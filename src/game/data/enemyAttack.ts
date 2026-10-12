import { s, type Infer } from '../../core/schema';
import json from './enemyAttack.json';
import { loadData } from './loadData';
import { totalFrames, type EnemyAttackDef, type TelegraphKind } from './types';

const pos = s.number({ min: 0 });
const frames = s.number({ min: 0, integer: true });

/** 敵・ボスの攻撃 1 つ（`EnemyAttackDef` の形。各項目の意味は types.ts）。ボスの段はこれに項目を足す（`bossMoves.ts`）。 */
export const enemyAttackShape = {
  id: s.string(),
  startup: frames,
  active: frames,
  recovery: frames,
  damage: pos,
  poiseDamage: pos,
  guardStaminaCost: pos,
  moveDistance: pos,
  arcDeg: s.number({ min: 0, max: 360 }),
  range: pos,
  heavy: s.optional(s.boolean()),
  telegraph: s.optional(s.literal('normal', 'heavy', 'unblockable')),
  followUp: s.optional(s.boolean()),
  trackDegPerSecond: s.optional(pos),
  trackEndFrame: s.optional(frames),
  poiseBonus: s.optional(pos),
};
export const EnemyAttackDefSchema = s.object(enemyAttackShape);

export const EnemyAttackDataSchema = s.object({
  /**
   * 敵・ボスの攻撃定義の共通ルール（5.1 節のテレグラフ基準）。`checkEnemyAttack` で基準を満たすことをテストする。
   * minStartup: 通常攻撃の予備動作（発生）の下限 / minHeavyStartup: 強い攻撃（ガード不能・強攻撃）の下限 /
   * minFollowUpStartup: 連続攻撃の 2 発目（`followUp`）の下限（A1 の連続は 20F。5.2 節）/
   * minActive: 持続の下限（ロール無敵 12F と確実に重なる）/
   * minDodgeWindow: 予備動作の開始から判定が消えるまで（発生 + 持続）の下限。反応してからロール（F4–F15 無敵）を
   * 判定の持続と重ねる時間が残る / trackDegPerSecond: 予備動作中に向きを追尾する速度（度/秒。通常の旋回 240°/s より遅い）/
   * trackRatio: 向きの追尾を続ける割合（発生の 60% まで。以降は向き固定でロールで躱せる）。
   */
  rules: s.object({
    minStartup: frames,
    minHeavyStartup: frames,
    minFollowUpStartup: frames,
    minActive: frames,
    minDodgeWindow: frames,
    trackDegPerSecond: pos,
    trackRatio: s.number({ min: 0, max: 1 }),
  }),
  undeadSoldierAttacks: s.object({
    a1: EnemyAttackDefSchema,
    a1b: EnemyAttackDefSchema,
    a2: EnemyAttackDefSchema,
    a3: EnemyAttackDefSchema,
  }),
  /**
   * closeRange: 近距離（A1 / A2）の条件 / midRange: 中距離（A3）の条件 / closeWeights・midWeights: 重み（中距離の残りは
   * 「選ばず接近」）/ a1ChainChance: A1 の後に A1 を連続する確率（連続は 1 回まで）/ rollPunishFrames・rollPunishA1Chance:
   * ロール直後（過去この F 以内）に近距離にいるときの A1 の確率（待機もスキップ）/ maxConsecutive: 同じ攻撃を連続で選べる最大回数。
   */
  undeadAttackRules: s.object({
    closeRange: pos,
    midRange: s.tuple(pos, pos),
    closeWeights: s.object({ a1: pos, a2: pos }),
    midWeights: s.object({ a3: s.number({ min: 0, max: 100 }) }),
    a1ChainChance: s.number({ min: 0, max: 1 }),
    rollPunishFrames: frames,
    rollPunishA1Chance: s.number({ min: 0, max: 1 }),
    maxConsecutive: frames,
  }),
});
export type EnemyAttackData = Infer<typeof EnemyAttackDataSchema>;

const data = loadData(EnemyAttackDataSchema, json, 'enemyAttack.json');

/**
 * 敵・ボスの攻撃定義の共通ルール（5.1 節のテレグラフ基準）。個別の数値は各敵のチケットで
 * `EnemyAttackDef`（types.ts）の形で追加し、`checkEnemyAttack` で基準を満たすことをテストする。
 */
export const ENEMY_ATTACK_RULES = data.rules;

/** 向きの追尾を終えるフレーム（このフレームまでは追尾する。以降は向き固定）。 */
export function trackEndFrame(def: EnemyAttackDef): number {
  return def.trackEndFrame ?? Math.floor(def.startup * ENEMY_ATTACK_RULES.trackRatio);
}

/** 反応から回避完了までの猶予（予備動作の開始から判定が消えるまで。F）。 */
export function dodgeWindow(def: EnemyAttackDef): number {
  return def.startup + def.active;
}

/** 基準違反の一覧（空なら OK）。 */
export function checkEnemyAttack(def: EnemyAttackDef): string[] {
  const problems: string[] = [];
  const minStartup = def.followUp
    ? ENEMY_ATTACK_RULES.minFollowUpStartup
    : def.heavy
      ? ENEMY_ATTACK_RULES.minHeavyStartup
      : ENEMY_ATTACK_RULES.minStartup;
  if (def.startup < minStartup) {
    problems.push(`${def.id}: 発生 ${def.startup} が下限 ${minStartup} 未満`);
  }
  if (def.active < ENEMY_ATTACK_RULES.minActive) {
    problems.push(`${def.id}: 持続 ${def.active} が下限 ${ENEMY_ATTACK_RULES.minActive} 未満`);
  }
  if (!def.followUp && dodgeWindow(def) < ENEMY_ATTACK_RULES.minDodgeWindow) {
    problems.push(
      `${def.id}: 回避の猶予 ${dodgeWindow(def)} が下限 ${ENEMY_ATTACK_RULES.minDodgeWindow} 未満`,
    );
  }
  if (trackEndFrame(def) > Math.ceil(def.startup * ENEMY_ATTACK_RULES.trackRatio)) {
    problems.push(`${def.id}: 追尾終了 F${trackEndFrame(def)} が発生の 60% を超える`);
  }
  if (totalFrames(def) <= 0 || def.damage < 0 || def.poiseDamage < 0) {
    problems.push(`${def.id}: 数値が不正`);
  }
  return problems;
}

/**
 * 亡者兵の攻撃（仕様書 5.2 節）。動作 ID は `enemy.undead.<id>` でマーカー表（`undeadClips.json`）と対応する。
 * 判定は水平の扇形（前方 `arcDeg`・射程 `range`）。突進は `moveDistance` を持続の間に均等に進む。
 * A1 横斬り / A1b（A1 の連続 2 発目）/ A2 縦斬り（大振り）/ A3 突進突き。
 */
export const UNDEAD_SOLDIER_ATTACKS = data.undeadSoldierAttacks;

export type UndeadAttackId = keyof typeof UNDEAD_SOLDIER_ATTACKS;

/** 亡者兵の攻撃選択（5.2 節の選択ルール）。距離は水平距離（m）。 */
export const UNDEAD_ATTACK_RULES = data.undeadAttackRules;

/** 攻撃のテレグラフ種別（`telegraph` の指定を優先し、なければ `heavy` から決める）。 */
export function telegraphKindOf(def: EnemyAttackDef): TelegraphKind {
  return def.telegraph ?? (def.heavy ? 'heavy' : 'normal');
}

const actionTables: { prefix: string; attacks: Readonly<Record<string, EnemyAttackDef>> }[] = [];

/**
 * 敵の攻撃表を動作 ID の接頭辞（`enemy.undead.` など）で登録する。描画側が動作 ID から攻撃定義を引いて
 * テレグラフを駆動する。新しい敵・ボスの攻撃表はここへ登録する。
 */
export function registerEnemyAttackTable(
  prefix: string,
  attacks: Readonly<Record<string, EnemyAttackDef>>,
): void {
  if (actionTables.some((t) => t.prefix === prefix)) return;
  actionTables.push({ prefix, attacks });
}

/** 動作 ID（`enemy.undead.a2`）から攻撃定義を引く。未登録なら undefined。 */
export function enemyAttackByAction(actionId: string | null): EnemyAttackDef | undefined {
  if (!actionId) return undefined;
  for (const t of actionTables) {
    if (actionId.startsWith(t.prefix)) return t.attacks[actionId.slice(t.prefix.length)];
  }
  return undefined;
}

registerEnemyAttackTable('enemy.undead.', UNDEAD_SOLDIER_ATTACKS);
