import { describe, expect, it } from 'vitest';
import { PHASE_TRANSITION, emberAtTransitionFrame, emberPulse, shieldReleased } from './bossLook';

describe('ボスのフェーズ移行の見た目', () => {
  it('熾火は咆哮の区間（F60〜F100）でなめらかに 0 → 1', () => {
    expect(emberAtTransitionFrame(1)).toBe(0);
    expect(emberAtTransitionFrame(PHASE_TRANSITION.ember.start)).toBe(0);
    expect(emberAtTransitionFrame(80)).toBeCloseTo(0.5, 5);
    expect(emberAtTransitionFrame(PHASE_TRANSITION.ember.end)).toBe(1);
    expect(emberAtTransitionFrame(120)).toBe(1);
    let prev = 0;
    for (let f = 60; f <= 100; f++) {
      const v = emberAtTransitionFrame(f);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('盾は F13 で手を離れる', () => {
    expect(shieldReleased(12)).toBe(false);
    expect(shieldReleased(13)).toBe(true);
  });

  it('熾火の呼吸は 0〜1 に収まり、基準値を下回る方向に揺れる', () => {
    for (let t = 0; t < 10; t += 0.1) {
      const v = emberPulse(t);
      expect(v).toBeGreaterThanOrEqual(0.7);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(emberPulse(0, 0)).toBe(0);
  });
});
