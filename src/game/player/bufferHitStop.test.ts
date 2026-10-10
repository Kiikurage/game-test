import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';

const DT = 1 / 60;

/**
 * ヒットストップ中は先行入力バッファの期限も止まる（#197、仕様書 4.1 節）。
 * 凍結したステップ数だけ期限が延びるので、凍結の有無・長さにかかわらず
 * 「状態フレームで数えた押せる範囲」は変わらない。凍結のない場合の境界（攻撃 10F）は従来どおり。
 */
describe('input buffer and hit-stop', () => {
  let game: Game;
  let input: FakeInput;

  beforeAll(async () => {
    await Game.create();
  });

  beforeEach(async () => {
    resetTuning();
    tuning.camera.autoFollow = false;
    input = new FakeInput();
    game = await Game.create({ input });
    run(10);
  });

  function tick(): void {
    game.update(DT);
    input.endStep();
  }

  function run(frames: number): void {
    for (let i = 0; i < frames; i++) tick();
  }

  /** 軽 1 の F1 から始めて、F`pressFrame` のステップで `lightAttack` を押し、直後に `freeze` F 凍結して、軽 2 へ繋がるかを返す。 */
  function light2Connects(pressFrame: number, freeze: number): boolean {
    input.press('lightAttack');
    tick(); // F1
    run(pressFrame - 2); // F`pressFrame` の直前まで
    input.press('lightAttack');
    tick(); // F`pressFrame`
    expect(game.player.stateFrame).toBe(pressFrame);
    if (freeze > 0) game.player.hitStop(freeze);
    run(freeze + 40);
    return game.player.state === 'light2' || game.player.state === 'light3';
  }

  describe('軽攻撃（バッファ 10F、窓 F20 から）', () => {
    it('凍結なしの境界: F11 の入力は繋がる', () => {
      expect(light2Connects(11, 0)).toBe(true);
    });

    it('凍結なしの境界: F10 の入力は窓の前に失効する', () => {
      expect(light2Connects(10, 0)).toBe(false);
    });

    it.each([4, 8, 12])('F12 で押して直後に %dF 凍結しても繋がる', (freeze) => {
      expect(light2Connects(12, freeze)).toBe(true);
    });

    it.each([4, 8, 12])('F11 で押して直後に %dF 凍結しても繋がる（境界）', (freeze) => {
      expect(light2Connects(11, freeze)).toBe(true);
    });

    it.each([4, 12])('F10 で押して %dF 凍結しても、凍結のない場合と同じく繋がらない', (freeze) => {
      expect(light2Connects(10, freeze)).toBe(false);
    });
  });

  describe('凍結中に押した入力（ロール 8F・回復 6F。凍結 6F 以上でバッファ長を超える）', () => {
    it.each([6, 8, 12])('凍結 %dF の最初のステップで押したロールが、解凍後に出る', (freeze) => {
      game.player.hitStop(freeze);
      input.press('dodge');
      run(freeze);
      expect(game.player.state).toBe('idle'); // 凍結中は何も起きない
      run(1);
      expect(['roll', 'backstep']).toContain(game.player.state);
    });

    it.each([8, 12])('凍結 %dF の最初のステップで押した回復が、解凍後に出る', (freeze) => {
      game.playerTarget.health.damage(50); // HP 満タンでは回復できない
      game.player.hitStop(freeze);
      input.press('item');
      run(freeze);
      expect(game.player.state).toBe('idle');
      run(1);
      expect(game.player.state).toBe('heal');
    });
  });
});
