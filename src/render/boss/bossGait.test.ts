import { describe, expect, it } from 'vitest';
import { GaitClock } from '../../game/anim/locomotion';
import type { AnimMarkerEvent } from '../../game/anim/markerDispatcher';
import {
  BOSS_GAIT_TABLE,
  BOSS_LOCOMOTION,
  BOSS_SCALE,
  BOSS_SPEED,
  bossGaitFor,
  toModelSpeed,
} from './bossGait';

describe('ボスの歩幅の対応表', () => {
  it('歩き 2.4 / 走り 4.2 / フェーズ 2 の走り 4.8 m/s が表にある', () => {
    expect(BOSS_GAIT_TABLE.map((e) => e.speed)).toEqual([2.4, 4.2, 4.8]);
  });

  it('足滑りの見込みは 35% 未満（歩きはほぼ 0）', () => {
    const walk = BOSS_GAIT_TABLE[0];
    expect(walk?.slip).toBeLessThan(0.02);
    for (const e of BOSS_GAIT_TABLE) expect(e.slip).toBeLessThan(0.35);
  });

  it('毎秒 1.8〜2.4 歩の重い足運び（1 サイクル 0.8〜1.2 秒）で、1 歩は 1.5〜2.5m', () => {
    for (const e of BOSS_GAIT_TABLE) {
      expect(e.cycleSeconds).toBeGreaterThan(0.8);
      expect(e.cycleSeconds).toBeLessThan(1.6);
      expect(e.stepMeters).toBeGreaterThan(1.5);
      expect(e.stepMeters).toBeLessThan(2.5);
    }
  });

  it('走りは歩きより走りクリップを混ぜ、フェーズ 2 はさらに混ぜる', () => {
    const walk = BOSS_GAIT_TABLE[0];
    const run1 = BOSS_GAIT_TABLE[1];
    const run2 = BOSS_GAIT_TABLE[2];
    expect(walk?.jogWeight).toBeCloseTo(0, 3);
    expect(run1?.jogWeight).toBeGreaterThan(0.05);
    expect(run2?.jogWeight).toBeGreaterThan(bossGaitFor(BOSS_SPEED.run[1]).jogWeight);
    expect(run2?.jogWeight).toBeLessThan(0.3);
  });

  it('遅い速度は歩きだけ、速いほど走りを混ぜる', () => {
    expect(bossGaitFor(1).jogWeight).toBe(0);
    expect(bossGaitFor(6).jogWeight).toBeGreaterThan(bossGaitFor(4.8).jogWeight);
  });
});

describe('GaitClock との組み合わせ（モデル空間の速度を渡す）', () => {
  const cycleSecondsAt = (speed: number): number => {
    const clock = new GaitClock();
    let cycles = 0;
    for (let i = 0; i < 60; i++) {
      clock.advance(toModelSpeed(speed), 1 / 60, { profile: BOSS_LOCOMOTION });
      cycles += clock.lastDelta;
    }
    return 1 / cycles; // 1 秒で進んだサイクル数の逆数
  };

  it('歩きと走りの 1 サイクルの秒数が対応表と一致する', () => {
    for (const e of BOSS_GAIT_TABLE) {
      expect(cycleSecondsAt(e.speed)).toBeCloseTo(e.cycleSeconds, 2);
    }
  });

  it('走り出すと足音（接地）が左右で発火し、歩幅は拡大率に比例して長い', () => {
    const clock = new GaitClock();
    const events: AnimMarkerEvent[] = [];
    const speed = BOSS_SPEED.run[1];
    const seconds = 10;
    for (let i = 0; i < seconds * 60; i++) {
      clock.advance(toModelSpeed(speed), 1 / 60, { profile: BOSS_LOCOMOTION, out: events });
    }
    const steps = events.filter((e) => e.type === 'footstep').length;
    const stepMeters = (speed * seconds) / steps;
    expect(stepMeters).toBeCloseTo(bossGaitFor(speed).stepMeters, 0);
    // 通常サイズ（等倍）の同速度の歩幅より BOSS_SCALE 倍長い
    expect(BOSS_SCALE).toBeCloseTo(2.2, 6);
  });
});
