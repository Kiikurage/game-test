import { describe, expect, it } from 'vitest';
import { DodgeButton } from './dodgeButton';

const DT = 1 / 60;
const HOLD = 0.25;

/** held の間 steps ステップ進める（最初のステップで押下エッジ）。 */
function hold(b: DodgeButton, steps: number): boolean[] {
  const out: boolean[] = [];
  for (let i = 0; i < steps; i++) out.push(b.update(DT, true, i === 0, false));
  return out;
}

describe('DodgeButton', () => {
  it('rolls on release after a short press', () => {
    const b = new DodgeButton(HOLD);
    expect(hold(b, 5).some(Boolean)).toBe(false); // 押している間は確定しない
    expect(b.sprint).toBe(false);
    expect(b.update(DT, false, false, true)).toBe(true);
  });

  it('sprints while held past the threshold and does not roll on release', () => {
    const b = new DodgeButton(HOLD);
    const results = hold(b, 20); // 20/60 s > 0.25 s
    expect(results.some(Boolean)).toBe(false);
    expect(b.sprint).toBe(true);
    expect(b.update(DT, false, false, true)).toBe(false);
    expect(b.sprint).toBe(false);
  });

  it('does not start sprinting before the threshold', () => {
    const b = new DodgeButton(HOLD);
    hold(b, 14); // 14/60 = 0.233 s
    expect(b.sprint).toBe(false);
  });

  it('treats press and release within a single step as a tap', () => {
    const b = new DodgeButton(HOLD);
    expect(b.update(DT, false, true, true)).toBe(true);
    expect(b.sprint).toBe(false);
  });

  it('handles release+press in one step as roll then new press', () => {
    const b = new DodgeButton(HOLD);
    hold(b, 3);
    expect(b.update(DT, true, true, true)).toBe(true); // 1 回目は回避確定、2 回目の押下が始まる
    expect(b.update(DT, false, false, true)).toBe(true); // 2 回目も短押し
  });

  it('does nothing when idle', () => {
    const b = new DodgeButton(HOLD);
    expect(b.update(DT, false, false, false)).toBe(false);
    expect(b.sprint).toBe(false);
  });
});
