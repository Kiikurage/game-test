import { beforeAll, describe, expect, it } from 'vitest';
import { Game } from '../../game';
import { FakeInput } from '../../testing/fakeInput';
import { bossSystemOf } from '../boss.system';
import { BOSS_MOVES, BossMoveRegistry } from '../bossMove';
import { LEAP_CLEARANCE, leapPushOut } from './leap.move';

describe('leapPushOut (pure)', () => {
  const boss = { x: 0, z: 0, yaw: 0 };

  it('does nothing at or beyond the clearance', () => {
    expect(leapPushOut(boss, { x: 0, z: LEAP_CLEARANCE })).toBeNull();
    expect(leapPushOut(boss, { x: 3, z: 3 })).toBeNull();
  });

  it('pushes radially away from the body so that the clearance is restored', () => {
    const p = { x: 0.3, z: 0.4 }; // 0.5m
    const push = leapPushOut(boss, p);
    expect(push).not.toBeNull();
    const after = Math.hypot(p.x + (push?.x ?? 0), p.z + (push?.z ?? 0));
    expect(after).toBeCloseTo(LEAP_CLEARANCE);
    // 方向は変わらない（ボス → プレイヤー）
    expect((push?.x ?? 0) / (push?.z ?? 1)).toBeCloseTo(0.75);
  });

  it('pushes along the boss facing when the player is right under it', () => {
    const push = leapPushOut({ x: 1, z: 2, yaw: Math.PI / 2 }, { x: 1, z: 2 });
    expect(push?.x).toBeCloseTo(LEAP_CLEARANCE);
    expect(push?.z).toBeCloseTo(0);
  });
});

describe('leap landing: the boss and the player do not overlap', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  it('a standing player under the landing is pushed out of the boss body', async () => {
    const DT = 1 / 60;
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [] });
    game.teleportPlayer(0, 12, Math.PI);
    const def = BOSS_MOVES.get('leap');
    if (!def) throw new Error('leap is not registered');
    const moves = new BossMoveRegistry();
    moves.register(def);
    const boss = bossSystemOf(game).spawn({ x: 0, z: 0, yaw: 0, moves, engage: true });
    const step = () => {
      game.update(DT);
      input.endStep();
    };
    for (let i = 0; i < 600 && !(boss.state === 'attack' && boss.debugInfo.stageFrame === 0); i++)
      step();
    expect(boss.state).toBe('attack');
    const gap = (): number =>
      Math.hypot(game.player.feet.x - boss.position.x, game.player.feet.z - boss.position.z);
    let minGap = Infinity;
    for (let f = 1; f <= 120; f++) {
      step();
      // 着地（段 F73）以降のボスは体を持つ。それ以前の滞空中は頭上を通るだけなので見ない
      if (f >= 74) minGap = Math.min(minGap, gap());
    }
    // 着地の瞬間は真上に重なる → 数フレームで体の外へ。その後は常に体の外
    expect(gap()).toBeGreaterThanOrEqual(LEAP_CLEARANCE - 0.2);
    expect(minGap).toBeLessThan(LEAP_CLEARANCE);
  });
});
