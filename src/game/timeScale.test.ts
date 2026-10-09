import { describe, expect, it } from 'vitest';
import { FixedStepper } from '../core/fixedStepper';
import { TimeScale } from './timeScale';

describe('TimeScale（スローモーション）', () => {
  it('開始前・終了後は 1 倍、シミュレーション 30 ステップのあいだ 0.3 倍', () => {
    const t = new TimeScale();
    expect(t.current).toBe(1);
    t.start(0.3, 30);
    let slow = 0;
    while (t.current < 1) {
      slow++;
      t.step();
    }
    expect(slow).toBe(30);
    expect(t.active).toBe(false);
    expect(t.current).toBe(1);
  });

  it('delay の間（ヒットストップ中）は 1 倍で、明けてから 30 ステップ続く', () => {
    const t = new TimeScale();
    t.start(0.3, 30, 12);
    expect(t.active).toBe(true);
    const seen: number[] = [];
    for (let i = 0; i < 12 + 30 + 3; i++) {
      seen.push(t.current);
      t.step();
    }
    expect(seen.slice(0, 12).every((s) => s === 1)).toBe(true);
    expect(seen.slice(12, 42).every((s) => s === 0.3)).toBe(true);
    expect(seen.slice(42).every((s) => s === 1)).toBe(true);
  });

  it('重ね掛けは強い方（小さいスケールと長い残り）にまとまる', () => {
    const t = new TimeScale();
    t.start(0.3, 30);
    for (let i = 0; i < 10; i++) t.step();
    t.start(0.5, 60); // ボス撃破など
    expect(t.current).toBe(0.3);
    expect(t.remainingFrames).toBe(60);
  });

  it('無効な引数は無視する', () => {
    const t = new TimeScale();
    t.start(0.3, 0);
    t.start(1, 30);
    expect(t.active).toBe(false);
  });

  it('固定ステップのアキュムレータと組み合わせる: 0.3 倍速 30F は実時間で約 100 ステップ、シミュレーションは 30 ステップ', () => {
    const t = new TimeScale();
    const stepper = new FixedStepper();
    const DT = 1 / 60;
    t.start(0.3, 30);
    let ticks = 0;
    let simSteps = 0;
    const log: number[] = [];
    while (t.active || ticks < 5) {
      // 実時間 1/60 秒ぶん（60Hz の描画）× タイムスケール
      const { steps } = stepper.advance(DT * t.current);
      for (let i = 0; i < steps; i++) {
        t.step();
        simSteps++;
      }
      log.push(steps);
      ticks++;
      if (ticks > 1000) throw new Error('did not finish');
    }
    expect(simSteps).toBe(30);
    expect(ticks).toBeGreaterThanOrEqual(99);
    expect(ticks).toBeLessThanOrEqual(102);
    // 1 ティックで 2 ステップ進むことはない（スローなので 0 か 1）
    expect(Math.max(...log)).toBe(1);
  });

  it('30fps 描画でも同じシミュレーションステップ数になる（決定的）', () => {
    const run = (tickSeconds: number): number => {
      const t = new TimeScale();
      const stepper = new FixedStepper();
      t.start(0.3, 30);
      let simSteps = 0;
      for (let i = 0; i < 2000 && t.active; i++) {
        const { steps } = stepper.advance(tickSeconds * t.current);
        for (let k = 0; k < steps; k++) {
          t.step();
          simSteps++;
        }
      }
      return simSteps;
    };
    expect(run(1 / 60)).toBe(30);
    expect(run(1 / 30)).toBe(30);
  });
});
