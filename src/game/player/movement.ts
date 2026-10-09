import type { Tuning } from '../tuning';

/**
 * 移動まわりの純粋関数。座標系は three と同じ右手系 Y 上。
 * ヨー角 yaw: 前方ベクトルは (sin yaw, cos yaw)（yaw=0 で +Z、yaw が増えると +X 側へ回る）。
 * 入力の move は x: 右が正、y: 前が正。
 */

export interface Vec2Like {
  x: number;
  y: number;
}

const TWO_PI = Math.PI * 2;

/** 角度を (-π, π] に正規化する。 */
export function wrapAngle(a: number): number {
  let r = a % TWO_PI;
  if (r > Math.PI) r -= TWO_PI;
  else if (r <= -Math.PI) r += TWO_PI;
  return r;
}

/** `from` から `to` への最短角度差（-π..π）。 */
export function angleDelta(from: number, to: number): number {
  return wrapAngle(to - from);
}

/** 水平ベクトル (x, z) のヨー角。 */
export function yawOf(x: number, z: number): number {
  return Math.atan2(x, z);
}

/**
 * カメラ基準の入力を水平のワールド方向（長さ = 入力の強さ）へ変換する。
 * `cameraYaw` はカメラの向き（前方 = (sin, cos)）。戻り値の x, z をそれぞれ x, y に入れる。
 */
export function cameraRelativeMove(move: Vec2Like, cameraYaw: number, out: Vec2Like): Vec2Like {
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);
  // 前 = (sin, cos)、右 = (-cos, sin)
  out.x = sin * move.y - cos * move.x;
  out.y = cos * move.y + sin * move.x;
  return out;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

type SpeedTuning = Pick<
  Tuning['player'],
  'walkMinInput' | 'walkMaxInput' | 'runMinInput' | 'minSpeedFraction' | 'walk' | 'run'
>;

/**
 * 入力の強さ（0..1）から目標速度（m/s）を連続的に決める（フリー移動）。
 * 弱い入力は歩き（最小でも歩きの `minSpeedFraction`）、`walkMaxInput` から `runMinInput` にかけて
 * なめらかに走りへ移り、それ以上は走りの最高速。0 なら 0。単調増加。
 */
export function speedForMagnitude(magnitude: number, p: SpeedTuning): number {
  if (magnitude <= 0) return 0;
  const m = Math.min(1, magnitude);
  if (m < p.walkMinInput) {
    const t = m / p.walkMinInput;
    return p.walk * (p.minSpeedFraction + (1 - p.minSpeedFraction) * t);
  }
  if (m <= p.walkMaxInput) return p.walk;
  const t = smoothstep(p.walkMaxInput, p.runMinInput, m);
  return p.walk + (p.run - p.walk) * t;
}

/** 水平速度ベクトル (vx, vz) を目標へ `maxDelta`（m/s）だけ近づける。長さが減る方向は減速として別の上限を使う。 */
export function approachVelocity(
  current: Vec2Like,
  target: Vec2Like,
  accel: number,
  decel: number,
  dt: number,
): void {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-9) return;
  const braking = Math.hypot(target.x, target.y) < Math.hypot(current.x, current.y);
  const maxStep = (braking ? decel : accel) * dt;
  if (dist <= maxStep) {
    current.x = target.x;
    current.y = target.y;
  } else {
    current.x += (dx / dist) * maxStep;
    current.y += (dy / dist) * maxStep;
  }
}

/**
 * 現在の向きを目標の向きへ回す。指数追従（`response` 1/秒）に最高角速度（`maxRate` rad/秒）の上限を付ける。
 * 差が大きいときは最高角速度で回り、近づくとなめらかに減速して止まる（鈍くならないよう response は大きめ）。
 */
export function turnToward(
  current: number,
  target: number,
  maxRate: number,
  response: number,
  dt: number,
): number {
  const diff = angleDelta(current, target);
  const eased = diff * (1 - Math.exp(-response * dt));
  const limit = maxRate * dt;
  const step = Math.max(-limit, Math.min(limit, eased));
  // 追従量が小さすぎて収束しないのを避ける（0.05° 未満は一致させる）
  if (Math.abs(diff) < 0.0009) return target;
  return wrapAngle(current + step);
}

/** 指数平滑の係数（1 - exp(-dt/tau)）。tau<=0 なら 1（即時）。 */
export function smoothFactor(dt: number, tau: number): number {
  return tau <= 0 ? 1 : 1 - Math.exp(-dt / tau);
}

/**
 * ロックオン中の目標速度（水平ワールド）。移動入力を「対象へ向かう前後」と「横」に分け、
 * 前 `side`、横 `side`、後ろ `back` の楕円で速度を決める。`scale` は入力の強さによる 0..1 の係数。
 * `toTargetYaw` はプレイヤーから対象への向き。
 */
export function lockOnTargetVelocity(
  worldMove: Vec2Like,
  toTargetYaw: number,
  speeds: { side: number; back: number },
  scale: number,
  out: Vec2Like,
): Vec2Like {
  const len = Math.hypot(worldMove.x, worldMove.y);
  if (len < 1e-6) {
    out.x = 0;
    out.y = 0;
    return out;
  }
  const dirX = worldMove.x / len;
  const dirY = worldMove.y / len;
  const fx = Math.sin(toTargetYaw);
  const fz = Math.cos(toTargetYaw);
  const forward = dirX * fx + dirY * fz; // 対象へ向かう成分（負なら後退）
  const side = dirX * -fz + dirY * fx; // 右が正
  const f = forward >= 0 ? forward * speeds.side : forward * speeds.back;
  const s = side * speeds.side;
  const speed = Math.hypot(f, s) * scale;
  out.x = dirX * speed;
  out.y = dirY * speed;
  return out;
}

/**
 * ロール / バックステップの 1 フレームごとの移動距離テーブル（合計が `distance` になる）。
 * 速度の重み: 立ち上がり `ramp` フレームで 0.5→1、`hold` フレームまで最高速、その後 `end` フレームへ向けて 0 まで線形に減る。
 * フレーム番号は F1 起点で、配列の添字 i は F(i+1) に対応する。
 */
export function dashProfile(
  distance: number,
  frames: number,
  shape: { ramp: number; hold: number; end: number },
): number[] {
  const weights: number[] = [];
  for (let f = 1; f <= frames; f++) {
    let w: number;
    if (f <= shape.ramp) w = 0.5 + (0.5 * f) / shape.ramp;
    else if (f <= shape.hold) w = 1;
    else if (f < shape.end) w = (shape.end - f) / (shape.end - shape.hold);
    else w = 0;
    weights.push(w);
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => (sum > 0 ? (w / sum) * distance : 0));
}
