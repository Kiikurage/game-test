import { describe, expect, it } from 'vitest';
import { DynamicResolution } from './dynamicResolution';

function feed(dr: DynamicResolution, ms: number, frames: number): number[] {
  const changes: number[] = [];
  for (let i = 0; i < frames; i++) {
    const r = dr.update(ms);
    if (r !== null) changes.push(r);
  }
  return changes;
}

describe('DynamicResolution', () => {
  it('computes the target frame time from fps', () => {
    expect(new DynamicResolution({ targetFps: 60 }).targetFrameMs).toBeCloseTo(16.667, 2);
    expect(new DynamicResolution({ targetFps: 30 }).targetFrameMs).toBeCloseTo(33.333, 2);
  });

  it('keeps the scale while frame time is on target', () => {
    const dr = new DynamicResolution({ targetFps: 60 });
    expect(feed(dr, 16.7, 200)).toEqual([]);
    expect(dr.scale).toBe(1);
  });

  it('scales down when frames are slow', () => {
    const dr = new DynamicResolution({ targetFps: 60, window: 10 });
    expect(feed(dr, 20, 10)).toEqual([0.9]);
    expect(dr.scale).toBe(0.9);
  });

  it('drops faster when badly over budget, never below the minimum', () => {
    const dr = new DynamicResolution({ targetFps: 60, window: 10, minScale: 0.5 });
    expect(feed(dr, 50, 10)).toEqual([0.7]);
    feed(dr, 50, 100);
    expect(dr.scale).toBe(0.5);
  });

  it('scales up only after sustained headroom, never above the maximum', () => {
    const dr = new DynamicResolution({
      targetFps: 60,
      window: 10,
      initialScale: 0.6,
      upStreak: 3,
    });
    expect(feed(dr, 8, 20)).toEqual([]);
    expect(feed(dr, 8, 10)).toEqual([0.7]);
    feed(dr, 8, 1000);
    expect(dr.scale).toBe(1);
  });

  it('resets the headroom streak when an on-target window intervenes', () => {
    const dr = new DynamicResolution({ targetFps: 60, window: 10, initialScale: 0.6 });
    feed(dr, 8, 20);
    feed(dr, 16.7, 10);
    expect(feed(dr, 8, 20)).toEqual([]);
  });

  it('ignores outliers such as tab switches', () => {
    const dr = new DynamicResolution({ targetFps: 60, window: 10 });
    expect(feed(dr, 5000, 50)).toEqual([]);
    expect(dr.scale).toBe(1);
  });

  it('uses the 30fps budget on mobile', () => {
    const dr = new DynamicResolution({ targetFps: 30, window: 10 });
    expect(feed(dr, 16.7, 10)).toEqual([]);
    expect(feed(dr, 50, 10)).toEqual([0.8]);
  });
});
