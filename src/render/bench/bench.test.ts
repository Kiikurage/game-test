import { describe, expect, it } from 'vitest';
import {
  BENCH_TIMING,
  BENCH_TIMING_QUICK,
  BenchSectionRun,
  benchTimingFor,
  formatBenchReport,
  percentile,
  summarize,
  type BenchSample,
} from './bench';

const sample = (frameMs: number, gpuMs: number | null = 5): BenchSample => ({
  frameMs,
  gpuMs,
  cpuMs: 2,
  draws: 100,
  tris: 50_000,
});

describe('percentile', () => {
  it('returns the nearest-rank value', () => {
    const xs = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(xs, 0.5)).toBe(50);
    expect(percentile(xs, 0.99)).toBe(99);
    expect(percentile([3, 1, 2], 0.5)).toBe(2);
    expect(percentile([], 0.5)).toBeNaN();
  });
});

describe('benchTimingFor', () => {
  it('uses the quick timing only for ?bench=quick', () => {
    expect(benchTimingFor('?bench')).toBe(BENCH_TIMING);
    expect(benchTimingFor('?bench=quick')).toBe(BENCH_TIMING_QUICK);
  });
});

describe('BenchSectionRun', () => {
  it('warms up, then measures until both time and frame count are met', () => {
    const run = new BenchSectionRun(BENCH_TIMING);
    let warmFrames = 0;
    while (run.step(1 / 60, 10, sample(16)) === 'warm') warmFrames++;
    expect(warmFrames).toBeGreaterThanOrEqual(59); // 1 秒
    expect(run.samples).toHaveLength(0);
    while (run.step(1 / 60, 10, sample(16)) === 'measure');
    expect(run.samples.length).toBeGreaterThanOrEqual(240); // 4 秒
    expect(run.phase).toBe('done');
    expect(run.pipelinesDuringMeasure).toBe(0);
  });

  it('keeps warming up while pipelines are still being created', () => {
    const run = new BenchSectionRun(BENCH_TIMING_QUICK);
    // 毎フレームパイプラインが増える間は計測に入らない
    for (let i = 0; i < 20; i++) expect(run.step(0.016, i, sample(16))).toBe('warm');
    let frames = 0;
    while (run.step(0.016, 20, sample(16)) === 'warm') frames++;
    expect(frames).toBe(BENCH_TIMING_QUICK.settleFrames);
  });

  it('gives up warming up after maxWarmSec', () => {
    const run = new BenchSectionRun(BENCH_TIMING);
    let i = 0;
    while (run.step(0.5, i++, sample(500)) === 'warm');
    expect(i).toBeLessThanOrEqual(BENCH_TIMING.maxWarmSec / 0.5 + 1);
  });

  it('reports measure progress', () => {
    const run = new BenchSectionRun(BENCH_TIMING_QUICK);
    while (run.step(0.016, 0, sample(16)) === 'warm');
    expect(run.progress).toBe(0);
    run.step(0.016, 0, sample(16));
    run.step(0.016, 0, sample(16));
    expect(run.progress).toBeCloseTo(0.5);
  });
});

describe('summarize / formatBenchReport', () => {
  it('summarizes samples and formats one line per section', () => {
    const row = summarize(
      'graveyard',
      [sample(10), sample(12), sample(30)],
      { width: 1600, height: 720, scale: 0.8 },
      0,
    );
    expect(row.frameMedMs).toBe(12);
    expect(row.frameP99Ms).toBe(30);
    expect(row.gpuMedMs).toBe(5);
    const noGpu = summarize('x', [sample(10, null)], { width: 1, height: 1, scale: 1 }, 2);
    expect(noGpu.gpuMedMs).toBeNull();

    const text = formatBenchReport(
      ['ua: test'],
      [row, noGpu, { name: 'graveyard:nomsaa', skipped: 'fixed at creation' }],
    );
    const lines = text.split('\n');
    expect(lines[1]).toBe('ua: test');
    expect(lines).toContain('graveyard | 12.0 | 30.0 | 5.0 | 2.0 | 100 | 50k | 1600x720 @0.80');
    expect(lines).toContain('x | 10.0 | 10.0 | n/a | 2.0 | 100 | 50k | 1x1 @1.00 pipe+2');
    expect(lines).toContain('graveyard:nomsaa | skipped: fixed at creation');
  });
});
