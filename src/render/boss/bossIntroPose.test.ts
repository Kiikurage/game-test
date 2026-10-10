import { describe, expect, it } from 'vitest';
import { bossIntroPose } from './bossIntroPose';

describe('bossIntroPose', () => {
  it('bows the head first, lifts it, and settles into a forward stance', () => {
    expect(bossIntroPose(0).headPitch).toBeGreaterThan(0.3);
    expect(bossIntroPose(44).headPitch).toBeLessThan(0);
    expect(bossIntroPose(90).spinePitch).toBeGreaterThan(0);
    expect(bossIntroPose(90).armSpread).toBeGreaterThan(0.2);
  });

  it('is clamped outside 0..90', () => {
    expect(bossIntroPose(-5)).toEqual(bossIntroPose(0));
    expect(bossIntroPose(500)).toEqual(bossIntroPose(90));
  });
});
