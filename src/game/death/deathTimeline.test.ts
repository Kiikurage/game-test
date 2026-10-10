import { describe, expect, it } from 'vitest';
import type { DeathPhase } from '../../core/gameEvents';
import { DEATH } from '../data/death';
import { DeathTimeline } from './deathTimeline';

/** F0 から `frames` ステップ進め、節目が発行されたフレームを記録する。 */
function run(
  tl: DeathTimeline,
  frames: number,
  skipAt?: number,
): { phase: DeathPhase; frame: number }[] {
  const out: { phase: DeathPhase; frame: number }[] = [];
  for (const phase of tl.begin()) out.push({ phase, frame: 0 });
  for (let i = 1; i <= frames; i++) {
    const frame = tl.frame + 1;
    for (const phase of tl.step(i === skipAt)) out.push({ phase, frame });
  }
  return out;
}

describe('DeathTimeline', () => {
  it('emits each phase at its frame (F0/F12/F30/F60/F90/F120/F240/F300)', () => {
    const log = run(new DeathTimeline(), 400);
    expect(log).toEqual([
      { phase: 'start', frame: 0 },
      { phase: 'anim', frame: 12 },
      { phase: 'grade', frame: 30 },
      { phase: 'text', frame: 60 },
      { phase: 'skippable', frame: 90 },
      { phase: 'hold', frame: 120 },
      { phase: 'fadeOut', frame: 240 },
      { phase: 'respawn', frame: 300 },
    ]);
  });

  it('ignores skip input before F90', () => {
    const tl = new DeathTimeline();
    run(tl, 89, 60);
    expect(tl.skipped).toBe(false);
    expect(tl.canSkip).toBe(false);
    expect(tl.fadeOutFrame).toBe(DEATH.fadeOutFrame);
  });

  it('shortens to about 3 seconds when skipped from F90 on', () => {
    const tl = new DeathTimeline();
    const log = run(tl, 400, 90);
    expect(log.find((e) => e.phase === 'fadeOut')?.frame).toBe(120);
    expect(log.find((e) => e.phase === 'respawn')?.frame).toBe(180);
    expect(log.some((e) => e.phase === 'hold')).toBe(false);
    expect(tl.active).toBe(false);
  });

  it('starts the fade-out immediately when skipped after F120', () => {
    const tl = new DeathTimeline();
    const log = run(tl, 400, 150);
    expect(log.find((e) => e.phase === 'fadeOut')?.frame).toBe(150);
    expect(log.find((e) => e.phase === 'respawn')?.frame).toBe(210);
    expect(log.some((e) => e.phase === 'hold')).toBe(true);
  });

  it('computes the screen and camera values', () => {
    const tl = new DeathTimeline();
    tl.begin();
    const at = (f: number) => {
      while (tl.frame < f) tl.step();
      return tl.visual;
    };
    expect(at(0)).toMatchObject({ grade: 0, fade: 0, fovOffsetDeg: 0, textAlpha: 0 });
    expect(at(12).fovOffsetDeg).toBe(0);
    expect(at(30).grade).toBe(0);
    expect(at(57).fovOffsetDeg).toBeCloseTo(-2, 5);
    expect(at(60).textAlpha).toBe(0);
    expect(at(75).grade).toBeCloseTo(0.5, 5);
    expect(at(90).textAlpha).toBeCloseTo(0.5, 5);
    expect(at(102).fovOffsetDeg).toBeCloseTo(-4, 5);
    expect(at(102).armOffsetM).toBeCloseTo(DEATH.cameraPullM, 5);
    expect(at(120).grade).toBe(1);
    expect(at(120).textAlpha).toBe(1);
    expect(at(120).fade).toBe(0);
    expect(at(270).fade).toBeCloseTo(0.5, 5);
    expect(at(270).textAlpha).toBeCloseTo(0.5, 5);
    expect(at(299).fade).toBeCloseTo(59 / 60, 5);
  });

  it('resets the screen effects on respawn and fades back in from black', () => {
    const tl = new DeathTimeline();
    run(tl, 300);
    expect(tl.active).toBe(false);
    expect(tl.visual).toMatchObject({ grade: 0, fovOffsetDeg: 0, armOffsetM: 0, textAlpha: 0 });
    expect(tl.visual.fade).toBe(1);
    for (let i = 0; i < DEATH.revealFrames; i++) tl.step();
    expect(tl.visual.fade).toBe(0);
  });

  it('can run again after a respawn', () => {
    const tl = new DeathTimeline();
    run(tl, 300);
    expect(run(tl, 400).map((e) => e.phase)).toContain('respawn');
  });
});
