import { totalFrames, type EnemyAttackDef, type TelegraphKind } from './types';

/**
 * 敵・ボスの攻撃定義の共通ルール（5.1 節のテレグラフ基準）。個別の数値は各敵のチケットで
 * `EnemyAttackDef`（types.ts）の形で追加し、`checkEnemyAttack` で基準を満たすことをテストする。
 */
export const ENEMY_ATTACK_RULES = {
  /** 通常攻撃の予備動作（発生）の下限。 */
  minStartup: 24,
  /** 強い攻撃（ガード不能・強攻撃）の予備動作の下限。 */
  minHeavyStartup: 34,
  /** 連続攻撃の 2 発目（`followUp`）の予備動作の下限（A1 の連続は 20F。5.2 節）。 */
  minFollowUpStartup: 20,
  /** 持続の下限（ロール無敵 12F と確実に重なる）。 */
  minActive: 4,
  /**
   * 反応から回避完了までの猶予の下限（F）。予備動作の開始から判定が消えるまで（発生 + 持続）が
   * これ以上あれば、反応してからロール（F4–F15 無敵）を判定の持続と重ねる時間が残る。
   */
  minDodgeWindow: 26,
  /** 予備動作中に向きを追尾する速度（度/秒。通常の旋回 240°/s より遅い）。 */
  trackDegPerSecond: 120,
  /** 向きの追尾を続ける割合（発生の 60% まで。以降は向き固定でロールで躱せる）。 */
  trackRatio: 0.6,
} as const;

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
 */
export const UNDEAD_SOLDIER_ATTACKS = {
  /** A1 横斬り。 */
  a1: {
    id: 'a1',
    startup: 24,
    active: 5,
    recovery: 28,
    damage: 45,
    poiseDamage: 25,
    guardStaminaCost: 22,
    moveDistance: 0,
    arcDeg: 100,
    range: 1.8,
  },
  /** A1 の連続（2 発目）。発生 20F に短縮、ダメージ 45。 */
  a1b: {
    id: 'a1b',
    startup: 20,
    active: 5,
    recovery: 28,
    damage: 45,
    poiseDamage: 25,
    guardStaminaCost: 22,
    moveDistance: 0,
    arcDeg: 100,
    range: 1.8,
    followUp: true,
  },
  /** A2 縦斬り（大振り）。 */
  a2: {
    id: 'a2',
    startup: 34,
    active: 6,
    recovery: 36,
    damage: 70,
    poiseDamage: 50,
    guardStaminaCost: 35,
    moveDistance: 0,
    arcDeg: 60,
    range: 2.0,
    heavy: true,
  },
  /** A3 突進突き。突進 2.5m は持続 8F の間に進む。 */
  a3: {
    id: 'a3',
    startup: 28,
    active: 8,
    recovery: 34,
    damage: 55,
    poiseDamage: 30,
    guardStaminaCost: 28,
    moveDistance: 2.5,
    arcDeg: 30,
    range: 1.8,
  },
} as const satisfies Record<string, EnemyAttackDef>;

export type UndeadAttackId = keyof typeof UNDEAD_SOLDIER_ATTACKS;

/** 亡者兵の攻撃選択（5.2 節の選択ルール）。距離は水平距離（m）。 */
export const UNDEAD_ATTACK_RULES = {
  /** 近距離（A1 / A2）の選択条件。 */
  closeRange: 2.2,
  /** 中距離（A3）の選択条件。 */
  midRange: [2.5, 5.0],
  /** 近距離の重み。 */
  closeWeights: { a1: 60, a2: 40 },
  /** 中距離の重み（残りは「選ばず接近」）。 */
  midWeights: { a3: 70 },
  /** A1 の後に A1 を連続する確率（連続は 1 回まで = 最大 2 発）。 */
  a1ChainChance: 0.4,
  /** ロール直後（過去この F 以内）に近距離にいるときの A1 の確率（待機もスキップ）。 */
  rollPunishFrames: 20,
  rollPunishA1Chance: 0.7,
  /** 同じ攻撃を連続で選べる最大回数（3 回連続は選ばない）。 */
  maxConsecutive: 2,
} as const;

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
