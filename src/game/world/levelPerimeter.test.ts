import { describe, expect, it } from 'vitest';
import { MOVEMENT } from '../data';
import { NavGrid } from '../enemy/navGrid';
import { ASHEN_FOUNDATION } from './ashenFoundation';
import { createLevel, type Level } from './level';

const level = createLevel(ASHEN_FOUNDATION);
const DEG = Math.PI / 180;

/** プレイヤーのカプセルの半径（余裕込み）と、乗り越えられる段差。 */
const PLAYER_RADIUS = 0.35;
const STEP = 0.35;
const CELL = 0.5;

interface Rect {
  readonly x: number;
  readonly z: number;
  readonly hx: number;
  readonly hz: number;
  readonly yawDeg: number;
  readonly top: number;
}

/**
 * 通行可能性の格子（0.5m）。セルは「傾斜が登坂限界以内」かつ「乗り越えられない固体の外」で歩ける。
 * 固体は箱・円柱（地面から 0.35m を超えるもの）と外周の透明壁、閉じた門、`block` で指定した矩形。
 */
function walkGrid(
  lv: Level,
  opts: {
    closedGates: readonly string[];
    blockRects?: readonly [number, number, number, number][];
  },
): { reach: (from: [number, number]) => Uint8Array; at: (x: number, z: number) => number } {
  const b = lv.data.bounds;
  const cols = Math.floor((b.maxX - b.minX) / CELL) + 1;
  const rows = Math.floor((b.maxZ - b.minZ) / CELL) + 1;
  const at = (x: number, z: number): number => {
    const ix = Math.round((x - b.minX) / CELL);
    const iz = Math.round((z - b.minZ) / CELL);
    return iz * cols + ix;
  };
  const solids: Rect[] = [];
  for (const box of lv.boxes) {
    solids.push({ ...box, yawDeg: box.yawDeg ?? 0, top: box.y + box.hy });
  }
  for (const g of lv.gates) {
    if (opts.closedGates.includes(g.def.id)) {
      solids.push({ ...g.box, yawDeg: g.box.yawDeg ?? 0, top: g.box.y + g.box.hy });
    }
  }
  const cyls = lv.cylinders;
  const blocked = new Uint8Array(cols * rows);
  const height = new Float32Array(cols * rows);
  for (let iz = 0; iz < rows; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const x = b.minX + ix * CELL;
      const z = b.minZ + iz * CELL;
      const i = iz * cols + ix;
      const h = lv.heightAt(x, z);
      height[i] = h;
      for (const s of solids) {
        if (s.top - h <= STEP) continue;
        const c = Math.cos(s.yawDeg * DEG);
        const sn = Math.sin(s.yawDeg * DEG);
        const dx = x - s.x;
        const dz = z - s.z;
        if (
          Math.abs(dx) > s.hx + s.hz + PLAYER_RADIUS ||
          Math.abs(dz) > s.hx + s.hz + PLAYER_RADIUS
        )
          continue;
        const lx = dx * c - dz * sn;
        const lz = dx * sn + dz * c;
        if (Math.abs(lx) <= s.hx + PLAYER_RADIUS && Math.abs(lz) <= s.hz + PLAYER_RADIUS) {
          blocked[i] = 1;
          break;
        }
      }
      if (blocked[i]) continue;
      for (const c of cyls) {
        if (c.y + c.height - h > STEP && Math.hypot(x - c.x, z - c.z) <= c.radius + PLAYER_RADIUS) {
          blocked[i] = 1;
          break;
        }
      }
      for (const [x0, x1, z0, z1] of opts.blockRects ?? []) {
        if (x >= x0 && x <= x1 && z >= z0 && z <= z1) blocked[i] = 1;
      }
    }
  }
  // 面の勾配（中心差分の大きさ）。軸に沿った差だけでなく、等高線に沿って斜めに登る抜け道も塞ぐ。
  const slope = new Float32Array(cols * rows);
  const hAt = (ix: number, iz: number): number =>
    lv.heightAt(b.minX + ix * CELL, b.minZ + iz * CELL);
  for (let iz = 0; iz < rows; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const dx = (hAt(ix + 1, iz) - hAt(ix - 1, iz)) / (2 * CELL);
      const dz = (hAt(ix, iz + 1) - hAt(ix, iz - 1)) / (2 * CELL);
      slope[iz * cols + ix] = Math.hypot(dx, dz);
    }
  }
  const maxSlope = Math.tan((MOVEMENT.maxSlopeDeg - 2) * DEG);
  const reach = (from: [number, number]): Uint8Array => {
    const seen = new Uint8Array(cols * rows);
    const start = at(from[0], from[1]);
    const stack = [start];
    seen[start] = 1;
    while (stack.length > 0) {
      const i = stack.pop() as number;
      const ix = i % cols;
      const iz = Math.floor(i / cols);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const jx = ix + dx;
        const jz = iz + dz;
        if (jx < 0 || jz < 0 || jx >= cols || jz >= rows) continue;
        const j = jz * cols + jx;
        if (seen[j] || blocked[j]) continue;
        if ((slope[j] ?? 0) > maxSlope) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
    return seen;
  };
  return { reach, at };
}

const SPAWN: [number, number] = [0, -2.4];
/** 地下墓所 D の通路（岩盤の塊を含む範囲）を丸ごと塞いだ状態 = 「D を通らずに」到達できるかの検査用。 */
const D_RECT: [number, number, number, number] = [59, 79, 35, 54];
const ALL_GATES = ['G1', 'fog-gate'];

describe('perimeter: the player cannot bypass D, G1 or the fog gate', { timeout: 60_000 }, () => {
  it('reaches the courtyard through D, but not the fog-gate side or the arena while the fog gate is closed', () => {
    const { reach, at } = walkGrid(level, { closedGates: ALL_GATES });
    const seen = reach(SPAWN);
    expect(seen[at(62, 42)], 'inside D').toBe(1);
    expect(seen[at(94, 52)], 'courtyard E via D').toBe(1);
    expect(seen[at(103, 66)], 'in front of the fog gate').toBe(1);
    expect(seen[at(122, 86)], 'arena F').toBe(0);
  });

  it('cannot reach the courtyard, G1 north lane or the arena without passing through D', () => {
    const { reach, at } = walkGrid(level, { closedGates: ALL_GATES, blockRects: [D_RECT] });
    const seen = reach(SPAWN);
    expect(seen[at(58, 21)], 'sanity: chapel C').toBe(1);
    expect(seen[at(62, 33)], 'sanity: D entrance side').toBe(1);
    expect(seen[at(76.3, 28)], 'sanity: south of G1').toBe(1);
    expect(seen[at(80, 40)], 'north lane beyond G1').toBe(0);
    expect(seen[at(94, 52)], 'courtyard E').toBe(0);
    expect(seen[at(103, 66)], 'fog gate').toBe(0);
    expect(seen[at(122, 86)], 'arena F').toBe(0);
  });

  it('opens the shortcut when G1 is open (sanity), and still not the fog gate side without D', () => {
    const { reach, at } = walkGrid(level, { closedGates: ['fog-gate'], blockRects: [D_RECT] });
    const seen = reach(SPAWN);
    expect(seen[at(80, 40)]).toBe(1);
    expect(seen[at(94, 52)]).toBe(1);
    expect(seen[at(122, 86)], 'arena F is behind the closed fog gate').toBe(0);
  });

  it('keeps every free-standing spot outside the passable region unreachable (cliff foot is steep)', () => {
    // 通行領域から 1m 以上外側のセルは、どこからも歩いて入れない
    const { reach } = walkGrid(level, { closedGates: [] });
    const seen = reach(SPAWN);
    const b = level.data.bounds;
    let leaked = '';
    for (let z = b.minZ; z <= b.maxZ; z += CELL) {
      for (let x = b.minX; x <= b.maxX; x += CELL) {
        const ix = Math.round((x - b.minX) / CELL);
        const iz = Math.round((z - b.minZ) / CELL);
        const cols = Math.floor((b.maxX - b.minX) / CELL) + 1;
        if (seen[iz * cols + ix] && level.openDistance(x, z) > 1) leaked = `${x},${z}`;
      }
    }
    expect(leaked, 'reachable cell far outside the open region').toBe('');
  });
});

describe('perimeter: enemies stay inside the passable region', { timeout: 60_000 }, () => {
  it('has no walkable navigation cell outside the open region', () => {
    // 崖の上の平らな台地は「歩けるセル」だが、そこへは行けない。敵が歩いて到達できるセルだけを調べる
    const nav = NavGrid.build(level);
    const start = nav.nearestWalkable(0, 0);
    expect(start).toBeGreaterThanOrEqual(0);
    const seen = new Uint8Array(nav.cols * nav.rows);
    const stack = [start];
    seen[start] = 1;
    let worst = 0;
    let where = '';
    while (stack.length > 0) {
      const i = stack.pop() as number;
      const ix = i % nav.cols;
      const iz = Math.floor(i / nav.cols);
      const d = level.openDistance(nav.centerX(ix), nav.centerZ(iz));
      if (d > worst) {
        worst = d;
        where = `${nav.centerX(ix)},${nav.centerZ(iz)}`;
      }
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!nav.isWalkable(ix + dx, iz + dz)) continue;
          const j = nav.index(ix + dx, iz + dz);
          if (seen[j]) continue;
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    expect(worst, `walkable cell outside the open region at ${where}`).toBeLessThan(0.5);
  });

  it('places every enemy spawn inside the open region', () => {
    for (const e of ASHEN_FOUNDATION.enemies) {
      expect(level.openDistance(e.x, e.z), e.id).toBe(0);
    }
  });
});

describe('perimeter: side paths stay open (spec chapter 14)', () => {
  const open = (x: number, z: number): boolean => level.openDistance(x, z) === 0;

  it('does not close the entrances and key points of the four side paths', () => {
    // side_roof: 倒れた柵・霊廟の裏の石段・屋根
    for (const [x, z] of [
      [33, 18.5],
      [29, 21.2],
      [29, 16],
    ] as const)
      expect(open(x, z), `roof ${x},${z}`).toBe(true);
    // side_ledge: 崖下 → 折れ曲がり → 北壁上の鐘・護符
    for (const [x, z] of [
      [35, 19],
      [44, 26],
      [50, 32],
      [52, 32.5],
    ] as const)
      expect(open(x, z), `ledge ${x},${z}`).toBe(true);
    // side_waterway: 入口の床板（C の内側）と、D 内の鉄格子
    for (const [x, z] of [
      [44, 28],
      [72, 45],
    ] as const)
      expect(open(x, z), `waterway ${x},${z}`).toBe(true);
    // side_wall: 亀裂の壁・蔵・壁上回廊・霧の門の脇
    for (const [x, z] of [
      [82, 41],
      [85, 41.5],
      [86, 52],
      [92, 67],
      [100, 67],
      [101, 65],
    ] as const) {
      expect(open(x, z), `wall ${x},${z}`).toBe(true);
    }
  });
});
