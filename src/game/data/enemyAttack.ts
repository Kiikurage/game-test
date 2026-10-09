import { totalFrames, type EnemyAttackDef } from './types';

/**
 * 敵・ボスの攻撃定義の共通ルール（5.1 節のテレグラフ基準）。個別の数値は各敵のチケットで
 * `EnemyAttackDef`（types.ts）の形で追加し、`checkEnemyAttack` で基準を満たすことをテストする。
 */
export const ENEMY_ATTACK_RULES = {
  /** 通常攻撃の予備動作（発生）の下限。 */
  minStartup: 24,
  /** 強い攻撃（ガード不能・強攻撃）の予備動作の下限。 */
  minHeavyStartup: 34,
  /** 持続の下限（ロール無敵 12F と確実に重なる）。 */
  minActive: 4,
} as const;

/** 基準違反の一覧（空なら OK）。 */
export function checkEnemyAttack(def: EnemyAttackDef): string[] {
  const problems: string[] = [];
  const minStartup = def.heavy ? ENEMY_ATTACK_RULES.minHeavyStartup : ENEMY_ATTACK_RULES.minStartup;
  if (def.startup < minStartup) {
    problems.push(`${def.id}: 発生 ${def.startup} が下限 ${minStartup} 未満`);
  }
  if (def.active < ENEMY_ATTACK_RULES.minActive) {
    problems.push(`${def.id}: 持続 ${def.active} が下限 ${ENEMY_ATTACK_RULES.minActive} 未満`);
  }
  if (totalFrames(def) <= 0 || def.damage < 0 || def.poiseDamage < 0) {
    problems.push(`${def.id}: 数値が不正`);
  }
  return problems;
}
