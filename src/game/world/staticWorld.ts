import { Euler, Quaternion, Vector3 } from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { CameraCollision } from '../camera/thirdPersonCamera';
import type { Physics } from '../physics';
import type { StaticCylinderSpec, TerrainCollisionMesh } from '../gameOptions';
import { CAMERA_QUERY_GROUPS, SIGHT_QUERY_GROUPS, WORLD_GROUPS } from './groups';
import type { BoxSpec } from './playground';

const GROUND_FALLBACK_HALF = 100;
const TMP_QUAT = new Quaternion();
const EULER_X = new Vector3(1, 0, 0);
const EULER_Y = new Vector3(0, 1, 0);

type Point = { readonly x: number; readonly y: number; readonly z: number };

/**
 * 静的な衝突（地形・箱・円柱）と、それに対する問い合わせ（遮蔽・視線・カメラの球キャスト）。
 * Game の組み立て時に地形 → 箱の順で作る（コライダーの生成順はシミュレーションの決定性に関わる）。
 */
export class StaticWorld {
  private readonly boxColliders = new Map<string, RAPIER.Collider>();

  constructor(
    private readonly physics: Physics,
    terrain: TerrainCollisionMesh | undefined,
    boxes: readonly BoxSpec[],
  ) {
    const { rapier, world } = physics;
    if (terrain) {
      world.createCollider(
        rapier.ColliderDesc.trimesh(terrain.vertices, terrain.indices).setCollisionGroups(
          WORLD_GROUPS,
        ),
      );
    } else {
      world.createCollider(
        rapier.ColliderDesc.cuboid(GROUND_FALLBACK_HALF, 0.5, GROUND_FALLBACK_HALF)
          .setTranslation(0, -0.5, 0)
          .setCollisionGroups(WORLD_GROUPS),
      );
    }
    for (const b of boxes) {
      const q = TMP_QUAT.setFromAxisAngle(EULER_Y, ((b.yawDeg ?? 0) * Math.PI) / 180);
      const qx = new Quaternion().setFromAxisAngle(EULER_X, ((b.pitchDeg ?? 0) * Math.PI) / 180);
      q.multiply(qx);
      const collider = world.createCollider(
        rapier.ColliderDesc.cuboid(b.hx, b.hy, b.hz)
          .setTranslation(b.x, b.y, b.z)
          .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
          .setCollisionGroups(WORLD_GROUPS),
      );
      if (b.enabled === false) collider.setEnabled(false);
      this.boxColliders.set(b.id, collider);
    }
  }

  /** 箱の衝突を有効 / 無効にする。該当する id がなければ false。 */
  setBoxEnabled(id: string, enabled: boolean): boolean {
    const collider = this.boxColliders.get(id);
    if (!collider) return false;
    collider.setEnabled(enabled);
    return true;
  }

  /** 静的な円柱の衝突（柱・大岩など）を追加する。 */
  addStaticCylinders(cylinders: readonly StaticCylinderSpec[]): void {
    const { rapier, world } = this.physics;
    for (const c of cylinders) {
      const desc = rapier.ColliderDesc.cylinder(c.height / 2, c.radius).setCollisionGroups(
        WORLD_GROUPS,
      );
      if (c.euler) {
        const q = new Quaternion().setFromEuler(new Euler(c.euler[0], c.euler[1], c.euler[2]));
        desc.setTranslation(c.x, c.y, c.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
      } else {
        desc.setTranslation(c.x, c.y + c.height / 2, c.z);
      }
      world.createCollider(desc);
    }
  }

  /** 攻撃者から命中位置までを地形・静的物が遮っているか（壁越しに当てない）。 */
  isBlocked(from: Point, to: Point): boolean {
    const { rapier, world } = this.physics;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 1e-4) return false;
    const ray = new rapier.Ray(
      { x: from.x, y: from.y, z: from.z },
      { x: dx / dist, y: dy / dist, z: dz / dist },
    );
    const hit = world.castRay(ray, dist, true, undefined, SIGHT_QUERY_GROUPS);
    return hit !== null && hit.timeOfImpact < dist - 0.05;
  }

  /** `from` から `to` への視線が地形・静的物に遮られていないか。 */
  hasLineOfSight(from: Point, to: Point): boolean {
    const { rapier, world } = this.physics;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 1e-4) return true;
    const ray = new rapier.Ray(
      { x: from.x, y: from.y, z: from.z },
      { x: dx / dist, y: dy / dist, z: dz / dist },
    );
    const hit = world.castRay(ray, dist, true, undefined, SIGHT_QUERY_GROUPS);
    // 対象の胸元の手前 0.3m までに何かあれば遮蔽
    return hit === null || hit.timeOfImpact > dist - 0.3;
  }

  /** カメラの球キャスト（`exclude` の剛体＝プレイヤーは無視する）。 */
  createCameraCollision(exclude: RAPIER.RigidBody): CameraCollision {
    const { rapier, world } = this.physics;
    const shapes = new Map<number, RAPIER.Ball>();
    const identity = { x: 0, y: 0, z: 0, w: 1 };
    return {
      castSphere(origin, dir, maxDistance, radius) {
        const key = Math.round(radius * 1000);
        let ball = shapes.get(key);
        if (!ball) {
          ball = new rapier.Ball(radius);
          shapes.set(key, ball);
        }
        const hit = world.castShape(
          { x: origin.x, y: origin.y, z: origin.z },
          identity,
          { x: dir.x, y: dir.y, z: dir.z },
          ball,
          0,
          maxDistance,
          true,
          undefined,
          CAMERA_QUERY_GROUPS,
          undefined,
          exclude,
        );
        return hit ? Math.min(maxDistance, hit.time_of_impact) : maxDistance;
      },
    };
  }
}
