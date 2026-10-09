import { Vector3 } from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import { MOVEMENT } from '../data';
import type { Physics } from '../physics';
import { GROUP, TARGET_GROUPS, interactionGroups } from '../world/groups';

/**
 * 敵の体（位置と衝突）。AI は `moveBy` で水平に動かすだけで、衝突・接地は実装が担う。
 * 実体は Rapier のキャラクターコントローラ（`RapierEnemyBody`）。テストでは衝突のない `FlatEnemyBody`。
 */
export interface EnemyBody {
  /** 足元の位置（実装が更新する参照）。 */
  readonly feet: Vector3;
  /** 水平に `dx, dz` だけ動こうとする（壁・段差・地形に従う）。 */
  moveBy(dx: number, dz: number): void;
  /** 位置を直接置く。 */
  teleport(x: number, y: number, z: number): void;
  /** 衝突体を取り除く。 */
  dispose(): void;
}

/** 敵のコライダー: 地形・他の敵・プレイヤーと衝突する。 */
const ENEMY_BODY_GROUPS = TARGET_GROUPS;
/** 敵の移動の問い合わせ: 地形と他の敵にだけ当たる（プレイヤーは押しのけられない・すり抜けない側に任せる）。 */
const ENEMY_QUERY_GROUPS = interactionGroups(GROUP.target, GROUP.world | GROUP.target);

const MAX_SLOPE_RAD = (MOVEMENT.maxSlopeDeg * Math.PI) / 180;
const GRAVITY = 20;

export class RapierEnemyBody implements EnemyBody {
  readonly feet = new Vector3();

  private readonly rigidBody: RAPIER.RigidBody;
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  private readonly centerY: number;
  private verticalVelocity = 0;
  private grounded = true;

  constructor(
    private readonly physics: Physics,
    x: number,
    y: number,
    z: number,
    height: number,
    radius: number,
  ) {
    const { rapier, world } = physics;
    this.feet.set(x, y, z);
    this.centerY = height / 2;
    this.rigidBody = world.createRigidBody(
      rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y + this.centerY, z),
    );
    this.collider = world.createCollider(
      rapier.ColliderDesc.capsule(height / 2 - radius, radius).setCollisionGroups(
        ENEMY_BODY_GROUPS,
      ),
      this.rigidBody,
    );
    const c = world.createCharacterController(0.02);
    c.setUp({ x: 0, y: 1, z: 0 });
    c.enableAutostep(MOVEMENT.stepHeight, 0.1, false);
    c.enableSnapToGround(0.3);
    c.setMaxSlopeClimbAngle(MAX_SLOPE_RAD);
    c.setMinSlopeSlideAngle(MAX_SLOPE_RAD);
    c.setSlideEnabled(true);
    c.setApplyImpulsesToDynamicBodies(false);
    this.controller = c;
  }

  moveBy(dx: number, dz: number): void {
    if (this.grounded) this.verticalVelocity = 0;
    else this.verticalVelocity = Math.max(-45, this.verticalVelocity - GRAVITY / 60);
    this.controller.computeColliderMovement(
      this.collider,
      { x: dx, y: this.verticalVelocity / 60, z: dz },
      undefined,
      ENEMY_QUERY_GROUPS,
    );
    const move = this.controller.computedMovement();
    this.feet.x += move.x;
    this.feet.y += move.y;
    this.feet.z += move.z;
    this.grounded = this.controller.computedGrounded();
    this.sync();
  }

  teleport(x: number, y: number, z: number): void {
    this.feet.set(x, y, z);
    this.verticalVelocity = 0;
    this.rigidBody.setTranslation({ x, y: y + this.centerY, z }, true);
    this.sync();
  }

  dispose(): void {
    const { world } = this.physics;
    world.removeCharacterController(this.controller);
    world.removeRigidBody(this.rigidBody);
  }

  private sync(): void {
    this.rigidBody.setNextKinematicTranslation({
      x: this.feet.x,
      y: this.feet.y + this.centerY,
      z: this.feet.z,
    });
  }
}

/** 衝突のない平らな地面の体（ユニットテスト・AI の単体検証用）。`blocked` が true の地点へは入れない。 */
export class FlatEnemyBody implements EnemyBody {
  readonly feet = new Vector3();

  constructor(
    x: number,
    z: number,
    private readonly blocked?: (x: number, z: number) => boolean,
  ) {
    this.feet.set(x, 0, z);
  }

  moveBy(dx: number, dz: number): void {
    const nx = this.feet.x + dx;
    const nz = this.feet.z + dz;
    if (this.blocked?.(nx, nz)) return;
    this.feet.x = nx;
    this.feet.z = nz;
  }

  teleport(x: number, y: number, z: number): void {
    this.feet.set(x, y, z);
  }

  dispose(): void {
    // 何もしない
  }
}
