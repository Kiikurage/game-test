import { beforeEach, describe, expect, it } from 'vitest';
import { fogGateOf } from '../fogGate/fogGate.system';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { ASHEN_FOUNDATION } from './ashenFoundation';
import { createLevel, levelGameOptions } from './level';

const DT = 1 / 60;
const level = createLevel(ASHEN_FOUNDATION);

/** 物理（Rapier）込みでレベル「灰の礎」を歩く統合テスト（D〜F の通し・狭所のロール・門のコライダ）。 */
describe('walking the level D to F (physics)', () => {
  let game: Game;
  let input: FakeInput;

  beforeEach(async () => {
    resetTuning();
    tuning.camera.autoFollow = false;
    input = new FakeInput();
    game = await Game.create({ input, ...levelGameOptions(level), enemies: [] }); // 地形の通行可能性の検証なので敵は置かない
    game.addStaticCylinders(level.cylinders);
    // 霧の門は最初は閉じている（#66）。通行可能性の検証では解除（open）にしておく
    fogGateOf(game)?.unseal();
    for (let i = 0; i < 10; i++) game.update(DT);
  });

  const pos = () => game.player.feet;
  const run = (frames: number): void => {
    for (let i = 0; i < frames; i++) {
      game.update(DT);
      input.endStep();
    }
  };

  /** 位置を保ったまま向きだけ変える（カメラも背後へ）。W（前進）はその向きへ進む。 */
  const aim = (yaw: number): void => {
    game.teleportPlayer(pos().x, pos().z, yaw, pos().y);
  };

  /** 経由点を順に、前進入力だけで歩く（位置のテレポートはしない）。各点の手前 `tol` m で次へ向きを変える。 */
  function walk(waypoints: readonly (readonly [number, number])[], tol = 1): void {
    for (const [wx, wz] of waypoints) {
      let frames = 0;
      for (;;) {
        const dx = wx - pos().x;
        const dz = wz - pos().z;
        if (Math.hypot(dx, dz) < tol) break;
        expect(frames++, `stuck before (${wx}, ${wz}) at ${pos().x}, ${pos().z}`).toBeLessThan(900);
        aim(Math.atan2(dx, dz));
        input.setMove(0, 1);
        run(6);
      }
    }
    input.setMove(0, 0);
    run(5);
  }

  function rollToward(yaw: number): void {
    aim(yaw);
    input.setMove(0, 1);
    input.press('dodge');
    run(40);
    input.setMove(0, 0);
    run(10);
  }

  it('walks from the bonfire through B, C, the catacomb D and the courtyard E into the arena F', () => {
    walk(
      [
        [10, 0],
        [22, 6],
        [32, 12],
        [40, 17],
        [52, 17],
        [58, 21],
        [58.5, 27],
        [61, 28],
        [62, 36],
        [62, 46],
        [63.5, 48.5],
        [78, 48.5],
        [84, 51],
        [91.5, 52.5],
        [98.5, 56],
        [102, 62],
        [104, 68],
        [111, 75],
        [118, 82],
      ],
      0.8,
    );
    // 闘技場の床（高さ 9.9m）の上。落下も壁抜けもしていない
    expect(Math.hypot(pos().x - 118, pos().z - 82)).toBeLessThan(1.5);
    expect(pos().y).toBeGreaterThan(9.7);
    expect(pos().y).toBeLessThan(10.2);
    expect(game.player.grounded).toBe(true);
  }, 30_000);

  it('keeps the player inside the 2.5m catacomb corridor when rolling into its walls', () => {
    // L 字の第 1 区間（x 60.75..63.25）で東・西の壁へ向かってロールする
    game.teleportPlayer(62, 42, 0);
    run(10);
    rollToward(Math.PI / 2);
    expect(pos().x).toBeGreaterThan(60.75);
    expect(pos().x).toBeLessThan(63.25);
    game.teleportPlayer(62, 42, 0);
    run(10);
    rollToward(-Math.PI / 2);
    expect(pos().x).toBeGreaterThan(60.75);
    expect(pos().x).toBeLessThan(63.25);
    // 第 2 区間（z 47.25..49.75）で南・北の壁へ
    for (const yaw of [0, Math.PI]) {
      game.teleportPlayer(70, 48.5, yaw);
      run(10);
      rollToward(yaw);
      expect(pos().z).toBeGreaterThan(47.25);
      expect(pos().z).toBeLessThan(49.75);
    }
    // 通路に沿ったロールは通り抜ける（東へ）
    game.teleportPlayer(66, 48.5, Math.PI / 2);
    run(10);
    const x0 = pos().x;
    rollToward(Math.PI / 2);
    expect(pos().x - x0).toBeGreaterThan(2.5);
  });

  it('blocks the iron gate G1 until its collider is switched off', () => {
    const gate = level.gates.find((g) => g.def.id === 'G1');
    if (!gate) throw new Error('no G1');
    const yaw = (gate.def.yawDeg * Math.PI) / 180;
    // 門の 5m 手前（A 側 = 南南西）から通り抜ける向きへ歩く
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const along = () => (pos().x - gate.def.x) * fx + (pos().z - gate.def.z) * fz;
    game.teleportPlayer(gate.def.x - fx * 5, gate.def.z - fz * 5, yaw);
    run(10);
    input.setMove(0, 1);
    for (let i = 0; i < 20; i++) {
      aim(yaw);
      run(15);
    }
    expect(along()).toBeLessThan(0);

    expect(game.setBoxEnabled('G1', false)).toBe(true);
    for (let i = 0; i < 20; i++) {
      aim(yaw);
      run(15);
    }
    expect(along()).toBeGreaterThan(2);
  });

  it('lets the player through an unsealed fog gate and blocks it again once sealed', () => {
    const gate = level.gates.find((g) => g.def.id === 'fog-gate');
    if (!gate) throw new Error('no fog gate');
    const yaw = (gate.def.yawDeg * Math.PI) / 180;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const along = () => (pos().x - gate.def.x) * fx + (pos().z - gate.def.z) * fz;
    game.teleportPlayer(gate.def.x - fx * 4, gate.def.z - fz * 4, yaw);
    run(10);
    input.setMove(0, 1);
    for (let i = 0; i < 12; i++) {
      aim(yaw);
      run(15);
    }
    expect(along()).toBeGreaterThan(3);

    // 戻る向きに歩く。霧で塞いだら通れない
    expect(fogGateOf(game)?.seal()).toBe(true);
    for (let i = 0; i < 12; i++) {
      aim(yaw + Math.PI);
      run(15);
    }
    expect(along()).toBeGreaterThan(0.2);
  });

  /** 目標へ向かって前進入力だけを一定時間押し続ける（途中で止められても構わない）。 */
  function pushToward(
    from: readonly [number, number],
    to: readonly [number, number],
    seconds = 14,
  ): void {
    game.teleportPlayer(from[0], from[1], 0);
    run(10);
    input.setMove(0, 1);
    for (let i = 0; i < seconds * 10; i++) {
      aim(Math.atan2(to[0] - pos().x, to[1] - pos().z));
      run(6);
    }
    input.setMove(0, 0);
    run(5);
  }

  it('cannot bypass the catacomb D by walking around it from the chapel (outer cliff)', () => {
    // 礼拝堂の東の崩れ口から中庭の真ん中へ、D を通らず直進しようとする。外周の崖・D の岩盤で止まる
    pushToward([61, 26], [94, 52]);
    expect(pos().x, `stopped at ${pos().x}, ${pos().z}`).toBeLessThan(79);
    // 北回り（D の北側）
    pushToward([56, 33], [90, 60]);
    expect(pos().x, `stopped at ${pos().x}, ${pos().z}`).toBeLessThan(79);
  }, 30_000);

  it('cannot get around the closed iron gate G1 along the lane walls', () => {
    const gate = level.gates.find((g) => g.def.id === 'G1');
    if (!gate) throw new Error('no G1');
    // G1 の南 5m（ショートカットの道上）から、門の北側 (80, 40) を直線で目指す
    pushToward([76, 27], [80, 40]);
    expect(pos().z, `stopped at ${pos().x}, ${pos().z}`).toBeLessThan(gate.def.z + 0.5);
    // 道の西側の外（D の岩盤の南）から
    pushToward([72, 27], [80, 40]);
    expect(pos().z, `stopped at ${pos().x}, ${pos().z}`).toBeLessThan(gate.def.z + 0.5);
  }, 30_000);

  it('cannot get around the closed fog gate from the courtyard', () => {
    expect(game.setBoxEnabled('fog-gate', true)).toBe(true);
    // 中庭の北東（霧の門の手前）から闘技場の中心を目指す。門の外側を回り込めない
    pushToward([101, 64], [122, 86]);
    expect(
      Math.hypot(pos().x - 122, pos().z - 86),
      `stopped at ${pos().x}, ${pos().z}`,
    ).toBeGreaterThan(17);
  }, 30_000);

  it('reports false for an unknown collider id', () => {
    expect(game.setBoxEnabled('no-such-box', true)).toBe(false);
  });
});
