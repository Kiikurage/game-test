import { Vector3 } from 'three/webgpu';
import { LOCK_ON } from '../data';
import { angleDelta, yawOf } from '../player/movement';
import { chestPosition, type LockOnTarget } from './targets';

/** 対象選択に使うカメラの姿勢。 */
export interface CameraView {
  readonly position: Vector3;
  /** 単位ベクトル（カメラの前方）。 */
  readonly forward: Vector3;
}

export interface SelectOptions {
  readonly playerPosition: Vector3;
  readonly acquireRange: number;
  /** 画面内とみなす範囲（半角, 度）。 */
  readonly viewHalfH: number;
  readonly viewHalfV: number;
  /** カメラから胸元へ視線が通るか。 */
  readonly isVisible: (from: Vector3, to: Vector3) => boolean;
  readonly exclude?: LockOnTarget | null;
}

const DEG = 180 / Math.PI;
const tmpChest = new Vector3();
const tmpDir = new Vector3();

export interface TargetMeasure {
  /** 画面中心からの角度（度）。 */
  readonly angleDeg: number;
  /** カメラ前方からの水平 / 垂直のずれ（度）。水平は左が正（yaw 増加方向）。 */
  readonly horizontalDeg: number;
  readonly verticalDeg: number;
  /** プレイヤーからの距離（m）。 */
  readonly distance: number;
}

/** 対象をカメラ基準で測る（スコア・画面内判定の素）。 */
export function measureTarget(
  target: LockOnTarget,
  camera: CameraView,
  playerPosition: Vector3,
): TargetMeasure {
  chestPosition(target, tmpChest);
  tmpDir.subVectors(tmpChest, camera.position);
  const len = tmpDir.length();
  const dot = len > 1e-6 ? tmpDir.dot(camera.forward) / len : 1;
  const angleDeg = Math.acos(Math.min(1, Math.max(-1, dot))) * DEG;
  const camYaw = yawOf(camera.forward.x, camera.forward.z);
  const horizontalDeg = angleDelta(camYaw, yawOf(tmpDir.x, tmpDir.z)) * DEG;
  const camElev = Math.asin(Math.min(1, Math.max(-1, camera.forward.y)));
  const elev = Math.atan2(tmpDir.y, Math.hypot(tmpDir.x, tmpDir.z));
  const verticalDeg = (elev - camElev) * DEG;
  const distance = Math.hypot(
    target.position.x - playerPosition.x,
    target.position.y - playerPosition.y,
    target.position.z - playerPosition.z,
  );
  return { angleDeg, horizontalDeg, verticalDeg, distance };
}

/** スコア = 画面中心からの角度（度）× 0.6 + 距離（m）× 0.4。小さいほど優先（3.2 節）。 */
export function lockOnScore(m: TargetMeasure): number {
  return m.angleDeg * LOCK_ON.score.angle + m.distance * LOCK_ON.score.distance;
}

function isCandidate(
  target: LockOnTarget,
  m: TargetMeasure,
  camera: CameraView,
  o: SelectOptions,
  viewScale: number,
): boolean {
  if (!target.alive || target === o.exclude) return false;
  if (m.distance > o.acquireRange) return false;
  if (Math.abs(m.horizontalDeg) > o.viewHalfH * viewScale) return false;
  if (Math.abs(m.verticalDeg) > o.viewHalfV * viewScale) return false;
  return o.isVisible(camera.position, chestPosition(target, new Vector3()));
}

/**
 * ロックオン取得: 距離・画面内・視線の条件を満たす対象からスコア最小を選ぶ。なければ null。
 */
export function selectLockOnTarget(
  targets: readonly LockOnTarget[],
  camera: CameraView,
  options: SelectOptions,
): LockOnTarget | null {
  let best: LockOnTarget | null = null;
  let bestScore = Infinity;
  for (const t of targets) {
    const m = measureTarget(t, camera, options.playerPosition);
    if (!isCandidate(t, m, camera, options, 1)) continue;
    const score = lockOnScore(m);
    if (score < bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

/**
 * ターゲット切替: 弾いた方向（dir: 1 = 右, -1 = 左）にある、現在の対象に最も近い別の候補。
 * 画面内の判定は取得時より広め（1.5 倍）にして、端にいる対象にも移れるようにする。
 */
export function selectSwitchTarget(
  targets: readonly LockOnTarget[],
  current: LockOnTarget,
  dir: -1 | 1,
  camera: CameraView,
  options: SelectOptions,
): LockOnTarget | null {
  const cur = measureTarget(current, camera, options.playerPosition);
  // 右 = yaw が減る向き。「右らしさ」r = -horizontalDeg
  const r0 = -cur.horizontalDeg;
  let best: LockOnTarget | null = null;
  let bestGap = Infinity;
  const opts = { ...options, exclude: current };
  for (const t of targets) {
    const m = measureTarget(t, camera, options.playerPosition);
    if (!isCandidate(t, m, camera, opts, 1.5)) continue;
    const gap = (-m.horizontalDeg - r0) * dir;
    if (gap <= 0.5) continue; // 同じ位置・反対側は対象外
    if (gap < bestGap) {
      bestGap = gap;
      best = t;
    }
  }
  return best;
}
