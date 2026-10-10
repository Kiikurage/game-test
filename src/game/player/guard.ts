import { GUARD, inWindow, type FrameWindow } from '../data';
import type { GuardOutcome } from '../combat';

/**
 * ガードの純粋ロジック（仕様書 2.3 節）。状態機械への組み込みは `Player` が行う。
 * フレーム・窓は `GuardParams` として外部から差し替えられる（入力補助 11.2 節。実際の差し替えは E10-1）。
 */

export interface GuardParams {
  /** 構え完了のフレーム（構えに入ってから何 F 目で判定が出るか）。 */
  readonly raiseFrames: number;
  /** ジャストガードの窓（構えに入ってからのフレーム）。 */
  readonly justWindow: FrameWindow;
  /** 解除の硬直。 */
  readonly releaseFrames: number;
  /** 正面の防御角度（度。±半分）。 */
  readonly frontArcDeg: number;
  /** ガード被弾のスタン。 */
  readonly stunFrames: number;
  /** ガードカウンターを出せる、被ガード後のフレーム数。 */
  readonly counterWindowFrames: number;
  /** ガード崩しの行動不能フレーム。 */
  readonly breakFrames: number;
}

export const DEFAULT_GUARD_PARAMS: GuardParams = {
  raiseFrames: GUARD.raiseFrames,
  justWindow: GUARD.justWindow,
  releaseFrames: GUARD.releaseRecoveryFrames,
  frontArcDeg: GUARD.frontArcDeg,
  stunFrames: GUARD.stunFrames,
  counterWindowFrames: GUARD.counterWindowFrames,
  breakFrames: GUARD.breakFrames,
};

const DEG = Math.PI / 180;
/** 境界（ちょうど ±60°）を含めるための浮動小数の許容。 */
const ARC_EPSILON = 1e-9;

/**
 * 攻撃者 `(ax, az)` が、`(px, pz)` で向き `yaw`（前方 = (sin yaw, cos yaw)）のガード側の正面 `arcDeg`（±半分）に
 * 入っているか。境界（ちょうど ±半分）は防げる。水平距離 0（真上・真下に重なる）の場合は防げるとして扱う。
 */
export function isWithinGuardArc(
  px: number,
  pz: number,
  yaw: number,
  ax: number,
  az: number,
  arcDeg: number,
): boolean {
  const dx = ax - px;
  const dz = az - pz;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return true;
  const cos = (Math.sin(yaw) * dx + Math.cos(yaw) * dz) / len;
  return cos >= Math.cos((arcDeg / 2) * DEG) - ARC_EPSILON;
}

/**
 * 構えの経過フレーム `guardFrame`（構えに入った最初のステップが F1）での、正面からの攻撃に対する判定。
 * 構え完了前は `none`、ジャストガードの窓の中は `just`、それ以外は `guard`。
 */
export function guardOutcomeAt(guardFrame: number, params: GuardParams): GuardOutcome {
  if (guardFrame < params.raiseFrames) return 'none';
  return inWindow(guardFrame, params.justWindow) ? 'just' : 'guard';
}

/**
 * ガード被弾からの経過を数える（ガードカウンターの受付窓）。`hit()` で 0 に戻し、凍結されないステップごとに
 * `step()` する。被弾したステップを 0 とし、次のステップが 1。窓は 1..`frames()`（30F 以内）。
 */
export class GuardCounterWindow {
  private age = Number.POSITIVE_INFINITY;

  constructor(private readonly frames: () => number) {}

  hit(): void {
    this.age = 0;
  }

  step(): void {
    if (this.age !== Number.POSITIVE_INFINITY) this.age++;
  }

  /** 受付中か。 */
  get open(): boolean {
    return this.age >= 1 && this.age <= this.frames();
  }

  /** 経過ステップ数（被弾していなければ Infinity。デバッグ・テスト用）。 */
  get elapsed(): number {
    return this.age;
  }

  /** カウンターを出した / ガード崩しなどで窓を閉じる。 */
  close(): void {
    this.age = Number.POSITIVE_INFINITY;
  }
}
