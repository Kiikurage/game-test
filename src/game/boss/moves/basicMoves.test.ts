import { describe, expect, it } from 'vitest';
import { findBossClipEvents, bossClipEvents } from '../../anim/bossClips';
import { markersOfType, playbackRate } from '../../anim/eventMarkers';
import { ENEMY_ATTACK_RULES, telegraphKindOf, totalFrames, trackEndFrame } from '../../data';
import type { SectorShape } from '../../combat';
import { BOSS_MIN_LOCKED_FRAMES, BOSS_MOVES, checkBossMove, stagesOf } from '../bossMove';
import { bossTelegraphOf } from '../bossTelegraph.system';
import { COMBO3_SWING, COMBO3_THRUST_DISTANCE } from './combo3.move';
import { OVERHEAD_APEX_OFFSET, OVERHEAD_REACH } from './overhead.move';
import { SWEEP_HEIGHT, SWEEP_SWING } from './sweep.move';
import './index';

function move(id: 'overhead' | 'sweep' | 'combo3') {
  const m = BOSS_MOVES.get(id);
  if (!m) throw new Error(`${id} is not registered`);
  return m;
}

/** 段のフレームデータ（仕様書 6.3 節の表と突き合わせる形）。 */
function table(id: 'overhead' | 'sweep' | 'combo3', phase: 1 | 2) {
  return stagesOf(move(id), phase).map((s) => ({
    startup: s.startup,
    active: s.active,
    recovery: s.recovery,
    damage: s.damage,
    poise: s.poiseDamage,
    guard: s.guardStaminaCost,
    arc: s.arcDeg,
    range: s.range,
    dash: s.moveDistance,
  }));
}

describe('技 1 大上段斬り: frame data (6.3)', () => {
  it('matches the spec table for P1 and P2', () => {
    expect(table('overhead', 1)).toEqual([
      {
        startup: 48,
        active: 8,
        recovery: 52,
        damage: 110,
        poise: 70,
        guard: 60,
        arc: 60,
        range: 4.5,
        dash: 0,
      },
    ]);
    expect(table('overhead', 2)).toEqual([
      {
        startup: 42,
        active: 8,
        recovery: 44,
        damage: 120,
        poise: 70,
        guard: 60,
        arc: 60,
        range: 4.5,
        dash: 0,
      },
    ]);
  });

  it('is usable in both phases, and tracks the target only until F30 (90 deg/s in P1)', () => {
    expect(move('overhead').phases).toEqual([1, 2]);
    for (const phase of [1, 2] as const) {
      const [stage] = stagesOf(move('overhead'), phase);
      if (!stage) throw new Error('no stage');
      expect(trackEndFrame(stage)).toBe(30);
      // 追尾終了から判定までに向き固定の猶予がある（P1 は 18F、P2 は 12F）
      expect(stage.startup - trackEndFrame(stage)).toBeGreaterThanOrEqual(BOSS_MIN_LOCKED_FRAMES);
    }
    expect(stagesOf(move('overhead'), 1)[0]?.trackDegPerSecond).toBe(90);
    // P2 は指定なし = フェーズの旋回速度（120°/s）
    expect(stagesOf(move('overhead'), 2)[0]?.trackDegPerSecond).toBeUndefined();
  });

  it('has super armor from the start of the wind-up through the active frames in P2 only', () => {
    expect(stagesOf(move('overhead'), 1)[0]?.superArmor).toBeUndefined();
    expect(stagesOf(move('overhead'), 2)[0]?.superArmor).toEqual({ start: 1, end: 50 });
  });

  it('reaches 4.5m from the boss, with the apex in front of the body (the dive-through zone)', () => {
    const m = move('overhead');
    const stage = stagesOf(m, 1)[0];
    if (!stage || !m.hooks?.shape) throw new Error('no shape');
    const shape = m.hooks.shape(
      {
        boss: {
          position: { x: 0, y: 0, z: 0 },
          yaw: 0,
          moveBy: () => undefined,
          turnToward: () => undefined,
        },
        target: { x: 0, y: 0, z: 3 },
        phase: 1,
        random: () => 0,
        stageIndex: 0,
        frame: 48,
      } as never,
      stage,
    ) as SectorShape;
    expect(shape.arcDeg).toBe(60);
    expect(shape.origin.z).toBeCloseTo(OVERHEAD_APEX_OFFSET);
    expect(shape.origin.z + shape.range).toBeCloseTo(OVERHEAD_REACH);
  });
});

describe('技 2 薙ぎ払い: frame data (6.3)', () => {
  it('matches the spec table for P1 and P2 (P2 has two sweeps)', () => {
    expect(table('sweep', 1)).toEqual([
      {
        startup: 40,
        active: 10,
        recovery: 48,
        damage: 95,
        poise: 60,
        guard: 52,
        arc: 200,
        range: 5,
        dash: 0,
      },
    ]);
    const p2 = table('sweep', 2);
    expect(p2).toHaveLength(2);
    // 1 発目: 発生 34・硬直（2 発目までの間）8・ダメージ 105
    expect(p2[0]).toMatchObject({ startup: 34, active: 10, damage: 105, arc: 200, range: 5 });
    // 2 発目: 発生 24・ダメージ 90・最終硬直 40（P2 の硬直）
    expect(p2[1]).toMatchObject({
      startup: 24,
      active: 10,
      recovery: 40,
      damage: 90,
      poise: 60,
      guard: 52,
    });
    expect(stagesOf(move('sweep'), 2)[1]?.followUp).toBe(true);
  });

  it('swings the second hit in the opposite direction', () => {
    expect(SWEEP_SWING['sweep.1']).not.toBe(SWEEP_SWING['sweep.2']);
  });

  it('has super armor in P2 (each hit) and not in P1', () => {
    expect(stagesOf(move('sweep'), 1)[0]?.superArmor).toBeUndefined();
    const [a, b] = stagesOf(move('sweep'), 2);
    expect(a?.superArmor).toEqual({ start: 1, end: 44 });
    expect(b?.superArmor).toEqual({ start: 1, end: 34 });
  });

  it('hits between 0.5m and 2.5m above the floor', () => {
    const m = move('sweep');
    const stage = stagesOf(m, 1)[0];
    if (!stage || !m.hooks?.shape) throw new Error('no shape');
    const shape = m.hooks.shape(
      {
        boss: {
          position: { x: 1, y: 2, z: 3 },
          yaw: 0.5,
          moveBy: () => undefined,
          turnToward: () => undefined,
        },
        target: { x: 0, y: 0, z: 0 },
        phase: 1,
        random: () => 0,
        stageIndex: 0,
        frame: 41,
      } as never,
      stage,
    ) as SectorShape;
    expect([shape.yMin, shape.yMax]).toEqual([SWEEP_HEIGHT.min, SWEEP_HEIGHT.max]);
    expect(shape.origin).toMatchObject({ x: 1, y: 2, z: 3 });
    expect(shape.arcDeg).toBe(200);
    expect(shape.range).toBe(5);
  });
});

describe('技 3 三連撃: frame data (6.3)', () => {
  it('matches the spec table for P1', () => {
    expect(table('combo3', 1)).toEqual([
      {
        startup: 30,
        active: 6,
        recovery: 8,
        damage: 80,
        poise: 40,
        guard: 40,
        arc: 90,
        range: 5,
        dash: 0,
      },
      {
        startup: 20,
        active: 6,
        recovery: 8,
        damage: 80,
        poise: 40,
        guard: 40,
        arc: 80,
        range: 5,
        dash: 0,
      },
      {
        startup: 36,
        active: 8,
        recovery: 56,
        damage: 100,
        poise: 60,
        guard: 55,
        arc: 30,
        range: 5,
        dash: COMBO3_THRUST_DISTANCE,
      },
    ]);
  });

  it('matches the spec table for P2 (startup 24/16/30, damage 85/85/105, final recovery 46)', () => {
    expect(table('combo3', 2)).toEqual([
      {
        startup: 24,
        active: 6,
        recovery: 8,
        damage: 85,
        poise: 40,
        guard: 40,
        arc: 90,
        range: 5,
        dash: 0,
      },
      {
        startup: 16,
        active: 6,
        recovery: 8,
        damage: 85,
        poise: 40,
        guard: 40,
        arc: 80,
        range: 5,
        dash: 0,
      },
      {
        startup: 30,
        active: 8,
        recovery: 46,
        damage: 105,
        poise: 60,
        guard: 55,
        arc: 30,
        range: 5,
        dash: COMBO3_THRUST_DISTANCE,
      },
    ]);
  });

  it('has an 8F gap between stages, and the stage 2 / 3 are follow-ups', () => {
    for (const phase of [1, 2] as const) {
      const [a, b, c] = stagesOf(move('combo3'), phase);
      expect([a?.recovery, b?.recovery]).toEqual([8, 8]);
      expect([a?.followUp, b?.followUp, c?.followUp]).toEqual([undefined, true, true]);
    }
  });

  it('swings stage 2 in the direction opposite to stage 1, then thrusts', () => {
    expect(COMBO3_SWING[0]).not.toBe(COMBO3_SWING[1]);
    expect(COMBO3_SWING[2]).toBe('thrust');
    expect(COMBO3_SWING).toHaveLength(3);
  });

  it('is a close-range move without super armor', () => {
    for (const phase of [1, 2] as const) {
      for (const s of stagesOf(move('combo3'), phase)) expect(s.superArmor).toBeUndefined();
    }
  });

  it('kills a 300 HP player in 3 hits (about 2-3 hits as designed)', () => {
    for (const phase of [1, 2] as const) {
      const total = stagesOf(move('combo3'), phase).reduce((n, s) => n + s.damage, 0);
      expect(total).toBeLessThan(300);
      expect(total + 80).toBeGreaterThanOrEqual(300);
    }
  });
});

describe('テレグラフ基準 (5.1) をボスの基準で満たす', () => {
  const ids = ['overhead', 'sweep', 'combo3'] as const;

  it('passes checkBossMove for every move (P1 and P2)', () => {
    for (const id of ids) expect(checkBossMove(move(id)), id).toEqual([]);
  });

  it('keeps every stage within the telegraph floors (24F normal / 34F heavy / 16F follow-up) and 4F+ active', () => {
    for (const id of ids) {
      for (const phase of [1, 2] as const) {
        for (const s of stagesOf(move(id), phase)) {
          const floor = s.followUp
            ? 16
            : s.heavy
              ? ENEMY_ATTACK_RULES.minHeavyStartup
              : ENEMY_ATTACK_RULES.minStartup;
          expect(s.startup, s.id).toBeGreaterThanOrEqual(floor);
          expect(s.active, s.id).toBeGreaterThanOrEqual(ENEMY_ATTACK_RULES.minActive);
          // 向き固定の猶予（ロールで躱す余裕）
          expect(s.startup - trackEndFrame(s), s.id).toBeGreaterThanOrEqual(BOSS_MIN_LOCKED_FRAMES);
          // 最初の段は反応から回避完了まで 26F 以上（発生 + 持続）
          if (!s.followUp)
            expect(s.startup + s.active, s.id).toBeGreaterThanOrEqual(
              ENEMY_ATTACK_RULES.minDodgeWindow,
            );
        }
      }
    }
  });

  it('starts the first stage of the 1st-hit moves from at least 30F (the roll-spam correction keeps this)', () => {
    for (const id of ids) {
      for (const phase of [1, 2] as const) {
        // 三連撃 P2 の 1 段目は 24F（ロール連打の補正のときだけ 30F へ延ばす = boss.ts の comboMinStartup）
        const first = stagesOf(move(id), phase)[0];
        expect(first?.startup).toBeGreaterThanOrEqual(id === 'combo3' && phase === 2 ? 24 : 30);
      }
    }
  });

  it('uses heavy for the strong attacks and normal for the quick slashes (none is unblockable)', () => {
    const kinds = (id: (typeof ids)[number], phase: 1 | 2) =>
      stagesOf(move(id), phase).map((s) => telegraphKindOf(s));
    expect(kinds('overhead', 1)).toEqual(['heavy']);
    expect(kinds('overhead', 2)).toEqual(['heavy']);
    expect(kinds('sweep', 1)).toEqual(['heavy']);
    expect(kinds('sweep', 2)).toEqual(['heavy', 'heavy']);
    expect(kinds('combo3', 1)).toEqual(['normal', 'normal', 'heavy']);
    expect(kinds('combo3', 2)).toEqual(['normal', 'normal', 'heavy']);
    // 強攻撃（heavy フラグ）は赤橙のテレグラフと一致する
    for (const id of ids) {
      for (const s of stagesOf(move(id), 1)) if (s.heavy) expect(telegraphKindOf(s)).toBe('heavy');
    }
  });

  it('resolves the telegraph kind of the running stage from the boss debug info', () => {
    expect(bossTelegraphOf({ move: 'combo3', stage: 1 }, 1)).toBe('normal');
    expect(bossTelegraphOf({ move: 'combo3', stage: 3 }, 2)).toBe('heavy');
    expect(bossTelegraphOf({ move: 'sweep', stage: 2 }, 2)).toBe('heavy');
    expect(bossTelegraphOf({ move: 'sweep', stage: 2 }, 1)).toBeNull(); // P1 の薙ぎ払いは 1 発
    expect(bossTelegraphOf({ move: null, stage: 0 }, 1)).toBeNull();
  });
});

describe('マーカー表 (anim/data/bossClips.json)', () => {
  const defs = (['overhead', 'sweep', 'combo3'] as const).flatMap((id) =>
    ([1, 2] as const).flatMap((phase) =>
      stagesOf(move(id), phase).map((stage) => ({ phase, stage })),
    ),
  );

  it('has one entry per stage and phase, matching the frame data', () => {
    expect(bossClipEvents.entries).toHaveLength(defs.length);
    for (const { phase, stage } of defs) {
      const entry = findBossClipEvents(`boss.${stage.id}.p${phase}`);
      if (!entry) throw new Error(`no marker entry for ${stage.id} P${phase}`);
      expect(entry.spec, entry.id).toEqual({
        startup: stage.startup,
        active: stage.active,
        recovery: stage.recovery,
      });
      expect(totalFrames(stage)).toBe(entry.spec.startup + entry.spec.active + entry.spec.recovery);
      expect(markersOfType(entry, 'hitStart').map((m) => m.frame)).toEqual([stage.startup + 1]);
      expect(markersOfType(entry, 'hitEnd').map((m) => m.frame)).toEqual([
        stage.startup + stage.active,
      ]);
    }
  });

  it('uses the planned UAL clips', () => {
    expect(findBossClipEvents('boss.overhead.1.p1')?.clip).toBe('Sword_Heavy_Combo');
    expect(findBossClipEvents('boss.sweep.1.p1')?.clip).toBe('Sword_Regular_B');
    expect(findBossClipEvents('boss.sweep.2.p2')?.clip).toBe('Melee_Hook');
    for (const n of [1, 2, 3])
      expect(findBossClipEvents(`boss.combo3.${n}.p1`)?.clip).toBe('Sword_Regular_Combo');
  });

  it('plays P2 about 1.15x faster for the moves whose startup shortens by that ratio (overhead 48 -> 42)', () => {
    const p1 = findBossClipEvents('boss.overhead.1.p1');
    const p2 = findBossClipEvents('boss.overhead.1.p2');
    if (!p1 || !p2) throw new Error('missing');
    expect(playbackRate(p2) / playbackRate(p1)).toBeCloseTo(48 / 42, 5);
    expect(playbackRate(p2) / playbackRate(p1)).toBeGreaterThan(1.1);
    expect(playbackRate(p2) / playbackRate(p1)).toBeLessThan(1.2);
  });
});
