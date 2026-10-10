// エントリ。初期バンドルは軽量に保つ（three / rapier は ./main の動的 import に含まれる）。
// 起動フロー: WebGPU 判定 → ローディング画面 → 本体ロード → 開始画面 → （タップ）→ 開始。
// `#app` の data-state: loading → ready（開始画面待ち）→ running ⇄ paused（再開画面待ち）/ unsupported。
import './style.css';
import { enterImmersive, shouldPause, type ImmersiveEnv } from './core/immersive';
import { LOAD_STAGES, ProgressTracker } from './core/progress';
import { installWebGPUCompat } from './core/webgpuCompat';
import { checkWebGPUSupport } from './core/webgpuSupport';
import type { GameApp } from './main';
import { createLoadingScreen, createPromptScreen, type PromptScreen } from './ui/launchScreens';
import { mountOrientationHint, showUnsupportedScreen } from './ui/overlays';

/** 開始 / 再開直後は、向きロックによる回転が終わるまで縦向き・フルスクリーン解除での一時停止を判定しない。 */
const SETTLE_MS = 1500;

interface ScreenOrientationLockable {
  lock(orientation: 'landscape'): Promise<void>;
}

function createImmersiveEnv(): ImmersiveEnv {
  const doc = document.documentElement;
  return {
    fullscreenSupported: document.fullscreenEnabled && typeof doc.requestFullscreen === 'function',
    requestFullscreen: () => doc.requestFullscreen({ navigationUI: 'hide' }),
    lockLandscape: () =>
      (screen.orientation as unknown as ScreenOrientationLockable).lock('landscape'),
  };
}

/** 開始・一時停止・再開の遷移を管理する。 */
function runLaunchFlow(root: HTMLElement, app: GameApp): void {
  const touch = matchMedia('(pointer: coarse)').matches;
  const portraitQuery = matchMedia('(orientation: portrait)');
  let state: 'waiting' | 'running' = 'waiting';
  let started = false;
  let fullscreenEntered = false;
  let settleUntil = 0;
  let prompt: PromptScreen | undefined;

  const showPrompt = (kind: 'start' | 'resume'): void => {
    prompt?.remove();
    const text =
      kind === 'start'
        ? touch
          ? '画面をタッチしてはじめる'
          : 'クリックしてはじめる'
        : touch
          ? '画面をタッチして再開'
          : 'クリックして再開';
    prompt = createPromptScreen({ kind, text }, () => {
      void activate();
    });
    state = 'waiting';
    root.dataset.state = kind === 'start' ? 'ready' : 'paused';
  };

  const pause = (): void => {
    if (state !== 'running') return;
    app.setPaused(true);
    showPrompt('resume');
  };

  const evaluate = (): void => {
    if (state !== 'running' || performance.now() < settleUntil) return;
    if (
      shouldPause({
        touch,
        portrait: portraitQuery.matches,
        fullscreenEntered,
        isFullscreen: document.fullscreenElement !== null,
      })
    ) {
      pause();
    }
  };

  /** ユーザー操作（タップ・クリック・キー）のハンドラから呼ぶ。同期部分でジェスチャーを使い切る。 */
  const activate = async (): Promise<void> => {
    app.resumeAudio();
    // PC: Pointer Lock（モバイルでは不要）。フルスクリーンは PC では強制しない。
    if (!touch) app.requestPointerLock();
    const immersive = touch ? enterImmersive(createImmersiveEnv()) : Promise.resolve(undefined);
    prompt?.remove();
    prompt = undefined;
    const result = await immersive;
    fullscreenEntered = result?.fullscreen ?? false;
    settleUntil = performance.now() + SETTLE_MS;
    setTimeout(evaluate, SETTLE_MS + 50);
    state = 'running';
    root.dataset.state = 'running';
    app.setPaused(false);
    if (!started) {
      started = true;
      app.start();
    }
  };

  document.addEventListener('fullscreenchange', evaluate);
  portraitQuery.addEventListener('change', evaluate);
  window.addEventListener('resize', evaluate);
  showPrompt('start');
}

async function boot(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) throw new Error('#app not found');

  mountOrientationHint();
  const support = await checkWebGPUSupport();
  if (!support.ok) {
    showUnsupportedScreen(root, support.reason);
    return;
  }

  installWebGPUCompat();
  root.dataset.state = 'loading';
  const loading = createLoadingScreen();
  const progress = new ProgressTracker(LOAD_STAGES, (s) => {
    loading.setProgress(s.fraction);
  });
  try {
    const code = progress.task('code');
    code.set(0.05); // ダウンロード中の進捗は取れないので、読み込み開始だけ示す
    const { createGameApp } = await import('./main');
    code.done();
    const app = await createGameApp(root, progress);
    loading.setProgress(1);
    loading.remove();
    runLaunchFlow(root, app);
  } catch (e) {
    console.error(e);
    loading.remove();
    // アダプタ取得後でもデバイス生成・バックエンド検証に失敗しうる。WebGL へは落とさない。
    showUnsupportedScreen(root, e instanceof Error ? e.message : String(e));
  }
}

void boot();
