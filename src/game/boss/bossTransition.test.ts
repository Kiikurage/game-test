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

  it('shows the red rim for 30F from the roar', () => {
    expect(rimAtTransitionFrame(59)).toBe(0);
    expect(rimAtTransitionFrame(60)).toBe(0);
    expect(rimAtTransitionFrame(66)).toBe(1);
    expect(rimAtTransitionFrame(77)).toBe(1);
    expect(rimAtTransitionFrame(84)).toBeCloseTo(0.5, 5);
    expect(rimAtTransitionFrame(90)).toBe(0);
    const lit = Array.from({ length: 121 }, (_, f) => rimAtTransitionFrame(f)).filter((v) => v > 0);
    expect(lit.length).toBe(29); // F61–F89
  });
});
