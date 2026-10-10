import { beforeAll, describe, expect, it } from 'vitest';
import { sectorShape } from '../combat';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { bossSystemOf, BOSS_ID } from './boss.system';
import { BOSS_MOVE_IDS, BOSS_STATS } from './bossData';
import { BossMoveRegistry, type BossMoveDef } from './bossMove';

const DT = 1 / 60;

/** ボスのシステムを Game（Rapier・平らな地面）に載せた結合テスト。 */
describe('boss system in the game (Rapier)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  /** 全 ID が同じ 1 技（大振り・ダメージあり）のレジストリ。 */
  const moves = (): BossMoveRegistry => {
    const reg = new BossMoveRegistry();
    for (const id of BOSS_MOVE_IDS) {
      const def: BossMoveDef = {
        id,
        name: id,
        phases: [1, 2],
        stages: [
          {
            id: `${id}.1`,
            startup: 40,
            active: 8,
            recovery: 40,
            damage: 100,
            poiseDamage: 60,
            guardStaminaCost: 50,
            moveDistance: 0,
            arcDeg: 120,
            range: 5,
            trackEndFrame: 20,
          },
        ],
      };
      reg.register(def);
    }
    return reg;
  };

  async function setup() {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [] });
    // プレイヤーはボスの正面 2.5m（ボスは南 +z を向く）
    game.teleportPlayer(0, 2.5, Math.PI);
    const system = bossSystemOf(game);
    const boss = system.spawn({ x: 0, z: 0, yaw: 0, moves: moves(), engage: true });
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    return { game, system, boss, run };
  }

  it('registers the boss as a lock-on target, a hit target and a boss id', async () => {
    const { game, boss } = await setup();
    expect(game.bossIds.has(BOSS_ID)).toBe(true);
    expect(game.lockOnTargets).toContain(boss);
    expect(game.combat.allTargets.has(BOSS_ID)).toBe(true);
    expect(game.reactors.get(BOSS_ID)?.poise.max).toBe(BOSS_STATS.poise);
    expect(boss.maxHp).toBe(2400);
  });

  it('beats, then telegraphs and hits the player for the move damage', async () => {
    const { game, boss, run } = await setup();
    const hp0 = game.playerTarget.health.current;
    for (let i = 0; i < 400 && boss.currentMove === null; i++) run(1);
    expect(boss.currentMove).not.toBeNull();
    expect(game.playerTarget.health.current).toBe(hp0); // 予備動作の間は当たらない
    for (let i = 0; i < 100 && game.hitCount === 0; i++) run(1);
    expect(game.hitCount).toBeGreaterThan(0);
    expect(game.playerTarget.health.current).toBeLessThan(hp0);
  });

  it('a normal player hit does not cancel the move; breaking the poise does', async () => {
    const { game, system, boss, run } = await setup();
    const heart = game.combat.allTargets.get(BOSS_ID);
    if (!heart) throw new Error('no boss target');
    for (let i = 0; i < 400 && boss.currentMove === null; i++) run(1);
    run(5);
    const hit = (poiseDamage: number) => {
      const attack = game.combat.startAttack('player', 'player', {
        id: 'test',
        damage: 20,
        poiseDamage,
      });
      game.combat.resolve(attack, sectorShape({ x: 0, y: 0, z: 3.2 }, Math.PI, 90, 3));
      game.combat.endAttack(attack);
    };
    const move = boss.currentMove;
    const hp0 = boss.hp;
    hit(25);
    run(1);
    expect(boss.hp).toBeLessThan(hp0);
    expect(boss.currentMove).toBe(move);
    expect(boss.state).not.toBe('staggered');
    // 強靭度 400 + 攻撃中の加算 30 を一度に超える削りで崩れる
    hit(500);
    run(1);
    expect(boss.state).toBe('staggered');
    expect(boss.currentMove).toBeNull();
    expect(system.boss).toBe(boss);
  });

  it('removing the boss unregisters everything', async () => {
    const { game, system, boss } = await setup();
    system.remove();
    expect(game.bossIds.has(BOSS_ID)).toBe(false);
    expect(game.lockOnTargets).not.toContain(boss);
    expect(game.combat.allTargets.has(BOSS_ID)).toBe(false);
    expect(game.reactors.has(BOSS_ID)).toBe(false);
    expect(system.boss).toBeNull();
  });
});
