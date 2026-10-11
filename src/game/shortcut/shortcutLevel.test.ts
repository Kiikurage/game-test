import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { ASHEN_FOUNDATION } from '../world/ashenFoundation';
import { createLevel, levelGameOptions } from '../world/level';
import { shortcutOf } from './shortcut.system';

const DT = 1 / 60;
const level = createLevel(ASHEN_FOUNDATION);

/** 篝火 → 鉄門 G1 → 中庭 → 霧の門前の、ショートカットの経由点（`extraRoutes` の道に沿う）。 */
const TO_G1: readonly (readonly [number, number])[] = [
  [8, -5],
  [34, -4.5],
  [68, 8],
  [78, 29],
];
const G1_TO_FOG_GATE: readonly (readonly [number, number])[] = [
  [78, 35],
  [80.2, 37],
  [80.5, 47],
  [84, 51],
  [91.5, 52.5],
  [98.5, 56],
  [102, 62],
];

/** 実レベル（灰の礎）でのショートカット: 北側からのレバー操作 → G1 を南へ抜けて A へ到達、所要時間の計測。 */
describe('shortcut on the real level (physics)', () => {
  let game: Game;
  let input: FakeInput;
  let save: SaveStore;

  beforeEach(async () => {
    resetTuning();
    tuning.camera.autoFollow = false;
    input = new FakeInput();
    save = new SaveStore(new MemoryStorage());
    game = await Game.create({ input, save, ...levelGameOptions(level), enemies: [] });
    game.addStaticCylinders(level.cylinders);
    for (let i = 0; i < 10; i++) game.update(DT);
  });

  const pos = () => game.player.feet;
  const run = (frames: number): void => {
    for (let i = 0; i < frames; i++) {
      game.update(DT);
      input.endStep();
    }
  };
  const aim = (yaw: number): void => {
    game.teleportPlayer(pos().x, pos().z, yaw, pos().y);
  };

  /** 経由点を順に、前進入力だけで歩く。かかったフレーム数を返す。 */
  function walk(
    waypoints: readonly (readonly [number, number])[],
    options: { sprint?: boolean; tol?: number } = {},
  ): number {
    let total = 0;
    let aimed = Number.NaN;
    input.setSprint(options.sprint ?? false);
    for (const [wx, wz] of waypoints) {
      for (;;) {
        const dx = wx - pos().x;
        const dz = wz - pos().z;
        if (Math.hypot(dx, dz) < (options.tol ?? 1)) break;
        expect(total, `stuck before (${wx}, ${wz}) at ${pos().x}, ${pos().z}`).toBeLessThan(3600);
        // 向きを直すと移動がリセットされるので、方位がずれたときだけ直す
        const bearing = Math.atan2(dx, dz);
        const err = Math.atan2(Math.sin(bearing - aimed), Math.cos(bearing - aimed));
        if (!(Math.abs(err) <= 0.1)) {
          aim(bearing);
          aimed = bearing;
        }
        input.setMove(0, 1);
        run(3);
        total += 3;
      }
    }
    input.setMove(0, 0);
    input.setSprint(false);
    return total;
  }

  /** 中庭側（北）のレバーの前から開通させ、扉が開ききるまで待つ。 */
  function openFromNorth(): void {
    const sc = shortcutOf(game);
    if (!sc) throw new Error('no shortcut');
    game.teleportPlayer(80.2, 37, Math.atan2(80 - 80.2, 36 - 37));
    run(10);
    expect(interactionOf(game).prompt?.id).toBe('lever-g1');
    input.press('interact');
    run(240);
    expect(sc.state).toBe('open');
  }

  it('opens from the north, is saved, and lets the player run G1 -> A', () => {
    // 開く前は G1 を北から南へも通れない
    game.teleportPlayer(78, 34, Math.PI);
    run(10);
    input.setMove(0, 1);
    for (let i = 0; i < 30; i++) {
      aim(Math.PI * 0.99);
      run(6);
    }
    input.setMove(0, 0);
    expect(pos().z).toBeGreaterThan(31);

    openFromNorth();
    expect(save.get().shortcuts).toEqual(['G1']);
    // G1 を南へ抜けて A（篝火）へ到達する
    walk([[78, 34], ...[...TO_G1].reverse(), [1, -2.4]], { sprint: true });
    expect(Math.hypot(pos().x, pos().z)).toBeLessThan(5);
  }, 30_000);

  it('measures the bonfire -> G1 -> fog gate trip time via the shortcut', () => {
    openFromNorth();
    game.teleportPlayer(0, -2.4, 1.0); // 篝火（リスポーン位置）
    run(5);
    const toG1 = walk(TO_G1, { sprint: true }) / 60;
    // 門の下（コライダが無効）を抜けて北へ
    const throughGate = walk([[78, 35]], { sprint: true }) / 60;
    expect(pos().z).toBeGreaterThan(33);
    const toFog = walk(G1_TO_FOG_GATE, { sprint: true }) / 60;
    const total = toG1 + throughGate + toFog;
    console.info(
      `[shortcut timing] bonfire->G1 ${toG1.toFixed(1)}s, through G1 ${throughGate.toFixed(1)}s, G1->fog gate ${toFog.toFixed(1)}s, total ${total.toFixed(1)}s (sprint)`,
    );
    // 目標: 篝火 → 鉄門が約 25 秒（70m ÷ 4.5m/s + 門 5s）。余裕を持って 30 秒以内
    expect(toG1).toBeLessThan(30);
  }, 60_000);
});
