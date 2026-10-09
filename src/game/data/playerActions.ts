import type { PlayerActionData, PlayerActionId } from './types';

/**
 * プレイヤーのアクション別フレームデータ（仕様書 2.3 節の表と補足の転記）。値は初期値で調整対象。
 * 全体フレームは表の値と一致する（playerActions.test.ts で保証）。
 *
 * 転記の規約:
 * - 発生・持続・硬直は表の値。判定のない動作（ロール・バックステップ・回復）は持続 0 とし、
 *   回復は「F26 で HP 加算」を `startup: 25` + `applyFrame: 26` で表す。
 * - キャンセル窓は仕様の文言から F 番号に直した値（コメントに根拠）。
 *   窓の終端が全体を超えるもの（軽攻撃の連続入力窓 = 全体 + 12F）は動作終了後も受け付ける。
 */
export const PLAYER_ACTIONS = {
  light1: {
    id: 'light1',
    startup: 12,
    active: 4,
    recovery: 20,
    staminaCost: 14,
    damageMultiplier: 1.0,
    poiseDamage: 20,
    moveDistance: 0.5,
    arcDeg: 110,
    cancels: [
      // 次の軽攻撃/強攻撃: 持続終了 + 4F（F20）から 全体終了 + 12F（F48）まで
      { to: 'lightAttack', start: 20, end: 48 },
      { to: 'heavyAttack', start: 20, end: 48 },
      // ロール/バックステップ: 持続終了の 2F 後（F18）から
      { to: 'dodge', start: 18, end: 36 },
      // ガード: 持続終了の 6F 後（F22）から
      { to: 'guard', start: 22, end: 36 },
    ],
    note: '横斬り',
  },
  light2: {
    id: 'light2',
    startup: 10,
    active: 4,
    recovery: 22,
    staminaCost: 14,
    damageMultiplier: 1.05,
    poiseDamage: 20,
    moveDistance: 0.5,
    arcDeg: 90,
    cancels: [
      { to: 'lightAttack', start: 18, end: 48 },
      { to: 'heavyAttack', start: 18, end: 48 },
      { to: 'dodge', start: 16, end: 36 },
      { to: 'guard', start: 20, end: 36 },
    ],
    note: '斬り下ろし',
  },
  light3: {
    id: 'light3',
    startup: 16,
    active: 6,
    recovery: 30,
    staminaCost: 20,
    damageMultiplier: 1.3,
    poiseDamage: 35,
    moveDistance: 1.0,
    arcDeg: 40,
    range: 2.2,
    cancels: [
      // コンボ終点: 軽攻撃には繋がらず、強攻撃のみ可（窓は 持続終了 + 4F から 全体 + 12F）
      { to: 'heavyAttack', start: 26, end: 64 },
      { to: 'dodge', start: 24, end: 52 },
      { to: 'guard', start: 28, end: 52 },
    ],
    note: '突き。コンボ終点',
  },
  heavy: {
    id: 'heavy',
    startup: 22,
    active: 6,
    recovery: 38,
    staminaCost: 28,
    damageMultiplier: 1.8,
    poiseDamage: 60,
    moveDistance: 0.8,
    // 発生 F6 以降、持続終了（F28）までスーパーアーマー（強靭度 +40）
    superArmor: { start: 6, end: 28, poiseBonus: 40 },
    // ロール/バックステップへは F44（持続終了 + 16F）から
    cancels: [{ to: 'dodge', start: 44, end: 66 }],
    note: '溜めなし',
  },
  heavyCharged: {
    id: 'heavyCharged',
    startup: 22,
    active: 6,
    recovery: 38,
    chargeFrames: 30,
    staminaCost: 34,
    damageMultiplier: 2.3,
    poiseDamage: 80,
    moveDistance: 1.0,
    superArmor: { start: 6, end: 28, poiseBonus: 40 },
    cancels: [{ to: 'dodge', start: 44, end: 66 }],
    note: 'フル溜め（溜め 30F の後に発生へ。溜め中は歩き速度 1.0 m/s）',
  },
  runAttack: {
    id: 'runAttack',
    startup: 14,
    active: 5,
    recovery: 30,
    staminaCost: 20,
    damageMultiplier: 1.2,
    poiseDamage: 40,
    moveDistance: 2.0,
    cancels: [],
    note: 'ダッシュまたは走り中に攻撃',
  },
  guardCounter: {
    id: 'guardCounter',
    startup: 14,
    active: 5,
    recovery: 28,
    staminaCost: 16,
    damageMultiplier: 1.4,
    poiseDamage: 50,
    moveDistance: 0.8,
    cancels: [],
    note: 'ガード被弾から 30F 以内に攻撃。盾の打撃',
  },
  backstab: {
    id: 'backstab',
    startup: 10,
    active: 3,
    recovery: 34,
    staminaCost: 16,
    damageMultiplier: 4.0,
    poiseDamage: 100,
    moveDistance: 0.9,
    cancels: [],
    note: '致命の一撃（#39）。未発見の敵の背面 ±60°・1.6m 以内で軽攻撃。背後へ吸着',
  },
  plunge: {
    id: 'plunge',
    // 発生は着地時（0）。全体は「着地 + 28」
    startup: 0,
    active: 4,
    recovery: 24,
    staminaCost: 20,
    damageMultiplier: 2.2,
    poiseDamage: 60,
    moveDistance: 0,
    cancels: [],
    note: '落下攻撃（#39）。高さ 1.5m 以上、ガード不能、空中補正 ±1.5 m/s',
  },
  roll: {
    id: 'roll',
    startup: 3,
    active: 0,
    recovery: 29,
    staminaCost: 20,
    poiseDamage: 0,
    moveDistance: 3.2,
    invuln: { start: 4, end: 15 },
    // F26 から攻撃・ガード・回復・移動へキャンセル可
    cancels: [
      { to: 'attack', start: 26, end: 32 },
      { to: 'guard', start: 26, end: 32 },
      { to: 'heal', start: 26, end: 32 },
      { to: 'move', start: 26, end: 32 },
    ],
  },
  backstep: {
    id: 'backstep',
    startup: 2,
    active: 0,
    recovery: 20,
    staminaCost: 12,
    poiseDamage: 0,
    moveDistance: 2.0,
    invuln: { start: 1, end: 8 },
    cancels: [{ to: 'attack', start: 18, end: 22 }],
    note: 'ロックオン中または移動入力なしでロール入力',
  },
  heal: {
    id: 'heal',
    // F26 で HP 加算（healApply）。F1–F25 はロール・攻撃・ガードにキャンセル不可
    startup: 25,
    active: 0,
    recovery: 29,
    staminaCost: 0,
    poiseDamage: 0,
    moveDistance: 0,
    applyFrame: 26,
    healAmount: 120,
    cancels: [
      { to: 'dodge', start: 30, end: 54 },
      { to: 'attack', start: 36, end: 54 },
      { to: 'guard', start: 36, end: 54 },
    ],
    note: '回復中の移動 1.0 m/s。F26 より前に被弾して仰け反ると回復は失われ瓶だけ消費',
  },
} as const satisfies Record<PlayerActionId, PlayerActionData>;

/** 落下攻撃の倍率: 未発見の敵に対して（2.3 節「未発見の敵 3.30」）。 */
export const PLUNGE_UNAWARE_MULTIPLIER = 3.3;

/** 強攻撃の溜め中の移動速度（m/s）。 */
export const HEAVY_CHARGE_MOVE_SPEED = 1.0;

/** ロール終了時（F32）にボタンが押されていればダッシュへ移行する。 */
export const ROLL_DASH_TRANSITION_FRAME = 32;

/** 空振りの回復動作（残数 0 で入力）。回復なし・SE のみ。 */
export const HEAL_EMPTY_FRAMES = 20;

export const PLAYER_ACTION_IDS = Object.keys(PLAYER_ACTIONS) as PlayerActionId[];
