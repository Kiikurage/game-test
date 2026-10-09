import {
  BoxGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardNodeMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  Vector3,
} from 'three/webgpu';
import { checker, float, mix, positionWorld, vec3 } from 'three/tsl';
import { CUBE_HALF, GROUND_Y, type Game } from '../game/game';
import type { GameRenderer } from './renderer';

/**
 * Game の状態を three のシーンとして描画する。
 * Game（シミュレーション）への依存は読み取り専用で、three の型は render 層に閉じる。
 */
export class GameView {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(50, 1, 0.1, 200);

  private readonly cubeMesh: Mesh;
  private readonly tmpPosition = new Vector3();
  private readonly tmpQuaternion = new Quaternion();

  constructor(
    private readonly game: Game,
    private readonly gameRenderer: GameRenderer,
  ) {
    this.scene.background = new Color(0x1a2030);

    // 地面: TSL でワールド座標ベースの市松模様を作る
    const groundMaterial = new MeshStandardNodeMaterial({ roughness: 0.95, metalness: 0 });
    const tile = checker(positionWorld.xz.mul(0.5));
    groundMaterial.colorNode = mix(vec3(0.16, 0.2, 0.17), vec3(0.24, 0.3, 0.25), float(tile));
    const ground = new Mesh(new PlaneGeometry(100, 100), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = GROUND_Y;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.cubeMesh = new Mesh(
      new BoxGeometry(CUBE_HALF * 2, CUBE_HALF * 2, CUBE_HALF * 2),
      new MeshStandardNodeMaterial({ color: 0xc8a25a, roughness: 0.6, metalness: 0.1 }),
    );
    this.cubeMesh.castShadow = true;
    this.cubeMesh.receiveShadow = true;
    this.scene.add(this.cubeMesh);

    const hemi = new HemisphereLight(0xaec6ff, 0x2a2418, 0.7);
    this.scene.add(hemi);

    const sun = new DirectionalLight(0xfff1d6, 2.2);
    sun.position.set(6, 10, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 30;
    this.scene.add(sun);

    this.camera.position.set(4.5, 3.5, 6);
    this.camera.lookAt(0, 0.6, 0);

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
    this.game.cube.sample(alpha, this.tmpPosition, this.tmpQuaternion);
    this.cubeMesh.position.copy(this.tmpPosition);
    this.cubeMesh.quaternion.copy(this.tmpQuaternion);
    this.gameRenderer.renderer.render(this.scene, this.camera);
  }
}
