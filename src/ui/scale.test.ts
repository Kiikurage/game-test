import { describe, expect, it } from 'vitest';
import { uiScale } from './scale';

describe('uiScale', () => {
  it('is 1 at the 412px reference short side', () => {
    expect(uiScale(915, 412)).toBe(1);
  });

  it('clamps small screens to 0.85 and large screens to 1.3', () => {
    expect(uiScale(640, 300)).toBe(0.85);
    expect(uiScale(2560, 1440)).toBe(1.3);
  });

  it('scales with the short side in between', () => {
    expect(uiScale(1280, 450)).toBeCloseTo(450 / 412, 10);
    expect(uiScale(450, 1280)).toBeCloseTo(450 / 412, 10);
    expect(uiScale(1280, 720)).toBeCloseTo(1.3, 10);
  });
});
