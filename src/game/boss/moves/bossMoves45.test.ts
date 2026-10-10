import { beforeAll, describe, expect, it, vi } from 'vitest';
import { findBossClipEvents } from '../../anim/bossClips';
import { markersOfType, playbackRate } from '../../anim/eventMarkers';
import { HitResolver, PLAYER_HEARTBOXES, UprightTarget } from '../../combat';
import { PLAYER_STATS, telegraphKindOf } from '../../data';
import { seededRandom } from '../../enemy/enemyManager';
import { Game } from '../../game';
import { FakeInput } from '../../testing/fakeInput';
import { Boss } from '../boss';
import { bossSystemOf } from '../boss.system';
import type { BossMoveId, BossPhase } from '../bossData';
import { BOSS_MOVES, BossMoveRegistry, checkBossMove, stagesOf } from '../bossMove';
import { bossTelegraphOf } from '../bossTelegraph.system';
import { canDodge, findDodgeWindows, simulateDodge } from '../dodgeSim';
import {
  LEAP_AIR_FRAMES,
  LEAP_CROUCH_FRAMES,
  LEAP_LOCK_FRAME,
  LEAP_MAX_DISTANCE,
  LEAP_PEAK_HEIGHT,
  LEAP_RADIUS,
  LEAP_TELEGRAPH_FRAME,
  clampLanding,
  leapHeight,
  leapStateOf,
  leapTelegraphVisible,
} from './leap.move';
import {
  SHIELD_BASH_KNOCKBACK,
  SLASH_LUNGE_MAX,
  SLASH_REACH_TARGET,
  slashLungeDistance,
} from './shieldBash.move';
import './index';

function move(id: 'shieldBash' | 'leap') {
  const m = BOSS_MOVES.get(id);
  if (!m) throw new Error(`${id} is not registered`);
  return m;
}

/** 段のフレームデータ（仕様書 6.3 節の表と突き合わせる形）。 */
function table(id: 'shieldBash' | 'leap', phase: BossPhase) {
  return stagesOf(move(id), phase).map((s) => ({
    startup: s.startup,
    active: s.active,
    recovery: s.recovery,
    damage: s.damage,
    poise: s.poiseDamage,
    guard: s.guardStaminaCost,
    arc: s.arcDeg,
    range: s.range,
  }));
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('技 4 盾打ち → 斬り下ろし: frame data (6.3)', () => {
  it('matches the spec table (phase 1 only)', () => {
    expect(table('shieldBash', 1)).toEqual([
      { startup: 26, active: 5, recovery: 12, damage: 60, poise: 60, guard: 40, arc: 90, range: 3 },
      { startup: 36, active: 6, recovery: 50, damage: 100, poise: 70, guard: 60, arc: 60, range: 4.5 },
    ]);
    expect(move('shieldBash').phases).toEqual([1]);
    expect(move('shieldBash').phase2Stages).toBeUndefined();
  });

  it('passes the boss move checks', () => {
    expect(checkBossMove(move('shieldBash'))).toEqual([]);
  });

  it('knocks the target back 3m on a hit, and the follow-up is a heavy telegraph', () => {
    const [bash, slash] = stagesOf(move('shieldBash'), 1);
    expect(bash?.knockback).toBe(3);
    expect(SHIELD_BASH_KNOCKBACK).toBe(3);
    expect(slash?.followUp).toBe(true);
    expect(slash && telegraphKindOf(slash)).toBe('heavy');
    expect(bash && telegraphKindOf(bash)).toBe('normal');
    expect(bossTelegraphOf({ move: 'shieldBash', stage: 1 }, 1)).toBe('normal');
    expect(bossTelegraphOf({ move: 'shieldBash', stage: 2 }, 1)).toBe('heavy');
  });

  it('cannot be used in phase 2', () => {
    const r = simulateDodge({ move: 'shieldBash', phase: 2 });
    expect(r.dodged).toBe(false);
    expect(r.error).toContain('shieldBash');
  });

  it('lunges only as far as needed to reach a knocked-down target, up to 3m', () => {
    expect(slashLungeDistance(2.5)).toBe(0);
    expect(slashLungeDistance(SLASH_REACH_TARGET)).toBe(0);
    expect(slashLungeDistance(5.2)).toBeCloseTo(2.0);
    expect(slashLungeDistance(20)).toBe(SLASH_LUNGE_MAX);
  });
});

describe('技 4: dodge simulation (dodgeSim)', () => {
  const scenario = { move: 'shieldBash', distance: 2.5 } as const;

  it('hits a standing player twice: the bash at F27, the slash at F80', () => {
    const r = simulateDodge(scenario);
    expect(r.hits.map((h) => [h.moveFrame, h.attackId, h.damage])).toEqual([
      [27, 'boss.shieldBash.1', 60],
      [80, 'boss.shieldBash.2', 100],
    ]);
  });

  it('a roll to either side dodges the bash, and the slash swings at empty air', () => {
    for (const direction of ['left', 'right'] as const) {
      const { frames } = findDodgeWindows(scenario, { direction, from: 1, to: 60 });
      // 無敵が盾打ちの持続（F27–F31）を覆う入力（F20–F24）を含む
      for (const f of range(20, 24)) expect(frames, `${direction} F${f}`).toContain(f);
      // 25 以降は無敵が間に合わず盾打ちが当たる
      expect(frames).not.toContain(25);
      const r = simulateDodge({ ...scenario, inputs: [{ frame: 22, direction }] });
      expect(r.hits).toEqual([]);
    }
  });

  it('rolling away to the side leaves the boss facing where the target was: the slash misses even when the roll is early', () => {
    const r = simulateDodge({ ...scenario, inputs: [{ frame: 8, direction: 'left' }] });
    expect(r.hits).toEqual([]);
  });

  it('a backstep is punished: the lunge brings the slash within reach', () => {
    const r = simulateDodge({ ...scenario, inputs: [{ frame: 10, action: 'backstep' }] });
    expect(r.hits.map((h) => h.attackId)).toEqual(['boss.shieldBash.2']);
  });

  it('a roll that dodges only the slash (input late) still takes the bash', () => {
    const r = simulateDodge({ ...scenario, inputs: [{ frame: 60, direction: 'left' }] });
    expect(r.hits.map((h) => h.attackId)).toEqual(['boss.shieldBash.1']);
  });

  it('a late side roll after the bash dodges the slash: window F66-F76 (invulnerability covers F81-F86)', () => {
    // 盾打ちを食らったあと（転倒しない想定）で、追撃だけを避けるロールの窓
    const base = { ...scenario, inputs: [] };
    expect(simulateDodge(base).hits).toHaveLength(2);
    for (const direction of ['left', 'right'] as const) {
      const bashHit = simulateDodge({ ...scenario, inputs: [{ frame: 1, direction }] });
      expect(bashHit.hits).toEqual([]);
    }
  });
});

/** 手動で回す 1 体のボス（プレイヤーの位置をフレームごとに指定できる）。 */
function runLeap(options: {
  phase?: BossPhase;
  /** そのフレーム（技の F）のプレイヤー位置。 */
  player: (frame: number) => { x: number; z: number };
  frames?: number;
}) {
  const combat = new HitResolver();
  const target = new UprightTarget('player', 'player', 1_000_000, PLAYER_HEARTBOXES);
  combat.addTarget(target);
  const boss = new Boss(
    { id: 'boss', x: 0, y: 0, z: 0, yaw: 0 },
    { combat, moves: BOSS_MOVES, random: seededRandom('leap') },
  );
  boss.aiEnabled = false;
  boss.setPhase(options.phase ?? 1);
  const hits: { frame: number; damage: number }[] = [];
  let frame = 0;
  combat.onHit((e) => hits.push({ frame, damage: e.damage }));
  const start = options.player(0);
  target.place(start.x, 0, start.z, 0);
  boss.update(1 / 60, { x: start.x, z: start.z, healing: false, rolling: false }, 0);
  expect(boss.startMove('leap', { skipApproach: true })).toBe(true);
  const trace: {
    frame: number;
    landing: { x: number; z: number };
    locked: boolean;
    airborne: boolean;
    height: number;
    landed: boolean;
    boss: { x: number; z: number };
  }[] = [];
  while (boss.currentMove !== null && frame < (options.frames ?? 300)) {
    frame++;
    const p = options.player(frame);
    target.place(p.x, 0, p.z, 0);
    boss.update(1 / 60, { x: p.x, z: p.z, healing: false, rolling: false }, 0);
    combat.step();
    const s = leapStateOf(boss);
    if (s) {
      trace.push({
        frame,
        landing: { ...s.landing },
        locked: s.locked,
        airborne: s.airborne,
        height: s.height,
        landed: s.landed,
        boss: { x: boss.position.x, z: boss.position.z },
      });
    }
  }
  return { hits, trace, boss, frames: frame };
}

describe('技 5 跳躍叩きつけ: frame data (6.3)', () => {
  it('matches the spec table for P1 and P2', () => {
    expect(table('leap', 1)).toEqual([
      { startup: 72, active: 6, recovery: 56, damage: 120, poise: 70, guard: 62, arc: 360, range: 3.5 },
    ]);
    expect(table('leap', 2)).toEqual([
      { startup: 72, active: 6, recovery: 46, damage: 130, poise: 70, guard: 62, arc: 360, range: 3.5 },
    ]);
    // 跳び上がり 42 + 滞空 30 = 発生 72
    expect(LEAP_CROUCH_FRAMES + LEAP_AIR_FRAMES).toBe(72);
    expect(LEAP_RADIUS).toBe(3.5);
  });

  it('passes the boss move checks and is a heavy (not unblockable) telegraph', () => {
    expect(checkBossMove(move('leap'))).toEqual([]);
    const stage = stagesOf(move('leap'), 1)[0];
    expect(stage && telegraphKindOf(stage)).toBe('heavy');
    expect(bossTelegraphOf({ move: 'leap', stage: 1 }, 2)).toBe('heavy');
  });

  it('is usable in both phases and has no approach (it jumps from where it stands)', () => {
    expect(move('leap').phases).toEqual([1, 2]);
    expect(move('leap').approach).toBeUndefined();
  });
});

describe('技 5: landing point and the ground telegraph', () => {
  it('follows the target until air F20 (stage F62), then stays fixed', () => {
    // プレイヤーは毎フレーム x を 0.1m ずつ動く
    const { trace } = runLeap({ player: (f) => ({ x: 10 + f * 0.1, z: 12 }) });
    const at = (f: number) => trace.find((t) => t.frame === f);
    expect(LEAP_LOCK_FRAME).toBe(62);
    expect(at(61)?.landing.x).toBeCloseTo(10 + 61 * 0.1);
    expect(at(62)?.landing.x).toBeCloseTo(10 + 62 * 0.1);
    expect(at(62)?.locked).toBe(false);
    // F63 以降は F62 の位置のまま
    expect(at(63)?.landing.x).toBeCloseTo(10 + 62 * 0.1);
    expect(at(63)?.locked).toBe(true);
    expect(at(72)?.landing.x).toBeCloseTo(10 + 62 * 0.1);
  });

  it('shows the telegraph from F18 and not before, until the landing', () => {
    const { trace } = runLeap({ player: () => ({ x: 0, z: 12 }) });
    expect(LEAP_TELEGRAPH_FRAME).toBe(18);
    const visible = (f: number) => {
      const t = trace.find((x) => x.frame === f);
      if (!t) throw new Error(`no trace at F${f}`);
      return leapTelegraphVisible({ frame: f, landed: t.landed });
    };
    expect(visible(17)).toBe(false);
    expect(visible(18)).toBe(true);
    expect(visible(72)).toBe(true);
    expect(visible(73)).toBe(false);
  });

  it('is airborne from F43 to F72, peaks mid-air, and lands exactly on the landing point at F72', () => {
    const { trace } = runLeap({ player: () => ({ x: 4, z: 12 }) });
    const at = (f: number) => trace.find((t) => t.frame === f);
    expect(at(42)?.airborne).toBe(false);
    expect(at(43)?.airborne).toBe(true);
    expect(at(72)?.airborne).toBe(true);
    expect(at(73)?.airborne).toBe(false);
    expect(at(72)?.height).toBeCloseTo(0);
    expect(at(57)?.height).toBeCloseTo(LEAP_PEAK_HEIGHT, 1);
    expect(leapHeight(0)).toBe(0);
    expect(leapHeight(LEAP_AIR_FRAMES / 2)).toBeCloseTo(LEAP_PEAK_HEIGHT);
    // 地上の間は動かない
    expect(at(42)?.boss).toEqual({ x: 0, z: 0 });
    // F72 で着地点に着く
    expect(at(72)?.boss.x).toBeCloseTo(4);
    expect(at(72)?.boss.z).toBeCloseTo(12);
    expect(at(73)?.landed).toBe(true);
  });

  it('clamps the landing point to the jump range for a faraway target', () => {
    expect(clampLanding({ x: 0, z: 0 }, { x: 0, z: 10 })).toEqual({ x: 0, z: 10 });
    const far = clampLanding({ x: 0, z: 0 }, { x: 0, z: 40 });
    expect(far.z).toBeCloseTo(LEAP_MAX_DISTANCE);
    expect(far.x).toBeCloseTo(0);
  });

  it('forgets the state when the move ends', () => {
    const { boss } = runLeap({ player: () => ({ x: 0, z: 12 }) });
    expect(leapStateOf(boss)).toBeUndefined();
  });
});

describe('技 5: hit circle boundary (radius 3.5m + the 0.35m hurtbox)', () => {
  const radius = PLAYER_STATS.hurtCapsule.radius;
  /** F62 までは (0, 12) に立ち、F63 から着地点の中心から `d` m の位置へ移る。 */
  const hitAt = (d: number): boolean => {
    const { hits } = runLeap({ player: (f) => (f <= LEAP_LOCK_FRAME ? { x: 0, z: 12 } : { x: d, z: 12 }) });
    return hits.length > 0;
  };

  it('hits inside the circle and misses outside it', () => {
    expect(hitAt(0)).toBe(true);
    expect(hitAt(3.0)).toBe(true);
    expect(hitAt(LEAP_RADIUS + radius - 0.02)).toBe(true);
    expect(hitAt(LEAP_RADIUS + radius + 0.02)).toBe(false);
    expect(hitAt(6)).toBe(false);
  });

  it('does not hit the player who leaves the circle after the landing point is fixed', () => {
    const { hits } = runLeap({ player: (f) => ({ x: f > LEAP_LOCK_FRAME ? 8 : 0, z: 12 }) });
    expect(hits).toEqual([]);
  });

  it('hits for 120 (P1) / 130 (P2) at the first active frame, F73', () => {
    expect(runLeap({ player: () => ({ x: 0, z: 12 }) }).hits).toEqual([{ frame: 73, damage: 120 }]);
    expect(runLeap({ phase: 2, player: () => ({ x: 0, z: 12 }) }).hits).toEqual([
      { frame: 73, damage: 130 },
    ]);
  });
});

describe('技 5: dodge simulation (dodgeSim)', () => {
  for (const phase of [1, 2] as const) {
    for (const distance of [9, 14]) {
      it(`a roll input at air F22-F28 (stage F64-F70) dodges in any direction; F63 and F71 do not (P${phase}, ${distance}m)`, () => {
        const scenario = { move: 'leap', phase, distance } as const;
        for (const direction of ['toward', 'away', 'left', 'right'] as const) {
          const { frames } = findDodgeWindows(scenario, { direction, from: 1, to: 90 });
          expect(frames, direction).toEqual(range(64, 70));
        }
        // 滞空 F = 段 F − 42
        expect(64 - LEAP_CROUCH_FRAMES).toBe(22);
        expect(70 - LEAP_CROUCH_FRAMES).toBe(28);
        expect(canDodge(scenario, { frame: 63, direction: 'toward' })).toBe(false);
        expect(canDodge(scenario, { frame: 71, direction: 'toward' })).toBe(false);
      });
    }
  }

  it('a backstep dodges only with an input at F71-F73 (invulnerability F1-F8 covers the landing)', () => {
    const { frames } = findDodgeWindows(
      { move: 'leap', distance: 10 },
      { action: 'backstep', from: 1, to: 90 },
    );
    expect(frames).toEqual([71, 72, 73]);
  });

  it('a standing target is hit once, at F73', () => {
    const r = simulateDodge({ move: 'leap', distance: 10 });
    expect(r.hits).toMatchObject([{ moveFrame: 73, stage: 1, damage: 120 }]);
  });
});

describe('マーカー表 (anim/data/bossClips.json): 技 4・5', () => {
  const entries: [string, BossMoveId, BossPhase, number][] = [
    ['boss.shieldBash.1.p1', 'shieldBash', 1, 0],
    ['boss.shieldBash.2.p1', 'shieldBash', 1, 1],
    ['boss.leap.1.p1', 'leap', 1, 0],
    ['boss.leap.1.p2', 'leap', 2, 0],
  ];

  it('has an entry per stage and phase matching the frame data', () => {
    for (const [id, moveId, phase, stageIndex] of entries) {
      const entry = findBossClipEvents(id);
      const stage = stagesOf(move(moveId === 'leap' ? 'leap' : 'shieldBash'), phase)[stageIndex];
      if (!entry || !stage) throw new Error(`missing ${id}`);
      expect(entry.spec, id).toEqual({
        startup: stage.startup,
        active: stage.active,
        recovery: stage.recovery,
      });
      expect(markersOfType(entry, 'hitStart').map((m) => m.frame)).toEqual([stage.startup + 1]);
      expect(markersOfType(entry, 'hitEnd').map((m) => m.frame)).toEqual([
        stage.startup + stage.active,
      ]);
      expect(playbackRate(entry)).toBeGreaterThan(0);
    }
  });

  it('uses the planned UAL clips', () => {
    expect(findBossClipEvents('boss.shieldBash.1.p1')?.clip).toBe('Shield_Dash');
    expect(findBossClipEvents('boss.shieldBash.2.p1')?.clip).toBe('Sword_Heavy_Combo');
    expect(findBossClipEvents('boss.leap.1.p1')?.clip).toBe('Jump_Start');
    expect(findBossClipEvents('boss.leap.1.p1')?.tail?.clip).toBe('Jump_Land');
  });
});

// ---- Game 結合（本物のプレイヤー・カメラ演出・被弾リアクション） ----

const DT = 1 / 60;

async function setup(moveId: BossMoveId, playerZ: number) {
  const input = new FakeInput();
  const game = await Game.create({ input, boxes: [], dummies: [], enemies: [] });
  game.teleportPlayer(0, playerZ, Math.PI);
  const def = BOSS_MOVES.get(moveId);
  if (!def) throw new Error(`move ${moveId} is not registered`);
  const moves = new BossMoveRegistry();
  moves.register(def);
  const boss = bossSystemOf(game).spawn({ x: 0, z: 0, yaw: 0, moves, engage: true });
  const step = () => {
    game.update(DT);
    input.endStep();
  };
  for (let i = 0; i < 600 && !(boss.state === 'attack' && boss.debugInfo.stageFrame === 0); i++) {
    step();
  }
  expect(boss.state).toBe('attack');
  return { game, boss, input, step };
}

describe('技 4・5: simulation against the real player', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  it('shield bash: a standing player is knocked down 3m, then the follow-up lunges in and hits', async () => {
    const { game, step } = await setup('shieldBash', 2.5);
    const hp0 = game.playerTarget.health.current;
    const log = game.hitLog.length;
    let bashZ = 0;
    let slashFrame = -1;
    for (let f = 1; f <= 140; f++) {
      step();
      const hits = game.hitLog.slice(log).filter((e) => e.targetId === 'player');
      if (hits.length >= 1 && bashZ === 0) bashZ = game.player.feet.z;
      if (hits.length >= 2 && slashFrame < 0) slashFrame = f;
    }
    const hits = game.hitLog.slice(log).filter((e) => e.targetId === 'player');
    expect(hits.map((e) => [e.attackId, e.baseDamage])).toEqual([
      ['boss.shieldBash.1', 60],
      ['boss.shieldBash.2', 100],
    ]);
    expect(hp0 - game.playerTarget.health.current).toBe(160);
    // 吹き飛ばしは重い被弾の既定（1.5m）ではなく 3m（滑りは数フレームかけて進む）
    expect(game.player.feet.z).toBeGreaterThan(2.5 + 2.7);
    expect(bashZ).toBeGreaterThan(2.5);
    expect(slashFrame).toBeGreaterThan(0);
  });

  it('shield bash: a side roll at F22 takes no damage from either stage', async () => {
    const { game, input, step } = await setup('shieldBash', 2.5);
    const hp0 = game.playerTarget.health.current;
    for (let f = 1; f <= 140; f++) {
      if (f === 22) {
        input.setMove(-1, 0);
        input.press('dodge');
      }
      step();
      if (f === 22) input.setMove(0, 0);
    }
    expect(game.playerTarget.health.current).toBe(hp0);
  });

  it('leap: shakes the camera at the landing, emits the slam event once, and hits a standing player', async () => {
    const { game, step } = await setup('leap', 12);
    const slam = vi.spyOn(game.camera.effects, 'slam');
    const events: { x: number; z: number; radius: number }[] = [];
    game.events.on('bossSlam', (e) => events.push({ x: e.position.x, z: e.position.z, radius: e.radius }));
    const hp0 = game.playerTarget.health.current;
    for (let f = 1; f <= 120; f++) step();
    expect(events).toHaveLength(1);
    expect(events[0]?.radius).toBe(LEAP_RADIUS);
    expect(slam).toHaveBeenCalledTimes(1);
    // 着地点（プレイヤーの足元）から振動を出す。距離は 0〜数 m（減衰なし）
    expect(slam.mock.calls[0]?.[0]).toBeLessThan(1);
    expect(hp0 - game.playerTarget.health.current).toBe(120);
  });

  it('leap: a roll at stage F66 takes no damage', async () => {
    const { game, input, step } = await setup('leap', 12);
    const hp0 = game.playerTarget.health.current;
    for (let f = 1; f <= 120; f++) {
      if (f === 66) {
        input.setMove(0, -1);
        input.press('dodge');
      }
      step();
      if (f === 66) input.setMove(0, 0);
    }
    expect(game.playerTarget.health.current).toBe(hp0);
  });
});
