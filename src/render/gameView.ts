import { type Object3D, PerspectiveCamera, Quaternion, Scene, Vector3 } from 'three/webgpu';
import type { Game } from '../game/game';
import { createEnvironment, type Environment } from './environment';
import { createPostProcess, type PostProcess } from './postprocess';
import type { GameRenderer, RenderStats } from './renderer';
import { GroundTelegraphs } from './telegraph';
import { TelegraphDemo, isTelegraphDemoEnabled } from './telegraph/demo';
import { PlaygroundView } from './playground';
import { LevelView } from './levelView';
import { Skyline } from './skyline';
import type { EnvironmentAssets } from './assets/environment';
import type { Level } from '../game/world/level';
import type { PlayerView } from './playerView';
import type { EnemyViews } from './enemyView';
import { createTestScene, type ColliderCylinder } from './testScene';
import { ParticleSystem } from './particles';
import { ParticleDemo, isParticleDemoEnabled } from './particles/demo';
import { CombatDebugView } from './combatDebugView';
import { profileScene, type RenderProfile } from './renderProfile';
import { NavDebugView } from './navDebugView';
import { GridNavigator } from '../game/enemy/gridNavigator';
import { createViewPlugins, type ViewPlugin } from './viewPlugins';

// `*.view.ts`（登録式の描画機能。viewPlugins.ts 参照）を自動で読み込む。新機能は gameView.ts を編集しない。
import.meta.glob('./**/*.view.ts', { eager: true });

/**
 * Game の状態を three のシーンとして描画する。
 * Game（シミュレーション）への依存は読み取り専用で、three の型は render 層に閉じる。
 *
 * 描画オブジェクトの追加: `view.scene.add(object)`。影を落とす/受けるメッシュは
 * `castShadow` / `receiveShadow` を true にする（影は `environment.sun` が担当し、
 * `environment.followShadowFocus(position)` でプレイヤー付近に追従させる）。
 */
export class GameView {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(50, 1, 0.1, 500);
  readonly environment: Environment;
  /** レベルを描いているときだけ（`?scene=test` では null）。 */
  readonly levelView: LevelView | null = null;
  /** 遠景の山並みとランドマーク（レベルを描いているときだけ）。 */
  private readonly skyline: Skyline | null = null;
  /** ボス技の地面予告（円・直線・影の円）。 */
  readonly telegraphs = new GroundTelegraphs();
  /** パーティクル（環境の灰・篝火・熾火・ヒット/撃破バースト）。 */
  readonly particles: ParticleSystem;
  /** 影のカバー範囲が追従する対象（プレイヤー等）。未設定なら game のプレイヤー位置。 */
  shadowFocusTarget: Object3D | null = null;
  /** false にすると game のカメラ追従を止める（キャラクター確認用ショーケースが自分でカメラを置くとき）。 */
  useGameCamera = true;
  /** テストシーンの立っている柱の衝突用円柱（`game.addStaticCylinders` へ渡す）。 */
  readonly colliders: readonly ColliderCylinder[];

  private savedFog: Scene['fogNode'] | undefined;
  private playerView: PlayerView | null = null;
  private enemyViews: EnemyViews | null = null;
  private readonly playground: PlaygroundView;
  private readonly postProcess: PostProcess;
  private readonly tmpPosition = new Vector3();
  private readonly tmpNormal = new Vector3();
  private readonly tmpQuaternion = new Quaternion();
  private readonly telegraphDemo: TelegraphDemo | null = null;
  private readonly particleDemo: ParticleDemo | null = null;
  private lastRenderMs = 0;
  /** ?debug のときだけ作る判定の可視化（ハートボックス・ヒットボックス）。 */
  private readonly combatDebug: CombatDebugView | null = null;
  /** ?debug のときだけ作る敵のナビゲーション（歩ける範囲・経路）の可視化。 */
  private readonly navDebug: NavDebugView | null = null;
  /** 登録式の描画機能（`viewPlugins.ts`）。 */
  private readonly plugins: readonly ViewPlugin[];

  constructor(
    private readonly game: Game,
    private readonly gameRenderer: GameRenderer,
    /** 指定するとレベル（地形・静的物）を描く。省略時は従来のテストシーン（`?scene=test`）。 */
    level?: Level,
  ) {
    const { preset } = gameRenderer.quality;

    this.environment = createEnvironment(this.scene, preset);
    if (level) {
      this.colliders = [];
      this.levelView = new LevelView(level);
      this.scene.add(this.levelView.root);
      this.skyline = new Skyline();
      this.scene.add(this.skyline.root);
    } else {
      const testScene = createTestScene(preset);
      this.colliders = testScene.pillars;
      this.scene.add(testScene.root);
    }
    this.playground = new PlaygroundView(game, !level);
    this.scene.add(this.playground.root);

    this.camera.position.set(5.5, 2.4, 8.5);
    this.camera.lookAt(-1.5, 4.6, -8);

    this.particles = new ParticleSystem(preset.particles);
    this.scene.add(this.particles.root);
    // ?pfx=0: パーティクルを非表示にする（負荷比較・不具合切り分け用）
    if (new URLSearchParams(window.location.search).get('pfx') === '0') {
      this.particles.root.visible = false;
    }
    if (isParticleDemoEnabled(window.location.search)) {
      this.particleDemo = new ParticleDemo(this.particles, this.scene, this.camera);
    }
    if (new URLSearchParams(window.location.search).has('debug')) {
      this.combatDebug = new CombatDebugView(game.combat);
      this.scene.add(this.combatDebug.root);
      const navigator = game.enemies.navigator;
      if (navigator instanceof GridNavigator) {
        this.navDebug = new NavDebugView(navigator);
        this.scene.add(this.navDebug.root);
      }
    }
    // 命中の火花・塵・黒い飛沫（ヒットストップと同じステップ。ガードは火花のみで足りるので弱める）
    game.events.on('hitStop', (e) => {
      this.tmpPosition.set(e.position.x, e.position.y, e.position.z);
      this.tmpNormal.set(e.normal.x, e.normal.y, e.normal.z);
      // ガード: 盾が弾くので、火花は盾の面（体の左前、胸の高さ）から攻撃側へ跳ね返る。ジャストガード（8F）は強めに散らす
      if (e.kind === 'guard' && e.toPlayer) {
        const { feet, yaw } = game.player;
        const fx = Math.sin(yaw);
        const fz = Math.cos(yaw);
        this.tmpPosition.set(
          feet.x + fx * 0.6 - fz * 0.2,
          feet.y + 1.15,
          feet.z + fz * 0.6 + fx * 0.2,
        );
        this.tmpNormal.set(-e.normal.x, e.normal.y, -e.normal.z).normalize();
      }
      const power = e.kind === 'guard' ? (e.frames >= 8 ? 1.5 : 0.9) : e.frames >= 8 ? 1.4 : 1;
      this.particles.hit(this.tmpPosition, this.tmpNormal, power);
    });
    this.scene.add(this.telegraphs.root);
    if (isTelegraphDemoEnabled(window.location.search)) {
      this.telegraphDemo = new TelegraphDemo(this.telegraphs, this.camera);
    }

    this.postProcess = createPostProcess(gameRenderer.renderer, this.scene, this.camera, preset);

    this.plugins = createViewPlugins({ game, view: this, gameRenderer, level });

    this.resize();
  }

  /** 登録式の描画機能のアセットを読み込む（失敗してもゲームは続行する）。起動時に 1 度呼ぶ。 */
  async loadPlugins(): Promise<void> {
    await Promise.all(
      this.plugins.map(async (p) => {
        try {
          await p.load?.();
        } catch (e) {
          console.error('view plugin failed to load', e);
        }
      }),
    );
  }

  /** 環境メッシュ（A〜C の墓石・枯れ木・石壁など）と篝火のパーティクルを置く。読み込み後に 1 度呼ぶ。 */
  attachEnvironment(assets: EnvironmentAssets): void {
    this.levelView?.attachEnvironment(assets, this.particles);
  }

  /** 直近フレームの描画統計（`renderer.info` の実測値）。 */
  get renderStats(): Readonly<RenderStats> {
    return this.gameRenderer.stats;
  }

  /** 描画負荷の内訳（カテゴリ別のドローコール・三角形、メイン/シャドウ別）。計測・性能テスト用。 */
  profile(): RenderProfile {
    return profileScene(this.scene, this.camera, this.environment.sun.shadow.camera, {
      particles: this.particles.root,
      telegraph: this.telegraphs.root,
    });
  }

  /** 任意の視点へカメラを固定する（俯瞰撮影・デバッグ用）。`null` でゲームのカメラへ戻す。 */
  setFreeCamera(view: { position: Vector3; target: Vector3 } | null): void {
    this.useGameCamera = view === null;
    // 俯瞰では霞が全体を覆うので外す（戻すときに復元する）
    this.savedFog ??= this.scene.fogNode;
    this.scene.fogNode = view ? null : this.savedFog;
    if (!view) return;
    this.camera.position.copy(view.position);
    this.camera.lookAt(view.target);
  }

  /** テストシーンの足場・ダミーの表示切替（キャラクター確認用ショーケースでは隠す）。 */
  setPlaygroundVisible(visible: boolean): void {
    this.playground.root.visible = visible;
  }

  /** プレイヤーの描画を登録する（毎フレーム補間・アニメーションを更新し、影の追従対象にする）。 */
  attachPlayer(view: PlayerView): void {
    this.playerView = view;
    this.shadowFocusTarget = view.root;
  }

  /** 敵の描画を登録する（毎フレーム補間・アニメーションを更新する）。 */
  attachEnemies(views: EnemyViews): void {
    this.enemyViews = views;
    const { preset } = this.gameRenderer.quality;
    views.lod = {
      nearDistance: preset.characterLod.nearDistance,
      // 影のカバー範囲（正方形）の対角まで含めた距離
      shadowDistance: preset.shadowRadius * 1.4,
    };
  }

  /** コンテナサイズに合わせてレンダラとカメラのアスペクト比を更新する。 */
  resize(): void {
    const { width, height } = this.gameRenderer.resize();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * `?nodraw` のときは描画（GPU への draw）だけ省く。シーン・アニメーション・パーティクルの更新は行う。
   * ソフトウェア描画（SwiftShader）の E2E は 1 フレームが数秒かかりシミュレーションが実時間に追いつかないため、
   * 描画の検証が目的でないロジック系の E2E で使う。
   */
  private readonly drawEnabled = !new URLSearchParams(location.search).has('nodraw');

  /**
   * 初回のパイプライン / シェーダコンパイル（SwiftShader では数十秒、実機でも数百 ms のカクつき）を
   * ローディング中に済ませるため、ゲーム開始前に 1 フレーム描画して GPU の完了まで待つ。
   * 全アセットを取り付けた後に呼ぶこと。`?nodraw` では何もしない。
   */
  async warmUp(): Promise<void> {
    if (!this.drawEnabled) return;
    this.render(1);
    const device = (this.gameRenderer.renderer.backend as { device?: GPUDevice }).device;
    await device?.queue.onSubmittedWorkDone();
  }

  /** alpha: 直前ステップ→最新ステップの補間係数。 */
  render(alpha: number): void {
    this.gameRenderer.beginFrame(performance.now());
    if (this.useGameCamera) this.syncCamera(alpha);
    this.skyline?.update(this.camera.position.x, this.camera.position.z);
    this.playerView?.update(alpha);
    const focus = this.shadowFocusTarget?.position ?? this.game.player.feet;
    this.enemyViews?.update(alpha, this.camera, focus);
    this.playground.update(this.camera);
    this.environment.followShadowFocus(focus);
    const now = performance.now();
    const dt = this.lastRenderMs > 0 ? (now - this.lastRenderMs) / 1000 : 0;
    this.lastRenderMs = now;
    this.particleDemo?.update(dt);
    this.particles.update(dt, focus);
    this.telegraphDemo?.update(Math.min(dt, 0.1));
    this.telegraphs.update(dt);
    for (const plugin of this.plugins) plugin.update?.(dt);
    this.combatDebug?.update();
    this.navDebug?.update();
    if (this.drawEnabled) this.postProcess.render();
    this.gameRenderer.endFrame();
  }

  /** game のカメラ（補間済み）を three のカメラへ反映する。 */
  private syncCamera(alpha: number): void {
    const cam = this.game.camera;
    cam.transform.sample(alpha, this.tmpPosition, this.tmpQuaternion);
    this.camera.position.copy(this.tmpPosition);
    this.camera.quaternion.copy(this.tmpQuaternion);
    if (this.camera.fov !== cam.fovDeg) {
      this.camera.fov = cam.fovDeg;
      this.camera.updateProjectionMatrix();
    }
  }
}
