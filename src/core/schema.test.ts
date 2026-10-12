import { describe, expect, it } from 'vitest';
import { parseData, s, SchemaError, type Infer } from './schema';

const Point = s.object({
  x: s.number(),
  z: s.number({ min: 0 }),
  tag: s.optional(s.literal('a', 'b')),
  link: s.nullable(s.string()),
});

const Shape = s.union('type', {
  circle: s.object({ type: s.literal('circle'), r: s.number() }),
  box: s.object({ type: s.literal('box'), size: s.tuple(s.number(), s.number()) }),
});

function errorOf(fn: () => unknown): SchemaError {
  try {
    fn();
  } catch (e) {
    if (e instanceof SchemaError) return e;
    throw e;
  }
  throw new Error('expected SchemaError');
}

describe('schema', () => {
  it('accepts valid data and returns it as typed', () => {
    const value = { x: 1, z: 2, link: null };
    const p: Infer<typeof Point> = parseData(Point, value);
    expect(p).toBe(value);
    expect(parseData(Shape, { type: 'box', size: [1, 2] })).toEqual({ type: 'box', size: [1, 2] });
  });

  it('reports the path of the first error with the source', () => {
    const e = errorOf(() =>
      parseData(
        s.array(Point),
        [
          { x: 1, z: 0, link: null },
          { x: 'a', z: 0, link: null },
        ],
        'p.json',
      ),
    );
    expect(e.path).toBe('$[1].x');
    expect(e.message).toBe('p.json: $[1].x: expected number, got string');
  });

  it('rejects missing keys, unknown keys, out-of-range and wrong literals', () => {
    expect(errorOf(() => parseData(Point, { x: 1, link: null })).path).toBe('$.z');
    expect(errorOf(() => parseData(Point, { x: 1, z: 0, link: null, y: 3 })).detail).toBe(
      'unknown key',
    );
    expect(errorOf(() => parseData(Point, { x: 1, z: -1, link: null })).detail).toMatch('>= 0');
    expect(errorOf(() => parseData(Point, { x: 1, z: 0, link: null, tag: 'c' })).path).toBe(
      '$.tag',
    );
  });

  it('dispatches unions by tag', () => {
    expect(errorOf(() => parseData(Shape, { type: 'hex' })).path).toBe('$.type');
    expect(errorOf(() => parseData(Shape, { type: 'box', size: [1] })).path).toBe('$.size');
  });

  it('runs refinements after the inner check', () => {
    const Range = s.refine(s.object({ min: s.number(), max: s.number() }), (r) =>
      r.min <= r.max ? undefined : 'min > max',
    );
    expect(parseData(Range, { min: 0, max: 1 })).toEqual({ min: 0, max: 1 });
    expect(errorOf(() => parseData(Range, { min: 2, max: 1 })).detail).toBe('min > max');
  });
});
