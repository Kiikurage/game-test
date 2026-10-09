import { describe, expect, it } from 'vitest';
import { PLAYER_STATS, STAMINA } from '../data';
import { Stamina } from './stamina';

const DT = 1 / 60;

describe('Stamina', () => {
  it('starts full and consumes on action start', () => {
    const s = new Stamina();
    expect(s.current).toBe(PLAYER_STATS.stamina);
    s.consume(20);
    expect(s.current).toBe(80);
  });

  it('clamps at 0 and refuses new actions when empty', () => {
    const s = new Stamina();
    s.consume(150);
    expect(s.current).toBe(0);
    expect(s.canStartAction).toBe(false);
  });

  it('waits 45 frames after a consume, then regenerates 40/s', () => {
    const s = new Stamina();
    s.consume(50);
    for (let i = 0; i < STAMINA.regenDelayFrames; i++) s.update(DT);
    expect(s.current).toBe(50);
    for (let i = 0; i < 60; i++) s.update(DT);
    expect(s.current).toBeCloseTo(90, 5);
  });

  it('waits 60 frames when it reaches 0', () => {
    const s = new Stamina();
    s.consume(100);
    for (let i = 0; i < STAMINA.depletedDelayFrames; i++) s.update(DT);
    expect(s.current).toBe(0);
    s.update(DT);
    expect(s.current).toBeGreaterThan(0);
  });

  it('does not regenerate in "none" mode and regenerates slower while guarding', () => {
    const s = new Stamina();
    s.consume(50);
    for (let i = 0; i < 200; i++) s.update(DT, 'none');
    expect(s.current).toBe(50);
    for (let i = 0; i < 45; i++) s.update(DT);
    for (let i = 0; i < 60; i++) s.update(DT, 'guard');
    expect(s.current).toBeCloseTo(70, 5);
  });

  it('drains continuously and reports when empty', () => {
    const s = new Stamina();
    let empty = false;
    let steps = 0;
    while (!empty && steps < 2000) {
      empty = s.drain(STAMINA.dashCostPerSecond, DT);
      steps++;
    }
    // 毎秒 10 → 100 を使い切るのに約 10 秒
    expect(steps / 60).toBeGreaterThan(9.9);
    expect(steps / 60).toBeLessThan(10.2);
  });

  it('never exceeds the maximum', () => {
    const s = new Stamina();
    s.consume(1);
    for (let i = 0; i < 600; i++) s.update(DT);
    expect(s.current).toBe(s.max);
  });
});
