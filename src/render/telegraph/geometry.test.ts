import { describe, expect, it } from 'vitest';
import { GROUND_LIFT, createDiscMesh, createStripMesh, placeOnTerrain } from './geometry';

const slope = (x: number, z: number): number => 0.3 * x + 0.1 * z + 2;

describe('telegraph geometry', () => {
  it('builds a disc with a centre vertex and concentric rings', () => {
    const m = createDiscMesh(4, 16);
    expect(m.local.length / 2).toBe(1 + 4 * 16);
    const outer = Math.hypot(m.local[(1 + 3 * 16) * 2] ?? 0, m.local[(1 + 3 * 16) * 2 + 1] ?? 0);
    expect(outer).toBeCloseTo(1, 6);
    expect(m.geometry.index?.count).toBe((16 + 3 * 16 * 2) * 3);
  });

  it('builds a strip of unit width and length', () => {
    const m = createStripMesh(10, 2);
    expect(m.local.length / 2).toBe(11 * 3);
    const xs = Array.from({ length: m.local.length / 2 }, (_, i) => m.local[i * 2] ?? 0);
    expect(Math.min(...xs)).toBeCloseTo(-0.5);
    expect(Math.max(...xs)).toBeCloseTo(0.5);
  });

  it('places every vertex on the terrain surface plus the lift (slope)', () => {
    const m = createDiscMesh(3, 12);
    placeOnTerrain(m, 10, -4, 0.7, 3.5, 3.5, slope);
    for (let i = 0; i < m.local.length / 2; i++) {
      const x = m.positions[i * 3] ?? 0;
      const y = m.positions[i * 3 + 1] ?? 0;
      const z = m.positions[i * 3 + 2] ?? 0;
      expect(y).toBeCloseTo(slope(x, z) + GROUND_LIFT, 5);
    }
  });

  it('orients the strip along yaw with the requested size', () => {
    const m = createStripMesh(4, 2);
    // yaw = 90°: ローカル +z がワールド +x を向く
    placeOnTerrain(m, 0, 0, Math.PI / 2, 1.5, 12, () => 0);
    const last = m.local.length / 2 - 1; // (x=0.5, z=1)
    expect(m.positions[last * 3]).toBeCloseTo(12, 5);
    expect(Math.abs(m.positions[last * 3 + 2] ?? 0)).toBeCloseTo(0.75, 5);
  });
});
