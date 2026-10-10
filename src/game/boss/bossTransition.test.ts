import { describe, expect, it } from 'vitest';
import { BOSS_BATTLE } from './bossData';
import {
  BOSS_TRANSITION,
  BOSS_TRANSITION_FRAMES,
  cuesBetween,
  rimAtTransitionFrame,
} from './bossTransition';

describe('boss transition timeline', () => {
  it('ends exactly when the boss rule ends (120F)', () => {
    expect(BOSS_TRANSITION.end).toBe(BOSS_BATTLE.transitionFrames);
  });

  it('lists cues in order and reports each once when crossed', () => {
    const frames = Object.values(BOSS_TRANSITION_FRAMES);
    expect([...frames].sort((a, b) => a - b)).toEqual(frames);
    expect(cuesBetween(-1, 0)).toEqual(['start']);
    expect(cuesBetween(0, 12)).toEqual(['flinchEnd']);
    expect(cuesBetween(12, 13)).toEqual(['shieldThrow']);
    expect(cuesBetween(13, 59)).toEqual([]);
    expect(cuesBetween(59, 60)).toEqual(['roar']);
    expect(cuesBetween(60, 100)).toEqual(['roarEnd']);
    expect(cuesBetween(100, 120)).toEqual(['end']);
  });

  it('pulses the red rim twice between F60 and F90', () => {
    expect(rimAtTransitionFrame(60)).toBe(0);
    expect(rimAtTransitionFrame(66)).toBe(1);
    expect(rimAtTransitionFrame(70)).toBe(0.5);
    expect(rimAtTransitionFrame(75)).toBe(1);
    expect(rimAtTransitionFrame(90)).toBe(0);
    expect(rimAtTransitionFrame(120)).toBe(0);
    const v = Array.from({ length: 31 }, (_, i) => rimAtTransitionFrame(60 + i));
    let peaks = 0;
    for (let i = 1; i < v.length - 1; i++) {
      if ((v[i] ?? 0) > (v[i - 1] ?? 0) && (v[i] ?? 0) >= (v[i + 1] ?? 0)) peaks++;
    }
    expect(peaks).toBe(2);
    expect(BOSS_TRANSITION.rim.alpha).toBeLessThanOrEqual(0.35);
  });
});
