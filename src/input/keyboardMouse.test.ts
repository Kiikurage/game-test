import { describe, expect, it } from 'vitest';
import { FIRST_MOVE_SPIKE_PX, isFirstMoveSpike } from './keyboardMouse';

describe('isFirstMoveSpike', () => {
  it('drops the half-viewport jump reported on the first move after the lock', () => {
    expect(isFirstMoveSpike(-640, -360)).toBe(true);
    expect(isFirstMoveSpike(0, FIRST_MOVE_SPIKE_PX + 1)).toBe(true);
  });

  it('keeps ordinary and fast movement', () => {
    expect(isFirstMoveSpike(12, -8)).toBe(false);
    expect(isFirstMoveSpike(-FIRST_MOVE_SPIKE_PX, FIRST_MOVE_SPIKE_PX)).toBe(false);
  });
});
