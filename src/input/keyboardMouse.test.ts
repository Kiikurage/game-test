import { describe, expect, it } from 'vitest';
import { isLockSpike, LOCK_SETTLE_MS, MOUSE_SPIKE_PX } from './keyboardMouse';

describe('isLockSpike', () => {
  it('drops the half-viewport jump right after the lock is acquired', () => {
    expect(isLockSpike(-640, -360, 0)).toBe(true);
    expect(isLockSpike(0, MOUSE_SPIKE_PX + 1, LOCK_SETTLE_MS)).toBe(true);
  });

  it('keeps ordinary movement right after the lock', () => {
    expect(isLockSpike(12, -8, 10)).toBe(false);
    expect(isLockSpike(-MOUSE_SPIKE_PX, MOUSE_SPIKE_PX, 10)).toBe(false);
  });

  it('never drops fast flicks once the lock has settled', () => {
    expect(isLockSpike(-640, -360, LOCK_SETTLE_MS + 1)).toBe(false);
    expect(isLockSpike(2000, 0, 60_000)).toBe(false);
  });
});
