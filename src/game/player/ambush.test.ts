import { describe, expect, it } from 'vitest';
import { AMBUSH, HIT_STOP, PLAYER_ACTIONS, PLAYER_STATS, attackDamage, totalFrames } from '../data';
import { activeWindow } from '../data';
import { parseClipEventTable } from '../anim/eventMarkers';
import playerClipsJson from '../anim/data/playerClips.json';
import type { EnemyStateId } from '../enemy/enemyStates';
import { inAmbushRange, isAmbushableState, snapDelta, snapGoal, snapProgress } from './ambush';

const DEG = Math.PI / 180;

/** 対象は原点で +z を向く。背面は −z。`angleDeg` は背面からのずれ（右が正）、`distance` は水平距離。 */
function playerAt(angleDeg: number, distance: number, y = 0): { x: number; y: number; z: number } {
  return {
    x: Math.sin(angleDeg * DEG) * distance,
    y,
    z: -Math.cos(angleDeg * DEG) * distance,
  };
}

describe('致命の一撃の条件（境界値）', () => {
  const target = { x: 0, y: 0, z: 0 };

  it('背面 ±60°: 59° は成立、61° は不成立（左右対称）', () => {
    expect(inAmbushRange(playerAt(0, 1), target, 0)).toBe(true);
    expect(inAmbushRange(playerAt(59, 1), target, 0)).toBe(true);
    expect(inAmbushRange(playerAt(-59, 1), target, 0)).toBe(true);
    expect(inAmbushRange(playerAt(61, 1), target, 0)).toBe(false);
    expect(inAmbushRange(playerAt(-61, 1), target, 0)).toBe(false);
    // 側面・正面は不成立
    expect(inAmbushRange(playerAt(90, 1), target, 0)).toBe(false);
    expect(inAmbushRange(playerAt(180, 1), target, 0)).toBe(false);
  });

  it('背面 60° ちょうどは成立（境界を含む）', () => {
    expect(inAmbushRange(playerAt(60, 1), target, 0)).toBe(true);
  });

  it('対象の向きに追従する（ヨーを回しても背面の定義は相対）', () => {
    const yaw = 90 * DEG; // +x を向く → 背面は −x
    expect(inAmbushRange({ x: -1, y: 0, z: 0 }, target, yaw)).toBe(true);
    expect(inAmbushRange({ x: 1, y: 0, z: 0 }, target, yaw)).toBe(false);
    expect(inAmbushRange({ x: -1, y: 0, z: 1.2 }, target, yaw)).toBe(true); // 約 50°
    expect(inAmbushRange({ x: -1, y: 0, z: 2 }, target, yaw)).toBe(false); // 約 63°
  });

  it('水平距離 1.6m: 1.59 は成立、1.61 は不成立', () => {
    expect(inAmbushRange(playerAt(0, 1.59), target, 0)).toBe(true);
    expect(inAmbushRange(playerAt(0, AMBUSH.maxDistanceM), target, 0)).toBe(true);
    expect(inAmbushRange(playerAt(0, 1.61), target, 0)).toBe(false);
    expect(inAmbushRange(playerAt(30, 1.61), target, 0)).toBe(false);
  });

  it('高低差 1.0m: 0.99 / 1.0 は成立、1.01 は不成立（上下とも）', () => {
    expect(inAmbushRange(playerAt(0, 1, 0.99), target, 0)).toBe(true);
    expect(inAmbushRange(playerAt(0, 1, 1.0), target, 0)).toBe(true);
    expect(inAmbushRange(playerAt(0, 1, -1.0), target, 0)).toBe(true);
    expect(inAmbushRange(playerAt(0, 1, 1.01), target, 0)).toBe(false);
    expect(inAmbushRange(playerAt(0, 1, -1.01), target, 0)).toBe(false);
  });

  it('対象の AI 状態: Idle / Suspicious のみ（Alert 以降・崩し中・死亡は不可）', () => {
    const ok: EnemyStateId[] = ['idle', 'suspicious'];
    const ng: EnemyStateId[] = [
      'alert',
      'chase',
      'approach',
      'attack',
      'recover',
      'return',
      'staggered',
      'dead',
    ];
    for (const s of ok) expect(isAmbushableState(s), s).toBe(true);
    for (const s of ng) expect(isAmbushableState(s), s).toBe(false);
  });
});

describe('致命の一撃の吸着', () => {
  it('目標は対象の背後 0.9m', () => {
    const out = { x: 0, z: 0 };
    snapGoal({ x: 2, y: 0, z: 3 }, 0, out);
    expect(out.x).toBeCloseTo(2, 6);
    expect(out.z).toBeCloseTo(3 - AMBUSH.snapDistanceM, 6);
    snapGoal({ x: 0, y: 0, z: 0 }, 90 * DEG, out); // +x を向く → 背後は −x
    expect(out.x).toBeCloseTo(-AMBUSH.snapDistanceM, 6);
    expect(out.z).toBeCloseTo(0, 6);
  });

  it('補正は最大 1.2m（それ以下ならそのまま）', () => {
    const out = { x: 0, z: 0 };
    snapDelta({ x: 0, z: 0 }, { x: 0, z: 0.5 }, out);
    expect(Math.hypot(out.x, out.z)).toBeCloseTo(0.5, 6);
    snapDelta({ x: 0, z: 0 }, { x: 3, z: 4 }, out);
    expect(Math.hypot(out.x, out.z)).toBeCloseTo(AMBUSH.snapMaxM, 6);
    expect(out.x / out.z).toBeCloseTo(0.75, 6); // 向きは保つ
  });

  it('1.6m・背面 60° の端からでも 1.2m の補正で目標付近へ届く', () => {
    const p = playerAt(60, 1.6);
    const goal = { x: 0, z: 0 };
    snapGoal({ x: 0, y: 0, z: 0 }, 0, goal);
    const d = { x: 0, z: 0 };
    snapDelta(p, goal, d);
    expect(Math.hypot(d.x, d.z)).toBeLessThanOrEqual(AMBUSH.snapMaxM + 1e-9);
    // 補正後の対象との距離は 1.6m より近づく
    expect(Math.hypot(p.x + d.x, p.z + d.z)).toBeLessThan(1.6);
  });

  it('進み具合は 6F で 1 に達し、単調に増える', () => {
    expect(snapProgress(0)).toBe(0);
    expect(snapProgress(AMBUSH.snapFrames)).toBe(1);
    expect(snapProgress(AMBUSH.snapFrames + 5)).toBe(1);
    for (let f = 1; f <= AMBUSH.snapFrames; f++) {
      expect(snapProgress(f)).toBeGreaterThan(snapProgress(f - 1));
    }
  });
});

describe('致命の一撃のフレームデータ（仕様 14.3.2 節）', () => {
  const data = PLAYER_ACTIONS.backstab;

  it('発生 10 / 持続 3 / 硬直 34 / 全体 47、スタミナ 16、強靭度削り 100', () => {
    expect([data.startup, data.active, data.recovery]).toEqual([10, 3, 34]);
    expect(totalFrames(data)).toBe(47);
    expect(data.staminaCost).toBe(16);
    expect(data.poiseDamage).toBe(100);
  });

  it('倍率 ×4.0 = 直剣 160（墓守の大剣 220 の倍率計算にも使える）', () => {
    expect(data.damageMultiplier).toBe(4.0);
    expect(attackDamage(PLAYER_STATS.attackPower, data.damageMultiplier)).toBe(160);
    expect(attackDamage(55, data.damageMultiplier)).toBe(220);
  });

  it('ヒットストップは 14F', () => {
    expect(HIT_STOP.playerBackstab).toBe(14);
  });

  it('マーカー表: 当たり窓は F11–F13（発生 10 の次〜持続 3）、前後のフレームは窓の外', () => {
    const entry = parseClipEventTable(playerClipsJson).entries.find(
      (e) => e.id === 'player.backstab',
    );
    expect(entry).toBeDefined();
    const w = activeWindow(data);
    expect(w).toEqual({ start: 11, end: 13 });
    const starts = entry?.markers.filter((m) => m.type === 'hitStart').map((m) => m.frame);
    const ends = entry?.markers.filter((m) => m.type === 'hitEnd').map((m) => m.frame);
    expect(starts).toEqual([11]);
    expect(ends).toEqual([13]);
    expect(entry?.clip).toBe('Sword_Thrust');
    expect(entry?.spec).toEqual({ startup: 10, active: 3, recovery: 34 });
  });
});
