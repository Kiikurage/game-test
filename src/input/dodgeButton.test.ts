import { describe, expect, it } from 'vitest';
import { DodgeButton, type DodgeButtonInput } from './dodgeButton';

const HOLD = 250;

const idle: DodgeButtonInput = {
  held: false,
  pressed: false,
  released: false,
  pressedAt: 0,
  releasedAt: 0,
};

/** t0 に押下して、now まで押し続けているステップ。 */
const down = (t0: number, edge: boolean): DodgeButtonInput => ({
  ...idle,
  held: true,
  pressed: edge,
  pressedAt: t0,
});

describe('DodgeButton', () => {
  it('rolls on release after a short press', () => {
    const b = new DodgeButton(HOLD);
    expect(b.update(1000, down(1000, true))).toBe(false); // 押している間は確定しない
    expect(b.update(1050, down(1000, false))).toBe(false);
    expect(b.sprint).toBe(false);
    expect(b.update(1100, { ...idle, released: true, releasedAt: 1090 })).toBe(true);
  });

  it('sprints while held past the threshold and does not roll on release', () => {
    const b = new DodgeButton(HOLD);
    b.update(1000, down(1000, true));
    expect(b.update(1200, down(1000, false))).toBe(false);
    expect(b.sprint).toBe(false);
    expect(b.update(1260, down(1000, false))).toBe(false);
    expect(b.sprint).toBe(true);
    expect(b.update(1300, { ...idle, released: true, releasedAt: 1290 })).toBe(false);
    expect(b.sprint).toBe(false);
  });

  it('measures the press in real event time, not in how late the release is processed', () => {
    const b = new DodgeButton(HOLD);
    b.update(1000, down(1000, true));
    // 描画が重く、離してから 2 秒後に処理されても、実際に押していたのは 100ms
    expect(b.update(3000, { ...idle, released: true, releasedAt: 1100 })).toBe(true);
  });

  it('treats press and release within a single step as a tap', () => {
    const b = new DodgeButton(HOLD);
    const tap = { ...idle, pressed: true, released: true, pressedAt: 1000, releasedAt: 1030 };
    expect(b.update(1040, tap)).toBe(true);
    expect(b.sprint).toBe(false);
  });

  it('handles release+press in one step as roll then new press', () => {
    const b = new DodgeButton(HOLD);
    b.update(1000, down(1000, true));
    const both = {
      held: true,
      pressed: true,
      released: true,
      pressedAt: 1090,
      releasedAt: 1080,
    };
    expect(b.update(1100, both)).toBe(true); // 1 回目は回避確定、2 回目の押下が始まる
    expect(b.update(1150, { ...idle, released: true, releasedAt: 1140 })).toBe(true);
  });

  it('does nothing when idle', () => {
    const b = new DodgeButton(HOLD);
    expect(b.update(1000, idle)).toBe(false);
    expect(b.sprint).toBe(false);
  });
});
