import './style.css';
import { MainLoop } from './core/mainLoop';
import { checkWebGPUSupport } from './core/webgpuSupport';
import { Game } from './game/game';
import { createRenderer } from './render/renderer';
import { GameView } from './render/gameView';
import { readDeviceHints, selectQuality } from './render/quality';
import { isDebugEnabled, mountDebugHud } from './ui/debugHud';
import { mountOrientationHint, showUnsupportedScreen } from './ui/overlays';

/** E2E / デバッグ用に公開する読み取り専用の状態。 */
interface DebugState {
  readonly backend: 'webgpu';
  readonly frames: number;
  readonly steps: number;
  readonly quality: string;
  readonly resolutionScale: number;
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

    new ResizeObserver(() => {
      view.resize();
    }).observe(root);

    mountOrientationHint();
    if (isDebugEnabled(location.search)) {
      mountDebugHud(gameRenderer.stats, {
        quality: quality.preset.level,
        targetFps: quality.targetFps,
      });
    }

    const loop = new MainLoop({
      update: (dt) => {
        game.update(dt);
      },
      render: (alpha) => {
        view.render(alpha);
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
      quality: quality.preset.level,
      get resolutionScale() {
        return gameRenderer.stats.scale;
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
