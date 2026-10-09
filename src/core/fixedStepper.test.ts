import { describe, expect, it } from 'vitest';
import { FixedStepper } from './fixedStepper';

const STEP = 1 / 60;

describe('FixedStepper', () => {
  it('does not step before a full step has accumulated', () => {
    const s = new FixedStepper();
    const r = s.advance(STEP / 2);
    expect(r.steps).toBe(0);
    expect(r.alpha).toBeCloseTo(0.5);
  });

  it('carries the remainder across frames', () => {
    const s = new FixedStepper();
    expect(s.advance(STEP * 0.75).steps).toBe(0);
    const r = s.advance(STEP * 0.75);
    expect(r.steps).toBe(1);
    expect(r.alpha).toBeCloseTo(0.5);
  });

  it('steps exactly once for an exact step duration', () => {
    const s = new FixedStepper();
    const r = s.advance(STEP);
    expect(r.steps).toBe(1);
    expect(r.alpha).toBeCloseTo(0);
  });

  it('runs a steady 120Hz display at 60Hz simulation', () => {
    const s = new FixedStepper();
    let total = 0;
    for (let i = 0; i < 120; i++) total += s.advance(1 / 120).steps;
    expect(total).toBe(60);
  });

  it('clamps steps per frame and drops the backlog', () => {
    const s = new FixedStepper({ maxStepsPerFrame: 5 });
    expect(s.advance(10).steps).toBe(5);
    const next = s.advance(0);
    expect(next.steps).toBe(0);
    expect(next.alpha).toBeCloseTo(0);
  });

  it('ignores negative frame times', () => {
    const s = new FixedStepper();
    expect(s.advance(-1).steps).toBe(0);
  });

  it('rejects invalid options', () => {
    expect(() => new FixedStepper({ stepSeconds: 0 })).toThrow(RangeError);
    expect(() => new FixedStepper({ maxStepsPerFrame: 0 })).toThrow(RangeError);
  });
});
