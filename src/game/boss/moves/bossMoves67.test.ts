import { describe, expect, it } from 'vitest';
import { findBossClipEvents } from '../../anim/bossClips';
import { markersOfType, playbackRate } from '../../anim/eventMarkers';
import { HitResolver, PLAYER_HEARTBOXES, UprightTarget } from '../../combat';
import { telegraphKindOf } from '../../data';
import { seededRandom } from '../../enemy/enemyManager';
import { Boss } from '../boss';
import type { BossMoveId } from '../bossData';
import { BOSS_MOVES, checkBossMove, stagesOf } from '../bossMove';
import { bossTelegraphOf } from '../bossTelegraph.system';
import { findDodgeWindows, simulateDodge, toRanges } from '../dodgeSim';
import {
  ASH_LENGTH,
  ASH_LINE_INTERVAL,
  ASH_RUN_FRAMES,
  ASH_SPEED,
  ASH_STARTUP,
  ASH_TELEGRAPH_FRAME,
  ashActiveLine,
  ashFront,
  ashLineStart,
  ashTelegraphVisible,
  ashShape,
} from './ashWave.move';
import { SPIN_ACTIVE, SPIN_GAP, SPIN_RADIUS, spinAngle } from './spin.move';
import './index';

function move(id: 'spin' | 'ashWave') {
  const m = BOSS_MOVES.get(id);
  if (!m) throw new Error(`${id} is not registered`);
  return m;
}

const DT = 1 / 60;
const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('技 6 回転斬り: frame data (6.3)', () => {
  it('matches the spec table (phase 2 only)', () => {
    const m = move('spin');
    expect(m.phases).toEqual([2]);
    expect(checkBossMove(m)).toEqual([]);
    const stages = stagesOf(m, 2);
    expect(
      stages.map((s) => [s.startup, s.active, s.damage, s.poiseDamage, s.guardStaminaCost]),
    ).toEqual([
      [36, 10, 85, 55, 48],
      [12, 10, 85, 55, 48],
    ]);
    for (const s of stages) {
      expect(s.arcDeg).toBe(360);
      expect(s.range).toBe(4.8);
      expect(telegraphKindOf(s)).toBe('heavy');
    }
    expect(stages[1]?.recovery).toBe(60);
    expect(SPIN_RADIUS).toBe(4.8);
  });

  it('has super armor from windup to the end of each rotation', () => {
    const [a, b] = stagesOf(move('spin'), 2);
    expect(a?.superArmor).toEqual({ start: 1, end: 46 });
    expect(b?.superArmor).toEqual({ start: 1, end: 22 });
  });

  it('leaves exactly 12F between the rotations', () => {
    // 判定は 1 回転目が通し F37〜F46、2 回転目が F59〜F68（立ち尽くして当たる F で見る）
    const r = simulateDodge({ move: 'spin', phase: 2, distance: 2.5 });
    const first = r.hits.find((h) => h.attackId === 'boss.spin.1');
    const second = r.hits.find((h) => h.attackId === 'boss.spin.2');
    expect(first?.moveFrame).toBe(37);
    expect(second?.moveFrame).toBe(59);
    const [a, b] = stagesOf(move('spin'), 2);
    const firstEnd = (a?.startup ?? 0) + (a?.active ?? 0) + (a?.recovery ?? 0);
    const gap = (second?.moveFrame ?? 0) - firstEnd - 1;
    expect(gap).toBe(SPIN_GAP);
    expect(gap).toBe(12);
    expect(b?.startup).toBe(12);
  });

  it('hits twice when standing still (once per rotation)', () => {
    const r = simulateDodge({ move: 'spin', phase: 2, distance: 2.5 });
    expect(r.hits.map((h) => [h.attackId, h.stageFrame])).toEqual([
      ['boss.spin.1', 37],
      ['boss.spin.2', 13],
    ]);
  });

  it('turns the model one full turn per rotation and returns to 0', () => {
    expect(spinAngle(1, 1)).toBeLessThan(0);
    expect(spinAngle(1, 36)).toBeCloseTo(-1.0, 5);
    expect(spinAngle(1, 36 + SPIN_ACTIVE)).toBeCloseTo(Math.PI * 2, 5);
    expect(spinAngle(1, 47)).toBe(0);
    expect(spinAngle(2, 12)).toBeCloseTo(-0.5, 5);
    expect(spinAngle(2, 12 + SPIN_ACTIVE)).toBeCloseTo(Math.PI * 2, 5);
  });

  it('is not selectable in phase 1', () => {
    const r = simulateDodge({ move: 'spin', phase: 1 });
    expect(r.error).toBeDefined();
  });
});

describe('技 6 回転斬り: dodge simulation', () => {
  it('rolling away at the end of the first rotation gets out before the second', () => {
    // 無敵 F4–F15 が 1 回転目の判定 F37–F46 を覆い、隙の 12F で円の外へ出る
    const w = findDodgeWindows({ move: 'spin', phase: 2, distance: 2.5 }, { direction: 'away' });
    expect(w.frames).toEqual(expect.arrayContaining([32, 33, 34]));
    expect(w.frames).not.toContain(35);
    expect(w.frames).not.toContain(36);
    expect(w.windows.some((r) => r.start <= 32 && r.end >= 34)).toBe(true);
  });

  it('taking the first rotation and rolling through the second dodges only the second', () => {
    // 1 回目はガード（またはくらう）→ 2 回転目の判定（通し F59–F68）をロール無敵（入力 F55–F56）で覆う
    for (const f of [55, 56]) {
      const r = simulateDodge({
        move: 'spin',
        phase: 2,
        distance: 2.5,
        inputs: [{ frame: f, direction: 'away' }],
      });
      expect(
        r.hits.map((h) => h.attackId),
        `input F${f}`,
      ).toEqual(['boss.spin.1']);
    }
    const late = simulateDodge({
      move: 'spin',
      phase: 2,
      distance: 2.5,
      inputs: [{ frame: 58, direction: 'away' }],
    });
    expect(late.hits.map((h) => h.attackId)).toEqual(['boss.spin.1', 'boss.spin.2']);
  });

  it('hits a player who stays close (rolling toward the boss never leaves the circle)', () => {
    const w = findDodgeWindows({ move: 'spin', phase: 2, distance: 2.5 }, { direction: 'toward' });
    expect(w.frames).toEqual([]);
  });

  it('does not hit a player outside the radius (4.8m + heart 0.35m)', () => {
    expect(simulateDodge({ move: 'spin', phase: 2, distance: 5.3 }).dodged).toBe(true);
    expect(simulateDodge({ move: 'spin', phase: 2, distance: 5.1 }).dodged).toBe(false);
  });
});

describe('技 7 灰の波: frame data (6.3)', () => {
  it('matches the spec table (phase 2 only)', () => {
    const m = move('ashWave');
    expect(m.phases).toEqual([2]);
    expect(checkBossMove(m)).toEqual([]);
    const [s] = stagesOf(m, 2);
    expect(s?.startup).toBe(50);
    expect(s?.recovery).toBe(54);
    expect(s?.damage).toBe(90);
    expect(s?.poiseDamage).toBe(40);
    expect(s?.guardStaminaCost).toBe(55);
    expect(s ? telegraphKindOf(s) : null).toBe('heavy');
    expect(s?.active).toBe(36);
  });

  it('spikes run 12m in 0.2s (12 frames)', () => {
    expect(ASH_LENGTH).toBe(12);
    expect(ASH_RUN_FRAMES).toBe(12);
    expect(ASH_SPEED * 60 * (ASH_RUN_FRAMES / 60)).toBeCloseTo(12);
    // 12m / 0.2s = 60m/s = 1m/F
    expect(ASH_SPEED * 60).toBeCloseTo(60);
    expect(ashFront(0, ASH_STARTUP)).toBe(0);
    expect(ashFront(0, ASH_STARTUP + 1)).toBeCloseTo(1);
    expect(ashFront(0, ASH_STARTUP + 6)).toBeCloseTo(6);
    expect(ashFront(0, ASH_STARTUP + 12)).toBeCloseTo(12);
    expect(ashFront(0, ASH_STARTUP + 40)).toBe(12);
  });

  it('starts the three lines 12F apart, one after another', () => {
    expect([0, 1, 2].map(ashLineStart)).toEqual([50, 62, 74]);
    expect(ASH_LINE_INTERVAL).toBe(12);
    expect(range(51, 86).map(ashActiveLine)).toEqual([
      ...Array<number>(12).fill(0),
      ...Array<number>(12).fill(1),
      ...Array<number>(12).fill(2),
    ]);
    expect(ashActiveLine(50)).toBe(-1);
    expect(ashActiveLine(87)).toBe(-1);
  });

  it('shows the ground telegraph from F18 until each line has run', () => {
    expect(ashTelegraphVisible(ASH_TELEGRAPH_FRAME - 1, 0)).toBe(false);
    expect(ashTelegraphVisible(ASH_TELEGRAPH_FRAME, 0)).toBe(true);
    expect(ashTelegraphVisible(62, 0)).toBe(true);
    expect(ashTelegraphVisible(63, 0)).toBe(false);
    expect(ashTelegraphVisible(63, 1)).toBe(true);
    expect(ashTelegraphVisible(86, 2)).toBe(true);
    expect(ashTelegraphVisible(87, 2)).toBe(false);
  });

  it('is reported as a heavy telegraph while running', () => {
    expect(bossTelegraphOf({ move: 'ashWave', stage: 1 }, 2)).toBe('heavy');
    expect(bossTelegraphOf({ move: 'spin', stage: 2 }, 2)).toBe('heavy');
  });

  it('hit shape is a 1m segment of a 1.5m wide line per frame (time-staggered, not a sweep)', () => {
    const origin = { x: 0, y: 0, z: 0 };
    const s = ashShape(origin, 0, ASH_STARTUP + 5);
    if (s.kind !== 'capsule') throw new Error('capsule expected');
    expect(s.capsule.radius).toBeCloseTo(0.75);
    expect(s.capsule.a.z).toBeCloseTo(4);
    expect(s.capsule.b.z).toBeCloseTo(5);
    // 2 本目は +25° 方向
    const t = ashShape(origin, 0, 62 + 3);
    if (t.kind !== 'capsule') throw new Error('capsule expected');
    expect(t.capsule.b.x).toBeCloseTo(Math.sin((25 * Math.PI) / 180) * 3);
    expect(t.capsule.b.z).toBeCloseTo(Math.cos((25 * Math.PI) / 180) * 3);
  });
});

/**
 * 灰の波の判定を、プレイヤーを指定の位置へ置いて調べる（ボスは原点で +z を向く。向きの追尾（F38 まで）の間は
 * 正面 8m に置き、F39 以降に `at` へ移す）。命中した攻撃の ID と F。
 */
function ashHits(at: { x: number; z: number }, invulnerable?: (frame: number) => boolean) {
  const combat = new HitResolver();
  const player = new UprightTarget('player', 'player', 1_000_000, PLAYER_HEARTBOXES);
  combat.addTarget(player);
  const boss = new Boss(
    { id: 'boss', x: 0, y: 0, z: 0, yaw: 0 },
    { combat, moves: BOSS_MOVES, random: seededRandom('ash') },
  );
  boss.aiEnabled = false;
  boss.setPhase(2);
  const hits: number[] = [];
  let frame = 0;
  combat.onHit(() => hits.push(frame));
  boss.startMove('ashWave', { skipApproach: true });
  while (boss.currentMove !== null && frame < 300) {
    frame++;
    const p = frame <= 38 ? { x: 0, z: 8 } : at;
    player.invulnerable = invulnerable?.(frame) ?? false;
    player.place(p.x, 0, p.z, Math.PI);
    boss.update(DT, { x: p.x, z: p.z, healing: false, rolling: false }, 0);
    combat.step();
  }
  return hits;
}

describe('技 7 灰の波: gap and side-step boundaries', () => {
  const deg = (d: number) => (d * Math.PI) / 180;
  const polar = (d: number, bearing: number) => ({
    x: Math.sin(deg(bearing)) * d,
    z: Math.cos(deg(bearing)) * d,
  });

  it('hits a player standing on a line', () => {
    expect(ashHits(polar(6, 0)).length).toBe(1);
    expect(ashHits(polar(6, 25)).length).toBe(1);
    expect(ashHits(polar(6, -25)).length).toBe(1);
  });

  it('a player standing in the gap between lines (about 1.0m wide at 5.8m) is not hit', () => {
    // 隣り合う線の間（±12.5°）。距離 5.8m で縁と縁の間が約 1.0m
    expect(ashHits(polar(5.8, 12.5))).toEqual([]);
    expect(ashHits(polar(5.8, -12.5))).toEqual([]);
    expect(ashHits(polar(8, 12.5))).toEqual([]);
  });

  it('the gap closes near the base: the heart box (0.35m) no longer fits', () => {
    // 線の縁と縁の間（中心間 0.433 × 距離 − 1.5）が 0.7m（ハートボックスの直径）を切るあたり
    expect(ashHits(polar(5.1, 12.5)).length).toBe(0);
    expect(ashHits(polar(4.4, 12.5)).length).toBe(1);
    expect(ashHits(polar(3, 12.5)).length).toBe(1);
  });

  it('running straight sideways gets out of every line', () => {
    expect(ashHits({ x: 3.2, z: 2.5 })).toEqual([]);
    expect(ashHits({ x: -3.2, z: 2.5 })).toEqual([]);
    expect(ashHits({ x: 5, z: 0 })).toEqual([]);
  });

  it('a line passing while the player is invulnerable (roll across) does not hit', () => {
    // 正面 6m。中央線が通る F（先端が 6m = F56）に無敵が重なれば当たらない
    expect(ashHits(polar(6, 0), (f) => f >= 50 && f <= 61)).toEqual([]);
    expect(ashHits(polar(6, 0), (f) => f >= 57 && f <= 68).length).toBe(1);
  });

  it('one hit per use: two lines never hit the same player twice', () => {
    // 正面 2m 付近は 3 本とも通るが、命中は 1 回
    expect(ashHits(polar(2, 0)).length).toBe(1);
  });
});

describe('技 7 灰の波: dodge simulation', () => {
  it('crossing a line by rolling toward the boss dodges it (invulnerable while it passes)', () => {
    const w = findDodgeWindows(
      { move: 'ashWave', phase: 2, distance: 7 },
      { direction: 'toward', from: 1, to: 80 },
    );
    expect(w.frames.length).toBeGreaterThan(0);
    // 入力 F46 前後（無敵 F49–F60 が 7m 地点を先端が通る F57 を覆う）
    expect(w.frames).toContain(50);
    expect(toRanges(w.frames).every((r) => r.start >= 40)).toBe(true);
  });

  it('rolling sideways from close range gets out of the lines', () => {
    for (const direction of ['left', 'right'] as const) {
      const w = findDodgeWindows(
        { move: 'ashWave', phase: 2, distance: 2.5 },
        { direction, from: 1, to: 80 },
      );
      expect(w.frames).toEqual(expect.arrayContaining([40, 45, 49]));
    }
  });

  it('standing still on the line is hit at the first frame the spike front reaches it', () => {
    const r = simulateDodge({ move: 'ashWave', phase: 2, distance: 8 });
    expect(r.hits.length).toBe(1);
    // 先端が 8m − 1.1m（線の半幅 0.75 + ハートボックス 0.35）= 約 6.9m に着く F
    expect(r.hits[0]?.stageFrame).toBe(ASH_STARTUP + 7);
  });
});

describe('マーカー表（E8-2）', () => {
  const entries: [string, BossMoveId, number][] = [
    ['boss.spin.1.p2', 'spin', 0],
    ['boss.spin.2.p2', 'spin', 1],
    ['boss.ashWave.1.p2', 'ashWave', 0],
  ];

  it('has an entry per stage matching the frame data', () => {
    for (const [id, moveId, stageIndex] of entries) {
      const entry = findBossClipEvents(id);
      const stage = stagesOf(move(moveId as 'spin' | 'ashWave'), 2)[stageIndex];
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
    expect(findBossClipEvents('boss.spin.1.p2')?.clip).toBe('Sword_Regular_B');
    expect(findBossClipEvents('boss.ashWave.1.p2')?.clip).toBe('Sword_Heavy_Combo');
  });
});
