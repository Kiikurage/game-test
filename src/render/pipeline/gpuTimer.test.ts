import { describe, expect, it } from 'vitest';
import { GpuFrameWindow, groupFrames, type TimestampSpan } from './gpuTimer';
import { orderedFramePasses, type FramePassDef } from './framePasses';
import { QUALITY_PRESETS } from '../quality';

const ms = (v: number): bigint => BigInt(Math.round(v * 1e6));
const span = (uid: string, label: string, start: number, end: number): TimestampSpan => ({
  uid,
  label,
  start: ms(start) + 1n,
  end: ms(end) + 1n,
});

describe('groupFrames', () => {
  it('splits by frame number and sums passes with the same label', () => {
    const frames = groupFrames([
      span('r:0:1:f10', 'shadow', 0, 1),
      span('r:1:2:f10', 'scene', 1, 4),
      span('r:2:3:f10', 'bloom', 4.5, 5),
      span('r:3:4:f10', 'bloom', 5, 5.5),
      span('r:0:1:f11', 'scene', 20, 22),
    ]);
    expect(frames.map((f) => f.frame)).toEqual([10, 11]);
    const f10 = frames[0];
    expect(f10?.passes.get('bloom')).toBeCloseTo(1);
    expect(f10?.passes.get('scene')).toBeCloseTo(3);
    expect(f10?.sumMs).toBeCloseTo(5);
    expect(f10?.rawSumMs).toBeCloseTo(5);
    expect(f10?.spanMs).toBeCloseTo(5.5);
    expect(frames[1]?.sumMs).toBeCloseTo(2);
  });

  it('credits overlapping passes only past the previous end (tile GPUs overlap passes)', () => {
    const [f] = groupFrames([
      span('r:0:1:f1', 'scene', 0, 3),
      span('r:1:2:f1', 'bloom', 1, 4),
      span('r:2:3:f1', 'bloom', 1.5, 4.5),
      span('r:3:4:f1', 'output', 4.2, 5),
    ]);
    expect(f?.passes.get('scene')).toBeCloseTo(3);
    expect(f?.passes.get('bloom')).toBeCloseTo(1.5);
    expect(f?.passes.get('output')).toBeCloseTo(0.5);
    expect(f?.sumMs).toBeCloseTo(5);
    expect(f?.rawSumMs).toBeCloseTo(9.8);
    expect(f?.spanMs).toBeCloseTo(5);
  });

  it('drops unwritten (0) and reversed timestamps', () => {
    const frames = groupFrames([
      { uid: 'r:0:1:f1', label: 'scene', start: 0n, end: 5n },
      { uid: 'r:1:1:f1', label: 'scene', start: 9n, end: 3n },
    ]);
    expect(frames).toEqual([]);
  });
});

describe('GpuFrameWindow', () => {
  it('reports per-pass medians in the given order, counting absent passes as 0', () => {
    const w = new GpuFrameWindow(3);
    for (const [scene, bloom] of [
      [100, 1],
      [3, 1],
      [4, 2],
      [5, 0],
    ] as const) {
      const passes = new Map<string, number>([['scene', scene]]);
      if (bloom > 0) passes.set('bloom', bloom);
      w.push({ frame: 0, passes, sumMs: scene + bloom, rawSumMs: 0, spanMs: scene + bloom });
    }
    const s = w.summary(['shadow', 'scene', 'bloom']);
    expect(s?.frames).toBe(3);
    expect(s?.passes).toEqual([
      { label: 'scene', ms: 4 },
      { label: 'bloom', ms: 1 },
    ]);
    expect(s?.sumMs).toBe(5);
  });

  it('returns null when empty', () => {
    expect(new GpuFrameWindow().summary()).toBeNull();
  });
});

describe('orderedFramePasses', () => {
  const def = (id: string, stage: FramePassDef['stage'], order?: number): FramePassDef => ({
    id,
    stage,
    ...(order !== undefined && { order }),
    build: (_ctx, color) => ({ color }),
  });

  it('orders by stage, then order, then registration', () => {
    const ids = orderedFramePasses(QUALITY_PRESETS.high, [
      def('grade', 'post', 100),
      def('taau', 'temporal'),
      def('bloom', 'post', 0),
      def('fog', 'volume'),
      def('gtao', 'screenSpace'),
      def('ssr', 'screenSpace'),
    ]).map((p) => p.id);
    expect(ids).toEqual(['gtao', 'ssr', 'fog', 'taau', 'bloom', 'grade']);
  });

  it('skips disabled passes', () => {
    const ids = orderedFramePasses(QUALITY_PRESETS.low, [
      { ...def('bloom', 'post'), enabled: (p) => p.bloom },
      def('grade', 'post', 1),
    ]).map((p) => p.id);
    expect(ids).toEqual(QUALITY_PRESETS.low.bloom ? ['bloom', 'grade'] : ['grade']);
  });
});
