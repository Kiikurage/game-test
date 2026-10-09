/**
 * 判定用の幾何（three 非依存）。ヒットボックス・ハートボックスのカプセルと、その距離・スイープ。
 * 座標はワールド（m）、`y` が上。
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

/** 線分 `a`–`b` を芯とし、半径 `radius` で膨らませたカプセル。 */
export interface Capsule {
  readonly a: Vec3;
  readonly b: Vec3;
  radius: number;
}

export function capsule(a: Vec3, b: Vec3, radius: number): Capsule {
  return { a: { ...a }, b: { ...b }, radius };
}

export function copyCapsule(from: Capsule, to: Capsule): Capsule {
  to.a.x = from.a.x;
  to.a.y = from.a.y;
  to.a.z = from.a.z;
  to.b.x = from.b.x;
  to.b.y = from.b.y;
  to.b.z = from.b.z;
  to.radius = from.radius;
  return to;
}

/** 線分どうしの最近点（Ericson, Real-Time Collision Detection 5.1.9）。 */
export interface SegmentClosest {
  /** 線分 1 / 2 上の最近点。 */
  readonly p1: Vec3;
  readonly p2: Vec3;
  distSq: number;
}

export function createSegmentClosest(): SegmentClosest {
  return { p1: vec3(), p2: vec3(), distSq: 0 };
}

const EPS = 1e-9;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function closestPointsOnSegments(
  a1: Vec3,
  b1: Vec3,
  a2: Vec3,
  b2: Vec3,
  out: SegmentClosest,
): SegmentClosest {
  const d1x = b1.x - a1.x;
  const d1y = b1.y - a1.y;
  const d1z = b1.z - a1.z;
  const d2x = b2.x - a2.x;
  const d2y = b2.y - a2.y;
  const d2z = b2.z - a2.z;
  const rx = a1.x - a2.x;
  const ry = a1.y - a2.y;
  const rz = a1.z - a2.z;
  const a = d1x * d1x + d1y * d1y + d1z * d1z;
  const e = d2x * d2x + d2y * d2y + d2z * d2z;
  const f = d2x * rx + d2y * ry + d2z * rz;
  let s: number;
  let t: number;
  if (a <= EPS && e <= EPS) {
    s = 0;
    t = 0;
  } else if (a <= EPS) {
    s = 0;
    t = clamp01(f / e);
  } else {
    const c = d1x * rx + d1y * ry + d1z * rz;
    if (e <= EPS) {
      t = 0;
      s = clamp01(-c / a);
    } else {
      const b = d1x * d2x + d1y * d2y + d1z * d2z;
      const denom = a * e - b * b;
      s = denom > EPS ? clamp01((b * f - c * e) / denom) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp01(-c / a);
      } else if (t > 1) {
        t = 1;
        s = clamp01((b - c) / a);
      }
    }
  }
  out.p1.x = a1.x + d1x * s;
  out.p1.y = a1.y + d1y * s;
  out.p1.z = a1.z + d1z * s;
  out.p2.x = a2.x + d2x * t;
  out.p2.y = a2.y + d2y * t;
  out.p2.z = a2.z + d2z * t;
  const dx = out.p1.x - out.p2.x;
  const dy = out.p1.y - out.p2.y;
  const dz = out.p1.z - out.p2.z;
  out.distSq = dx * dx + dy * dy + dz * dz;
  return out;
}

/** 2 つのカプセルが重なっているか（接触を含む）。重なっていれば `out` に最近点を残す。 */
export function capsulesOverlap(a: Capsule, b: Capsule, out: SegmentClosest): boolean {
  closestPointsOnSegments(a.a, a.b, b.a, b.b, out);
  const r = a.radius + b.radius;
  return out.distSq <= r * r;
}

const MAX_SWEEP_STEPS = 128;
const SWEEP_POSE: Capsule = { a: vec3(), b: vec3(), radius: 0 };

/**
 * カプセルが前の姿勢 `prev` から現在の姿勢 `curr` へ動いた軌跡（端点を直線補間した姿勢の列）が、
 * `target` と重なるか。高速移動でのすり抜け（トンネリング）を防ぐため、補間を `maxStep`（m）以下の
 * 刻みに分割して各姿勢で判定する。重なった姿勢（現在に近い側から探す）の最近点を `out` に残す。
 *
 * 既定の刻み 0.1m は、カプセル半径の和（武器 0.25m + 対象 0.35m）より十分小さいので、
 * 1 フレームで対象を飛び越えることはない。
 */
export function sweptCapsuleOverlap(
  prev: Capsule,
  curr: Capsule,
  target: Capsule,
  out: SegmentClosest,
  maxStep = 0.1,
): boolean {
  const move = Math.max(
    Math.hypot(curr.a.x - prev.a.x, curr.a.y - prev.a.y, curr.a.z - prev.a.z),
    Math.hypot(curr.b.x - prev.b.x, curr.b.y - prev.b.y, curr.b.z - prev.b.z),
  );
  const steps = Math.min(MAX_SWEEP_STEPS, Math.max(1, Math.ceil(move / maxStep)));
  const pose = SWEEP_POSE;
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    pose.a.x = prev.a.x + (curr.a.x - prev.a.x) * t;
    pose.a.y = prev.a.y + (curr.a.y - prev.a.y) * t;
    pose.a.z = prev.a.z + (curr.a.z - prev.a.z) * t;
    pose.b.x = prev.b.x + (curr.b.x - prev.b.x) * t;
    pose.b.y = prev.b.y + (curr.b.y - prev.b.y) * t;
    pose.b.z = prev.b.z + (curr.b.z - prev.b.z) * t;
    pose.radius = curr.radius;
    if (capsulesOverlap(pose, target, out)) return true;
  }
  return false;
}
