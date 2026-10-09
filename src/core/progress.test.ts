import { describe, expect, it } from 'vitest';
import { ProgressTracker } from './progress';

describe('ProgressTracker', () => {
  const weights = { a: 1, b: 3 };
  it('weights stages and reaches 1 when all are done', () => {
    const seen: number[] = [];
    const t = new ProgressTracker(weights, (s) => seen.push(s.fraction));
    t.task('a').done();
    expect(t.fraction).toBeCloseTo(0.25);
    t.task('b').set(0.5);
    expect(t.fraction).toBeCloseTo(0.625);
    t.task('b').done();
    expect(t.fraction).toBe(1);
    expect(seen).toEqual([...seen].sort((x, y) => x - y));
  });
  it('ignores decreases and clamps out-of-range values', () => {
    const t = new ProgressTracker(weights);
    const b = t.task('b');
    b.set(0.8);
    b.set(0.2);
    expect(t.fraction).toBeCloseTo(0.6);
    b.set(5);
    expect(t.fraction).toBeCloseTo(0.75);
    t.task('a').set(Number.NaN);
    expect(t.fraction).toBeCloseTo(0.75);
  });
});
