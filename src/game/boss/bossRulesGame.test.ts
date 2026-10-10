import { beforeAll, describe, expect, it } from 'vitest';
import { sectorShape } from '../combat';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { bossSystemOf, BOSS_ID } from './boss.system';
import { BOSS_MOVE_IDS } from './bossData';
import { BossMoveRegistry } from './bossMove';

const DT = 1 / 60;

/** ボス戦のルール（#78）の Game 結合テスト: 崩し 1 回 / フェーズ・1.5 倍・移行中の無敵・イベント・リセット。 */
describe('boss battle rules in the game (Rapier)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  /** 全 ID が同じ 1 技（ダメージ 0。プレイヤーが死なない）。 */
  const quietMoves = (): BossMoveRegistry => {
    const reg = new BossMoveRegistry();
    for (const id of BOSS_MOVE_IDS) {
      reg.register({
        id,
        name: id,
        phases: [1, 2],
        stages: [
          {
            id: `${id}.1`,
            startup: 40,
            active: 8,
            recovery: 40,
            damage: 0,
            poiseDamage: 0,
            guardStaminaCost: 0,
            moveDistance: 0,
            arcDeg: 120,
            range: 5,
            trackEndFrame: 20,
          },
        ],
      });
    }
    return reg;
  };

  async function setup() {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [] });
    game.teleportPlayer(0, 2.5, Math.PI);
    const log: { name: string; payload: unknown }[] = [];
    for (const name of [
      'bossEngaged',
      'bossHpChanged',
      'bossPhaseBoundary',
      'bossDefeated',
      'bossReset',
    ] as const) {
      game.events.on(name, (payload) => log.push({ name, payload }));
    }
    const system = bossSystemOf(game);
    const boss = system.spawn({ x: 0, z: 0, yaw: 0, moves: quietMoves(), engage: true });
    const heart = game.combat.allTargets.get(BOSS_ID);
    if (!heart) throw new Error('no boss target');
    const reactor = game.reactors.get(BOSS_ID);
    if (!reactor) throw new Error('no boss reactor');
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    const hit = (damage: number, poiseDamage: number) => {
      const attack = game.combat.startAttack('player', 'player', {
        id: 'test',
        damage,
        poiseDamage,
      });
      game.combat.resolve(attack, sectorShape({ x: 0, y: 0, z: 3.2 }, Math.PI, 90, 3));
      game.combat.endAttack(attack);
      run(1);
    };
    const events = (name: string) => log.filter((e) => e.name === name).map((e) => e.payload);
    return { game, system, boss, heart, reactor, run, hit, events, log };
  }

  it('breaks once per phase: 120F stagger, x1.5 damage, then poise damage is disabled', async () => {
    const { boss, heart, reactor, run, hit } = await setup();
    run(5);
    // 崩し（強靭度 400 を超える削り）
    hit(20, 500);
    expect(boss.state).toBe('staggered');
    expect(reactor.poise.staggerRemaining).toBeGreaterThan(100);
    expect(reactor.poise.staggerRemaining).toBeLessThanOrEqual(120);
    expect(heart.staggered).toBe(true);
    // 崩し中は被ダメージ 1.5 倍
    const hp0 = heart.health.current;
    hit(20, 0);
    expect(hp0 - heart.health.current).toBe(30);
    // 崩しが明けるまで待つ
    for (let i = 0; i < 600 && (reactor.staggered || boss.state === 'staggered'); i++) run(1);
    expect(boss.state).not.toBe('staggered');
    expect(heart.staggered).toBe(false);
    // 同じフェーズでは強靭度ダメージが無効（崩れない・強靭度も減らない）
    expect(boss.canBreak).toBe(false);
    hit(20, 500);
    hit(20, 500);
    expect(boss.state).not.toBe('staggered');
    expect(reactor.poise.current).toBe(reactor.poise.max);
    const hp1 = heart.health.current;
    hit(20, 0);
    expect(hp1 - heart.health.current).toBe(20); // 崩し中ではないので等倍
  });

  it('is invulnerable during the phase transition, then can be broken once more in phase 2', async () => {
    const { boss, heart, run, hit, events } = await setup();
    run(5);
    hit(20, 500);
    for (let i = 0; i < 600 && boss.state === 'staggered'; i++) run(1);
    hit(1200, 0);
    expect(heart.health.current).toBeLessThanOrEqual(1200);
    for (let i = 0; i < 600 && boss.state !== 'transition'; i++) run(1);
    expect(boss.state).toBe('transition');
    expect(events('bossPhaseBoundary')).toHaveLength(1);
    // 移行中は無敵
    const hp = heart.health.current;
    hit(100, 0);
    run(10);
    hit(100, 0);
    expect(heart.health.current).toBe(hp);
    for (let i = 0; i < 400 && boss.phase === 1; i++) run(1);
    expect(boss.phase).toBe(2);
    // フェーズ 2 では崩しがもう一度使える
    expect(boss.canBreak).toBe(true);
    run(5);
    hit(20, 500);
    expect(boss.state).toBe('staggered');
  });

  it('emits engage / HP (with the damage) / defeat events from the game bus', async () => {
    const { boss, run, hit, events, log } = await setup();
    run(2);
    expect(events('bossEngaged')).toEqual([
      { id: BOSS_ID, hp: 2400, maxHp: 2400, phase: 1, boundaries: [1200] },
    ]);
    hit(40, 0);
    expect(events('bossHpChanged')).toEqual([
      { id: BOSS_ID, hp: 2360, maxHp: 2400, damage: 40, phase: 1 },
    ]);
    hit(5000, 0);
    expect(boss.state).toBe('dead');
    expect(events('bossDefeated')).toHaveLength(1);
    expect(log.at(-1)?.name).toBe('bossDefeated');
    expect(events('bossPhaseBoundary')).toHaveLength(0);
  });

  it('resets on the player death and on rest: full HP, phase 1, home, and no duplicate events', async () => {
    const { game, boss, heart, reactor, run, hit, events } = await setup();
    run(5);
    hit(20, 500);
    hit(1200, 0);
    run(20);
    boss.moveBy(1, 1);
    game.events.emit('death', {
      phase: 'start',
      frame: 0,
      skipped: false,
      position: { x: 0, y: 0, z: 2.5 },
    });
    expect(boss.state).toBe('dormant');
    expect(boss.phase).toBe(1);
    expect(boss.hp).toBe(2400);
    expect(heart.health.current).toBe(2400);
    expect(heart.invulnerable).toBe(false);
    expect(reactor.poise.damageDisabled).toBe(false);
    expect(boss.position.x).toBe(0);
    expect(boss.position.z).toBe(0);
    expect(events('bossReset')).toEqual([{ id: BOSS_ID, cause: 'death', hp: 2400, maxHp: 2400 }]);
    // リスポーンの rest イベントが続いても二重に出ない
    game.events.emit('rest', {
      cause: 'respawn',
      bonfireId: 'b',
      position: { x: 0, y: 0, z: 0 },
      defeatedBosses: [],
    });
    expect(events('bossReset')).toHaveLength(1);
    // 再び交戦できる。篝火の休憩でももう一度戻る
    boss.engage();
    expect(boss.state).toBe('beat');
    hit(40, 0);
    game.events.emit('rest', {
      cause: 'rest',
      bonfireId: 'b',
      position: { x: 0, y: 0, z: 0 },
      defeatedBosses: [],
    });
    expect(events('bossReset')).toHaveLength(2);
    expect(events('bossReset')[1]).toMatchObject({ cause: 'rest' });
    expect(heart.health.current).toBe(2400);
  });

  it('does not reset a defeated boss on rest', async () => {
    const { game, boss, run, hit, events } = await setup();
    run(5);
    hit(5000, 0);
    expect(boss.state).toBe('dead');
    game.events.emit('rest', {
      cause: 'rest',
      bonfireId: 'b',
      position: { x: 0, y: 0, z: 0 },
      defeatedBosses: [BOSS_ID],
    });
    expect(boss.state).toBe('dead');
    expect(events('bossReset')).toHaveLength(0);
  });

  it('removing an engaged boss tells the HP bar to go away (cause removed)', async () => {
    const { system, run, events } = await setup();
    run(2);
    system.remove();
    expect(events('bossReset')).toEqual([{ id: BOSS_ID, cause: 'removed', hp: 2400, maxHp: 2400 }]);
    expect(events('bossDefeated')).toHaveLength(0);
  });
});
