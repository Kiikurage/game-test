import { describe, expect, it } from 'vitest';
import { Game } from './game';
import { createTuning, resetTuning } from './tuning';

const DT = 1 / 60;

describe('tuning（Game ごとの調整値）', () => {
  it('2 つの Game の調整値は別のオブジェクトで、片方の書き換えがもう片方へ漏れない', async () => {
    const a = await Game.create();
    const b = await Game.create();
    expect(a.tuning).not.toBe(b.tuning);

    a.tuning.camera.distance = 8;
    a.tuning.hitStop.playerLight = 9;
    a.tuning.player.run = 1;
    expect(b.tuning).toEqual(createTuning());

    // 書き換えはその Game のカメラにだけ効く
    for (let i = 0; i < 120; i++) {
      a.update(DT);
      b.update(DT);
    }
    expect(a.camera.armLength).toBeGreaterThan(createTuning().camera.distance + 1);
    expect(b.camera.armLength).toBeCloseTo(createTuning().camera.distance, 1);
  });

  it('resetTuning は渡した調整値だけを初期値へ戻す', async () => {
    const a = await Game.create();
    const b = await Game.create();
    a.tuning.camera.distance = 8;
    b.tuning.camera.distance = 6;
    resetTuning(a.tuning);
    expect(a.tuning).toEqual(createTuning());
    expect(b.tuning.camera.distance).toBe(6);
  });
});
