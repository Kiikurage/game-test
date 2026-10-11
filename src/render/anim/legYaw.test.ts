import { describe, expect, it } from 'vitest';
import { legYawTarget, MAX_LEG_YAW } from './legYaw';

describe('legYawTarget', () => {
  it('turns the body toward a pure strafe without folding (right = negative)', () => {
    expect(legYawTarget(1, 0, false)).toEqual({ wanted: -MAX_LEG_YAW, folded: false });
    expect(legYawTarget(-1, 0, false)).toEqual({ wanted: MAX_LEG_YAW, folded: false });
  });

  it('does not flip sign when the strafe direction wobbles around 90 degrees (#256)', () => {
    let folded = false;
    for (const lz of [0.05, -0.05, -0.2, 0.1, -0.3, 0.02, -0.1]) {
      const r = legYawTarget(1, lz, folded);
      folded = r.folded;
      expect(r.wanted).toBeCloseTo(-MAX_LEG_YAW);
    }
  });

  it('folds a backward move to face forward, with hysteresis', () => {
    const back = legYawTarget(0.2, -1, false); // ほぼ真後ろ
    expect(back.folded).toBe(true);
    expect(Math.abs(back.wanted)).toBeLessThan(0.3);
    // 125° は折り返し中なら維持、前向き中なら折り返さない
    const x = -Math.sin((125 * Math.PI) / 180);
    const z = Math.cos((125 * Math.PI) / 180);
    expect(legYawTarget(x, z, true).folded).toBe(true);
    expect(legYawTarget(x, z, false).folded).toBe(false);
  });

  it('keeps forward movement straight', () => {
    expect(legYawTarget(0, 1, false).wanted).toBeCloseTo(0);
  });
});
