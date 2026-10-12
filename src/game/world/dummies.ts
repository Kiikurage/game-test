import {
  HOLLOW_SOLDIER_REACTOR,
  HitReactor,
  UprightTarget,
  uprightHeartbox,
  type HitResolver,
} from '../combat';
import type { ReactorRegistry } from '../combat/reactorRegistry';
import { DummyTarget, type LockOnTarget } from '../lockOn/targets';
import type { Physics } from '../physics';
import type { Tuning } from '../tuning';
import { TARGET_GROUPS } from './groups';
import type { DummySpec } from './playground';

/** テストシーンのダミーの HP（判定の確認用。実質壊れない）。 */
const DUMMY_HP = 99999;

/**
 * テストシーンのダミーを置く: ロックオン対象・被弾側（亡者兵相当の強靭度 50。押し戻しは受けない）・円柱の衝突。
 * 作ったダミー（描画用）を返す。
 */
export function spawnDummies(
  specs: readonly DummySpec[],
  deps: {
    readonly physics: Physics;
    readonly combat: HitResolver;
    readonly reactors: ReactorRegistry;
    readonly tuning: Tuning;
    readonly lockOnTargets: LockOnTarget[];
    readonly heightAt: (x: number, z: number) => number;
  },
): DummyTarget[] {
  const { rapier, world } = deps.physics;
  const dummies: DummyTarget[] = [];
  for (const d of specs) {
    const y = deps.heightAt(d.x, d.z);
    const target = new DummyTarget(d.id, d.x, y, d.z, d.height, d.radius);
    dummies.push(target);
    deps.lockOnTargets.push(target);
    const heart = new UprightTarget(d.id, 'enemy', DUMMY_HP, [uprightHeartbox(d.radius, d.height)]);
    heart.place(d.x, y, d.z, 0);
    deps.combat.addTarget(heart);
    deps.reactors.add(d.id, new HitReactor(HOLLOW_SOLDIER_REACTOR, deps.tuning), heart);
    deps.reactors.discardSlide(d.id);
    world.createCollider(
      rapier.ColliderDesc.cylinder(d.height / 2, d.radius)
        .setTranslation(d.x, y + d.height / 2, d.z)
        .setCollisionGroups(TARGET_GROUPS),
    );
  }
  return dummies;
}
