import type { Vec2 } from '../core/input';

/**
 * ラジアルデッドゾーン + スケーリング。
 * 大きさが dead 以下なら 0、それ以上は (dead..1) を (0..1) に写す。方向は保つ。
 * 軸ごとのデッドゾーンと違い、斜め入力でも方向がスナップしない。
 */
export function applyRadialDeadzone(x: number, y: number, dead: number): Vec2 {
  const mag = Math.hypot(x, y);
  if (mag <= dead || mag === 0) return { x: 0, y: 0 };
  const clamped = Math.min(mag, 1);
  const scaled = (clamped - dead) / (1 - dead);
  const k = scaled / mag;
  return { x: x * k, y: y * k };
}

/** 大きさ m を m^exponent に変換する（方向は保つ）。 */
export function applyResponseCurve(v: Vec2, exponent: number): Vec2 {
  const mag = Math.hypot(v.x, v.y);
  if (mag === 0) return { x: 0, y: 0 };
  const k = mag ** exponent / mag;
  return { x: v.x * k, y: v.y * k };
}

/** 長さが max を超えるベクトルを長さ max に丸める。 */
export function clampLength(x: number, y: number, max = 1): Vec2 {
  const mag = Math.hypot(x, y);
  if (mag <= max || mag === 0) return { x, y };
  return { x: (x / mag) * max, y: (y / mag) * max };
}
