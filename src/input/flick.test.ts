import { describe, expect, it } from 'vitest';
import { classifyFlick } from './flick';
import { keysToMove } from './keyboardMouse';

describe('classifyFlick', () => {
  it('detects a quick horizontal swipe', () => {
    expect(classifyFlick({ durationMs: 120, dx: 90, dy: 10 })).toBe(1);
    expect(classifyFlick({ durationMs: 120, dx: -90, dy: -10 })).toBe(-1);
  });

  it('rejects slow drags, short swipes and diagonal swipes', () => {
    expect(classifyFlick({ durationMs: 600, dx: 200, dy: 0 })).toBe(0);
    expect(classifyFlick({ durationMs: 100, dx: 20, dy: 0 })).toBe(0);
    expect(classifyFlick({ durationMs: 100, dx: 80, dy: 80 })).toBe(0);
  });
});

describe('keysToMove', () => {
  it('maps WASD and normalises diagonals', () => {
    expect(keysToMove(new Set(['KeyW']))).toEqual({ x: 0, y: 1 });
    expect(keysToMove(new Set(['KeyA', 'KeyD']))).toEqual({ x: 0, y: 0 });
    const d = keysToMove(new Set(['KeyW', 'KeyD']));
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
    expect(d.x).toBeGreaterThan(0);
    expect(d.y).toBeGreaterThan(0);
  });
});
