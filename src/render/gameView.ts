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
  /** 影のカバー範囲が追従する対象（プレイヤー等）。未設定ならデモ立方体。 */
  shadowFocusTarget: Object3D | null = null;

  private readonly cubeMesh: Mesh;
  private readonly postProcess: PostProcess;
  private readonly tmpPosition = new Vector3();
  private readonly tmpQuaternion = new Quaternion();

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
    this.environment.followShadowFocus(this.shadowFocusTarget?.position ?? this.tmpPosition);
    this.postProcess.render();
    this.gameRenderer.endFrame();
  }
}
