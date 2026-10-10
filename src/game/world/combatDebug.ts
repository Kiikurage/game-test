import type { EnemySpawn } from './level';

/**
 * 戦闘デバッグシーン（`?scene=combat`）。テストシーンの広場に亡者兵 1 体だけを置く。
 * プレイヤーの初期位置は広場の南（z=3.5、北向き）。亡者兵はその北 7m で南（+z）を向いて待つ。
 */
export const COMBAT_DEBUG_ENEMIES: readonly EnemySpawn[] = [
  {
    id: 'combat-undead-1',
    type: 'undead_soldier',
    area: 'A',
    x: 0,
    z: -3.5,
    yaw: 0,
    behavior: 'wait',
  },
];
