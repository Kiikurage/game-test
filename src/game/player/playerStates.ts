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
  // 被弾（#50）: 仰け反り 24F（Hit_Chest）/ 転倒 48F（Hit_Knockback）。どの状態からも入る。
  | 'flinch'
  | 'knockdown'
  // 死亡（HP 0）。どの状態からも入り、リスポーン（`Player.teleport`）でしか出られない。演出・UI は別チケット。
  | 'dead';

/** 軽攻撃の動作 ID（コンボ順）。状態 ID・`PLAYER_ACTIONS` のキー・マーカー表 `player.<id>` が一致する。 */
export const LIGHT_ATTACK_IDS = ['light1', 'light2', 'light3'] as const;
export type LightAttackId = (typeof LIGHT_ATTACK_IDS)[number];

export function isLightAttackState(state: PlayerStateId): state is LightAttackId {
  return state === 'light1' || state === 'light2' || state === 'light3';
}

/** 被弾で入る状態（どの状態からも遷移できる）。 */
const REACTIONS = ['flinch', 'knockdown', 'dead'] as const;

/** 遷移グラフ。ここにない遷移は `IllegalTransitionError` になる（状態機械が不正遷移を拒否する）。 */
export const PLAYER_STATE_GRAPH: StateGraph<PlayerStateId> = {
  // 移動系からは、コンボ窓（全体 + 12F）が残っていれば軽 2・軽 3 へも入れる
  idle: {
    kind: 'idle',
    to: ['move', 'dash', 'roll', 'backstep', 'fall', ...LIGHT_ATTACK_IDS, ...REACTIONS],
  },
  move: {
    kind: 'move',
    to: ['idle', 'dash', 'roll', 'backstep', 'fall', ...LIGHT_ATTACK_IDS, ...REACTIONS],
  },
  dash: {
    kind: 'move',
    to: ['idle', 'move', 'roll', 'backstep', 'fall', ...LIGHT_ATTACK_IDS, ...REACTIONS],
  },
  // ロール終了・キャンセル: 移動・ダッシュ（ボタン保持）・停止・落下・攻撃（F26 以降）
  roll: { kind: 'action', to: ['idle', 'move', 'dash', 'fall', 'light1', ...REACTIONS] },
  backstep: { kind: 'action', to: ['idle', 'move', 'light1', ...REACTIONS] },
  // 小さな段差の乗り降りは着地せず立ち・移動へ戻る
  fall: { kind: 'move', to: ['idle', 'move', 'land', ...REACTIONS] },
  // 着地硬直: 途中からロール系で抜けられる
  land: { kind: 'action', to: ['idle', 'move', 'roll', 'backstep', 'fall', ...REACTIONS] },
  // 軽攻撃: 次段（キャンセル窓）・ロール/バックステップ（キャンセル窓）・終了で移動系へ
  light1: {
    kind: 'action',
    to: ['idle', 'move', 'fall', 'roll', 'backstep', 'light2', ...REACTIONS],
  },
  light2: {
    kind: 'action',
    to: ['idle', 'move', 'fall', 'roll', 'backstep', 'light3', ...REACTIONS],
  },
  light3: { kind: 'action', to: ['idle', 'move', 'fall', 'roll', 'backstep', ...REACTIONS] },
  // 被弾の硬直。終了後は移動・待機・落下へ（硬直中は行動不能。再被弾は restart / 転倒への格上げ）
  flinch: { kind: 'stagger', to: ['idle', 'move', 'fall', 'knockdown', 'dead'] },
  knockdown: { kind: 'stagger', to: ['idle', 'move', 'fall', 'flinch', 'dead'] },
  dead: { kind: 'dead', to: [] },
};

/** 被弾の硬直中（仰け反り・転倒）。 */
export function isReactionState(state: PlayerStateId): boolean {
  return state === 'flinch' || state === 'knockdown';
}

/** ロール・バックステップ中のように、入力による通常移動を受け付けない状態。 */
export function isDodgeState(state: PlayerStateId): boolean {
  return state === 'roll' || state === 'backstep';
}
