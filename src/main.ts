import './style.css';
import { MainLoop } from './core/mainLoop';
import { checkWebGPUSupport } from './core/webgpuSupport';
import { createBrowserAudioEngine, createSfxSystem, installAudioUnlock } from './audio';
import { Game } from './game/game';
import { InputSystem, type InputDebugState } from './input';
import { createRenderer } from './render/renderer';
import { GameView } from './render/gameView';
import { readDeviceHints, selectQuality } from './render/quality';
import { isDebugEnabled, mountDebugHud } from './ui/debugHud';
import { CharacterShowcase, type ShowcaseState } from './render/assets/showcase';
import { mountOrientationHint, showUnsupportedScreen } from './ui/overlays';

/** E2E / デバッグ用に公開する読み取り専用の状態。 */
interface DebugState {
  readonly backend: 'webgpu';
  readonly frames: number;
  readonly steps: number;
  readonly input: InputDebugState;
  readonly quality: string;
  readonly resolutionScale: number;
  /** アセットパイプライン確認用のキャラクター表示（読み込み失敗時は undefined）。 */
  readonly showcase?: ShowcaseState;
  /** オーディオエンジンの状態（AudioContext 非対応なら undefined）。 */
  readonly audio?: {
    readonly state: string;
    readonly sfx: { readonly loaded: number; readonly active: number; readonly stats: object };
    /** E2E 用: game のイベントバス経由で SE を鳴らす。 */
    readonly emitSound: (cue: string) => void;
  };
}

declare global {
  interface Window {
    __game?: DebugState;
  }
}

async function bootstrap(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) throw new Error('#app not found');

  const support = await checkWebGPUSupport();
  if (!support.ok) {
    showUnsupportedScreen(root, support.reason);
    return;
  }

  try {
    const quality = selectQuality(location.search, readDeviceHints());
    const gameRenderer = await createRenderer(root, quality);
    const game = await Game.create();
    const view = new GameView(game, gameRenderer);

    // アセットパイプライン（#10）の確認用。プレイヤー統合（#8）で置き換える。
    const showcase = await CharacterShowcase.create(view.scene, view.camera).catch((e: unknown) => {
      console.error('character showcase failed to load', e);
      return undefined;
    });

    if (showcase) view.shadowFocusTarget = showcase.root;

    new ResizeObserver(() => {
      view.resize();
    }).observe(root);

    mountOrientationHint();
    const input = new InputSystem(root);
    if (isDebugEnabled(location.search)) {
      mountDebugHud(gameRenderer.stats, {
        quality: quality.preset.level,
        targetFps: quality.targetFps,
      });
    }

    // AudioContext は生成直後 suspended。最初のユーザー操作で resume する（自動再生制限）。
    // 「タップして始める」UI ができたら、そのハンドラから audio.resume() を呼ぶ。
    const audio = createBrowserAudioEngine();
    if (audio) installAudioUnlock(audio, window);
    const sfx =
      audio &&
      createSfxSystem(audio, game.events, {
        baseUrl: import.meta.env.BASE_URL,
        isMobile: readDeviceHints().isMobile,
      });
    void sfx?.preloadGroup('title'); // 暫定: タイトル画面ができたらそこで呼ぶ（field は敵・ボス SE 用）

    const loop = new MainLoop({
      update: (dt) => {
        input.step(dt); // 入力スナップショットを確定（#8 でプレイヤーへ渡す）
        game.update(dt);
      },
      render: (alpha) => {
        showcase?.update();
        view.render(alpha);
        sfx?.syncListener(view.camera);
      },
    });
    loop.start();

    window.__game = {
      backend: 'webgpu',
      get frames() {
        return loop.frameCount;
      },
      get steps() {
        return loop.stepCount;
      },
      get input() {
        return input.debugState;
      },
      quality: quality.preset.level,
      get resolutionScale() {
        return gameRenderer.stats.scale;
      },
      get audio() {
        return (
          audio &&
          sfx && {
            state: audio.state,
            sfx: {
              loaded: sfx.library.loadedCount,
              active: sfx.player.activeVoices,
              stats: { ...sfx.player.stats },
            },
            emitSound: (cue: string) => {
              game.events.emit('sound', { cue });
            },
          }
        );
      },
      get showcase() {
        return showcase?.state;
      },
    };
    root.dataset.state = 'running';
  } catch (e) {
    console.error(e);
    // アダプタ取得後でもデバイス生成・バックエンド検証に失敗しうる。WebGL へは落とさない。
    showUnsupportedScreen(root, e instanceof Error ? e.message : String(e));
  }
}

void bootstrap();
