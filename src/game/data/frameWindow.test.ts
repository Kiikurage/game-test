import { describe, expect, it } from 'vitest';
import { inWindow, isInWindow, windowLength } from './frameWindow';
import { PLAYER_ACTIONS } from './playerActions';
import type { CancelTarget } from './types';

/**
 * 境界値テストの書き方: 窓 [start, end] に対し、start-1 / start / end / end+1 の 4 点を検証する。
 * `expectWindow(isOpen, start, end)` で任意の判定関数を同じ形で検証できる。
 */
function expectWindow(isOpen: (frame: number) => boolean, start: number, end: number): void {
  expect(isOpen(start - 1), `F${start - 1}（開始の前）`).toBe(false);
  expect(isOpen(start), `F${start}（開始）`).toBe(true);
  expect(isOpen(end), `F${end}（終了）`).toBe(true);
  expect(isOpen(end + 1), `F${end + 1}（終了の後）`).toBe(false);
}

describe('isInWindow（F1 起点・両端を含む）', () => {
  it('F1–F12: 1 と 12 を含み、0 と 13 を含まない', () => {
    expectWindow((f) => isInWindow(f, 1, 12), 1, 12);
  });

  it('単一フレームの窓', () => {
    expect(isInWindow(5, 5, 5)).toBe(true);
    expect(isInWindow(4, 5, 5)).toBe(false);
    expect(isInWindow(6, 5, 5)).toBe(false);
  });

  it('start > end は例外', () => {
    expect(() => isInWindow(1, 5, 4)).toThrow(RangeError);
    expect(() => windowLength({ start: 5, end: 4 })).toThrow(RangeError);
  });

  it('windowLength: F4–F15 は 12F', () => {
    expect(windowLength({ start: 4, end: 15 })).toBe(12);
    expect(windowLength({ start: 1, end: 1 })).toBe(1);
  });
});

describe('仕様書の例で検証する窓', () => {
  const canCancel = (id: keyof typeof PLAYER_ACTIONS, to: CancelTarget, frame: number): boolean =>
    PLAYER_ACTIONS[id].cancels.some((c) => c.to === to && inWindow(frame, c));

  it('軽攻撃 1 の次の軽攻撃入力窓は F20–F48', () => {
    expectWindow((f) => canCancel('light1', 'lightAttack', f), 20, 48);
  });

  it('軽攻撃 1 のロール/バックステップへのキャンセルは F18 から', () => {
    expect(canCancel('light1', 'dodge', 17)).toBe(false);
    expect(canCancel('light1', 'dodge', 18)).toBe(true);
  });

  it('強攻撃のロールへのキャンセルは F44 から（持続終了 +16F）', () => {
    expect(canCancel('heavy', 'dodge', 43)).toBe(false);
    expect(canCancel('heavy', 'dodge', 44)).toBe(true);
  });

  it('ロールの無敵は F4–F15（12F）。F3 と F16 は被弾する', () => {
    const inv = PLAYER_ACTIONS.roll.invuln;
    expectWindow((f) => inWindow(f, inv), 4, 15);
    expect(windowLength(inv)).toBe(12);
  });

  it('バックステップの無敵は F1–F8（8F）', () => {
    const inv = PLAYER_ACTIONS.backstep.invuln;
    expectWindow((f) => inWindow(f, inv), 1, 8);
    expect(windowLength(inv)).toBe(8);
  });

  it('ロールの F26 からキャンセル可（F25 は不可）', () => {
    for (const to of ['attack', 'guard', 'heal', 'move'] as const) {
      expect(canCancel('roll', to, 25), to).toBe(false);
      expect(canCancel('roll', to, 26), to).toBe(true);
    }
  });

  it('回復: F30 からロール、F36 から攻撃・ガードへ。F25 まではどれも不可', () => {
    expect(canCancel('heal', 'dodge', 29)).toBe(false);
    expect(canCancel('heal', 'dodge', 30)).toBe(true);
    for (const to of ['attack', 'guard'] as const) {
      expect(canCancel('heal', to, 35), to).toBe(false);
      expect(canCancel('heal', to, 36), to).toBe(true);
    }
    for (const c of PLAYER_ACTIONS.heal.cancels) expect(c.start).toBeGreaterThan(25);
  });

  it('強攻撃のスーパーアーマーは F6–F28（発生 F6 以降、持続終了まで）', () => {
    expectWindow((f) => inWindow(f, PLAYER_ACTIONS.heavy.superArmor), 6, 28);
  });
});
