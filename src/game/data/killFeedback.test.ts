import { describe, expect, it } from 'vitest';
import { KILL_FEEDBACK, KILL_VANISH_FRAMES, killFeedbackAt } from './killFeedback';

describe('killFeedbackAt (#281)', () => {
  it('fixes the dissolve start and length so the corpse vanishes within ~1.2s', () => {
    expect(KILL_FEEDBACK.dissolveStartFrames).toBe(20);
    expect(KILL_FEEDBACK.dissolveFrames).toBe(48);
    expect(KILL_VANISH_FRAMES).toBeLessThanOrEqual(72);
    expect(killFeedbackAt(KILL_VANISH_FRAMES).dissolve).toBe(1);
    expect(killFeedbackAt(KILL_FEEDBACK.dissolveStartFrames).dissolve).toBe(0);
  });

  it('flashes the outline and starts burning out at F0', () => {
    const f0 = killFeedbackAt(0);
    expect(f0.flash).toBe(1);
    expect(f0.eyeGlow).toBe(1);
    expect(killFeedbackAt(4).flash).toBe(1);
    expect(killFeedbackAt(10).flash).toBe(0);
    expect(killFeedbackAt(2).burnout).toBeGreaterThan(0.15);
    expect(killFeedbackAt(20).burnout).toBe(1);
  });

  it('turns the eyes off within 6 frames', () => {
    expect(killFeedbackAt(3).eyeGlow).toBeCloseTo(0.5, 9);
    expect(killFeedbackAt(6).eyeGlow).toBe(0);
  });

  it('is the living state before death', () => {
    expect(killFeedbackAt(-1)).toEqual({ flash: 0, eyeGlow: 1, burnout: 0, dissolve: 0 });
  });
});
