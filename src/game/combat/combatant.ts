import type { LockOnTarget } from '../lockOn/targets';
import type { Freezable } from './hitStop';
import type { HitReactor } from './hitReactor';
import type { HitResolver } from './hitResolver';
import type { ReactorRegistry } from './reactorRegistry';
import type { UprightTarget } from './uprightTarget';

/** `Game.registerCombatant` に渡す、登録式のシステムが持つ敵（ボスなど）。 */
export interface Combatant {
  readonly id: string;
  readonly lockOn: LockOnTarget;
  readonly heart: UprightTarget;
  readonly reactor: HitReactor;
  readonly freezable: Freezable;
  readonly boss?: boolean;
}

/**
 * 敵をロックオン対象・被弾側（ハートボックス・強靭度）・ヒットストップの凍結口としてまとめて登録する。
 * `boss: true` なら `bossIds` にも入れる。戻り値を呼ぶと登録をすべて解く。
 */
export function registerCombatant(
  combatant: Combatant,
  combat: HitResolver,
  registry: ReactorRegistry,
  lockOnTargets: LockOnTarget[],
): () => void {
  const { id, lockOn, heart, reactor, freezable, boss = false } = combatant;
  combat.addTarget(heart);
  registry.add(id, reactor, heart);
  registry.registerFreezable(id, freezable);
  if (boss) registry.bossIds.add(id);
  if (!lockOnTargets.includes(lockOn)) lockOnTargets.push(lockOn);
  return () => {
    combat.removeTarget(id);
    registry.remove(id);
    registry.unregisterFreezable(id);
    if (boss) registry.bossIds.delete(id);
    const i = lockOnTargets.indexOf(lockOn);
    if (i >= 0) lockOnTargets.splice(i, 1);
  };
}
