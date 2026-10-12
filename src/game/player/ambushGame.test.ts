import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS, PLAYER_STATS, attackDamage } from '../data';
import type { Enemy } from '../enemy/enemy';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import type { EnemySpawn } from '../world/level';
import type { AmbushCandidate, AmbushSource } from './ambush';
import { debugStatsSystem } from '../debug/stats.system';

const DT = 1 / 60;

const spawn = (type: EnemySpawn['type'], id: string, x = 0, z = 0): EnemySpawn => ({
  id,
  type,
  area: 'A',
  x,
  z,
  yaw: 0, // +z を向く（背面は −z）
  behavior: 'wait',
});

/** 致命の一撃（#115）の結合テスト。平らな地面・物理込みで 1 ステップずつ検証する。 */
describe('ambush strike (Rapier)', () => {
  let game: Game;
  let input: FakeInput;

  beforeAll(async () => {
    await Game.create();
  });

  async function setup(enemies: EnemySpawn[]): Promise<Enemy[]> {
    input = new FakeInput();
    game = await Game.create({ input, dummies: [], enemies });
    game.tuning.camera.autoFollow = false;
    return game.enemies.enemies.slice();
  }

  function tick(): void {
    game.update(DT);
    input.endStep();
  }

  function run(frames: number): void {
    for (let i = 0; i < frames; i++) tick();
  }

  /** 軽攻撃を押して 1 ステップ進める（F1 のステップ）。 */
  function press(): void {
    input.press('lightAttack');
    tick();
  }

  /** 対象の背後 `behind` m・ずれ `side` m に立ち、対象の方（+z）を向く。 */
  function standBehind(behind: number, side = 0): void {
    game.teleportPlayer(side, -behind, 0);
    run(2);
  }

  it('亡者兵（HP 120）は 160 で即死し、スタミナ 16 を消費、ヒットストップ 14F', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    standBehind(1.2);
    const stamina = game.player.stamina.current;
    press();
    expect(game.player.state).toBe('backstab');
    expect(soldier.restrained).toBe(true);
    expect(stamina - game.player.stamina.current).toBeGreaterThanOrEqual(16 - 1e-6);
    // F11 の当たり窓で命中する
    let hitFrame = 0;
    for (let f = 2; f <= 20 && hitFrame === 0; f++) {
      tick();
      if (game.systems.get(debugStatsSystem).hitLog.some((h) => h.attackId === 'backstab'))
        hitFrame = f;
    }
    expect(hitFrame).toBeGreaterThanOrEqual(PLAYER_ACTIONS.backstab.startup + 1);
    expect(hitFrame).toBeLessThanOrEqual(PLAYER_ACTIONS.backstab.startup + 3);
    const hit = game.systems.get(debugStatsSystem).hitLog.find((h) => h.attackId === 'backstab');
    expect(hit?.damage).toBe(attackDamage(PLAYER_STATS.attackPower, 4.0));
    expect(hit?.damage).toBe(160);
    expect(hit?.poiseDamage).toBe(100);
    expect(hit?.killed).toBe(true);
    expect(game.systems.get(debugStatsSystem).lastHitStopFrames).toBe(14);
    expect(soldier.state).toBe('dead');
    expect(soldier.restrained).toBe(false);
  });

  it('盾持ち（HP 200）は HP 40 が残り、強靭度崩しで崩れる', async () => {
    const [shield] = await setup([spawn('undead_shield', 'a')]);
    if (!shield) throw new Error('no enemy');
    standBehind(1.2);
    press();
    run(PLAYER_ACTIONS.backstab.startup + 3);
    const hit = game.systems.get(debugStatsSystem).hitLog.find((h) => h.attackId === 'backstab');
    expect(hit?.damage).toBe(160);
    expect(hit?.killed).toBe(false);
    expect(shield.hp).toBe(40);
    expect(shield.state).toBe('staggered');
    expect(shield.restrained).toBe(false);
    // 崩し中は通常の 1.5 倍で軽攻撃 1 発（60）で倒せる
    run(60);
    expect(game.player.state).not.toBe('backstab');
  });

  it('発動中の対象は拘束され、Alert にならず振り向かない', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    standBehind(1.2);
    const yaw = soldier.yaw;
    press();
    // 命中の手前まで（F1〜F10）
    for (let i = 0; i < 9; i++) {
      tick();
      expect(soldier.restrained).toBe(true);
      expect(soldier.state).toBe('idle');
      expect(soldier.yaw).toBe(yaw);
      expect(soldier.gauge).toBe(0);
    }
    // 他からの Alert 要請も無視される
    soldier.provoke(5, 5);
    expect(soldier.state).toBe('idle');
  });

  it('背後 0.9m へ吸着し、対象の方を向く（最大 1.2m の補正）', async () => {
    await setup([spawn('undead_soldier', 'a')]);
    standBehind(1.4, 0.6);
    const start = { x: game.player.feet.x, z: game.player.feet.z };
    press();
    run(6);
    const moved = Math.hypot(game.player.feet.x - start.x, game.player.feet.z - start.z);
    expect(moved).toBeGreaterThan(0.5);
    expect(moved).toBeLessThanOrEqual(1.2 + 0.05);
    // 対象（原点）を向いている
    const toTarget = Math.atan2(0 - game.player.feet.x, 0 - game.player.feet.z);
    const diff = Math.atan2(
      Math.sin(game.player.yaw - toTarget),
      Math.cos(game.player.yaw - toTarget),
    );
    expect(Math.abs(diff)).toBeLessThan(0.1);
    // 背後 0.9m に立つ場合（開始が 1.2m 以内）は目標に届く
    await setup([spawn('undead_soldier', 'a')]);
    standBehind(1.6);
    press();
    run(6);
    expect(game.player.feet.z).toBeCloseTo(-0.9, 1);
    expect(game.player.feet.x).toBeCloseTo(0, 1);
  });

  it('正面からは通常の軽攻撃 1', async () => {
    await setup([spawn('undead_soldier', 'a')]);
    game.teleportPlayer(0, 1.2, Math.PI);
    run(2);
    press();
    expect(game.player.state).toBe('light1');
  });

  it('Alert 以降の敵には不発（軽攻撃 1）', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    standBehind(1.2);
    soldier.provoke(0, -1.2);
    expect(soldier.state).toBe('alert');
    run(1);
    expect(game.player.ambushReady).toBe(false);
    press();
    expect(game.player.state).toBe('light1');
  });

  it('強靭度崩し中の敵には不発（軽攻撃 1）', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    standBehind(1.2);
    soldier.stagger(120);
    run(1);
    press();
    expect(game.player.state).toBe('light1');
  });

  it('Suspicious の敵にも発動する', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    standBehind(1.2);
    soldier.gauge = 60;
    soldier.fsm.transition('suspicious');
    expect(soldier.state).toBe('suspicious');
    press();
    expect(game.player.state).toBe('backstab');
  });

  it('距離 1.6m の外では不発（軽攻撃 1）', async () => {
    await setup([spawn('undead_soldier', 'a')]);
    standBehind(1.7);
    press();
    expect(game.player.state).toBe('light1');
  });

  it('ambushReady: 条件成立中だけ true（剣の縁の光）', async () => {
    await setup([spawn('undead_soldier', 'a')]);
    standBehind(1.2);
    expect(game.player.ambushReady).toBe(true);
    standBehind(2.5);
    expect(game.player.ambushReady).toBe(false);
  });

  it('F1 に条件を評価する: 先行入力が実行に移る瞬間に成立していれば発動する', async () => {
    await setup([]);
    const candidate: AmbushCandidate = { id: 'x', position: { x: 0, y: 0, z: 5 }, yaw: 0 };
    let ready = false;
    const log: string[] = [];
    const stub: AmbushSource = {
      find: () => (ready ? candidate : null),
      begin: () => log.push('begin'),
      end: () => log.push('end'),
    };
    game.player.ambushSource = stub;
    game.teleportPlayer(0, 4, 0);
    run(2);
    // ロール（F26 から攻撃へキャンセル）の F20 に攻撃を押す。条件はキャンセル窓が開く直前に成立する
    input.setMove(1, 0);
    input.press('dodge');
    tick();
    input.setMove(0, 0);
    input.release('dodge');
    expect(game.player.state).toBe('roll');
    for (let i = 0; i < 18; i++) tick();
    press(); // 先行入力として積まれる（まだ受け付けない）
    expect(game.player.state).toBe('roll');
    for (let i = 0; i < 20 && game.player.state === 'roll'; i++) {
      if (game.player.stateFrame >= 24) ready = true; // 入力時には不成立だった
      tick();
    }
    expect(game.player.state).toBe('backstab');
    expect(log).toEqual(['begin']);
  });

  it('被弾などで中断されたら拘束が解ける', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    standBehind(1.2);
    press();
    expect(soldier.restrained).toBe(true);
    game.player.receiveHit(
      {
        attackerId: 'x',
        targetId: 'player',
        attackId: 'x',
        attackInstanceId: 1,
        damage: 1,
        baseDamage: 1,
        multiplier: 1,
        poiseDamage: 200,
        attackPoiseDamage: 200,
        attackerPosition: { x: 0, y: 0, z: 3 },
        guard: 'none',
        guardStaminaCost: 0,
        position: { x: 0, y: 1, z: -1 },
        hurtboxIndex: 0,
        targetHp: 100,
        killed: false,
        kind: 'light',
      },
      0,
      -1,
    );
    run(2);
    expect(game.player.state).not.toBe('backstab');
    expect(soldier.restrained).toBe(false);
  });

  it('複数の敵: 命中音（戦闘音 8m）で近くの別の敵が気付き始める', async () => {
    const [a, b] = await setup([
      spawn('undead_soldier', 'a'),
      spawn('undead_soldier', 'b', 4, 0), // 4m 横。向きは同じで、プレイヤーは背面
    ]);
    if (!a || !b) throw new Error('no enemy');
    standBehind(1.2);
    press();
    run(PLAYER_ACTIONS.backstab.startup + 3 + 10);
    expect(a.state).toBe('dead');
    expect(b.gauge).toBeGreaterThan(0);
  });
});
