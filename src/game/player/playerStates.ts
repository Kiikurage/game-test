import type { StateGraph } from '../anim/characterFsm';

/**
 * プレイヤーの行動状態。後続の攻撃・ガード・被弾・回復（#46 / #53 / #50 など）は、ここへ状態 ID と遷移を足し、
 * `Player.updateState` の分岐とキャンセル窓（`PLAYER_ACTIONS.*.cancels`）、マーカー表（`player.<状態 ID>`）を書く。
 * `kind: 'action'` の状態は、状態 ID（または `actionId`）が `PLAYER_ACTIONS` のキー・マーカー表の ID と対応する。
 */
export type PlayerStateId =
  | 'idle'
  | 'move'
  | 'dash'
  | 'roll'
  | 'backstep'
  | 'fall'
  | 'land'
  | 'light1'
  | 'light2'
  | 'light3'
  // 強攻撃（#52）: 溜め（ボタン保持。歩き 1.0 m/s）→ 離すと発生へ。溜め 30F 未満は `heavy`、30F 以上は `heavyCharged`。
  // 走り攻撃: ダッシュ・走り中の攻撃入力。
  | 'heavyCharge'
  | 'heavy'
  | 'heavyCharged'
  | 'runAttack'
  // 回復瓶（#48）: 全体 54F（F26 で HP 加算）/ 残数 0 の空振り 20F
  | 'heal'
  | 'healEmpty'
  // 被弾（#50）: 仰け反り 24F（Hit_Chest）/ 転倒 48F（Hit_Knockback）。どの状態からも入る。
  | 'flinch'
  | 'knockdown'
  // ガード（#53）: 構え・保持（`guard`）、解除の硬直 8F、ガード崩し 54F、ガードカウンター 47F。
  | 'guard'
  | 'guardRelease'
  | 'guardBreak'
  | 'guardCounter'
  // 状況アクション（#55）: 調べる動作（`interact`。篝火の点火など）、座り込み（`sitDown`）、座って保持（`rest`）、
  // 立ち上がり（`standUp`。リスポーンはここから始まる）。長さは `Player.beginScripted` が決める。
  | 'interact'
  | 'sitDown'
  | 'rest'
  | 'standUp'
  // 死亡（HP 0）。どの状態からも入り、リスポーン（`Player.teleport`）でしか出られない。演出・UI は別チケット。
  | 'dead';

/** 軽攻撃の動作 ID（コンボ順）。状態 ID・`PLAYER_ACTIONS` のキー・マーカー表 `player.<id>` が一致する。 */
export const LIGHT_ATTACK_IDS = ['light1', 'light2', 'light3'] as const;
export type LightAttackId = (typeof LIGHT_ATTACK_IDS)[number];

/** 強攻撃の動作 ID（溜めなし / フル溜め）。どちらも発生 22・持続 6・硬直 38 で、F6〜持続終了がスーパーアーマー。 */
export const HEAVY_ATTACK_IDS = ['heavy', 'heavyCharged'] as const;
export type HeavyAttackId = (typeof HEAVY_ATTACK_IDS)[number];

/** 攻撃判定を出す動作の ID（軽攻撃・強攻撃・走り攻撃・ガードカウンター）。状態 ID・`PLAYER_ACTIONS` のキー・マーカー表が一致する。 */
export type PlayerAttackId = LightAttackId | HeavyAttackId | 'runAttack' | 'guardCounter';

export function isAttackState(state: PlayerStateId): state is PlayerAttackId {
  return (
    isLightAttackState(state) ||
    isHeavyAttackState(state) ||
    state === 'runAttack' ||
    state === 'guardCounter'
  );
}

export function isHeavyAttackState(state: PlayerStateId): state is HeavyAttackId {
  return state === 'heavy' || state === 'heavyCharged';
}

export function isLightAttackState(state: PlayerStateId): state is LightAttackId {
  return state === 'light1' || state === 'light2' || state === 'light3';
}

/** 被弾で入る状態（どの状態からも遷移できる）。 */
const REACTIONS = ['flinch', 'knockdown', 'dead'] as const;
/** 回復瓶の動作（地上・ロール F26 以降から入る）。 */
const HEALS = ['heal', 'healEmpty'] as const;
/** 強攻撃の入口（溜め開始）。軽攻撃の窓・ロール/バックステップ/回復のキャンセル窓の `attack` から入れる。 */
const HEAVY_ENTRY = 'heavyCharge';
/** 状況アクション（地上から入る。`Player.beginScripted`）。 */
const SCRIPTED = ['interact', 'sitDown', 'standUp'] as const;

/** 遷移グラフ。ここにない遷移は `IllegalTransitionError` になる（状態機械が不正遷移を拒否する）。 */
export const PLAYER_STATE_GRAPH: StateGraph<PlayerStateId> = {
  // 移動系からは、コンボ窓（全体 + 12F）が残っていれば軽 2・軽 3 へも入れる
  idle: {
    kind: 'idle',
    to: [
      'move',
      'dash',
      'roll',
      'backstep',
      'fall',
      'guard',
      ...LIGHT_ATTACK_IDS,
      HEAVY_ENTRY,
      ...HEALS,
      ...SCRIPTED,
      ...REACTIONS,
    ],
  },
  move: {
    kind: 'move',
    to: [
      'idle',
      'dash',
      'roll',
      'backstep',
      'fall',
      'guard',
      ...LIGHT_ATTACK_IDS,
      HEAVY_ENTRY,
      'runAttack',
      ...HEALS,
      ...SCRIPTED,
      ...REACTIONS,
    ],
  },
  dash: {
    kind: 'move',
    to: [
      'idle',
      'move',
      'roll',
      'backstep',
      'fall',
      'guard',
      ...LIGHT_ATTACK_IDS,
      HEAVY_ENTRY,
      'runAttack',
      ...HEALS,
      ...SCRIPTED,
      ...REACTIONS,
    ],
  },
  // ロール終了・キャンセル: 移動・ダッシュ（ボタン保持）・停止・落下・攻撃・ガード・回復（F26 以降）
  roll: {
    kind: 'action',
    to: ['idle', 'move', 'dash', 'fall', 'light1', HEAVY_ENTRY, 'guard', ...HEALS, ...REACTIONS],
  },
  backstep: { kind: 'action', to: ['idle', 'move', 'light1', HEAVY_ENTRY, ...REACTIONS] },
  // 小さな段差の乗り降りは着地せず立ち・移動へ戻る
  fall: { kind: 'move', to: ['idle', 'move', 'land', ...REACTIONS] },
  // 着地硬直: 途中からロール系で抜けられる
  land: { kind: 'action', to: ['idle', 'move', 'roll', 'backstep', 'fall', ...REACTIONS] },
  // 軽攻撃: 次段（キャンセル窓）・ロール/バックステップ（キャンセル窓）・終了で移動系へ
  light1: {
    kind: 'action',
    to: ['idle', 'move', 'fall', 'roll', 'backstep', 'guard', 'light2', HEAVY_ENTRY, ...REACTIONS],
  },
  light2: {
    kind: 'action',
    to: ['idle', 'move', 'fall', 'roll', 'backstep', 'guard', 'light3', HEAVY_ENTRY, ...REACTIONS],
  },
  light3: {
    kind: 'action',
    to: ['idle', 'move', 'fall', 'roll', 'backstep', 'guard', HEAVY_ENTRY, ...REACTIONS],
  },
  // 強攻撃の溜め: ボタンを離すと発生へ（溜め 30F 未満 = heavy、以上 = heavyCharged）。溜め中もロールで抜けられる。
  heavyCharge: {
    kind: 'action',
    to: ['heavy', 'heavyCharged', 'roll', 'backstep', 'fall', ...REACTIONS],
  },
  // 強攻撃: ロール/バックステップへは F44（持続終了 + 16F）から。終わりで移動系へ（次は軽攻撃 1）
  heavy: {
    kind: 'action',
    to: ['idle', 'move', 'fall', 'roll', 'backstep', ...REACTIONS],
  },
  heavyCharged: {
    kind: 'action',
    to: ['idle', 'move', 'fall', 'roll', 'backstep', ...REACTIONS],
  },
  // 走り攻撃: キャンセル窓なし。終わりで移動系へ
  runAttack: { kind: 'action', to: ['idle', 'move', 'fall', ...REACTIONS] },
  // 回復: F30 からロールへ、F36 から攻撃・ガードへキャンセル可。終了で移動系へ
  heal: {
    kind: 'action',
    to: ['idle', 'move', 'fall', 'roll', 'backstep', 'light1', HEAVY_ENTRY, 'guard', ...REACTIONS],
  },
  healEmpty: { kind: 'action', to: ['idle', 'move', 'fall', ...REACTIONS] },
  // 被弾の硬直。終了後は移動・待機・落下へ（硬直中は行動不能。再被弾は restart / 転倒への格上げ）
  flinch: { kind: 'stagger', to: ['idle', 'move', 'fall', 'knockdown', 'dead'] },
  knockdown: { kind: 'stagger', to: ['idle', 'move', 'fall', 'flinch', 'dead'] },
  // ガード: 移動系（歩きながら構える。上半身レイヤ）。ロール・ガードカウンターへは即時、解除は硬直を挟む。
  // 構え完了前（F1–F5）や背面からの被弾は通常の被弾（REACTIONS）。
  guard: {
    kind: 'move',
    to: [
      'idle',
      'move',
      'fall',
      'roll',
      'backstep',
      'guardRelease',
      'guardBreak',
      'guardCounter',
      ...REACTIONS,
    ],
  },
  // 解除の硬直 8F。再入力で即ガード復帰、終わりで（先行入力の）通常攻撃か移動系へ。
  guardRelease: {
    kind: 'move',
    to: ['idle', 'move', 'fall', 'guard', 'light1', ...REACTIONS],
  },
  // ガード崩し: 54F の行動不能（被ダメージ 1.5 倍）。途中の被弾でも姿勢は崩れたまま。
  guardBreak: { kind: 'stagger', to: ['idle', 'move', 'fall', 'dead'] },
  // ガードカウンター: 盾の打撃。終わりで移動系へ。
  guardCounter: { kind: 'action', to: ['idle', 'move', 'fall', ...REACTIONS] },
  // 状況アクション: 終わりで移動系へ（座り込みは `rest` へ。`rest` は `standUp` まで保持）。被弾・死亡は割り込める。
  interact: { kind: 'action', to: ['idle', 'move', 'fall', ...REACTIONS] },
  sitDown: { kind: 'action', to: ['rest', ...REACTIONS] },
  rest: { kind: 'action', to: ['standUp', ...REACTIONS] },
  standUp: { kind: 'action', to: ['idle', 'move', 'fall', ...REACTIONS] },
  dead: { kind: 'dead', to: [] },
};

/** ガード系の状態（構え・解除の硬直）。ガード崩しは含まない。 */
export function isGuardState(state: PlayerStateId): boolean {
  return state === 'guard' || state === 'guardRelease';
}

/** 被弾の硬直中（仰け反り・転倒）。 */
export function isReactionState(state: PlayerStateId): boolean {
  return state === 'flinch' || state === 'knockdown';
}

/** 回復瓶の動作中（回復・空振り）。 */
export function isHealState(state: PlayerStateId): state is 'heal' | 'healEmpty' {
  return state === 'heal' || state === 'healEmpty';
}

/** ロール・バックステップ中のように、入力による通常移動を受け付けない状態。 */
export function isDodgeState(state: PlayerStateId): boolean {
  return state === 'roll' || state === 'backstep';
}

/** 状況アクション（調べる・座り込み・休憩の保持・立ち上がり）の最中。入力で移動・攻撃などはできない。 */
export function isScriptedState(state: PlayerStateId): boolean {
  return state === 'interact' || state === 'sitDown' || state === 'rest' || state === 'standUp';
}

/** 座っている間（座り込み・保持・立ち上がり）。篝火の安全を表し、被弾しない。 */
export function isSeatedState(state: PlayerStateId): boolean {
  return state === 'sitDown' || state === 'rest' || state === 'standUp';
}
