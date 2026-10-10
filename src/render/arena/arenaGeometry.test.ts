import { describe, expect, it } from 'vitest';
import type { BufferGeometry } from 'three/webgpu';
import {
  createColumnGeometry,
  createFloorDiscGeometry,
  createPedestalGeometry,
  createWallRingGeometry,
  triangleCount,
} from './arenaGeometry';

/** 三角形の幾何法線と頂点法線の向きが一致しない三角形の割合（巻き方向の検査）。 */
function inverted(g: BufferGeometry): number {
  const pos = g.getAttribute('position');
  const nor = g.getAttribute('normal');
  const idx = g.getIndex();
  if (!idx) throw new Error('no index');
  let bad = 0;
  let total = 0;
  for (let i = 0; i < idx.count; i += 3) {
    const [a, b, c] = [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)] as [number, number, number];
    const ux = pos.getX(b) - pos.getX(a);
    const uy = pos.getY(b) - pos.getY(a);
    const uz = pos.getZ(b) - pos.getZ(a);
    const vx = pos.getX(c) - pos.getX(a);
    const vy = pos.getY(c) - pos.getY(a);
    const vz = pos.getZ(c) - pos.getZ(a);
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    if (Math.hypot(nx, ny, nz) < 1e-9) continue;
    const dot = nx * nor.getX(a) + ny * nor.getY(a) + nz * nor.getZ(a);
    total++;
    if (dot < 0) bad++;
  }
  return total === 0 ? 0 : bad / total;
}

describe('arena geometry', () => {
  it('builds a column of the specified height whose shaft matches the collision radius', () => {
    const g = createColumnGeometry({ x: 10, y: 5, z: -3, radius: 0.7, height: 4 });
    g.computeBoundingBox();
    expect(g.boundingBox?.min.y).toBeCloseTo(5, 6);
    expect(g.boundingBox?.max.y).toBeCloseTo(9, 6);
    expect(triangleCount(g)).toBeLessThan(2500);
    expect(inverted(g)).toBe(0);
  });

  it('builds a pedestal whose rim is at the pedestal height', () => {
    const g = createPedestalGeometry({ x: 0, z: 0, y: 2, radius: 1.6, height: 0.9 });
    g.computeBoundingBox();
    expect(g.boundingBox?.max.y).toBeCloseTo(2.9, 6);
    expect(g.boundingBox?.max.x).toBeLessThanOrEqual(1.6 + 1e-6);
    expect(inverted(g)).toBe(0);
  });

  it('builds the wall ring inside the collision height, facing the arena', () => {
    const g = createWallRingGeometry({
      cx: 0,
      cz: 0,
      floorY: 1,
      inner: 16.1,
      outer: 17.2,
      height: 3.4,
      start: 0.3,
      end: 0.3 + 5.8,
    });
    g.computeBoundingBox();
    expect(g.boundingBox?.max.y).toBeLessThanOrEqual(1 + 3.4 + 1e-6);
    expect(g.boundingBox?.min.y).toBeCloseTo(1, 6);
    expect(inverted(g)).toBe(0);
    expect(triangleCount(g)).toBeLessThan(2500);
  });

  it('builds a flat floor disc', () => {
    const g = createFloorDiscGeometry(0, 0, 3, 16.5);
    expect(inverted(g)).toBe(0);
  });
});
