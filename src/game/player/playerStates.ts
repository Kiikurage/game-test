import type { StateGraph } from '../anim/characterFsm';

/**
 * プレイヤーの行動状態。後続の攻撃・ガード・被弾・回復（#46 / #53 / #50 など）は、ここへ状態 ID と遷移を足し、
 * `Player.updateState` の分岐とキャンセル窓（`PLAYER_ACTIONS.*.cancels`）、マーカー表（`player.<状態 ID>`）を書く。
 * `kind: 'action'` の状態は、状態 ID（または `actionId`）が `PLAYER_ACTIONS` のキー・マーカー表の ID と対応する。
 */
export type PlayerStateId = 'idle' | 'move' | 'dash' | 'roll' | 'backstep' | 'fall' | 'land';

/** 遷移グラフ。ここにない遷移は `IllegalTransitionError` になる（状態機械が不正遷移を拒否する）。 */
export const PLAYER_STATE_GRAPH: StateGraph<PlayerStateId> = {
  idle: { kind: 'idle', to: ['move', 'dash', 'roll', 'backstep', 'fall'] },
  move: { kind: 'move', to: ['idle', 'dash', 'roll', 'backstep', 'fall'] },
  dash: { kind: 'move', to: ['idle', 'move', 'roll', 'backstep', 'fall'] },
  // ロール終了・キャンセル: 移動・ダッシュ（ボタン保持）・停止・落下
  roll: { kind: 'action', to: ['idle', 'move', 'dash', 'fall'] },
  backstep: { kind: 'action', to: ['idle', 'move'] },
  // 小さな段差の乗り降りは着地せず立ち・移動へ戻る
  fall: { kind: 'move', to: ['idle', 'move', 'land'] },
  // 着地硬直: 途中からロール系で抜けられる
  land: { kind: 'action', to: ['idle', 'move', 'roll', 'backstep', 'fall'] },
};

/** ロール・バックステップ中のように、入力による通常移動を受け付けない状態。 */
export function isDodgeState(state: PlayerStateId): boolean {
  return state === 'roll' || state === 'backstep';
}
