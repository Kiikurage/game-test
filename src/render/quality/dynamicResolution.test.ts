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

  it('ignores isolated outliers such as tab switches', () => {
    const dr = new DynamicResolution({ targetFps: 60, window: 10 });
    for (let i = 0; i < 50; i++) {
      expect(dr.update(5000)).toBeNull();
      dr.update(16.7);
    }
    expect(dr.scale).toBe(1);
  });

  it('drops the scale at ~1fps (frames over the outlier limit, repeated)', () => {
    const dr = new DynamicResolution({
      targetFps: 30,
      window: 15,
      maxWindowMs: 1000,
      minScale: 0.4,
      spikeClamp: 6,
    });
    // 1100ms/フレームが続く: 15 フレーム（16 秒）待たず、数フレームで下がり始め、下限まで落ちる
    const changes = feed(dr, 1100, 12);
    expect(changes.length).toBeGreaterThan(0);
    feed(dr, 1100, 30);
    expect(dr.scale).toBe(0.4);
  });

  it('uses the 30fps budget on mobile', () => {
    const dr = new DynamicResolution({ targetFps: 30, window: 10 });
    expect(feed(dr, 16.7, 10)).toEqual([]);
    expect(feed(dr, 50, 10)).toEqual([0.8]);
  });

  it('drops below 30fps on a slow mobile GPU, step by step down to the floor', () => {
    // 45ms/frame（22fps）が続く: 窓ごとに下がり続け、下限で止まる
    const dr = new DynamicResolution({ targetFps: 30, window: 10, minScale: 0.4 });
    const changes = feed(dr, 45, 200);
    expect(changes[0]).toBeLessThan(1);
    expect(changes.at(-1)).toBe(0.4);
    expect(dr.scale).toBe(0.4);
  });

  it('does not wait for the maximum: starts from initialScale and reacts within one window', () => {
    const dr = new DynamicResolution({ targetFps: 30, window: 15, initialScale: 0.8 });
    expect(feed(dr, 40, 14)).toEqual([]);
    expect(feed(dr, 40, 1)).toHaveLength(1);
    expect(dr.scale).toBeLessThan(0.8);
  });

  it('ignores warm-up frames and settle frames after a change', () => {
    const dr = new DynamicResolution({
      targetFps: 30,
      window: 10,
      warmupFrames: 20,
      settleFrames: 5,
    });
    // 起動直後の遅いフレームは評価しない
    expect(feed(dr, 200, 20)).toEqual([]);
    expect(feed(dr, 40, 10)).toHaveLength(1);
    // 変更直後の 5 フレームは捨てられるので、窓が埋まるまでに 15 フレーム必要
    expect(feed(dr, 40, 14)).toEqual([]);
    expect(feed(dr, 40, 1)).toHaveLength(1);
  });

  it('clamps single spikes so a shader-compile hitch does not drop the scale', () => {
    const dr = new DynamicResolution({ targetFps: 30, window: 10, spikeClamp: 2 });
    // 9 フレーム 30ms + 1 フレーム 900ms: 丸め無しなら平均 120ms で大きく下がる
    for (let i = 0; i < 9; i++) dr.update(30);
    expect(dr.update(900)).toBeNull();
    expect(dr.scale).toBe(1);
  });

  it('backs off raising after an upscale immediately overshoots', () => {
    const dr = new DynamicResolution({
      targetFps: 30,
      window: 10,
      initialScale: 0.6,
      upStreak: 2,
    });
    feed(dr, 20, 20); // 余裕 2 窓 → 0.7
    expect(dr.scale).toBe(0.7);
    feed(dr, 45, 10); // 上げた直後に超過 → 下げる
    const afterDown = dr.scale;
    expect(afterDown).toBeLessThan(0.7);
    // 通常なら 2 窓で上げるが、バックオフで 4 窓必要
    feed(dr, 20, 20);
    expect(dr.scale).toBe(afterDown);
    feed(dr, 20, 20);
    expect(dr.scale).toBeGreaterThan(afterDown);
  });
});
