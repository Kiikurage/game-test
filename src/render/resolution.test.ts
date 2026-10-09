import { describe, expect, it } from 'vitest';
import { computePixelRatio } from './resolution';

describe('computePixelRatio', () => {
  it('uses devicePixelRatio on small desktop windows', () => {
    expect(computePixelRatio(800, 600, 1)).toBe(1);
    expect(computePixelRatio(800, 600, 2)).toBe(2);
  });

  it('caps the pixel ratio', () => {
    expect(computePixelRatio(400, 300, 3)).toBe(2);
  });

  it('caps the pixel ratio on high-DPI phones', () => {
    const w = 915;
    const h = 412;
    const ratio = computePixelRatio(w, h, 3);
    expect(ratio).toBe(2);
    expect(w * ratio * h * ratio).toBeLessThanOrEqual(2_500_000 + 1);
  });

  it('never goes below the floor or above DPR for tiny DPR', () => {
    expect(computePixelRatio(1280, 720, 0.25)).toBe(1);
    expect(computePixelRatio(10000, 10000, 1)).toBe(0.5);
  });
});
