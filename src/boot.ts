// エントリ。初期バンドルは軽量に保つ（three / rapier は ./main の動的 import に含まれる）。
// 起動フロー: WebGPU 判定 → ローディング画面 → 本体ロード → 開始画面 → （タップ）→ 開始。
// `#app` の data-state: loading → ready（開始画面待ち）→ running ⇄ paused（再開画面待ち）/ unsupported。
import './style.css';
import {
  enterImmersive,
  shouldPause,
  type ImmersiveEnv,
  type ImmersiveResult,
} from './core/immersive';
import { LOAD_STAGES, ProgressTracker } from './core/progress';
import { installWebGPUCompat } from './core/webgpuCompat';
import { checkWebGPUSupport } from './core/webgpuSupport';
import type { GameApp } from './main';
import { createLoadingScreen, createPromptScreen, type PromptScreen } from './ui/launchScreens';
import { mountOrientationHint, showUnsupportedScreen, type OrientationHint } from './ui/overlays';

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
    onFailure: (stage, e) => {
      console.warn(`[immersive] ${stage} failed: ${e instanceof Error ? e.name : String(e)}`);
    },
  };
}

let orientationHint: OrientationHint | undefined;
let lastImmersive: ImmersiveResult | undefined;
/** 開始 / 再開画面が出ている間だけ入る。縦持ちの案内のタップから、横向き化と同時に開始・再開するために使う。 */
let promptActivate: (() => void) | undefined;
let pendingImmersive: Promise<ImmersiveResult> | undefined;

/**
 * 横向きフルスクリーン化（縦持ちの案内タップ・開始 / 再開タップ共通）。ユーザー操作のハンドラから呼ぶ
 * （requestFullscreen は同期的に呼ばれる。向きロックはフルスクリーン成立後でないと拒否されるため直後に続ける）。
 * すでに横向きロック済みのフルスクリーンなら何も呼ばない。結果で案内の文言を切り替える。
 */
function enterLandscape(): Promise<ImmersiveResult> {
  if (document.fullscreenElement !== null && lastImmersive?.orientationLocked) {
    return Promise.resolve(lastImmersive);
  }
  if (pendingImmersive) return pendingImmersive;
  pendingImmersive = enterImmersive(createImmersiveEnv()).then((r) => {
    lastImmersive = r;
    pendingImmersive = undefined;
    orientationHint?.setFailed(!r.orientationLocked);
    return r;
  });
  return pendingImmersive;
}

/** 開始・一時停止・再開の遷移を管理する。 */
function runLaunchFlow(root: HTMLElement, app: GameApp): void {
  const touch = matchMedia('(pointer: coarse)').matches;
  const portraitQuery = matchMedia('(orientation: portrait)');
  let state: 'waiting' | 'running' = 'waiting';
  let started = false;
  let fullscreenEntered = lastImmersive?.fullscreen ?? false;
  let settleUntil = 0;
  /** 縦のまま開始 / 再開した直後（最初の判定がまだ）。横向きで始めてから縦へ回した場合は含めない。 */
  let justActivated = false;
  /**
   * タップで横向き化を試みたのに縦のままだった（ロック失敗・端末が回らない）。
   * この状態で縦を理由に一時停止すると「開始 → 停止 → 開始…」を繰り返すだけなので、縦のまま続行する。
   * 横向きを一度でも確認したら解除する（その後に縦へ戻したら通常どおり一時停止）。
   */
  let portraitGaveUp = false;
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
    promptActivate = () => {
      void activate();
    };
    state = 'waiting';
    root.dataset.state = kind === 'start' ? 'ready' : 'paused';
  };

  const pause = (): void => {
    if (state !== 'running') return;
    app.setPaused(true);
    showPrompt('resume');
  };

  const evaluate = (): void => {
    if (touch && !portraitQuery.matches && portraitGaveUp) {
      portraitGaveUp = false;
      orientationHint?.setFailed(false);
    }
    if (state !== 'running' || performance.now() < settleUntil) return;
    if (justActivated && touch && portraitQuery.matches) {
      portraitGaveUp = true;
      orientationHint?.setFailed(true);
    }
    justActivated = false;
    if (
      shouldPause({
        touch,
        portrait: portraitQuery.matches && !portraitGaveUp,
        fullscreenEntered,
        isFullscreen: document.fullscreenElement !== null,
      })
    ) {
      pause();
    }
  };

  /** ユーザー操作（タップ・クリック・キー）のハンドラから呼ぶ。同期部分でジェスチャーを使い切る。 */
  const activate = async (): Promise<void> => {
    promptActivate = undefined; // 二重起動を防ぐ（以降のタップは没入化のみ・重複なら何もしない）
    app.resumeAudio();
    const portraitAtActivate = portraitQuery.matches;
    // PC: Pointer Lock（モバイルでは不要）。フルスクリーンは PC では強制しない。
    if (!touch) app.requestPointerLock();
    const immersive = touch ? enterLandscape() : Promise.resolve(undefined);
    prompt?.remove();
    prompt = undefined;
    const result = await immersive;
    fullscreenEntered = result?.fullscreen ?? false;
    settleUntil = performance.now() + SETTLE_MS;
    justActivated = portraitAtActivate;
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

  orientationHint = mountOrientationHint(() => {
    // 開始 / 再開画面が出ていれば、1 タップで横向き化と開始・再開まで行う（ローディング中は横向き化のみ）
    if (promptActivate) {
      promptActivate();
      return;
    }
    void enterLandscape().then(() => {
      // ロックが通っても端末が回らなかった場合は「回してください」に切り替え、タップを透過して縦のまま始められるようにする
      setTimeout(() => {
        if (matchMedia('(orientation: portrait)').matches) orientationHint?.setFailed(true);
      }, SETTLE_MS);
    });
  });
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
