import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { HEAVY_CHARGE_FULL_CUE } from './heavyChargeCue.system';

const DT = 1 / 60;

/** 強攻撃のフル溜め到達の SE（#200）: 30F で 1 回だけ、29F・キャンセルでは出ない。 */
describe('heavy charge full cue', () => {
  let game: Game;
  let input: FakeInput;
  let cues: { cue: string; source?: string }[];

  beforeAll(async () => {
    await Game.create();
  });

  beforeEach(async () => {
    resetTuning();
    tuning.camera.autoFollow = false;
    input = new FakeInput();
    game = await Game.create({ input });
    cues = [];
    game.events.on('sound', (e) => {
      if (e.cue === HEAVY_CHARGE_FULL_CUE) cues.push(e);
    });
    run(10);
  });

  function tick(): void {
    game.update(DT);
    input.endStep();
  }

  function run(frames: number): void {
    for (let i = 0; i < frames; i++) tick();
  }

  /** 強攻撃ボタンを押して溜めの `frames` ステップ目まで進める（押したステップが F1）。 */
  function chargeTo(frames: number): void {
    input.press('heavyAttack');
    tick();
    run(frames - 1);
    expect(game.player.state).toBe('heavyCharge');
    expect(game.player.chargeFrames).toBe(frames);
  }

  it('溜め 29F では出ない', () => {
    chargeTo(29);
    expect(cues).toHaveLength(0);
  });

  it('溜め 30F で出る（player 起源）', () => {
    chargeTo(29);
    tick();
    expect(game.player.chargeFrames).toBe(30);
    expect(cues).toHaveLength(1);
    expect(cues[0]?.source).toBe('player');
  });

  it('30F 以降に保持し続けても 1 回だけ', () => {
    chargeTo(30);
    run(90);
    expect(game.player.state).toBe('heavyCharge');
    expect(cues).toHaveLength(1);
  });

  it('溜めをキャンセルしたら出ない（ロール）', () => {
    chargeTo(20);
    input.press('dodge');
    input.release('dodge');
    run(5);
    expect(game.player.state).not.toBe('heavyCharge');
    run(60);
    expect(cues).toHaveLength(0);
  });

  it('29F で離して攻撃に移っても出ない。続けて溜め直すと再び 1 回出る', () => {
    chargeTo(29);
    input.release('heavyAttack');
    tick();
    expect(game.player.state).toBe('heavy');
    expect(cues).toHaveLength(0);
    run(80);
    chargeTo(31);
    expect(cues).toHaveLength(1);
  });
});
