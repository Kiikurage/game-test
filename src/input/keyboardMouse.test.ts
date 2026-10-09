import { describe, expect, it } from 'vitest';
import { isMouseSpike, MOUSE_SPIKE_PX } from './keyboardMouse';

describe('isMouseSpike', () => {
  it('accepts ordinary and fast mouse movement', () => {
    expect(isMouseSpike(0, 0)).toBe(false);
    expect(isMouseSpike(12, -8)).toBe(false);
    expect(isMouseSpike(-MOUSE_SPIKE_PX, MOUSE_SPIKE_PX)).toBe(false);
  });

  it('rejects the half-viewport jump reported on pointer lock', () => {
    expect(isMouseSpike(-640, -360)).toBe(true);
    expect(isMouseSpike(0, 301)).toBe(true);
  });
});
