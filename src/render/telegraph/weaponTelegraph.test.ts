import { describe, expect, it } from 'vitest';
import { Group, Mesh } from 'three/webgpu';
import { UNDEAD_SOLDIER_ATTACKS, enemyAttackByAction, telegraphKindOf } from '../../game/data';
import {
  PULSE_FRAMES,
  RAMP_FRAMES,
  WEAPON_TELEGRAPH,
  enemyTelegraph,
  weaponTelegraphAmount,
} from './weaponTelegraph';
import { applyUndeadLook } from '../undead/undeadMaterial';
import { UNDEAD_VARIANTS } from '../undead/variants';

const A1 = UNDEAD_SOLDIER_ATTACKS.a1;
const A2 = UNDEAD_SOLDIER_ATTACKS.a2;

describe('weaponTelegraphAmount', () => {
  it('starts at 0.5 of the peak and reaches 1.0 of the peak in 8 frames', () => {
    const peak = WEAPON_TELEGRAPH.normal.peak;
    expect(weaponTelegraphAmount(A1, 'normal', 1)).toBeCloseTo(0.5 * peak);
    expect(weaponTelegraphAmount(A1, 'normal', 1 + RAMP_FRAMES)).toBeCloseTo(peak);
    expect(weaponTelegraphAmount(A1, 'normal', 1 + RAMP_FRAMES / 2)).toBeCloseTo(0.75 * peak);
  });

  it('is off before the windup and after the fade', () => {
    expect(weaponTelegraphAmount(A1, 'normal', 0)).toBe(0);
    const end = A1.startup + WEAPON_TELEGRAPH.normal.fadeFrames;
    expect(weaponTelegraphAmount(A1, 'normal', end)).toBe(0);
  });

  it('keeps glowing through the active frames only for heavy attacks', () => {
    const f = A2.startup + 1;
    expect(weaponTelegraphAmount(A2, 'heavy', f)).toBeGreaterThan(
      weaponTelegraphAmount(A2, 'normal', f),
    );
    expect(weaponTelegraphAmount(A2, 'heavy', A2.startup + A2.active)).toBeCloseTo(
      WEAPON_TELEGRAPH.heavy.peak,
    );
  });

  it('is monotonic while ramping and fades monotonically', () => {
    let prev = 0;
    for (let f = 1; f <= 9; f++) {
      const a = weaponTelegraphAmount(A2, 'heavy', f);
      expect(a).toBeGreaterThanOrEqual(prev);
      prev = a;
    }
    const end = A2.startup + A2.active;
    prev = weaponTelegraphAmount(A2, 'heavy', end);
    for (let f = end + 1; f <= end + WEAPON_TELEGRAPH.heavy.fadeFrames; f++) {
      const a = weaponTelegraphAmount(A2, 'heavy', f);
      expect(a).toBeLessThanOrEqual(prev);
      prev = a;
    }
  });

  it('differs by strength and duration per kind so it does not rely on color alone', () => {
    const { normal, heavy, unblockable } = WEAPON_TELEGRAPH;
    expect(heavy.peak).toBeGreaterThan(normal.peak);
    expect(unblockable.peak).toBeGreaterThanOrEqual(heavy.peak);
    expect(heavy.fadeFrames).toBeGreaterThan(normal.fadeFrames);
    expect(heavy.holdThroughActive).toBe(true);
    expect(normal.holdThroughActive).toBe(false);
    expect(unblockable.pulse).toBeGreaterThan(0);
    const values = Array.from({ length: PULSE_FRAMES }, (_, i) =>
      weaponTelegraphAmount(A2, 'unblockable', 12 + i),
    );
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.05);
  });

  it('maps colors: normal is white-ish, heavy and unblockable are red-orange', () => {
    const channels = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255] as const;
    const [nr, ng, nb] = channels(WEAPON_TELEGRAPH.normal.color);
    expect(Math.min(nr, ng, nb)).toBeGreaterThan(200);
    for (const kind of ['heavy', 'unblockable'] as const) {
      const [r, g, b] = channels(WEAPON_TELEGRAPH[kind].color);
      expect(r).toBeGreaterThan(200);
      expect(g).toBeLessThan(110);
      expect(b).toBeLessThan(60);
    }
  });
});

describe('attack definitions', () => {
  it('classifies undead soldier attacks: A1 normal, A2 heavy', () => {
    expect(telegraphKindOf(UNDEAD_SOLDIER_ATTACKS.a1)).toBe('normal');
    expect(telegraphKindOf(UNDEAD_SOLDIER_ATTACKS.a2)).toBe('heavy');
    expect(telegraphKindOf({ ...A1, telegraph: 'unblockable' })).toBe('unblockable');
  });

  it('looks attacks up by action id', () => {
    expect(enemyAttackByAction('enemy.undead.a2')).toBe(A2);
    expect(enemyAttackByAction('enemy.undead.zzz')).toBeUndefined();
    expect(enemyAttackByAction(null)).toBeUndefined();
  });

  it('enemyTelegraph is off without a definition', () => {
    expect(enemyTelegraph(undefined, 10).amount).toBe(0);
    expect(enemyTelegraph(A2, 10).kind).toBe('heavy');
  });
});

describe('per-instance driving', () => {
  function enemyRoot(): Group {
    const root = new Group();
    const hand = new Group();
    hand.name = 'attach:sword';
    hand.add(new Mesh());
    root.add(hand);
    return root;
  }

  it('does not link the telegraph of one enemy to another', () => {
    const a = enemyRoot();
    const b = enemyRoot();
    const lookA = applyUndeadLook(a, UNDEAD_VARIANTS.gaunt);
    const lookB = applyUndeadLook(b, UNDEAD_VARIANTS.gaunt);
    lookA.setWeaponTelegraph(0.8, WEAPON_TELEGRAPH.heavy.color);
    expect(lookA.weaponTelegraph).toBeCloseTo(0.8);
    expect(lookB.weaponTelegraph).toBe(0);
    const matA = (a.children[0]?.children[0] as Mesh).material;
    const matB = (b.children[0]?.children[0] as Mesh).material;
    expect(matA).not.toBe(matB);
  });
});
