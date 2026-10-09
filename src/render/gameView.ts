import {
  BoxGeometry,
  Mesh,
  type Object3D,
  MeshStandardNodeMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
} from 'three/webgpu';
import { CUBE_HALF, type Game } from '../game/game';
import { createEnvironment, type Environment } from './environment';
import { createPostProcess, type PostProcess } from './postprocess';
import type { GameRenderer } from './renderer';
import { createTestScene } from './testScene';
import { GroundTelegraphs } from './telegraph';
import { TelegraphDemo, isTelegraphDemoEnabled } from './telegraph/demo';
import { ParticleSystem } from './particles';
import { ParticleDemo, isParticleDemoEnabled } from './particles/demo';

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
  /** ボス技の地面予告（円・直線・影の円）。 */
  readonly telegraphs = new GroundTelegraphs();
  /** パーティクル（環境の灰・篝火・熾火・ヒット/撃破バースト）。 */
  readonly particles: ParticleSystem;
  /** 影のカバー範囲が追従する対象（プレイヤー等）。未設定ならデモ立方体。 */
  shadowFocusTarget: Object3D | null = null;

  private readonly cubeMesh: Mesh;
  private readonly postProcess: PostProcess;
  private readonly tmpPosition = new Vector3();
  private readonly tmpQuaternion = new Quaternion();
  private readonly telegraphDemo: TelegraphDemo | null = null;
  private readonly particleDemo: ParticleDemo | null = null;
  private lastRenderMs = 0;

  constructor(
    private readonly game: Game,
    private readonly gameRenderer: GameRenderer,
  ) {
    const { preset } = gameRenderer.quality;

    this.environment = createEnvironment(this.scene, preset);
    this.scene.add(createTestScene(preset).root);

    this.cubeMesh = new Mesh(
      new BoxGeometry(CUBE_HALF * 2, CUBE_HALF * 2, CUBE_HALF * 2),
      new MeshStandardNodeMaterial({ color: 0xb8924a, roughness: 0.55, metalness: 0.15 }),
    );
    this.cubeMesh.castShadow = true;
    this.cubeMesh.receiveShadow = true;
    this.scene.add(this.cubeMesh);

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
    this.scene.add(this.telegraphs.root);
    if (isTelegraphDemoEnabled(window.location.search)) {
      this.telegraphDemo = new TelegraphDemo(this.telegraphs, this.camera);
    }

    this.postProcess = createPostProcess(gameRenderer.renderer, this.scene, this.camera, preset);

    this.resize();
  }

  /** コンテナサイズに合わせてレンダラとカメラのアスペクト比を更新する。 */
  resize(): void {
    const { width, height } = this.gameRenderer.resize();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** alpha: 直前ステップ→最新ステップの補間係数。 */
  render(alpha: number): void {
    this.gameRenderer.beginFrame(performance.now());
    this.game.cube.sample(alpha, this.tmpPosition, this.tmpQuaternion);
    this.cubeMesh.position.copy(this.tmpPosition);
    this.cubeMesh.quaternion.copy(this.tmpQuaternion);
    const focus = this.shadowFocusTarget?.position ?? this.tmpPosition;
    this.environment.followShadowFocus(focus);
    const now = performance.now();
    const dt = this.lastRenderMs > 0 ? (now - this.lastRenderMs) / 1000 : 0;
    this.lastRenderMs = now;
    this.particleDemo?.update(dt);
    this.particles.update(dt, focus);
    this.telegraphDemo?.update(Math.min(dt, 0.1));
    this.telegraphs.update(dt);
    this.postProcess.render();
    this.gameRenderer.endFrame();
  }
}
