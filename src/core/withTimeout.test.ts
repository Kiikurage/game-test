import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { settleWithin } from './withTimeout';

describe('settleWithin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves true when the promise settles in time', async () => {
    await expect(settleWithin(Promise.resolve(), 1000)).resolves.toBe(true);
  });

  it('resolves false instead of hanging when the promise never settles (#369)', async () => {
    const result = settleWithin(new Promise<void>(() => undefined), 1000);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toBe(false);
  });

  it('propagates rejection', async () => {
    await expect(settleWithin(Promise.reject(new Error('lost')), 1000)).rejects.toThrow('lost');
  });
});
