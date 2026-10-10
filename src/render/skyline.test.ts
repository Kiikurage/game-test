import { describe, expect, it } from 'vitest';
import { RIDGE_LAYERS, ridgeHeight } from './skyline';

describe('skyline ridges', () => {
  it('is seamless around the circle and stays above the horizon', () => {
    for (const layer of RIDGE_LAYERS) {
      expect(ridgeHeight(layer, 0)).toBeCloseTo(ridgeHeight(layer, Math.PI * 2), 5);
      for (let i = 0; i < 360; i++) {
        const h = ridgeHeight(layer, (i / 360) * Math.PI * 2);
        expect(h).toBeGreaterThan(layer.base - 1e-6);
        expect(h).toBeLessThan(layer.base + layer.amplitude + 20);
      }
    }
  });

  it('gets hazier with distance', () => {
    const hazes = RIDGE_LAYERS.map((l) => l.haze);
    expect([...hazes].sort((a, b) => a - b)).toEqual(hazes);
  });
});
