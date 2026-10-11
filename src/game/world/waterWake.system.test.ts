import { describe, expect, it } from 'vitest';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { ASHEN_FOUNDATION } from './ashenFoundation';
import { createLevel, levelGameOptions } from './level';
import {
  WAKE_CAPACITY,
  WAKE_KIND,
  WaterWake,
  waterWakeOf,
  type WakeKind,
} from './waterWake.system';
import { waterwayOf } from './waterway.system';

const DT = 1 / 60;

interface Rec {
  step: number;
  kind: WakeKind;
  x: number;
  strength: number;
}

const collect = (wake: WaterWake, after: number): Rec[] => {
  const out: Rec[] = [];
  wake.forEachSince(after, (r) =>
    out.push({ step: r.step, kind: r.kind, x: r.x, strength: r.strength }),
  );
  return out;
};

describe('WaterWake ring buffer', () => {
  it('returns records newer than the given step, oldest first', () => {
    const wake = new WaterWake();
    for (let s = 0; s < 5; s++) {
      wake.record(WAKE_KIND.wake, s, 0, 0, 1, true);
      wake.step++;
    }
    expect(collect(wake, 0).map((r) => r.step)).toEqual([1, 2, 3, 4, 5]);
    expect(collect(wake, 3).map((r) => r.x)).toEqual([3, 4]);
    expect(collect(wake, 5)).toEqual([]);
  });

  it('drops records that overflowed the capacity', () => {
    const wake = new WaterWake();
    for (let s = 0; s < WAKE_CAPACITY + 10; s++) {
      wake.record(WAKE_KIND.step, s, 0, 0, 1, false);
      wake.step++;
    }
    const all = collect(wake, 0);
    expect(all).toHaveLength(WAKE_CAPACITY);
    expect(all[0]?.step).toBe(11);
    expect(all[all.length - 1]?.step).toBe(WAKE_CAPACITY + 10);
  });
});

describe('waterWake system (fixed-step records)', () => {
  it('records the wake, footsteps and a roll of the player in the waterway, one step per update', async () => {
    resetTuning();
    tuning.camera.autoFollow = false;
    const level = createLevel(ASHEN_FOUNDATION);
    const input = new FakeInput();
    const game = await Game.create({ input, ...levelGameOptions(level), enemies: [] });
    game.addStaticCylinders(level.cylinders);
    waterwayOf(game).breakHatch();
    game.teleportPlayer(50, 28, Math.PI / 2, 1.02);
    const wake = waterWakeOf(game);
    const run = (n: number): void => {
      for (let i = 0; i < n; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    run(20);
    const start = wake.step;
    expect(start).toBe(20);
    input.setMove(0, 1);
    run(60);
    const walked = collect(wake, start);
    expect(walked.every((r) => r.step > start && r.step <= wake.step)).toBe(true);
    // 毎ステップの押し分け（速度つき）と、足音
    expect(walked.filter((r) => r.kind === WAKE_KIND.wake).length).toBeGreaterThan(40);
    expect(walked.some((r) => r.kind === WAKE_KIND.wake && r.strength > 2)).toBe(true);
    expect(walked.some((r) => r.kind === WAKE_KIND.step)).toBe(true);
    // 東へ進んでいる
    const xs = walked.filter((r) => r.kind === WAKE_KIND.wake).map((r) => r.x);
    expect((xs[xs.length - 1] ?? 0) - (xs[0] ?? 0)).toBeGreaterThan(1);

    const beforeRoll = wake.step;
    input.press('dodge');
    run(30);
    expect(collect(wake, beforeRoll).filter((r) => r.kind === WAKE_KIND.roll)).toHaveLength(1);
  }, 30_000);
});
