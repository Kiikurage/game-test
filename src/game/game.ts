import { InterpolatedTransform } from '../core/interpolated';
import { createPhysics, type Physics } from './physics';

/** 地面の上面の高さ。 */
export const GROUND_Y = 0;
/** デモ立方体の一辺の半分。 */
export const CUBE_HALF = 0.5;

/**
 * ゲームのシミュレーション状態。描画（three）には依存せず、
 * 描画側は `cube` 等の InterpolatedTransform を読み取るだけにする。
 */
export class Game {
  /** 最小シーン用の立方体（物理で落下して静止する）。 */
  readonly cube = new InterpolatedTransform();

  private readonly cubeBody;

  private constructor(private readonly physics: Physics) {
    const { rapier, world } = physics;

    // 地面（上面が y=GROUND_Y）
    const ground = world.createRigidBody(rapier.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
    world.createCollider(rapier.ColliderDesc.cuboid(50, 0.5, 50), ground);

    // 少し傾けて落とす立方体
    this.cubeBody = world.createRigidBody(
      rapier.RigidBodyDesc.dynamic()
        .setTranslation(0, 3.5, 0)
        .setRotation({ x: 0.2, y: 0.3, z: 0.1, w: 0.92 })
        .setAngvel({ x: 1.2, y: 0.8, z: 0.4 }),
    );
    world.createCollider(
      rapier.ColliderDesc.cuboid(CUBE_HALF, CUBE_HALF, CUBE_HALF)
        .setRestitution(0.35)
        .setFriction(0.8),
      this.cubeBody,
    );

    this.syncFromPhysics();
    this.cube.snap();
  }

  static async create(): Promise<Game> {
    return new Game(await createPhysics());
  }

  /** 固定タイムステップで 1 ステップ進める。 */
  update(dt: number): void {
    this.cube.beginStep();
    this.physics.step(dt);
    this.syncFromPhysics();
  }

  private syncFromPhysics(): void {
    const t = this.cubeBody.translation();
    const r = this.cubeBody.rotation();
    this.cube.position.set(t.x, t.y, t.z);
    this.cube.quaternion.set(r.x, r.y, r.z, r.w);
  }
}
