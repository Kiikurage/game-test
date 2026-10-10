import { describe, expect, it } from 'vitest';
import { createLevel } from './level';
import { ASHEN_FOUNDATION } from './ashenFoundation';
import { arenaMoodWeight, arenaOf, isArenaProp } from './arena';

describe('arenaOf', () => {
  const level = createLevel(ASHEN_FOUNDATION);
  const arena = arenaOf(level);

  it('reads the Ø32 circle, 4 pillars (r 0.7, h 4) and the pedestal from the level', () => {
    expect(arena).not.toBeNull();
    if (!arena) return;
    expect(arena.circle).toEqual({ x: 122, z: 86, radius: 16 });
    expect(arena.pillars).toHaveLength(4);
    for (const p of arena.pillars) {
      expect(p.radius).toBeCloseTo(0.7, 6);
      expect(Math.hypot(p.x - 122, p.z - 86)).toBeCloseTo(12, 6);
    }
    expect(arena.pillarHeight).toBeCloseTo(4, 6);
  });

  it('exposes the bonfire slot on top of the pedestal', () => {
    if (!arena) throw new Error('no arena');
    expect(arena.bonfireSlot.x).toBe(122);
    expect(arena.bonfireSlot.z).toBe(86);
    expect(arena.bonfireSlot.y).toBeCloseTo(level.heightAt(122, 86) + 0.9, 1);
    expect(arena.pedestal.topY).toBe(arena.bonfireSlot.y);
  });

  it('puts the entry on the fog-gate side (south-west)', () => {
    if (!arena) throw new Error('no arena');
    expect(arena.entry.x).toBeLessThan(arena.center.x);
    expect(arena.entry.z).toBeLessThan(arena.center.z);
    expect(Math.hypot(arena.entry.x - 122, arena.entry.z - 86)).toBeCloseTo(16.5, 0);
  });

  it('has the fog gate target 3m inside the arena entry, facing the center', () => {
    if (!arena) throw new Error('no arena');
    const spawn = level.data.interactables.find((i) => i.id === 'fog-gate');
    const target = spawn?.target;
    if (!target) throw new Error('no fog gate target');
    expect(Math.hypot(target.x - arena.entry.x, target.z - arena.entry.z)).toBeCloseTo(3, 0);
    expect(Math.hypot(target.x - arena.center.x, target.z - arena.center.z)).toBeLessThan(
      arena.circle.radius - 2,
    );
    const toCenter = Math.atan2(arena.center.x - target.x, arena.center.z - target.z);
    expect(target.yaw).toBeCloseTo(toCenter, 6);
  });

  it('recognises the props replaced by the arena view', () => {
    expect(isArenaProp('f-wall-3')).toBe(true);
    expect(isArenaProp('f-pillar-1')).toBe(true);
    expect(isArenaProp('f-pedestal')).toBe(true);
    expect(isArenaProp('f-pass-l')).toBe(false);
  });

  it('ramps the mood weight smoothly from the courtyard to the arena', () => {
    if (!arena) throw new Error('no arena');
    const at = (x: number, z: number): number => arenaMoodWeight(arena, x, z);
    expect(at(90, 55)).toBe(0);
    expect(at(122, 86)).toBe(1);
    expect(at(122, 86 - 16)).toBe(1);
    const gate = at(104, 68);
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThan(1);
    let prev = 0;
    for (let i = 0; i <= 20; i++) {
      const w = at(100 + i * 1.1, 64 + i * 1.1);
      expect(w).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = w;
    }
  });
});
