import { describe, expect, it } from 'vitest';
import { ASHEN_FOUNDATION } from './ashenFoundation';
import {
  createLevel,
  shapesOverlap,
  validateLevel,
  type AreaShape,
  type Level,
  type LevelData,
} from './level';

const level = createLevel(ASHEN_FOUNDATION);

describe('level data validation', () => {
  it('has no problems for the Ashen Foundation data', () => {
    expect(validateLevel(ASHEN_FOUNDATION)).toEqual([]);
  });

  it('keeps areas A to F disjoint and matching the spec coordinates', () => {
    const ids = ASHEN_FOUNDATION.areas.map((a) => a.id);
    expect(ids).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    const area = (id: string) => ASHEN_FOUNDATION.areas.find((a) => a.id === id)?.shape;
    expect(area('A')).toMatchObject({ type: 'circle', cx: 0, cz: 0, r: 8 });
    expect(area('C')).toMatchObject({ minX: 40, maxX: 60, minZ: 12, maxZ: 32 });
    expect(area('E')).toMatchObject({ minX: 84, maxX: 104, minZ: 48, maxZ: 68 });
    expect(area('F')).toMatchObject({ type: 'circle', cx: 122, cz: 86, r: 16 });
  });

  it('detects overlapping areas, stray points and duplicate ids', () => {
    const circle: AreaShape = { type: 'circle', cx: 0, cz: 0, r: 8 };
    expect(shapesOverlap(circle, { type: 'rect', minX: 5, maxX: 20, minZ: 0, maxZ: 5 })).toBe(true);
    expect(shapesOverlap(circle, { type: 'rect', minX: 8, maxX: 20, minZ: 0, maxZ: 5 })).toBe(
      false,
    );

    const first = ASHEN_FOUNDATION.enemies[0];
    if (!first) throw new Error('no enemies');
    const broken: LevelData = {
      ...ASHEN_FOUNDATION,
      enemies: [{ ...first, x: 300 }, first],
      items: [{ id: 'bad', kind: 'relic', area: 'C', x: 0, z: 0 }],
    };
    const problems = validateLevel(broken).join('\n');
    expect(problems).toContain('outside area');
    expect(problems).toContain('duplicate id');
  });

  it('places the bonfire at the origin and starts the player next to it', () => {
    expect(ASHEN_FOUNDATION.bonfire).toEqual({ x: 0, z: 0 });
    const s = ASHEN_FOUNDATION.playerSpawn;
    expect(Math.hypot(s.x, s.z)).toBeLessThan(4);
  });

  it('keeps every stair step within the 0.35m auto-step limit', () => {
    for (const p of ASHEN_FOUNDATION.props) {
      if (p.kind === 'stairs') expect(p.stepRise).toBeLessThanOrEqual(0.35);
    }
  });
});

describe('terrain', () => {
  const { terrain } = level;
  const bounds = ASHEN_FOUNDATION.bounds;

  it('is deterministic and covers the playable bounds', () => {
    expect(level.heightAt(33.3, 12.1)).toBe(createLevel(ASHEN_FOUNDATION).heightAt(33.3, 12.1));
    expect(terrain.minX).toBeLessThan(bounds.minX);
    expect(terrain.minX + (terrain.cols - 1) * terrain.cellSize).toBeGreaterThan(bounds.maxX);
    expect(terrain.vertices.length).toBe(terrain.cols * terrain.rows * 3);
    // 地形の穴（床板の穴・水路の階段の上。`terrainHoles`）のセルは三角形を張らない
    const full = (terrain.cols - 1) * (terrain.rows - 1) * 6;
    const holeCells = (ASHEN_FOUNDATION.terrainHoles ?? []).reduce(
      (n, h) => n + (h.maxX - h.minX) * (h.maxZ - h.minZ),
      0,
    );
    expect(terrain.indices.length).toBe(full - holeCells * 6);
    // 約 150m × 110m
    expect(bounds.maxX - bounds.minX).toBeGreaterThan(140);
    expect(bounds.maxZ - bounds.minZ).toBeGreaterThan(105);
  });

  it('has flat floors for the bonfire area and the chapel', () => {
    for (let a = 0; a < 6.28; a += 0.4) {
      expect(level.heightAt(Math.cos(a) * 7.5, Math.sin(a) * 7.5)).toBeCloseTo(0, 6);
    }
    for (const [x, z] of [
      [41, 13],
      [50, 22],
      [59, 31],
      [41, 31],
    ] as const) {
      expect(level.heightAt(x, z)).toBeCloseTo(3.4, 6);
    }
  });

  it('rises gently along the B path from the bonfire to the chapel', () => {
    const route = ASHEN_FOUNDATION.route;
    for (let i = 1; i < 5; i++) {
      const a = route[i];
      const b = route[i + 1];
      if (!a || !b) throw new Error('route');
      const run = Math.hypot(b.x - a.x, b.z - a.z);
      const slopeDeg = (Math.atan2(Math.abs(b.height - a.height), run) * 180) / Math.PI;
      expect(slopeDeg).toBeLessThan(12);
    }
    expect(level.heightAt(22, 6)).toBeGreaterThan(0.8);
    expect(level.heightAt(32, 12)).toBeGreaterThan(level.heightAt(22, 6));
  });

  it('is climbable (<= 38 degrees) everywhere in the open region', () => {
    const inset = ASHEN_FOUNDATION.terrain.cliffWidth + 2;
    const h = (ix: number, iz: number) => terrain.vertices[(iz * terrain.cols + ix) * 3 + 1] ?? 0;
    let maxDeg = 0;
    let worst = '';
    for (let iz = 0; iz < terrain.rows - 1; iz++) {
      for (let ix = 0; ix < terrain.cols - 1; ix++) {
        const x = terrain.minX + ix * terrain.cellSize;
        const z = terrain.minZ + iz * terrain.cellSize;
        // 外周封鎖の崖（通行領域の外側。#176）は登れない
        if ([0, 1].some((i) => [0, 1].some((j) => level.openDistance(x + i, z + j) > 0))) continue;
        if (
          x < bounds.minX + inset ||
          x > bounds.maxX - inset ||
          z < bounds.minZ + inset ||
          z > bounds.maxZ - inset
        ) {
          continue;
        }
        const dx = Math.max(
          Math.abs(h(ix + 1, iz) - h(ix, iz)),
          Math.abs(h(ix + 1, iz + 1) - h(ix, iz + 1)),
        );
        const dz = Math.max(
          Math.abs(h(ix, iz + 1) - h(ix, iz)),
          Math.abs(h(ix + 1, iz + 1) - h(ix + 1, iz)),
        );
        const deg = (Math.atan(Math.hypot(dx, dz) / terrain.cellSize) * 180) / Math.PI;
        if (deg > maxDeg) {
          maxDeg = deg;
          worst = `${x},${z}`;
        }
      }
    }
    expect(maxDeg, `steepest at ${worst}`).toBeLessThanOrEqual(38);
  });

  it('has an unclimbable low cliff along the outer edge', () => {
    const edge = level.heightAt(bounds.minX + 0.2, 20);
    const inner = level.heightAt(bounds.minX + 5, 20);
    expect(edge - inner).toBeGreaterThan(2.5);
  });

  it('classifies surfaces for footsteps by area', () => {
    expect(level.surfaceAt(0, 0)).toBe('stone');
    expect(level.surfaceAt(20, 6)).toBe('grass');
    expect(level.surfaceAt(50, 22)).toBe('stone');
    expect(level.surfaceAt(65, 40)).toBe('underground');
    expect(level.surfaceAt(5, 40)).toBe('grass');
  });
});

describe('static colliders', () => {
  it('embeds boxes in the terrain and makes the chapel walls taller than the step limit', () => {
    expect(level.boxes.length).toBeGreaterThan(20);
    for (const b of level.boxes) {
      const bottom = b.y - b.hy;
      const top = b.y + b.hy;
      expect(top).toBeGreaterThan(bottom);
      // 地下水路（#111）の板・壁と、腐った床板・鉄格子、水路の通る所をくり抜いた岩盤の破片は、地形の下 / 地形の穴の上にある
      if (
        b.style === 'waterway' ||
        b.style === 'hatch' ||
        b.style === 'grate' ||
        b.id.includes('-lintel-') ||
        b.id.startsWith('d-mass-s')
      )
        continue;
      // 底面は足元の地形より下（宙に浮かない）
      expect(bottom).toBeLessThan(level.heightAt(b.x, b.z) - 0.5);
    }
    const wall = level.boxes.find((b) => b.id === 'chapel-n');
    expect(wall ? wall.y + wall.hy - 3.4 : 0).toBeCloseTo(2.8, 6);
  });

  it('surrounds the playable bounds with invisible walls', () => {
    expect(level.boundaryBoxes).toHaveLength(4);
  });
});

// ---- 歩行可能性（グリッド探索） ----

interface Point {
  readonly x: number;
  readonly z: number;
}
const STEP = 0.5;
const PLAYER_RADIUS = 0.4;
const MAX_SLOPE = Math.tan((38 * Math.PI) / 180);

/** 立ち入れない円（箱は外接円で近似せず、回転した矩形で判定する）。 */
function isBlocked(lv: Level, x: number, z: number, extra: (x: number, z: number) => boolean) {
  const ground = lv.heightAt(x, z);
  for (const b of lv.boxes) {
    if (b.style === 'stairs') continue; // 登れる
    if (b.y + b.hy - ground <= 0.35) continue; // 乗り越えられる
    const yaw = ((b.yawDeg ?? 0) * Math.PI) / 180;
    const dx = x - b.x;
    const dz = z - b.z;
    const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    const lz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
    if (Math.abs(lx) < b.hx + PLAYER_RADIUS && Math.abs(lz) < b.hz + PLAYER_RADIUS) return true;
  }
  for (const c of lv.cylinders) {
    if (Math.hypot(x - c.x, z - c.z) < c.radius + PLAYER_RADIUS) return true;
  }
  return extra(x, z);
}

function reachable(
  lv: Level,
  from: Point,
  to: Point,
  extra: (x: number, z: number) => boolean = () => false,
): boolean {
  const { bounds } = lv.data;
  const key = (ix: number, iz: number) => `${ix},${iz}`;
  const toCell = (v: number) => Math.round(v / STEP);
  const start: [number, number] = [toCell(from.x), toCell(from.z)];
  const goal: [number, number] = [toCell(to.x), toCell(to.z)];
  const seen = new Set<string>([key(...start)]);
  const queue: [number, number][] = [start];
  const minX = bounds.minX + 5;
  const maxX = bounds.maxX - 5;
  const minZ = bounds.minZ + 5;
  const maxZ = bounds.maxZ - 5;
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    if (!cur) break;
    if (Math.abs(cur[0] - goal[0]) <= 1 && Math.abs(cur[1] - goal[1]) <= 1) return true;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cur[0] + dx;
      const nz = cur[1] + dz;
      const k = key(nx, nz);
      if (seen.has(k)) continue;
      const x = nx * STEP;
      const z = nz * STEP;
      if (x < minX || x > maxX || z < minZ || z > maxZ) continue;
      if (isBlocked(lv, x, z, extra)) continue;
      const slope = Math.abs(lv.heightAt(x, z) - lv.heightAt(cur[0] * STEP, cur[1] * STEP)) / STEP;
      if (slope > MAX_SLOPE) continue;
      seen.add(k);
      queue.push([nx, nz]);
    }
  }
  return false;
}

describe('walkability of areas A to C', () => {
  const spawn = ASHEN_FOUNDATION.playerSpawn;
  const chapelCenter = { x: 50, z: 22 };

  it('lets the player walk from the bonfire to the middle of the chapel', () => {
    expect(reachable(level, spawn, chapelCenter)).toBe(true);
  });

  it('keeps the chapel centre unreachable when all three entrances are sealed', () => {
    const sealAll = (x: number, z: number) =>
      (x > 38.5 && x < 41.5 && z > 14 && z < 20) ||
      (x > 47 && x < 53.5 && z > 10.5 && z < 13.5) ||
      (x > 58.5 && x < 61.5 && z > 23.5 && z < 30.5);
    expect(reachable(level, spawn, chapelCenter, sealAll)).toBe(false);
  });

  it('gives the chapel several approach routes (west gate, south gap, east gap)', () => {
    const west = (x: number, z: number) => x > 38.5 && x < 41.5 && z > 14 && z < 20;
    const south = (x: number, z: number) => x > 47 && x < 53.5 && z > 10.5 && z < 13.5;
    const east = (x: number, z: number) => x > 58.5 && x < 61.5 && z > 23.5 && z < 30.5;
    const sealed = (open: string) => (x: number, z: number) =>
      (open !== 'west' && west(x, z)) ||
      (open !== 'south' && south(x, z)) ||
      (open !== 'east' && east(x, z));
    for (const open of ['west', 'south', 'east']) {
      expect(reachable(level, spawn, chapelCenter, sealed(open)), open).toBe(true);
    }
  });

  it('continues from the chapel to the entrance of area D', () => {
    expect(reachable(level, chapelCenter, { x: 62, z: 38 })).toBe(true);
  });

  it('keeps the main route clear of props', () => {
    const route = ASHEN_FOUNDATION.route;
    for (let i = 1; i + 1 < route.length; i++) {
      const a = route[i];
      const b = route[i + 1];
      if (!a || !b) continue;
      for (let t = 0; t <= 1; t += 0.05) {
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;
        expect(
          isBlocked(level, x, z, () => false),
          `route blocked at (${x}, ${z})`,
        ).toBe(false);
      }
    }
  });
});

describe('areas D to F (E4-1b)', () => {
  const spawn = ASHEN_FOUNDATION.playerSpawn;
  const data = ASHEN_FOUNDATION;
  const box = (id: string) => {
    const b = level.boxes.find((x) => x.id === id);
    if (!b) throw new Error(`no box ${id}`);
    return b;
  };

  it('defines the iron gate G1, its lever and the fog gate at the spec coordinates', () => {
    const gate = (id: string) => data.gates.find((g) => g.id === id);
    expect(gate('G1')).toMatchObject({ kind: 'iron', x: 78, z: 32, blocking: true });
    expect(gate('G1')?.leverId).toBe('lever-g1');
    expect(gate('fog-gate')).toMatchObject({ kind: 'fog', x: 104, z: 68, blocking: false });
    const at = (id: string) => data.interactables.find((i) => i.id === id);
    expect(at('lever-g1')).toMatchObject({ kind: 'lever', x: 80, z: 36 });
    expect(at('G1')).toMatchObject({ kind: 'gate', x: 78, z: 32 });
    expect(at('fog-gate')).toMatchObject({ kind: 'gate', area: 'E', x: 104, z: 68 });
    // 門のコライダ: G1 は有効、霧の門は無効で始まる。id は門の id
    const boxes = level.gates.map((g) => g.box);
    expect(boxes.find((b) => b.id === 'G1')?.enabled).toBe(true);
    expect(boxes.find((b) => b.id === 'fog-gate')?.enabled).toBe(false);
  });

  it('builds the arena: Ø32 circle, 4 pillars (h 4m, r 0.7m) evenly spaced, pedestal in the centre', () => {
    const f = data.areas.find((a) => a.id === 'F')?.shape;
    expect(f).toMatchObject({ type: 'circle', cx: 122, cz: 86, r: 16 });
    const pillars = level.cylinders.filter((c) => c.id.startsWith('f-pillar'));
    expect(pillars).toHaveLength(4);
    for (const p of pillars) {
      expect(p.radius).toBeCloseTo(0.7, 6);
      expect(p.height - 0.3).toBeCloseTo(4, 6);
      expect(Math.hypot(p.x - 122, p.z - 86)).toBeCloseTo(12, 6);
    }
    const sorted = pillars.map((p) => Math.atan2(p.z - 86, p.x - 122)).sort((a, b) => a - b);
    for (let i = 0; i < 4; i++) {
      const next = sorted[(i + 1) % 4] ?? 0;
      const cur = sorted[i] ?? 0;
      expect((next - cur + 2 * Math.PI) % (2 * Math.PI)).toBeCloseTo(Math.PI / 2, 6);
    }
    expect(level.cylinders.find((c) => c.style === 'pedestal')).toMatchObject({ x: 122, z: 86 });
    // 外周の壁の内面は円の外（内径 32m 以上）
    for (const b of level.boxes.filter((x) => x.id.startsWith('f-wall-'))) {
      expect(Math.hypot(b.x - 122, b.z - 86) - b.hz).toBeGreaterThanOrEqual(15.99);
    }
  });

  it('makes the catacomb corridor 2.5m wide with an L turn, about 22m from the entrance', () => {
    // 第 1 区間: 西壁の東面と岩盤の西面の間
    const w = box('d-wall-w');
    const s = box('d-mass-s');
    expect(s.x - s.hx - (w.x + w.hx)).toBeCloseTo(2.5, 6);
    // 第 2 区間: 南の岩盤の北面と北の岩盤の南面の間
    const n = box('d-mass-n');
    expect(n.z - n.hz - (s.z + s.hz)).toBeCloseTo(2.5, 6);
    // 入口 (62,38) → 角 (62,48.5) → 盾持ちの位置 (74,49) の道のり
    const length = Math.hypot(0, 48.5 - 38) + Math.hypot(74 - 62, 49 - 48.5);
    expect(length).toBeGreaterThan(21);
    expect(length).toBeLessThan(24);
  });

  it('places the courtyard fountain as an obstacle and keeps a route around it', () => {
    const fountain = level.cylinders.find((c) => c.style === 'fountain');
    expect(fountain).toBeDefined();
    expect(fountain?.x).toBeGreaterThan(84);
    expect(fountain?.x).toBeLessThan(104);
    expect(reachable(level, { x: 84, z: 51 }, { x: 104, z: 66 })).toBe(true);
  });

  it('lets the player walk from the bonfire to the arena', () => {
    expect(reachable(level, spawn, { x: 62, z: 40 })).toBe(true);
    expect(reachable(level, spawn, { x: 76, z: 48.5 })).toBe(true);
    expect(reachable(level, spawn, { x: 100, z: 60 })).toBe(true);
    expect(reachable(level, spawn, { x: 118, z: 82 })).toBe(true);
    expect(reachable(level, spawn, { x: 122, z: 92 })).toBe(true);
  });

  it('gives the courtyard two approach routes (west entrance, south breach)', () => {
    const west = (x: number, z: number) => x > 82 && x < 86 && z > 47 && z < 55;
    const south = (x: number, z: number) => x > 90 && x < 98 && z > 46 && z < 50;
    const centre = { x: 94, z: 64 };
    expect(reachable(level, spawn, centre, (x, z) => west(x, z) || south(x, z))).toBe(false);
    expect(reachable(level, spawn, centre, south)).toBe(true);
    expect(reachable(level, spawn, centre, west)).toBe(true);
  });

  it('seals the arena except for the passage from the fog gate', () => {
    const passage = (x: number, z: number) => x > 105 && x < 112 && z > 70 && z < 77;
    expect(reachable(level, spawn, { x: 122, z: 92 }, passage)).toBe(false);
  });

  it('keeps the main route clear of props through D, E and F', () => {
    const route = data.route;
    const start = route.findIndex((p) => p.x === 62 && p.z === 36);
    expect(start).toBeGreaterThan(0);
    for (let i = start; i + 1 < route.length; i++) {
      const a = route[i];
      const b = route[i + 1];
      if (!a || !b) continue;
      for (let t = 0; t <= 1; t += 0.05) {
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;
        expect(
          isBlocked(level, x, z, () => false),
          `route blocked at (${x}, ${z})`,
        ).toBe(false);
      }
    }
  });

  it('keeps the climb from C to the arena gentle along the main route (< 22 degrees)', () => {
    const route = data.route;
    const start = route.findIndex((p) => p.x === 61 && p.z === 28);
    for (let i = start; i + 1 < route.length; i++) {
      const a = route[i];
      const b = route[i + 1];
      if (!a || !b) continue;
      const run = Math.hypot(b.x - a.x, b.z - a.z);
      const deg = (Math.atan2(Math.abs(b.height - a.height), run) * 180) / Math.PI;
      expect(deg, `${i}`).toBeLessThan(22);
    }
  });

  it('connects the shortcut from G1 down to the bonfire area, through the open gate', () => {
    const lane = data.extraRoutes?.[0];
    if (!lane) throw new Error('no shortcut route');
    const g1 = lane.findIndex((p) => p.x === 78 && p.z === 32);
    let length = 0;
    for (let i = g1; i + 1 < lane.length; i++) {
      const a = lane[i];
      const b = lane[i + 1];
      if (a && b) length += Math.hypot(b.x - a.x, b.z - a.z);
    }
    expect(length).toBeGreaterThan(70);
    expect(length).toBeLessThan(100);
    // ショートカット（G1 より南）に敵はいない
    const onRoad = data.enemies.filter((e) => e.x > 64 && e.x < 82 && e.z > 4 && e.z < 32);
    expect(onRoad).toEqual([]);
    expect(reachable(level, { x: 8, z: -5 }, { x: 80.3, z: 40 })).toBe(true);
  });
});
