import { describe, expect, it } from 'vitest';
import { EventBus, type GameEventMap } from '../../core/gameEvents';
import { HitResolver, Poise, UprightTarget, uprightHeartbox } from '../combat';
import { seededRandom } from '../enemy/enemyManager';
import { Boss, type BossStateId } from './boss';
import { BOSS_BATTLE, BOSS_MOVE_IDS, BOSS_WALL, type BossMoveId } from './bossData';
import { BossMoveRegistry, type BossMoveDef, type BossStageDef } from './bossMove';

const DT = 1 / 60;

const stage = (id: string, over: Partial<BossStageDef> = {}): BossStageDef => ({
  id,
  startup: 20,
  active: 4,
  recovery: 10,
  damage: 40,
  poiseDamage: 30,
  guardStaminaCost: 30,
  moveDistance: 0,
  arcDeg: 120,
  range: 5,
  trackEndFrame: 8,
  ...over,
});

/** 全 ID（または `only`）に同じ段構成の技を割り当てる。 */
function registry(
  stages: (id: BossMoveId) => BossStageDef[],
  only?: readonly BossMoveId[],
): BossMoveRegistry {
  const reg = new BossMoveRegistry();
  for (const id of only ?? BOSS_MOVE_IDS) {
    const def: BossMoveDef = { id, name: id, phases: [1, 2], stages: stages(id) };
    reg.register(def);
  }
  return reg;
}

const threeStages = (id: BossMoveId): BossStageDef[] => [
  stage(`${id}.1`),
  stage(`${id}.2`, { followUp: true, startup: 18 }),
  stage(`${id}.3`, { followUp: true, startup: 18 }),
];

interface Opts {
  moves?: BossMoveRegistry;
  seed?: string;
  playerX?: number;
  playerZ?: number;
  arena?: { x: number; z: number; radius: number };
  pillars?: { x: number; z: number; radius: number }[];
  bossX?: number;
  bossZ?: number;
  bossYaw?: number;
  poise?: Poise;
}

function setup(opts: Opts = {}) {
  const combat = new HitResolver();
  const events = new EventBus<GameEventMap>();
  const log: { name: string; payload: unknown }[] = [];
  for (const name of [
    'bossEngaged',
    'bossHpChanged',
    'bossPhaseBoundary',
    'bossDefeated',
    'bossReset',
    'bossPillarHit',
  ] as const) {
    events.on(name, (payload) => log.push({ name, payload }));
  }
  const player = new UprightTarget('player', 'player', 100000, [uprightHeartbox(0.35, 1.8)]);
  const input = { x: opts.playerX ?? 0, z: opts.playerZ ?? 2, healing: false, rolling: false };
  combat.addTarget(player);
  const boss = new Boss(
    { id: 'boss', x: opts.bossX ?? 0, y: 0, z: opts.bossZ ?? 0, yaw: opts.bossYaw ?? 0 },
    {
      combat,
      events,
      moves: opts.moves ?? registry((id) => [stage(`${id}.1`)]),
      random: seededRandom(opts.seed ?? 'rules'),
      ...(opts.poise && { poise: opts.poise }),
      ...(opts.arena && { arena: opts.arena }),
      ...(opts.pillars && { pillars: opts.pillars }),
    },
  );
  const step = () => {
    player.place(input.x, 0, input.z, Math.PI);
    boss.update(DT, input);
    combat.step();
  };
  const names = (name: string) => log.filter((e) => e.name === name).map((e) => e.payload);
  return { boss, combat, player, input, step, log, names };
}

function runUntil(step: () => void, done: () => boolean, max = 5000): number {
  for (let i = 0; i < max; i++) {
    if (done()) return i;
    step();
  }
  throw new Error('condition not reached');
}

describe('boss phase transition (6.5)', () => {
  it('lets the move finish after the threshold is crossed, skips follow-ups, then transitions', () => {
    const h = setup({ moves: registry(threeStages) });
    h.boss.engage();
    runUntil(h.step, () => h.boss.state === 'attack');
    // 1 段目の途中で閾値を超える
    for (let i = 0; i < 10; i++) h.step();
    expect(h.boss.debugInfo.stage).toBe(1);
    h.boss.hp = BOSS_BATTLE.phase2Hp - 1;
    h.step();
    expect(h.boss.debugInfo.transitionPending).toBe(true);
    expect(h.boss.state).toBe('attack'); // 技は最後まで出す
    runUntil(h.step, () => h.boss.state !== 'attack');
    // 2 段目以降は出さない
    expect(h.boss.state).toBe('transition');
    expect(h.boss.phase).toBe(1);
    expect(h.boss.currentMove).toBeNull();
    expect(h.names('bossPhaseBoundary')).toEqual([
      {
        id: 'boss',
        from: 1,
        to: 2,
        hp: BOSS_BATTLE.phase2Hp - 1,
        transitionFrames: BOSS_BATTLE.transitionFrames,
      },
    ]);
  });

  it('does not trigger before the move is over when the threshold is crossed in the last stage', () => {
    const h = setup({ moves: registry((id) => [stage(`${id}.1`, { recovery: 40 })]) });
    h.boss.engage();
    runUntil(h.step, () => h.boss.state === 'attack');
    for (let i = 0; i < 30; i++) h.step(); // 発生・持続を過ぎ、硬直へ
    h.boss.hp = 1000;
    for (let i = 0; i < 5; i++) h.step();
    expect(h.boss.state).toBe('attack');
    expect(h.names('bossPhaseBoundary')).toHaveLength(0);
    runUntil(h.step, () => h.boss.state !== 'attack');
    expect(h.boss.state).toBe('transition');
  });

  it('transitions at once from the beat, is invulnerable for 120F, then resumes in phase 2', () => {
    const h = setup();
    h.boss.engage();
    expect(h.boss.state).toBe('beat');
    h.boss.hp = 1200; // ちょうど閾値も対象（以下）
    h.step();
    expect(h.boss.state).toBe('transition');
    expect(h.boss.invulnerable).toBe(true);
    for (let i = 0; i < BOSS_BATTLE.transitionFrames - 2; i++) h.step();
    expect(h.boss.state).toBe('transition');
    expect(h.boss.phase).toBe(1);
    h.step();
    h.step();
    expect(h.boss.phase).toBe(2);
    expect(h.boss.invulnerable).toBe(false);
    expect(h.boss.state).toBe('beat');
    // 一度だけ
    for (let i = 0; i < 3000; i++) h.step();
    expect(h.names('bossPhaseBoundary')).toHaveLength(1);
  });

  it('restarts with a far-band move (leap / ash wave) even at close range', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const h = setup({ seed, playerZ: 2 });
      h.boss.engage();
      h.boss.hp = 1000;
      runUntil(h.step, () => h.boss.phase === 2);
      runUntil(h.step, () => h.boss.currentMove !== null);
      expect(['leap', 'ashWave']).toContain(h.boss.currentMove);
    }
  });

  it('waits for the stagger to end, then transitions', () => {
    const h = setup();
    h.boss.engage();
    h.boss.stagger(60);
    h.boss.hp = 1000;
    for (let i = 0; i < 30; i++) h.step();
    expect(h.boss.state).toBe('staggered');
    runUntil(h.step, () => h.boss.state !== 'staggered');
    expect(h.boss.state).toBe('transition');
  });

  it('does not transition when the boss is defeated outright', () => {
    const h = setup();
    h.boss.engage();
    h.boss.kill();
    for (let i = 0; i < 10; i++) h.step();
    expect(h.boss.state).toBe('dead');
    expect(h.names('bossPhaseBoundary')).toHaveLength(0);
    expect(h.names('bossDefeated')).toHaveLength(1);
  });

  it('never triggers in phase 2', () => {
    const h = setup();
    h.boss.setPhase(2);
    h.boss.engage();
    h.boss.hp = 100;
    for (let i = 0; i < 2000; i++) h.step();
    expect(h.names('bossPhaseBoundary')).toHaveLength(0);
  });
});

describe('boss break once per phase (6.2)', () => {
  it('accepts one stagger per phase and disables poise damage after it', () => {
    const poise = new Poise(400);
    const h = setup({ poise });
    h.boss.engage();
    expect(h.boss.canBreak).toBe(true);
    h.boss.stagger(120);
    expect(h.boss.state).toBe('staggered');
    expect(h.boss.canBreak).toBe(false);
    expect(poise.damageDisabled).toBe(true);
    expect(poise.hit(1000, 120)).toEqual({ broke: false, ignored: true });
    expect(poise.current).toBe(400);
    // 120F の硬直
    for (let i = 0; i < 119; i++) h.step();
    expect(h.boss.state).toBe('staggered');
    h.step();
    expect(h.boss.state).toBe('beat');
    // 2 回目は無視
    h.boss.stagger(120);
    expect(h.boss.state).toBe('beat');
  });

  it('allows a new break in the next phase (poise restored)', () => {
    const poise = new Poise(400);
    const h = setup({ poise });
    h.boss.engage();
    h.boss.stagger(30);
    h.boss.hp = 1000;
    runUntil(h.step, () => h.boss.phase === 2);
    expect(poise.damageDisabled).toBe(false);
    expect(poise.current).toBe(400);
    expect(h.boss.canBreak).toBe(true);
    h.boss.stagger(120);
    expect(h.boss.state).toBe('staggered');
  });

  it('cannot be staggered during the transition', () => {
    const h = setup();
    h.boss.engage();
    h.boss.hp = 1000;
    h.step();
    expect(h.boss.state).toBe('transition');
    h.boss.stagger(120);
    expect(h.boss.state).toBe('transition');
  });
});

describe('boss events and reset', () => {
  it('emits engage once with the phase boundary, HP changes with the damage, and defeat', () => {
    const h = setup();
    h.boss.engage();
    h.boss.engage();
    expect(h.names('bossEngaged')).toEqual([
      { id: 'boss', hp: 2400, maxHp: 2400, phase: 1, boundaries: [1200] },
    ]);
    h.boss.setHp(2300);
    h.boss.setHp(2300); // 変化なしは発行しない
    h.boss.setHp(2000);
    expect(h.names('bossHpChanged')).toEqual([
      { id: 'boss', hp: 2300, maxHp: 2400, damage: 100, phase: 1 },
      { id: 'boss', hp: 2000, maxHp: 2400, damage: 300, phase: 1 },
    ]);
    h.boss.kill();
    expect(h.names('bossHpChanged').at(-1)).toEqual({
      id: 'boss',
      hp: 0,
      maxHp: 2400,
      damage: 2000,
      phase: 1,
    });
    expect(h.log.at(-1)?.name).toBe('bossDefeated');
  });

  it('reset returns to full HP, phase 1, the home position, and waits for engage', () => {
    const poise = new Poise(400);
    const h = setup({ poise, bossX: 3, bossZ: -2, bossYaw: 1 });
    h.boss.engage();
    for (let i = 0; i < 600; i++) h.step();
    h.boss.stagger(120);
    h.boss.hp = 1000;
    runUntil(h.step, () => h.boss.phase === 2);
    h.boss.moveBy(2, 2);
    h.boss.reset('death');
    expect(h.boss.state).toBe('dormant');
    expect(h.boss.phase).toBe(1);
    expect(h.boss.hp).toBe(2400);
    expect(h.boss.position.x).toBe(3);
    expect(h.boss.position.z).toBe(-2);
    expect(h.boss.yaw).toBe(1);
    expect(h.boss.canBreak).toBe(true);
    expect(poise.damageDisabled).toBe(false);
    expect(h.boss.debugInfo.history).toEqual([]);
    expect(h.names('bossReset')).toEqual([{ id: 'boss', cause: 'death', hp: 2400, maxHp: 2400 }]);
    for (let i = 0; i < 300; i++) h.step();
    expect(h.boss.state).toBe('dormant');
    // 再び戦える。2 回目の交戦開始イベントが出る
    h.boss.engage();
    expect(h.boss.state).toBe('beat');
    expect(h.names('bossEngaged')).toHaveLength(2);
    // 交戦前のリセットはイベントを出さない
    const h2 = setup();
    h2.boss.reset('rest');
    expect(h2.names('bossReset')).toHaveLength(0);
  });

  it('revives a defeated boss on reset and transitions again from scratch', () => {
    const h = setup();
    h.boss.engage();
    h.boss.kill();
    h.boss.reset('death');
    expect(h.boss.alive).toBe(true);
    h.boss.engage();
    h.boss.hp = 1000;
    for (let i = 0; i < 5; i++) h.step();
    expect(h.boss.state).toBe('transition');
  });
});

describe('boss wall positioning (6.6)', () => {
  const arena = { x: 0, z: 0, radius: 16 };
  const closeOnly = registry((id) => [stage(`${id}.1`)], ['overhead', 'sweep', 'combo3']);

  /** 壁際に追い詰められたプレイヤー（壁まで 0.8m）。ボスは中央側に 2.2m の近距離。 */
  const pinned = (seed: string) =>
    setup({
      seed,
      moves: closeOnly,
      arena,
      bossZ: 13,
      bossYaw: 0,
      playerZ: 15.2,
      poise: new Poise(400),
    });

  it('steps back before the first frame of a close-range move, so the player has room', () => {
    for (const seed of ['s1', 's2', 's3', 's4', 's5']) {
      const h = pinned(seed);
      h.boss.engage();
      const states: BossStateId[] = [];
      let startDistance = 0;
      runUntil(h.step, () => {
        const s = h.boss.state;
        if (states.at(-1) !== s) states.push(s);
        if (s === 'attack' && startDistance === 0) startDistance = h.boss.debugInfo.distance;
        return s === 'attack' && h.boss.debugInfo.stageFrame >= 1;
      });
      // 技の前に stepBack を挟む
      expect(states.slice(-2)).toEqual(['stepBack', 'attack']);
      // 2.2m → 約 4.2m（技の射程 5.0m の内側だが、後ろへ下がる余地ができる）
      expect(startDistance).toBeGreaterThan(2.2 + BOSS_WALL.stepBackDistance - 0.1);
      // ボスはアリーナの中央側へ下がる（壁の外へは出ない）
      expect(h.boss.position.z).toBeLessThan(13 - BOSS_WALL.stepBackDistance + 0.1);
      expect(Math.hypot(h.boss.position.x, h.boss.position.z)).toBeLessThanOrEqual(16);
    }
  });

  it('does not step back when the player is not at the wall, or the boss is the one at the wall', () => {
    const open = setup({ moves: closeOnly, arena, bossZ: 0, playerZ: 2 });
    open.boss.engage();
    const seen = new Set<BossStateId>();
    for (let i = 0; i < 3000; i++) {
      open.step();
      seen.add(open.boss.state);
    }
    expect(seen.has('stepBack')).toBe(false);
    const atWall = setup({
      moves: closeOnly,
      arena,
      bossZ: 15.5,
      bossYaw: Math.PI,
      playerZ: 13.5,
    });
    atWall.boss.engage();
    const seen2 = new Set<BossStateId>();
    for (let i = 0; i < 3000; i++) {
      atWall.step();
      seen2.add(atWall.boss.state);
    }
    expect(seen2.has('stepBack')).toBe(false);
  });

  it('never leaves the arena or gets stuck while the player stays pinned', () => {
    const h = pinned('long');
    h.boss.engage();
    let moves = 0;
    let prevMove: BossMoveId | null = null;
    for (let i = 0; i < 20000; i++) {
      h.step();
      const m = h.boss.currentMove;
      if (m && !prevMove) moves++;
      prevMove = m;
      expect(Math.hypot(h.boss.position.x, h.boss.position.z)).toBeLessThanOrEqual(16.0001);
    }
    expect(moves).toBeGreaterThan(50); // 詰まらずに技を出し続ける
  });
});

describe('boss attacks and pillars (6.6)', () => {
  const pillars = [{ x: 0, z: 3, radius: 0.7 }];

  it('still hits a player standing behind a pillar, and emits the pillar hit hook', () => {
    const h = setup({
      pillars,
      playerZ: 4.2, // 柱（z = 3）の向こう側
      moves: registry((id) => [stage(`${id}.1`, { damage: 77 })]),
    });
    h.boss.engage();
    runUntil(h.step, () => h.player.health.current < 100000);
    expect(100000 - h.player.health.current).toBe(77);
    const hits = h.names('bossPillarHit') as {
      pillar: number;
      moveId: string;
      position: { z: number };
    }[];
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.pillar).toBe(0);
    // 破片の位置は柱のボス側の面
    expect(hits[0]?.position.z).toBeCloseTo(3 - 0.7, 5);
  });

  it('emits nothing when the attack does not reach the pillar', () => {
    const h = setup({
      pillars: [{ x: 10, z: 10, radius: 0.7 }],
      moves: registry((id) => [stage(`${id}.1`)]),
    });
    h.boss.engage();
    for (let i = 0; i < 1500; i++) h.step();
    expect(h.names('bossPillarHit')).toHaveLength(0);
  });
});
