import './style.css';
import { MainLoop } from './core/mainLoop';
import { checkWebGPUSupport } from './core/webgpuSupport';
import { Game, type GameDebugState } from './game/game';
import { InputSystem, type InputDebugState } from './input';
import { createRenderer } from './render/renderer';
import { GameView } from './render/gameView';
import { readDeviceHints, selectQuality } from './render/quality';
import { isDebugEnabled, mountDebugHud } from './ui/debugHud';
import { mountTuningPanel } from './ui/tuningPanel';
import { resetTuning, tuning } from './game/tuning';
import { CharacterShowcase, type ShowcaseState } from './render/assets/showcase';
import { PlayerView, type PlayerViewState } from './render/playerView';
import { createTerrainCollisionMesh } from './render/testScene';
import { terrainHeight } from './render/terrain';
import { mountOrientationHint, showUnsupportedScreen } from './ui/overlays';

/** E2E / デバッグ用に公開する読み取り専用の状態。 */
interface DebugState {
  readonly backend: 'webgpu';
  readonly frames: number;
  readonly steps: number;
  readonly input: InputDebugState;
  readonly quality: string;
  readonly resolutionScale: number;
  /** `?clip=` / `?view=` 指定時のキャラクター確認表示（アセットパイプライン確認用）。 */
  readonly showcase?: ShowcaseState;
  /** プレイヤー・カメラ・ロックオンの状態（E2E 用）。 */
  readonly sim: GameDebugState;
  /** プレイヤーの描画状態（読み込み失敗時は undefined）。 */
  readonly playerView?: PlayerViewState;
}

/** キャラクター確認用の URL 指定（`?clip=` / `?view=`）があるか。あれば従来どおり騎士を 1 体置いて見せる。 */
function isShowcaseRequested(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has('clip') || params.has('view');
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
    const input = new InputSystem(root);
    const game = await Game.create({
      input,
      terrain: createTerrainCollisionMesh(),
      terrainHeight,
    });
    const view = new GameView(game, gameRenderer);
    game.addStaticCylinders(view.colliders);

    let showcase: CharacterShowcase | undefined;
    let playerView: PlayerView | undefined;
    if (isShowcaseRequested(location.search)) {
      // アセットパイプライン（#10）の確認用。カメラも自分で置く。
      view.useGameCamera = false;
      showcase = await CharacterShowcase.create(view.scene, view.camera).catch((e: unknown) => {
        console.error('character showcase failed to load', e);
        return undefined;
      });
      if (showcase) view.shadowFocusTarget = showcase.root;
    } else {
      playerView = await PlayerView.create(view.scene, game).catch((e: unknown) => {
        console.error('player view failed to load', e);
        return undefined;
      });
      if (playerView) view.attachPlayer(playerView);
    }

    new ResizeObserver(() => {
      view.resize();
    }).observe(root);

    mountOrientationHint();
    if (isDebugEnabled(location.search)) {
      mountDebugHud(gameRenderer.stats, {
        quality: quality.preset.level,
        targetFps: quality.targetFps,
      });
      // 操作感の調整値（プレイヤー・カメラ・ロックオン）を実行中に書き換えられる
      mountTuningPanel(tuning, resetTuning);
    }

    const loop = new MainLoop({
      update: (dt) => {
        input.step(dt); // 入力スナップショットを確定してから game が読む
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
      quality: quality.preset.level,
      get resolutionScale() {
        return gameRenderer.stats.scale;
      },
      get showcase() {
        return showcase?.state;
      },
      get sim() {
        return game.debugState;
      },
      get playerView() {
        return playerView?.state;
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
