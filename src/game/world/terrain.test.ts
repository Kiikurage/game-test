import { describe, expect, it } from 'vitest';
import { FLAT_RADIUS, terrainHeight } from './terrain';

describe('terrainHeight', () => {
  it('is flat around the origin so it matches the physics ground', () => {
    for (let a = 0; a < 6.28; a += 0.5) {
      expect(terrainHeight(Math.cos(a) * FLAT_RADIUS, Math.sin(a) * FLAT_RADIUS)).toBeCloseTo(0, 9);
    }
    expect(terrainHeight(0, 0)).toBeCloseTo(0, 9);
  });

  it('is deterministic and finite, and rises towards the rim', () => {
    expect(terrainHeight(40, 20)).toBe(terrainHeight(40, 20));
    expect(Number.isFinite(terrainHeight(-123.4, 56.7))).toBe(true);
    let max = 0;
    for (let a = 0; a < 6.28; a += 0.2) {
      max = Math.max(max, terrainHeight(Math.cos(a) * 120, Math.sin(a) * 120));
    }
    expect(max).toBeGreaterThan(10);
  });
});
