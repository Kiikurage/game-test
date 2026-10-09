import './style.css';
import { MainLoop } from './core/mainLoop';
import { checkWebGPUSupport } from './core/webgpuSupport';
import { createBrowserAudioEngine, createSfxSystem, installAudioUnlock } from './audio';
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
import type { PlayerAnimLayer } from './render/assets/playerAnimator';
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
  /** E2E 用の操作（テレポートなど）。 */
  readonly dev: {
    teleport(x: number, z: number, yaw: number, y?: number): void;
    /** シミュレーションの一時停止（撮影用）。 */
    pause(paused: boolean): void;
    /** 指定した対象を直接ロックオンする（撮影用）。 */
    lock(id: string): boolean;
    /** カメラをプレイヤーの向き + `yawOffset` の背後に置き直す（撮影用）。 */
    view(yawOffset: number, distance?: number, pitchDeg?: number): void;
    /** プレイヤーのアニメーションレイヤーを時刻で固定表示する（撮影用）。 */
    pose(layer: PlayerAnimLayer | null, time?: number): void;
  };
  /** プレイヤーの描画状態（読み込み失敗時は undefined）。 */
  readonly playerView?: PlayerViewState;
  /** オーディオエンジンの状態（AudioContext 非対応なら undefined）。 */
  readonly audio?: {
    readonly state: string;
    readonly sfx: { readonly loaded: number; readonly active: number; readonly stats: object };
    /** E2E 用: game のイベントバス経由で SE を鳴らす。 */
    readonly emitSound: (cue: string) => void;
  };
}

/** キャラクター確認用の URL 指定（`?clip=` / `?view=`）があるか。あれば従来どおり騎士を 1 体置いて見せる。 */
function isShowcaseRequested(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has('clip') || params.has('view') || params.has('corpse');
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
      view.setPlaygroundVisible(false);
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

    let paused = false;
    const loop = new MainLoop({
      update: (dt) => {
        if (paused) return;
        input.step(dt); // 入力スナップショットを確定してから game が読む
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
      get sim() {
        return game.debugState;
      },
      dev: {
        teleport: (x, z, yaw, y) => {
          game.teleportPlayer(x, z, yaw, y);
        },
        lock: (id) => game.lockOnTo(id),
        pause: (p) => {
          paused = p;
        },
        view: (yawOffset, distance, pitchDeg) => {
          if (distance !== undefined) tuning.camera.distance = distance;
          game.camera.reset(game.player.feet, game.player.yaw + yawOffset, pitchDeg);
        },
        pose: (layer, time = 0) => {
          playerView?.setDebugPose(layer ? { layer, time } : null);
        },
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
