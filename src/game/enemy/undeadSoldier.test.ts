import { beforeAll, describe, expect, it } from 'vitest';
import { findEnemyClipEvents } from '../anim/enemyClips';
import {
  ENEMY_STATS,
  UNDEAD_ATTACK_RULES,
  UNDEAD_SOLDIER_ATTACKS,
  checkEnemyAttack,
  type UndeadAttackId,
} from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import type { EnemySpawn } from '../world/level';
import { AttackRunner } from './attackRunner';
import { seededRandom } from './enemyManager';
import { UNDEAD_PLANNER } from './undeadAttack';

const DT = 1 / 60;

describe('undead soldier selection rule (seeded)', () => {
  const pick = (distance: number, history: string[], recentRoll: boolean, seed: string) =>
    UNDEAD_PLANNER.choose({ distance, history, recentRoll, random: seededRandom(seed) });

  /** 乱数 1 列で N 回選ばせた分布。 */
  function tally(distance: number, recentRoll: boolean, n = 4000) {
    const random = seededRandom(`tally-${distance}-${String(recentRoll)}`);
    const counts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const id = String(UNDEAD_PLANNER.choose({ distance, history: [], recentRoll, random }));
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return (id: string) => (counts[id] ?? 0) / n;
  }

  it('follows the 60/40 close weights and the 70% A3 weight', () => {
    const close = tally(1.5, false);
    expect(close('a1')).toBeGreaterThan(0.56);
    expect(close('a1')).toBeLessThan(0.64);
    expect(close('a2')).toBeGreaterThan(0.36);
    expect(close('a2')).toBeLessThan(0.44);
    const mid = tally(3.5, false);
    expect(mid('a3')).toBeGreaterThan(0.66);
    expect(mid('a3')).toBeLessThan(0.74);
    expect(mid('null')).toBeGreaterThan(0.26); // 残りは選ばず接近
  });

  it('after a roll at close range picks A1 about 70% of the time', () => {
    const t = tally(1.5, true);
    expect(t('a1')).toBeGreaterThan(0.66);
    expect(t('a1')).toBeLessThan(0.74);
  });

  it('respects the distance boundaries 2.2 / 2.5 / 5.0 m exactly', () => {
    const picked = (d: number) =>
      Array.from({ length: 40 }, (_, i) => pick(d, [], false, `b${i}`)).filter((x) => x !== null);
    expect(picked(2.2)).toHaveLength(40); // 2.2 ちょうどは近距離（≤）
    expect(picked(2.2001)).toHaveLength(0);
    expect(picked(2.4999)).toHaveLength(0);
    expect(picked(2.5).length).toBeGreaterThan(0); // 2.5 は A3 の範囲に含む
    expect(picked(5.0).length).toBeGreaterThan(0);
    expect(picked(5.0001)).toHaveLength(0);
    expect(picked(2.2).every((x) => x === 'a1' || x === 'a2')).toBe(true);
    expect(picked(5.0).every((x) => x === 'a3')).toBe(true);
  });

  it('never picks the same attack three times in a row over a long seeded run', () => {
    const random = seededRandom('streak');
    const history: string[] = [];
    for (let i = 0; i < 3000; i++) {
      const distance = i % 2 === 0 ? 1.8 : 3.5;
      const id = UNDEAD_PLANNER.choose({ distance, history, recentRoll: false, random });
      if (id === null) continue;
      history.push(id);
      const n = history.length;
      if (n >= 3) {
        expect(history[n - 1] === history[n - 2] && history[n - 2] === history[n - 3]).toBe(false);
      }
    }
    expect(history.length).toBeGreaterThan(500);
  });

  it('chains A1 into A1 about 40% of the time and never twice', () => {
    const random = seededRandom('chain');
    let chained = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      if (UNDEAD_PLANNER.followUp?.({ lastId: 'a1', chain: 0, random }) === 'a1b') chained++;
      expect(UNDEAD_PLANNER.followUp?.({ lastId: 'a1b', chain: 1, random })).toBeNull();
    }
    expect(chained / n).toBeGreaterThan(0.36);
    expect(chained / n).toBeLessThan(0.44);
  });

  it('keeps every attack within the telegraph rules', () => {
    for (const def of Object.values(UNDEAD_SOLDIER_ATTACKS)) {
      expect(checkEnemyAttack(def)).toEqual([]);
    }
    expect(UNDEAD_ATTACK_RULES.a1ChainChance).toBe(0.4);
  });
});

const SPAWN: EnemySpawn = {
  id: 't-soldier',
  type: 'undead_soldier',
  area: 'A',
  x: 0,
  z: 0,
  yaw: 0,
  behavior: 'wait',
};

/** 亡者兵とプレイヤーの結合テスト（Rapier・平らな地面）。 */
describe('undead soldier in the game (Rapier)', () => {
  beforeAll(async () => {
    await Game.create();
  });

  /** `forced` の攻撃だけを出す亡者兵（選択ルールは上で検証済み。ここは命中・回避のシミュレーション）。 */
  async function setup(forced?: UndeadAttackId, playerZ = 2) {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [SPAWN] });
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('enemy not spawned');
    if (forced) {
      enemy.attackBehavior = new AttackRunner({
        combat: game.combat,
        tokens: game.attackTokens,
        random: seededRandom('forced'),
        planner: { choose: () => forced },
        attacks: UNDEAD_SOLDIER_ATTACKS,
        actionPrefix: 'enemy.undead.',
        entryOf: findEnemyClipEvents,
      });
    }
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    game.teleportPlayer(0, playerZ, Math.PI);
    enemy.provoke(0, playerZ);
    for (let i = 0; i < 1500 && enemy.state !== 'attack'; i++) run(1);
    expect(enemy.state).toBe('attack');
    return { game, input, enemy, run };
  }

  it('has the spec stats: HP 120, poise 50, 1.8m', async () => {
    const { enemy } = await setup('a1');
    expect(ENEMY_STATS.undead_soldier.hp).toBe(120);
    expect(ENEMY_STATS.undead_soldier.poise).toBe(50);
    expect(enemy.maxHp).toBe(120);
    expect(enemy.height).toBeCloseTo(1.8, 5);
  });

  it('A1 hits a player who does not dodge at F25 (24F telegraph, then the first active frame)', async () => {
    const { game, enemy, run } = await setup('a1');
    const hp0 = game.playerTarget.health.current;
    let hitAt = -1;
    for (let i = 0; i < 40 && hitAt < 0; i++) {
      const before = game.hitCount;
      run(1);
      if (game.hitCount > before) hitAt = enemy.fsm.stateFrame;
    }
    expect(hitAt).toBe(UNDEAD_SOLDIER_ATTACKS.a1.startup + 1);
    expect(game.playerTarget.health.current).toBe(hp0 - 45);
  });

  for (const id of ['a1', 'a2', 'a3'] as const) {
    it(`a roll pressed 3F before the active frames dodges ${id} (the latest fair timing)`, async () => {
      // A3 は離れた位置（4m）から突進する
      const { game, input, enemy, run } = await setup(id, id === 'a3' ? 4 : 2);
      const def = UNDEAD_SOLDIER_ATTACKS[id];
      const hp0 = game.playerTarget.health.current;
      while (enemy.fsm.stateFrame < def.startup - 3) run(1);
      input.setMove(1, 0);
      input.press('dodge');
      let covered = false;
      for (let i = 0; i < def.active + 24; i++) {
        run(1);
        const f = enemy.fsm.stateFrame;
        if (f > def.startup && f <= def.startup + def.active && game.player.invulnerable) {
          covered = true;
        }
      }
      expect(covered).toBe(true);
      expect(game.hitLog.filter((e) => e.targetId === 'player')).toHaveLength(0);
      expect(game.playerTarget.health.current).toBe(hp0);
    });

    it(`a roll pressed at the reaction budget (telegraph start + 10F) dodges ${id}`, async () => {
      const { game, input, enemy, run } = await setup(id, id === 'a3' ? 4 : 2);
      const def = UNDEAD_SOLDIER_ATTACKS[id];
      while (enemy.fsm.stateFrame < 10) run(1);
      input.setMove(1, 0);
      input.press('dodge');
      run(def.startup + def.active + 4);
      expect(game.hitLog.filter((e) => e.targetId === 'player')).toHaveLength(0);
    });
  }

  it('three light attacks kill a soldier (HP 120), which enters Dead at HP 0', async () => {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [SPAWN] });
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('enemy not spawned');
    game.teleportPlayer(0, -1.1, 0); // 背後から
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    run(5);
    for (let i = 0; i < 400 && enemy.alive; i++) {
      if (i % 6 === 0) input.press('lightAttack');
      run(1);
    }
    expect(game.hitLog.filter((e) => e.attackerId === 'player')).toHaveLength(3);
    expect(enemy.alive).toBe(false);
    expect(enemy.state).toBe('dead');
    expect(enemy.hp).toBe(0);
  });
});
