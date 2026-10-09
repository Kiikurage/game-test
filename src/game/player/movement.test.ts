import { describe, expect, it } from 'vitest';
import { resetTuning, tuning } from '../tuning';
import {
  angleDelta,
  approachVelocity,
  cameraRelativeMove,
  dashProfile,
  lockOnTargetVelocity,
  speedForMagnitude,
  turnToward,
  wrapAngle,
  yawOf,
} from './movement';

const DEG = Math.PI / 180;

describe('wrapAngle / angleDelta', () => {
  it('wraps into (-π, π]', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 9);
    expect(wrapAngle(-3 * Math.PI)).toBeCloseTo(Math.PI, 9);
    expect(wrapAngle(0.5)).toBeCloseTo(0.5, 9);
  });
  it('takes the shortest way round', () => {
    expect(angleDelta(170 * DEG, -170 * DEG)).toBeCloseTo(20 * DEG, 9);
    expect(angleDelta(-170 * DEG, 170 * DEG)).toBeCloseTo(-20 * DEG, 9);
  });
});

describe('cameraRelativeMove', () => {
  const out = { x: 0, y: 0 };
  it('moves along the camera forward when pushing the stick up', () => {
    // カメラが +Z を向いている（yaw 0）
    cameraRelativeMove({ x: 0, y: 1 }, 0, out);
    expect(out.x).toBeCloseTo(0, 9);
    expect(out.y).toBeCloseTo(1, 9);
    // カメラが -Z を向いている（yaw π）
    cameraRelativeMove({ x: 0, y: 1 }, Math.PI, out);
    expect(out.x).toBeCloseTo(0, 9);
    expect(out.y).toBeCloseTo(-1, 9);
  });
  it('moves to the screen right when pushing the stick right', () => {
    // カメラが +Z を向くと、画面の右は -X
    cameraRelativeMove({ x: 1, y: 0 }, 0, out);
    expect(out.x).toBeCloseTo(-1, 9);
    expect(out.y).toBeCloseTo(0, 9);
    // カメラが -Z を向くと、画面の右は +X
    cameraRelativeMove({ x: 1, y: 0 }, Math.PI, out);
    expect(out.x).toBeCloseTo(1, 9);
    expect(out.y).toBeCloseTo(0, 9);
    // カメラが +X を向く（yaw 90°）と、画面の右は +Z の逆…右 = (-cos, sin) = (0, 1)
    cameraRelativeMove({ x: 1, y: 0 }, 90 * DEG, out);
    expect(out.x).toBeCloseTo(0, 9);
    expect(out.y).toBeCloseTo(1, 9);
  });
  it('preserves the input magnitude', () => {
    cameraRelativeMove({ x: 0.3, y: 0.4 }, 1.234, out);
    expect(Math.hypot(out.x, out.y)).toBeCloseTo(0.5, 9);
  });
  it('is consistent with yawOf (forward input faces the camera yaw)', () => {
    cameraRelativeMove({ x: 0, y: 1 }, 1.1, out);
    expect(yawOf(out.x, out.y)).toBeCloseTo(1.1, 9);
  });
});

describe('speedForMagnitude', () => {
  resetTuning();
  const p = tuning.player;

  it('is 0 without input and never exceeds the run speed', () => {
    expect(speedForMagnitude(0, p)).toBe(0);
    expect(speedForMagnitude(1, p)).toBeCloseTo(p.run, 9);
    expect(speedForMagnitude(5, p)).toBeCloseTo(p.run, 9);
  });
  it('walks for weak input and runs for strong input', () => {
    expect(speedForMagnitude(0.4, p)).toBeCloseTo(p.walk, 9);
    expect(speedForMagnitude(0.85, p)).toBeCloseTo(p.run, 9);
  });
  it('is monotonically non-decreasing and starts moving immediately', () => {
    let prev = 0;
    for (let m = 0.01; m <= 1.0001; m += 0.01) {
      const v = speedForMagnitude(m, p);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
    // ごく弱い入力でも歩きの半分近くで動き出す（動き出しの遅れを作らない）
    expect(speedForMagnitude(0.02, p)).toBeGreaterThan(p.walk * 0.4);
  });
});

describe('approachVelocity', () => {
  it('reaches the run speed in about 8 frames and stops in about 6 frames', () => {
    const accel = 4.5 / (8 / 60);
    const decel = 4.5 / (6 / 60);
    const v = { x: 0, y: 0 };
    let frames = 0;
    while (v.y < 4.5 - 1e-9 && frames < 100) {
      approachVelocity(v, { x: 0, y: 4.5 }, accel, decel, 1 / 60);
      frames++;
    }
    expect(frames).toBe(8);
    frames = 0;
    while (v.y > 1e-9 && frames < 100) {
      approachVelocity(v, { x: 0, y: 0 }, accel, decel, 1 / 60);
      frames++;
    }
    expect(frames).toBe(6);
  });
  it('turns the velocity vector without overshooting the target', () => {
    const v = { x: 4.5, y: 0 };
    for (let i = 0; i < 30; i++) approachVelocity(v, { x: 0, y: 4.5 }, 40, 40, 1 / 60);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.y).toBeCloseTo(4.5, 9);
  });
});

describe('turnToward', () => {
  it('never exceeds the maximum angular speed', () => {
    const max = 720 * DEG;
    const next = turnToward(0, Math.PI, max, 100, 1 / 60);
    expect(Math.abs(next)).toBeLessThanOrEqual(max / 60 + 1e-9);
    expect(Math.abs(next)).toBeGreaterThan(0);
  });
  it('turns 180 degrees in about a quarter of a second at 720 deg/s', () => {
    let yaw = 0;
    let frames = 0;
    while (Math.abs(angleDelta(yaw, Math.PI)) > 1 * DEG && frames < 200) {
      yaw = turnToward(yaw, Math.PI, 720 * DEG, 22, 1 / 60);
      frames++;
    }
    expect(frames).toBeGreaterThanOrEqual(15);
    expect(frames).toBeLessThanOrEqual(24);
  });
  it('responds immediately to small corrections (not sluggish)', () => {
    const yaw = turnToward(0, 20 * DEG, 720 * DEG, 22, 1 / 60);
    // 1 フレームで 20° の約 30% 以上は向く
    expect(yaw).toBeGreaterThan(20 * DEG * 0.25);
  });
  it('takes the short way across the ±π seam', () => {
    const yaw = turnToward(170 * DEG, -170 * DEG, 720 * DEG, 22, 1 / 60);
    expect(angleDelta(170 * DEG, yaw)).toBeGreaterThan(0);
  });
  it('snaps when almost aligned', () => {
    expect(turnToward(0.1, 0.1004, 720 * DEG, 22, 1 / 60)).toBe(0.1004);
  });
});

describe('lockOnTargetVelocity', () => {
  const speeds = { side: 3.8, back: 2.6 };
  const out = { x: 0, y: 0 };

  it('moves at the side speed toward the target and sideways', () => {
    // 対象は +Z 方向
    lockOnTargetVelocity({ x: 0, y: 1 }, 0, speeds, 1, out);
    expect(out.y).toBeCloseTo(3.8, 9);
    lockOnTargetVelocity({ x: 1, y: 0 }, 0, speeds, 1, out);
    expect(Math.hypot(out.x, out.y)).toBeCloseTo(3.8, 9);
  });
  it('backs away more slowly', () => {
    lockOnTargetVelocity({ x: 0, y: -1 }, 0, speeds, 1, out);
    expect(out.y).toBeCloseTo(-2.6, 9);
  });
  it('scales with the analog magnitude factor', () => {
    lockOnTargetVelocity({ x: 0, y: 1 }, 0, speeds, 0.4, out);
    expect(out.y).toBeCloseTo(3.8 * 0.4, 9);
  });
  it('is zero without input', () => {
    lockOnTargetVelocity({ x: 0, y: 0 }, 1, speeds, 1, out);
    expect(out).toEqual({ x: 0, y: 0 });
  });
});

describe('dashProfile', () => {
  it('moves exactly the given distance over the given frames', () => {
    const profile = dashProfile(3.2, 32, { ramp: 3, hold: 15, end: 28 });
    expect(profile).toHaveLength(32);
    expect(profile.reduce((a, b) => a + b, 0)).toBeCloseTo(3.2, 9);
  });
  it('starts moving on F1 and stops by the end frame', () => {
    const profile = dashProfile(3.2, 32, { ramp: 3, hold: 15, end: 28 });
    expect(profile[0]).toBeGreaterThan(0);
    expect(profile[27]).toBe(0);
    expect(profile[31]).toBe(0);
    // 無敵窓 F4-F15 の間が最高速
    const peak = Math.max(...profile);
    expect(profile[3]).toBeCloseTo(peak, 9);
    expect(profile[14]).toBeCloseTo(peak, 9);
  });
});
