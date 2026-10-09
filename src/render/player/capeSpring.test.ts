import { describe, expect, it } from 'vitest';
import { CapeSpring } from './capeSpring';

const run = (spring: CapeSpring, seconds: number, speed: number, turn = 0): void => {
  for (let t = 0; t < seconds; t += 1 / 60)
    spring.step(1 / 60, { forwardSpeed: speed, turnRate: turn });
};

describe('CapeSpring', () => {
  it('hangs almost still when the knight stands (only a faint breeze)', () => {
    const s = new CapeSpring();
    run(s, 3, 0);
    for (const p of s.pitch) expect(Math.abs(p)).toBeLessThan(0.05);
    for (const r of s.roll) expect(Math.abs(r)).toBeLessThan(0.05);
  });

  it('streams backward when running: every segment pitches back, more at higher speed', () => {
    const jog = new CapeSpring();
    const sprint = new CapeSpring();
    run(jog, 2, 4.5);
    run(sprint, 2, 7);
    for (let i = 0; i < jog.segments; i++) {
      expect(jog.pitch[i]).toBeGreaterThan(0.02);
    }
    expect(sprint.pitch.reduce((a, b) => a + b, 0)).toBeGreaterThan(
      jog.pitch.reduce((a, b) => a + b, 0),
    );
  });

  it('swings out when turning, opposite to the turn direction', () => {
    const left = new CapeSpring();
    const right = new CapeSpring();
    run(left, 1, 4, 3);
    run(right, 1, 4, -3);
    expect(left.roll[0]).toBeLessThan(0);
    expect(right.roll[0]).toBeGreaterThan(0);
  });

  it('settles back to rest after the knight stops and stays bounded', () => {
    const s = new CapeSpring();
    run(s, 2, 7, 4);
    for (const p of [...s.pitch, ...s.roll]) expect(Math.abs(p)).toBeLessThan(1.2);
    run(s, 4, 0, 0);
    for (const p of s.pitch) expect(Math.abs(p)).toBeLessThan(0.05);
  });

  it('is stable with huge frame times and ignores non-positive dt', () => {
    const s = new CapeSpring();
    s.step(5, { forwardSpeed: 7, turnRate: 5 });
    s.step(0, { forwardSpeed: 7, turnRate: 5 });
    s.step(-1, { forwardSpeed: 7, turnRate: 5 });
    for (const p of [...s.pitch, ...s.roll]) expect(Number.isFinite(p)).toBe(true);
    expect(Math.abs(s.pitch[0] ?? 0)).toBeLessThan(1);
  });

  it('hangs straight down under gravity when the torso leans (angles cancel the lean)', () => {
    const s = new CapeSpring();
    for (let t = 0; t < 4; t += 1 / 60)
      s.step(1 / 60, { forwardSpeed: 0, turnRate: 0, leanPitch: 0.5, leanRoll: -0.2 });
    expect(s.pitch.reduce((a, b) => a + b, 0)).toBeCloseTo(-0.5, 1);
    expect(s.roll.reduce((a, b) => a + b, 0)).toBeCloseTo(-0.2, 1);
    // 上の段ほど多く受け持つ
    expect(Math.abs(s.pitch[0] ?? 0)).toBeGreaterThan(Math.abs(s.pitch[2] ?? 0));
  });

  it('is deterministic and can be reset', () => {
    const a = new CapeSpring();
    const b = new CapeSpring();
    run(a, 1, 5, 1);
    run(b, 1, 5, 1);
    expect(a.pitch).toEqual(b.pitch);
    a.reset();
    expect(a.pitch.every((v) => v === 0)).toBe(true);
  });
});
