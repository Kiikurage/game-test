import {
  capsulesOverlap,
  copyCapsule,
  sweptCapsuleOverlap,
  vec3,
  type Capsule,
  type SegmentClosest,
  type Vec3,
} from './geometry';

/**
 * 攻撃の判定形状（ヒットボックス）。プレイヤー・雑魚・ボスの全攻撃がこの抽象で書ける。
 *
 * - `capsule`: 武器のカプセル（プレイヤー: 半径 0.25m・長さ 1.1m、2.3 節）。持続中の毎フレーム
 *   「前フレームの姿勢 → 現在の姿勢」でスイープする。`origin` は攻撃者の体の位置（壁越し判定の始点）。
 * - `sector`: 水平の扇形（前方 `arcDeg`・射程 `range`）。`arcDeg >= 360` は全周（円）。
 *   垂直方向は原点の高さから `yMin`〜`yMax` の範囲。5.2 節の A1/A2 や全周の叩きつけに使う。
 *   突進（A3 など）は、原点が前フレームから現在へ動く扇形として同じ型で表す（原点・向きを補間してスイープ）。
 */
export interface CapsuleShape {
  readonly kind: 'capsule';
  readonly capsule: Capsule;
  readonly origin: Vec3;
}

export interface SectorShape {
  readonly kind: 'sector';
  /** 扇形の頂点（攻撃者の足元）。 */
  readonly origin: Vec3;
  /** 向き（前方 = (sin yaw, cos yaw)）。 */
  yaw: number;
  arcDeg: number;
  range: number;
  /** 原点の高さからの垂直範囲（m）。 */
  yMin: number;
  yMax: number;
}

export type HitShape = CapsuleShape | SectorShape;

export const SECTOR_DEFAULT_Y_MIN = -0.3;
export const SECTOR_DEFAULT_Y_MAX = 2.2;

export function capsuleShape(capsule: Capsule, origin: Vec3): CapsuleShape {
  return { kind: 'capsule', capsule, origin };
}

export function sectorShape(
  origin: Vec3,
  yaw: number,
  arcDeg: number,
  range: number,
  yMin = SECTOR_DEFAULT_Y_MIN,
  yMax = SECTOR_DEFAULT_Y_MAX,
): SectorShape {
  return { kind: 'sector', origin: { ...origin }, yaw, arcDeg, range, yMin, yMax };
}

/** 全周（360°）の円形判定。 */
export function circleShape(
  origin: Vec3,
  radius: number,
  yMin?: number,
  yMax?: number,
): SectorShape {
  return sectorShape(origin, 0, 360, radius, yMin, yMax);
}

export function cloneShape(shape: HitShape): HitShape {
  if (shape.kind === 'capsule') {
    return {
      kind: 'capsule',
      capsule: copyCapsule(shape.capsule, { a: vec3(), b: vec3(), radius: 0 }),
      origin: { ...shape.origin },
    };
  }
  return { ...shape, origin: { ...shape.origin } };
}

const DEG = Math.PI / 180;

/** 角度差を (-π, π] に畳む。 */
function wrapAngle(a: number): number {
  const twoPi = Math.PI * 2;
  let r = a % twoPi;
  if (r > Math.PI) r -= twoPi;
  else if (r <= -Math.PI) r += twoPi;
  return r;
}

/**
 * 水平の扇形と、水平の円（中心 `cx, cz`・半径 `r`）の厳密な交差判定。
 * 扇形に入る方向なら射程 + r まで、外なら 2 本の辺（頂点から射程までの線分）への距離で判定する。
 */
export function sectorOverlapsCircle(
  ox: number,
  oz: number,
  yaw: number,
  arcDeg: number,
  range: number,
  cx: number,
  cz: number,
  r: number,
): boolean {
  const vx = cx - ox;
  const vz = cz - oz;
  const d = Math.hypot(vx, vz);
  if (d <= r) return true;
  if (arcDeg >= 360) return d <= range + r;
  const half = (arcDeg * DEG) / 2;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const cos = (vx * fx + vz * fz) / d;
  if (Math.acos(Math.max(-1, Math.min(1, cos))) <= half) return d <= range + r;
  // 扇形の外の方向: 近い側の辺への距離
  const side = vx * fz - vz * fx; // yaw 増加側が正
  const edgeYaw = yaw + (side >= 0 ? half : -half);
  const ex = Math.sin(edgeYaw);
  const ez = Math.cos(edgeYaw);
  const t = Math.max(0, Math.min(range, vx * ex + vz * ez));
  return Math.hypot(vx - ex * t, vz - ez * t) <= r;
}

/** ハートボックス（カプセル）の芯のうち、`(ox, oz)` に水平で最も近い点。 */
function nearestOnAxisXZ(h: Capsule, ox: number, oz: number, out: Vec3): void {
  const dx = h.b.x - h.a.x;
  const dz = h.b.z - h.a.z;
  const len2 = dx * dx + dz * dz;
  const t =
    len2 > 1e-12 ? Math.max(0, Math.min(1, ((ox - h.a.x) * dx + (oz - h.a.z) * dz) / len2)) : 0;
  out.x = h.a.x + dx * t;
  out.z = h.a.z + dz * t;
  out.y = h.a.y + (h.b.y - h.a.y) * t;
}

const TMP_NEAR: Vec3 = vec3();

/** 現在の姿勢の扇形がハートボックスに当たるか。当たれば `contact` に接触点（対象側）を書く。 */
export function sectorHitsHeart(s: SectorShape, heart: Capsule, contact: Vec3): boolean {
  const lo = Math.min(heart.a.y, heart.b.y) - heart.radius;
  const hi = Math.max(heart.a.y, heart.b.y) + heart.radius;
  if (hi < s.origin.y + s.yMin || lo > s.origin.y + s.yMax) return false;
  nearestOnAxisXZ(heart, s.origin.x, s.origin.z, TMP_NEAR);
  if (
    !sectorOverlapsCircle(
      s.origin.x,
      s.origin.z,
      s.yaw,
      s.arcDeg,
      s.range,
      TMP_NEAR.x,
      TMP_NEAR.z,
      heart.radius,
    )
  ) {
    return false;
  }
  // 接触点: 対象の芯から攻撃者側へ半径ぶん寄せた点（高さは扇形の中ほどを対象の範囲に収める）
  const dx = s.origin.x - TMP_NEAR.x;
  const dz = s.origin.z - TMP_NEAR.z;
  const d = Math.hypot(dx, dz);
  const k = d > 1e-6 ? Math.min(heart.radius, d) / d : 0;
  const mid = s.origin.y + (s.yMin + s.yMax) / 2;
  contact.x = TMP_NEAR.x + dx * k;
  contact.z = TMP_NEAR.z + dz * k;
  contact.y = Math.max(lo, Math.min(hi, mid));
  return true;
}

const SECTOR_STEP = 0.1;
const MAX_SECTOR_STEPS = 128;
const TMP_SECTOR: SectorShape = {
  kind: 'sector',
  origin: vec3(),
  yaw: 0,
  arcDeg: 0,
  range: 0,
  yMin: 0,
  yMax: 0,
};
const TMP_CLOSEST: SegmentClosest = { p1: vec3(), p2: vec3(), distSq: 0 };

/**
 * 前フレームの形状 `prev`（なければ現在のみ）から現在の `curr` へのスイープが `heart` に当たるか。
 * 当たれば `contact` に接触点を書く。種類の違う `prev` は無視して現在のみを判定する。
 */
export function shapeHitsHeart(
  prev: HitShape | null,
  curr: HitShape,
  heart: Capsule,
  contact: Vec3,
): boolean {
  if (curr.kind === 'capsule') {
    const p = prev?.kind === 'capsule' ? prev.capsule : null;
    const hit = p
      ? sweptCapsuleOverlap(p, curr.capsule, heart, TMP_CLOSEST)
      : capsulesOverlap(curr.capsule, heart, TMP_CLOSEST);
    if (!hit) return false;
    contact.x = (TMP_CLOSEST.p1.x + TMP_CLOSEST.p2.x) / 2;
    contact.y = (TMP_CLOSEST.p1.y + TMP_CLOSEST.p2.y) / 2;
    contact.z = (TMP_CLOSEST.p1.z + TMP_CLOSEST.p2.z) / 2;
    return true;
  }
  const p = prev?.kind === 'sector' ? prev : null;
  if (!p) return sectorHitsHeart(curr, heart, contact);
  const move = Math.hypot(
    curr.origin.x - p.origin.x,
    curr.origin.y - p.origin.y,
    curr.origin.z - p.origin.z,
  );
  const steps = Math.min(MAX_SECTOR_STEPS, Math.max(1, Math.ceil(move / SECTOR_STEP)));
  const s = TMP_SECTOR;
  const dyaw = wrapAngle(curr.yaw - p.yaw);
  s.arcDeg = curr.arcDeg;
  s.range = curr.range;
  s.yMin = curr.yMin;
  s.yMax = curr.yMax;
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    s.origin.x = p.origin.x + (curr.origin.x - p.origin.x) * t;
    s.origin.y = p.origin.y + (curr.origin.y - p.origin.y) * t;
    s.origin.z = p.origin.z + (curr.origin.z - p.origin.z) * t;
    s.yaw = curr.yaw - dyaw * (1 - t);
    if (sectorHitsHeart(s, heart, contact)) return true;
  }
  return false;
}
