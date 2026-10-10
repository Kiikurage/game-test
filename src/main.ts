import { MainLoop } from './core/mainLoop';
import type { ProgressTracker } from './core/progress';
import { createBrowserAudioEngine, createSfxSystem, installAudioUnlock } from './audio';
import { Game, type GameDebugState } from './game/game';
import { preloadPhysics } from './game/physics';
import { InputSystem, type InputDebugState } from './input';
import { createRenderer } from './render/renderer';
import { GameView } from './render/gameView';
import { readDeviceHints, selectQuality } from './render/quality';
import { isDebugEnabled, mountDebugHud } from './ui/debugHud';
import { mountTuningPanel } from './ui/tuningPanel';
import { resetTuning, tuning } from './game/tuning';
import { CharacterShowcase, type ShowcaseState } from './render/assets/showcase';
import { PlayerView, type PlayerViewState } from './render/playerView';
import { EnemyViews } from './render/enemyView';
import { createTerrainCollisionMesh } from './render/testScene';
import { ASHEN_FOUNDATION } from './game/world/ashenFoundation';
import { EnvironmentAssets } from './render/assets/environment';
import { createLevel, levelGameOptions } from './game/world/level';
import { SaveStore, getLocalStorage } from './core/persistence';
import { terrainHeight } from './render/terrain';
import { createDevHooks, isShowcaseRequested, type DevHooks } from './devHooks';

// `*.dev.ts`（デバッグフック・showcase の URL パラメータの登録）を自動で読み込む。新機能は main.ts を編集しない。
import.meta.glob('./**/*.dev.ts', { eager: true });

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
  /** E2E 用の操作（テレポートなど）。各機能が `*.dev.ts` の `registerDevHooks` で足す（src/devHooks.ts）。 */
  readonly dev: DevHooks;
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

declare global {
  interface Window {
    __game?: DebugState;
  }
}

/** 起動フロー（boot.ts）から見たゲーム本体の操作口。 */
export interface GameApp {
  /** メインループを開始する（開始画面のタップ後に一度だけ）。 */
  start(): void;
  setPaused(paused: boolean): void;
  /** AudioContext を resume する（ユーザー操作のハンドラ内で呼ぶ）。 */
  resumeAudio(): void;
  requestPointerLock(): void;
}

/**
 * ゲーム本体を組み立てる（レンダラー・物理・アセットのロード）。ループは `start()` まで回さない。
 * boot.ts から動的 import される（three / rapier を初期バンドルに含めないため）。
 * WebGPU の対応判定は呼び出し側で済んでいる前提。失敗時は例外を投げる。
 */
export async function createGameApp(
  root: HTMLElement,
  progress: ProgressTracker,
): Promise<GameApp> {
  try {
    preloadPhysics();
    const rendererTask = progress.task('renderer');
    const physicsTask = progress.task('physics');
    const sceneTask = progress.task('scene');
    const assetsTask = progress.task('assets');
    const quality = selectQuality(location.search, readDeviceHints());
    const gameRenderer = await createRenderer(root, quality);
    rendererTask.done();
    const input = new InputSystem(root);
    // 既定はレベル「灰の礎」。`?scene=test` で従来のテストシーン（雰囲気確認用）
    const level =
      new URLSearchParams(location.search).get('scene') === 'test'
        ? null
        : createLevel(ASHEN_FOUNDATION);
    const game = await Game.create({
      input,
      save: new SaveStore(getLocalStorage()),
      ...(level
        ? levelGameOptions(level)
        : { terrain: createTerrainCollisionMesh(), terrainHeight }),
      // `?enemies=0`: 敵を配置しない（敵に邪魔されない移動の E2E・地形の確認用）
      ...(new URLSearchParams(location.search).get('enemies') === '0' && { enemies: [] }),
    });
    physicsTask.done();
    const view = new GameView(game, gameRenderer, level ?? undefined);
    game.addStaticCylinders(level ? level.cylinders : view.colliders);
    // ?env=0: 環境メッシュを置かない（グレーボックスのまま。負荷比較用）
    if (level && new URLSearchParams(location.search).get('env') !== '0') {
      // 環境メッシュ（墓地・礼拝堂）。読み込みに失敗してもグレーボックスのまま遊べる
      await EnvironmentAssets.load()
        .then((assets) => {
          view.attachEnvironment(assets);
        })
        .catch((e: unknown) => {
          console.error('environment assets failed to load', e);
        });
    }
    sceneTask.done();

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
      if (game.enemies.enemies.length > 0) {
        const enemyViews = await EnemyViews.create(view.scene, game).catch((e: unknown) => {
          console.error('enemy views failed to load', e);
          return undefined;
        });
        if (enemyViews) {
          enemyViews.setDebug(isDebugEnabled(location.search));
          view.attachEnemies(enemyViews);
        }
      }
    }
    await view.loadPlugins();
    assetsTask.done();

    new ResizeObserver(() => {
      view.resize();
    }).observe(root);

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

    // 開始画面のタップまでシミュレーションは進めない（boot.ts が setPaused(false) → start() する）
    let paused = true;
    const loop = new MainLoop(
      {
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
      },
      { timeScale: () => game.timeScale.current },
    );

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
      dev: createDevHooks({
        game,
        view,
        input,
        playerView: () => playerView,
        setPaused: (p) => {
          paused = p;
        },
      }),
      get playerView() {
        return playerView?.state;
      },
    };

    return {
      start: () => {
        loop.start();
      },
      setPaused: (p) => {
        paused = p;
        audio?.setPaused(p);
      },
      resumeAudio: () => {
        if (audio && audio.state !== 'running') void audio.resume();
      },
      requestPointerLock: () => {
        input.requestPointerLock();
      },
    };
  } catch (e) {
    console.error(e);
    // 呼び出し側（boot.ts）が、アダプタ取得後のデバイス生成・バックエンド検証の失敗を非対応画面にする。
    // WebGL へは落とさない。
    throw e;
  }
}
