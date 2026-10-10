import { describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS, PLAYER_STATS, STAMINA } from '../data';
import { Stamina } from './stamina';

const DT = 1 / 60;
const PER_FRAME = STAMINA.regenPerSecond / 60;

function step(s: Stamina, frames: number, context?: Parameters<Stamina['update']>[1]): void {
  for (let i = 0; i < frames; i++) s.update(DT, context);
}

describe('Stamina', () => {
  it('starts full and consumes on action start', () => {
    const s = new Stamina();
    expect(s.current).toBe(PLAYER_STATS.stamina);
    expect(s.max).toBe(100);
    s.consume(20);
    expect(s.current).toBe(80);
    expect(s.ratio).toBeCloseTo(0.8, 10);
  });

  describe('start / clamp', () => {
    it('clamps at 0 and never goes negative', () => {
      const s = new Stamina();
      s.consume(150);
      expect(s.current).toBe(0);
      s.consume(10);
      expect(s.current).toBe(0);
    });

    it('cannot start a new action at 0', () => {
      const s = new Stamina();
      s.consume(100);
      expect(s.canStart(PLAYER_ACTIONS.light1.staminaCost)).toBe(false);
      expect(s.canStart(1)).toBe(false);
      expect(s.canStartAction).toBe(false);
    });

    it('can start an action whose cost exceeds the remainder (it clamps to 0 afterwards)', () => {
      const s = new Stamina();
      s.consume(95); // 残り 5
      expect(s.canStart(PLAYER_ACTIONS.heavyCharged.staminaCost)).toBe(true);
      s.consume(PLAYER_ACTIONS.heavyCharged.staminaCost);
      expect(s.current).toBe(0);
      expect(s.canStart(PLAYER_ACTIONS.light1.staminaCost)).toBe(false);
    });

    it('can always start a zero-cost action (heal) even at 0', () => {
      const s = new Stamina();
      s.consume(100);
      expect(s.canStart(PLAYER_ACTIONS.heal.staminaCost)).toBe(true);
      expect(s.canStart(0)).toBe(true);
    });

    it('ignores non-positive consumption and does not restart the wait', () => {
      const s = new Stamina();
      s.consume(10);
      step(s, 10);
      const wait = s.regenDelayRemaining;
      s.consume(0);
      s.consume(-5);
      expect(s.current).toBe(90);
      expect(s.regenDelayRemaining).toBe(wait);
    });
  });

  describe('regeneration', () => {
    it('is 40 per second = 0.667 per frame at 60Hz', () => {
      expect(PER_FRAME).toBeCloseTo(0.6667, 4);
      const s = new Stamina();
      s.consume(50);
      step(s, STAMINA.regenDelayFrames);
      const before = s.current;
      s.update(DT);
      expect(s.current - before).toBeCloseTo(0.66667, 4);
      step(s, 59);
      expect(s.current - before).toBeCloseTo(40, 5); // ちょうど 60F で 40
    });

    it('waits 45 frames after the last consume, then regenerates', () => {
      const s = new Stamina();
      s.consume(50);
      step(s, 44);
      expect(s.current).toBe(50);
      step(s, 1); // 45F 目まで回復しない
      expect(s.current).toBe(50);
      step(s, 1);
      expect(s.current).toBeCloseTo(50 + PER_FRAME, 6);
    });

    it('restarts the 45-frame wait on every consume', () => {
      const s = new Stamina();
      s.consume(30);
      step(s, 40);
      s.consume(10);
      step(s, 44);
      expect(s.current).toBe(60);
      step(s, 2);
      expect(s.current).toBeGreaterThan(60);
    });

    it('waits 60 frames when it reaches 0', () => {
      const s = new Stamina();
      s.consume(100);
      expect(s.regenDelayRemaining).toBe(STAMINA.depletedDelayFrames);
      step(s, 60);
      expect(s.current).toBe(0);
      step(s, 1);
      expect(s.current).toBeCloseTo(PER_FRAME, 6);
    });

    it('regenerates at 20 per second while guarding', () => {
      const s = new Stamina();
      s.consume(50);
      step(s, STAMINA.regenDelayFrames + 1); // 待ち終わり
      const before = s.current;
      step(s, 60, { guarding: true });
      expect(s.current - before).toBeCloseTo(20, 5);
    });

    it('does not regenerate while running or dashing, but the wait still elapses', () => {
      const s = new Stamina();
      s.consume(50);
      step(s, 200, { sprinting: true });
      expect(s.current).toBe(50);
      expect(s.regenDelayRemaining).toBe(0);
      // 走りをやめた最初のフレームから回復する
      s.update(DT);
      expect(s.current).toBeCloseTo(50 + PER_FRAME, 6);
    });

    it('does not regenerate while charging a heavy attack, but the wait still elapses', () => {
      const s = new Stamina();
      s.consume(50);
      step(s, 200, { charging: true });
      expect(s.current).toBe(50);
      expect(s.regenDelayRemaining).toBe(0);
      s.update(DT);
      expect(s.current).toBeCloseTo(50 + PER_FRAME, 6);
    });

    it('never exceeds the maximum', () => {
      const s = new Stamina();
      s.consume(1);
      step(s, 600);
      expect(s.current).toBe(s.max);
    });

    it('refill restores the full amount and clears the wait', () => {
      const s = new Stamina();
      s.consume(100);
      s.refill();
      expect(s.current).toBe(100);
      expect(s.regenDelayRemaining).toBe(0);
    });
  });

  describe('dash drain', () => {
    it('drains 10 per second and reports when empty', () => {
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

    it('consumes 10 after exactly one second of dashing', () => {
      const s = new Stamina();
      for (let i = 0; i < 60; i++) s.drain(STAMINA.dashCostPerSecond, DT);
      expect(s.current).toBeCloseTo(90, 6);
    });
  });

  describe('empty event', () => {
    it('fires once when an action start consumes it down to 0', () => {
      const s = new Stamina();
      let count = 0;
      s.onEmpty(() => count++);
      s.consume(60);
      expect(count).toBe(0);
      s.consume(60);
      expect(count).toBe(1);
      s.consume(10); // すでに 0: 再通知しない
      expect(count).toBe(1);
    });

    it('fires again after recovering and emptying again', () => {
      const s = new Stamina();
      let count = 0;
      s.onEmpty(() => count++);
      s.consume(100);
      step(s, 200);
      expect(s.current).toBeGreaterThan(0);
      s.consume(100);
      expect(count).toBe(2);
    });

    it('fires from a continuous drain and can be unsubscribed', () => {
      const s = new Stamina();
      s.current = 0.1;
      let count = 0;
      const off = s.onEmpty(() => count++);
      expect(s.drain(STAMINA.dashCostPerSecond, DT)).toBe(true);
      expect(count).toBe(1);
      off();
      s.current = 5;
      s.consume(10);
      expect(count).toBe(1);
    });
  });
});
