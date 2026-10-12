import type { StateKind } from '../anim/characterFsm';
import type { PlayerStateId } from './playerStates';

/** 状況アクションの状態（`Player.beginScripted`）。 */
export type ScriptedActionState = 'interact' | 'sitDown' | 'standUp';

export interface ScriptedOptions {
  /** 動作の長さ（フレーム）。この後に次の状態へ移る（interact / standUp は移動系、sitDown は rest）。 */
  readonly frames: number;
  /** この向き（ヨー）へ体を向ける（省略時は今の向きのまま）。 */
  readonly faceYaw?: number;
}

/** アニメーション側（`CharacterAnimator`）が読む、状態に依存しない描画用の情報。 */
export interface PlayerAnimationState {
  readonly state: PlayerStateId;
  /** 状態の共通分類（Idle / Move / Action / Stagger / Dead）。 */
  readonly kind: StateKind;
  /** `kind: 'action'` の間の動作 ID（マーカー表は `player.<動作 ID>`）。 */
  readonly actionId: string | null;
  /** 動作の全体フレーム数がマーカー表にない状態（着地など）の長さ。なければ 0。 */
  readonly totalFrames: number;
  /** 歩行サイクルの共通位相（0..1）と、直近 1 ステップでの変化量（逆回しなら負）。 */
  readonly gaitPhase: number;
  readonly gaitPhaseStep: number;
  /** ヒットストップ中（直近のステップが凍結だった）。アニメーションも止める。 */
  readonly frozen: boolean;
  /** 現在の状態に入ってからのフレーム数（F1 起点）。 */
  readonly stateFrame: number;
  /** 水平速度の大きさ（m/s）。 */
  readonly speed: number;
  /** 水平速度を向きの座標系で表したもの。x: 右が正, z: 前が正（m/s）。 */
  readonly localVelocity: { readonly x: number; readonly z: number };
  readonly lockedOn: boolean;
  /** 向き（ヨー）。 */
  readonly yaw: number;
  /** ガードの見た目の段階（上半身の盾の構え。ガード系の状態でなければ none）。 */
  readonly guard: GuardPresentation;
}

/**
 * ガードの見た目: `raise` 構え中（F1–構え完了）、`hold` 保持、`hit` 被ガードのスタン中、`release` 解除の硬直、
 * `none` ガードしていない。`frame` は構えに入ってからのフレーム（`hit` では被ガードからのフレーム）。
 */
export interface GuardPresentation {
  readonly phase: 'none' | 'raise' | 'hold' | 'hit' | 'release';
  readonly frame: number;
}
