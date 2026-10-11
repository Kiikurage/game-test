import { AMBUSH } from '../data';
import type { EnemyStateId } from '../enemy/enemyStates';

/**
 * 致命の一撃（仕様書 14.3.2 節）の条件判定と吸着の計算。純粋な関数だけ（Rapier・three 非依存）。
 * `Player` は `AmbushSource`（対象の探索と拘束）を通して使い、Game への接続は `ambush.system.ts` が行う。
 *
 * 座標: ヨーは前方 = (sin yaw, cos yaw)。
 */

export interface Point3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** 致命の一撃の対象になれる敵（生きた参照。位置・向きは毎ステップ更新される）。 */
export interface AmbushCandidate {
  readonly id: string;
  /** 足元の位置。 */
  readonly position: Point3;
  readonly yaw: number;
}

/** `Player` が致命の一撃の対象を探し、拘束を始める・終えるための口（`ambush.system.ts` が実装する）。 */
export interface AmbushSource {
  /** `feet` から致命の一撃が成立する対象（なければ null）。複数なら最も近い敵。 */
  find(feet: Point3): AmbushCandidate | null;
  /** 発動した（F1）。対象を拘束する。 */
  begin(target: AmbushCandidate): void;
  /** 終わった（動作の終了・被弾による中断）。拘束を解く。 */
  end(target: AmbushCandidate): void;
}

/** 敵の AI 状態が致命の一撃の対象か（Idle / Suspicious のみ。Alert 以降・強靭度崩し中・死亡は対象外）。 */
export function isAmbushableState(state: EnemyStateId): boolean {
  return state === 'idle' || state === 'suspicious';
}

const EPS = 1e-9;

/**
 * 位置の条件: プレイヤーが対象の背面 ±60° の扇の内側にいて、水平距離 ≤ 1.6m、高低差 ≤ 1.0m
 * （境界は含む）。対象の真下・真上（水平距離 0）は背面とみなす。
 */
export function inAmbushRange(player: Point3, target: Point3, targetYaw: number): boolean {
  const dx = player.x - target.x;
  const dz = player.z - target.z;
  const horizontal = Math.hypot(dx, dz);
  if (horizontal > AMBUSH.maxDistanceM + EPS) return false;
  if (Math.abs(player.y - target.y) > AMBUSH.maxHeightDiffM + EPS) return false;
  if (horizontal < 1e-6) return true;
  // 対象の背後方向と、対象 → プレイヤーの方向のなす角
  const backX = -Math.sin(targetYaw);
  const backZ = -Math.cos(targetYaw);
  const cos = (dx * backX + dz * backZ) / horizontal;
  const angleDeg = (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
  return angleDeg <= AMBUSH.backHalfAngleDeg + EPS;
}

/** 吸着の目標: 対象の背後 0.9m。 */
export function snapGoal(target: Point3, targetYaw: number, out: { x: number; z: number }): void {
  out.x = target.x - Math.sin(targetYaw) * AMBUSH.snapDistanceM;
  out.z = target.z - Math.cos(targetYaw) * AMBUSH.snapDistanceM;
}

/**
 * 吸着の移動量: `from` から目標 `goal` への変位。長さが `snapMaxM`（1.2m）を超える場合は 1.2m に切り詰める
 * （「最大 1.2m の補正」。切り詰めた場合は背後 0.9m までは届かない）。
 */
export function snapDelta(
  from: { x: number; z: number },
  goal: { x: number; z: number },
  out: { x: number; z: number },
): void {
  let dx = goal.x - from.x;
  let dz = goal.z - from.z;
  const len = Math.hypot(dx, dz);
  if (len > AMBUSH.snapMaxM) {
    const k = AMBUSH.snapMaxM / len;
    dx *= k;
    dz *= k;
  }
  out.x = dx;
  out.z = dz;
}

/** 吸着の進み具合 0..1（`frame` は動作の F1 起点。出だしを速く、最後に減速する）。 */
export function snapProgress(frame: number): number {
  const t = Math.min(1, Math.max(0, frame / AMBUSH.snapFrames));
  return 1 - (1 - t) * (1 - t);
}
