import './style.css';
import { MainLoop } from './core/mainLoop';
import { checkWebGPUSupport } from './core/webgpuSupport';
import { Game } from './game/game';
import { InputSystem, type InputDebugState } from './input';
import { createRenderer } from './render/renderer';
import { GameView } from './render/gameView';
import { CharacterShowcase, type ShowcaseState } from './render/assets/showcase';
import { mountOrientationHint, showUnsupportedScreen } from './ui/overlays';

/** E2E / デバッグ用に公開する読み取り専用の状態。 */
interface DebugState {
  readonly backend: 'webgpu';
  readonly frames: number;
  readonly steps: number;
  readonly input: InputDebugState;
  /** アセットパイプライン確認用のキャラクター表示（読み込み失敗時は undefined）。 */
  readonly showcase?: ShowcaseState;
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
    const gameRenderer = await createRenderer(root);
    const game = await Game.create();
    const view = new GameView(game, gameRenderer);

    // アセットパイプライン（#10）の確認用。プレイヤー統合（#8）で置き換える。
    const showcase = await CharacterShowcase.create(view.scene, view.camera).catch((e: unknown) => {
      console.error('character showcase failed to load', e);
      return undefined;
    });

    new ResizeObserver(() => {
      view.resize();
    }).observe(root);

    mountOrientationHint();
    const input = new InputSystem(root);

    const loop = new MainLoop({
      update: (dt) => {
        input.step(dt); // 入力スナップショットを確定（#8 でプレイヤーへ渡す）
        game.update(dt);
      },
      render: (alpha) => {
        showcase?.update();
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
      get input() {
        return input.debugState;
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
