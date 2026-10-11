import { describe, expect, it } from 'vitest';
import { ASHEN_FOUNDATION } from '../../game/world/ashenFoundation';
import { createLevel } from '../../game/world/level';
import {
  FLOW_SPEED,
  MAX_WALL_DISTANCE,
  buildWaterGrid,
  buildWaterSurface,
  cellIndex,
  isWater,
  waterBounds,
} from './waterLayout';
import { waterLayoutInput } from './waterwayLevel';

const level = createLevel(ASHEN_FOUNDATION);
const way = level.data.waterways?.[0];
if (!way) throw new Error('no waterway');
const input = waterLayoutInput(level, way);
const grid = buildWaterGrid(input, 0.1);

const flowAt = (x: number, z: number): [number, number] => {
  const k = cellIndex(grid, x, z);
  return [grid.flow[k * 2] ?? 0, grid.flow[k * 2 + 1] ?? 0];
};

describe('water grid of the side waterway', () => {
  it('covers the water rects with a land border and excludes the sarcophagus', () => {
    const b = waterBounds(way.rects);
    expect(grid.originX).toBeLessThan(b.minX);
    expect(grid.originZ).toBeLessThan(b.minZ);
    expect(isWater(grid, 44, 28)).toBe(true); // 床板の真下
    expect(isWater(grid, 55, 28)).toBe(true); // 東西の水路
    expect(isWater(grid, 66, 35)).toBe(true); // 北の水路
    expect(isWater(grid, 63, 34)).toBe(true); // 墓室
    expect(isWater(grid, 61.3, 35)).toBe(false); // 石棺
    expect(isWater(grid, 55, 30)).toBe(false); // 壁の外
    expect(isWater(grid, 66, 41)).toBe(false); // 上り階段
    // 外周は陸（4 近傍が格子からはみ出さない）
    for (let i = 0; i < grid.nx; i++) {
      expect(grid.mask[i]).toBe(0);
      expect(grid.mask[(grid.nz - 1) * grid.nx + i]).toBe(0);
    }
    expect(grid.surfaceY - grid.floorY).toBeCloseTo(way.depth, 6);
  });

  it('measures the distance to the nearest wall', () => {
    const d = (x: number, z: number): number => grid.wallDistance[cellIndex(grid, x, z)] ?? -1;
    // 幅 2m の水路の中央は壁から約 1m、壁際は 0 付近
    expect(d(55, 28)).toBeGreaterThan(0.85);
    expect(d(55, 28)).toBeLessThanOrEqual(MAX_WALL_DISTANCE);
    expect(d(55, 27.05)).toBeLessThan(0.1);
    // 石棺の際も近い
    expect(d(62.2, 35)).toBeLessThan(0.2);
  });

  it('flows from the stairs down the north channel, then west along the tunnel; the chamber is almost still', () => {
    const [nx, nz] = flowAt(66, 34);
    expect(nz).toBeLessThan(-FLOW_SPEED * 0.5); // 南へ
    expect(Math.abs(nx)).toBeLessThan(Math.abs(nz));
    const [wx, wz] = flowAt(55, 28);
    expect(wx).toBeLessThan(-FLOW_SPEED * 0.5); // 西へ
    expect(Math.abs(wz)).toBeLessThan(Math.abs(wx));
    const [cx, cz] = flowAt(61, 33.5);
    expect(Math.hypot(cx, cz)).toBeLessThan(FLOW_SPEED * 0.25);
  });
});

describe('water surface mesh', () => {
  const rects = way.rects.filter((r) => r.water);
  const mesh = buildWaterSurface(rects, grid.surfaceY, 0.25);

  it('tiles the water rects exactly (area) with upward-facing triangles', () => {
    const p = mesh.positions;
    let area = 0;
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const [a, b, c] = [mesh.indices[t], mesh.indices[t + 1], mesh.indices[t + 2]].map(
        (i) => (i ?? 0) * 3,
      ) as [number, number, number];
      const ux = (p[b] ?? 0) - (p[a] ?? 0);
      const uz = (p[b + 2] ?? 0) - (p[a + 2] ?? 0);
      const vx = (p[c] ?? 0) - (p[a] ?? 0);
      const vz = (p[c + 2] ?? 0) - (p[a + 2] ?? 0);
      // 法線 (u × v) が +y
      const ny = uz * vx - ux * vz;
      expect(ny).toBeGreaterThan(0);
      area += ny / 2;
    }
    const expected = rects.reduce((s, r) => s + (r.maxX - r.minX) * (r.maxZ - r.minZ), 0);
    expect(area).toBeCloseTo(expected, 3);
  });

  it('shares vertices along rect seams (no T-junctions)', () => {
    // 区画の境界上の頂点は、境界の両側の四角が同じ頂点を使う → 位置が重複しない
    const seen = new Set<string>();
    const p = mesh.positions;
    for (let i = 0; i < p.length; i += 3) {
      const key = `${(p[i] ?? 0).toFixed(4)},${(p[i + 2] ?? 0).toFixed(4)}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
    // すべての辺は高々 2 つの三角形に共有され、境界の辺上に他の頂点が乗っていない（T 字なし）
    const edges = new Map<string, number>();
    for (let t = 0; t < mesh.indices.length; t += 3) {
      for (let e = 0; e < 3; e++) {
        const a = mesh.indices[t + e] ?? 0;
        const b = mesh.indices[t + ((e + 1) % 3)] ?? 0;
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
    }
    for (const n of edges.values()) expect(n).toBeLessThanOrEqual(2);
  });
});
