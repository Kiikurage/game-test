import { describe, expect, it } from 'vitest';
import {
  GAIT_CYCLE_METERS,
  GaitClock,
  PLAYER_LOCOMOTION,
  blendedCycleMeters,
  locomotionBlend,
} from './locomotion';
import type { AnimMarkerEvent } from './markerDispatcher';

describe('locomotionBlend', () => {
  const sum = (b: ReturnType<typeof locomotionBlend>) => b.idle + b.walk + b.jog + b.sprint;

  it('合計は常に 1', () => {
    for (const v of [0, 0.4, 1.0, 1.8, 3, 4.5, 5.5, 6.5, 9]) {
      expect(sum(locomotionBlend(v))).toBeCloseTo(1, 10);
    }
  });

  it('止まっていれば立ち、歩き速度で歩き、走り速度で走り、ダッシュ速度でダッシュ', () => {
    expect(locomotionBlend(0).idle).toBe(1);
    expect(locomotionBlend(PLAYER_LOCOMOTION.walk).walk).toBeCloseTo(1, 10);
    expect(locomotionBlend(PLAYER_LOCOMOTION.run).jog).toBeCloseTo(1, 10);
    expect(locomotionBlend(PLAYER_LOCOMOTION.dash).sprint).toBeCloseTo(1, 10);
  });

  it('歩きと走りの間は両方が混ざる', () => {
    const b = locomotionBlend(3.15);
    expect(b.walk).toBeGreaterThan(0.3);
    expect(b.jog).toBeGreaterThan(0.3);
  });
});

describe('GaitClock', () => {
  const DT = 1 / 60;

  function walkFor(seconds: number, speed: number, reverse = false) {
    const clock = new GaitClock();
    const out: AnimMarkerEvent[] = [];
    const frames = Math.round(seconds * 60);
    for (let i = 0; i < frames; i++) clock.advance(speed, DT, { out, reverse });
    return { clock, out };
  }

  it('走り（4.5 m/s）の足音は 1 サイクルに 2 回、サイクル距離で決まる', () => {
    const cycleMeters = blendedCycleMeters(locomotionBlend(4.5));
    expect(cycleMeters).toBeCloseTo(GAIT_CYCLE_METERS.jog, 5);
    const seconds = (cycleMeters / 4.5) * 5; // ちょうど 5 サイクル
    const { out } = walkFor(seconds, 4.5);
    const steps = out.filter((e) => e.type === 'footstep');
    expect(steps.length).toBeGreaterThanOrEqual(9);
    expect(steps.length).toBeLessThanOrEqual(10);
    expect(steps.every((e) => e.gait === 'run')).toBe(true);
  });

  it('歩きの足音の歩様は walk', () => {
    const { out } = walkFor(2, 1.8);
    expect(out.length).toBeGreaterThan(2);
    expect(out.every((e) => e.gait === 'walk')).toBe(true);
  });

  it('速いほど足音の間隔が短い', () => {
    const a = walkFor(3, 4.5).out.length;
    const b = walkFor(3, 6.5).out.length;
    expect(b).toBeGreaterThan(a);
  });

  it('止まっている間は位相も進まず、足音も出ない', () => {
    const { clock, out } = walkFor(2, 0);
    expect(out).toEqual([]);
    expect(clock.phase).toBe(0);
    expect(clock.lastDelta).toBe(0);
  });

  it('左足（位相 0）と右足（位相 約 0.5）の接地で発火する', () => {
    const clock = new GaitClock();
    const phases: number[] = [];
    for (let i = 0; i < 90; i++) {
      const out: AnimMarkerEvent[] = [];
      clock.advance(4.5, DT, { out });
      for (let k = 0; k < out.length; k++) phases.push(clock.phase);
    }
    expect(phases.length).toBeGreaterThanOrEqual(3);
    const fractional = phases.map((p) => Math.min(p, Math.abs(p - 0.527), 1 - p));
    // 位相 0 か 0.527 の直後（1 ステップ分の誤差内）
    for (const f of fractional) expect(f).toBeLessThan(0.06);
  });

  it('逆回し（ロックオン中の後退）は位相が減る', () => {
    const clock = new GaitClock();
    clock.advance(2, DT, { reverse: true });
    expect(clock.lastDelta).toBeLessThan(0);
    expect(clock.phase).toBeGreaterThan(0.9); // 0 から負へ → 1 に折り返す
  });

  it('描画補間用に、直近 1 ステップの位相変化量を返す', () => {
    const clock = new GaitClock();
    clock.advance(4.5, DT);
    const first = clock.phase;
    expect(clock.lastDelta).toBeCloseTo(first, 10);
    clock.advance(4.5, DT);
    expect(clock.phase - first).toBeCloseTo(clock.lastDelta, 10);
  });
});
