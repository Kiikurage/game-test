import { describe, expect, it } from 'vitest';
import { applyRadialDeadzone, applyResponseCurve, clampLength } from './deadzone';

describe('applyRadialDeadzone', () => {
  it('returns zero inside the deadzone', () => {
    expect(applyRadialDeadzone(0.1, 0.1, 0.2)).toEqual({ x: 0, y: 0 });
    expect(applyRadialDeadzone(0, 0, 0.2)).toEqual({ x: 0, y: 0 });
  });

  it('rescales so the output is continuous from 0 at the edge to 1 at full tilt', () => {
    const edge = applyRadialDeadzone(0.2001, 0, 0.2);
    expect(edge.x).toBeGreaterThan(0);
    expect(edge.x).toBeLessThan(0.001);
    expect(applyRadialDeadzone(1, 0, 0.2).x).toBeCloseTo(1);
    expect(applyRadialDeadzone(0.6, 0, 0.2).x).toBeCloseTo(0.5);
  });

  it('keeps direction (radial, not per-axis)', () => {
    const v = applyRadialDeadzone(0.3, 0.4, 0.1); // magnitude 0.5
    expect(v.y / v.x).toBeCloseTo(4 / 3);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo((0.5 - 0.1) / 0.9);
  });

  it('clamps overshoot (square gate corners) to unit length', () => {
    const v = applyRadialDeadzone(1, 1, 0.1);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
  });
});

describe('applyResponseCurve', () => {
  it('is identity for exponent 1 and softens small inputs for exponent > 1', () => {
    expect(applyResponseCurve({ x: 0.5, y: 0 }, 1).x).toBeCloseTo(0.5);
    expect(applyResponseCurve({ x: 0.5, y: 0 }, 2).x).toBeCloseTo(0.25);
    expect(applyResponseCurve({ x: 1, y: 0 }, 2).x).toBeCloseTo(1);
    expect(applyResponseCurve({ x: 0, y: 0 }, 2)).toEqual({ x: 0, y: 0 });
  });
});

describe('clampLength', () => {
  it('limits the length without changing direction', () => {
    const v = clampLength(3, 4, 1);
    expect(v.x).toBeCloseTo(0.6);
    expect(v.y).toBeCloseTo(0.8);
    expect(clampLength(0.3, 0.2)).toEqual({ x: 0.3, y: 0.2 });
  });
});
