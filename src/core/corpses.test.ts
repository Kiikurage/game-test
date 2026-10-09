import { describe, expect, it } from 'vitest';
import {
  CORPSE_POSES,
  CORPSE_VARIANTS,
  corpsePlacement,
  corpsePlacements,
  isCorpsePose,
  yawAwayFrom,
  yawToward,
  type CorpsePose,
} from './corpses';

describe('corpsePlacement', () => {
  it('specifies pose, position and yaw', () => {
    const p = corpsePlacement({ pose: 'prone', x: 24, z: 9, y: 0.5, yaw: 1.2, variant: 'broad' });
    expect(p).toEqual({ pose: 'prone', variant: 'broad', position: [24, 0.5, 9], yaw: 1.2 });
  });

  it('defaults to ground level, yaw 0 and a variant derived from the index', () => {
    const p = corpsePlacement({ pose: 'sitting', x: 1, z: 2 }, 5);
    expect(p.position).toEqual([1, 0, 2]);
    expect(p.yaw).toBe(0);
    expect(p.variant).toBe(CORPSE_VARIANTS[5 % CORPSE_VARIANTS.length]);
  });

  it('does not repeat the same variant for neighbours when the variant is omitted', () => {
    const list = corpsePlacements(
      Array.from({ length: 8 }, (_, i) => ({ pose: 'sitting' as const, x: i, z: 0 })),
    );
    for (let i = 1; i < list.length; i++) expect(list[i]?.variant).not.toBe(list[i - 1]?.variant);
  });

  it('is deterministic', () => {
    const specs = CORPSE_POSES.map((pose, i) => ({ pose, x: i, z: -i }));
    expect(corpsePlacements(specs)).toEqual(corpsePlacements(specs));
  });

  it('rejects unknown poses and variants', () => {
    expect(() => corpsePlacement({ pose: 'flying' as CorpsePose, x: 0, z: 0 })).toThrow();
    expect(() =>
      corpsePlacement({ pose: 'sitting', x: 0, z: 0, variant: 'ghost' as never }),
    ).toThrow();
    expect(isCorpsePose('praying')).toBe(true);
    expect(isCorpsePose('dancing')).toBe(false);
  });

  it('provides the four poses of the spec (14.7)', () => {
    expect([...CORPSE_POSES].sort()).toEqual(['leaning', 'praying', 'prone', 'sitting']);
  });
});

describe('yaw helpers', () => {
  const gate = { x: 101, z: 64 };
  const here = { x: 24, z: 9 };
  it('faces toward / away from a point', () => {
    const toward = yawToward(here, gate);
    const away = yawAwayFrom(here, gate);
    const dir = (yaw: number): [number, number] => [Math.sin(yaw), Math.cos(yaw)];
    const dx = gate.x - here.x;
    const dz = gate.z - here.z;
    const len = Math.hypot(dx, dz);
    expect(dir(toward)[0] * (dx / len) + dir(toward)[1] * (dz / len)).toBeCloseTo(1, 9);
    // 門とは逆向きに這った遺体（14.7 節）: 向きは門の方向と正反対
    expect(dir(away)[0] * (dx / len) + dir(away)[1] * (dz / len)).toBeCloseTo(-1, 9);
  });
});
