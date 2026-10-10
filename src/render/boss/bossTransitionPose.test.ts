import { describe, expect, it } from 'vitest';
import { BOSS_TRANSITION } from '../../game/boss/bossTransition';
import { bossTransitionPose } from './bossTransitionPose';

describe('boss transition pose', () => {
  it('procedural pose starts and ends at rest, and leans back at the roar', () => {
    const rest = bossTransitionPose(0);
    expect(rest.spinePitch).toBe(0);
    expect(rest.armSpread).toBe(0);
    const end = bossTransitionPose(BOSS_TRANSITION.end);
    expect(end.spinePitch).toBe(0);
    expect(end.headPitch).toBe(0);
    expect(end.armSpread).toBe(0);
    expect(bossTransitionPose(80).spinePitch).toBeLessThan(-0.3);
    expect(bossTransitionPose(80).armSpread).toBeGreaterThan(0.4);
    expect(bossTransitionPose(4).spinePitch).toBeLessThan(-0.2); // 仰け反り
  });
});
