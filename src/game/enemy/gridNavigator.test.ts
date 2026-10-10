import { describe, expect, it } from 'vitest';
import { createFlatLevel, wallProp } from '../testing/flatLevel';
import { ASHEN_FOUNDATION } from '../world/ashenFoundation';
import { createLevel, type GateDef } from '../world/level';
import { GridNavigator } from './gridNavigator';
import { NavGrid } from './navGrid';
import type { NavAgent, NavPoint } from './navigation';

const realLevel = createLevel(ASHEN_FOUNDATION);
const realGrid = NavGrid.build(realLevel);

function pathLength(path: readonly NavPoint[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as NavPoint;
    const b = path[i] as NavPoint;
    len += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return len;
}

/** 経路が（始点・終点の近くを除いて）歩けるセルだけを通る。 */
function expectWalkable(grid: NavGrid, path: readonly NavPoint[]): void {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as NavPoint;
    const b = path[i] as NavPoint;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    for (let d = 0; d <= len; d += 0.1) {
      const t = len > 0 ? d / len : 0;
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      const nearEnd = i === 1 || i === path.length - 1;
      if (nearEnd && (d < 1 || len - d < 1)) continue;
      expect(
        grid.isWalkableAt(x, z),
        `blocked at (${x.toFixed(2)}, ${z.toFixed(2)}), segment ${i}`,
      ).toBe(true);
    }
  }
}

describe('NavGrid on the Ashen Foundation', () => {
  it('builds a grid covering the play area', () => {
    expect(realGrid.cols).toBeGreaterThan(500);
    expect(realGrid.rows).toBeGreaterThan(400);
  });

  it('blocks walls, rocks, pillars and the outer cliff but keeps roads walkable', () => {
    expect(realGrid.isWalkableAt(0, 3)).toBe(true); // A の広場
    expect(realGrid.isWalkableAt(0, 0)).toBe(false); // 篝火の台座
    expect(realGrid.isWalkableAt(-10.5, -10.5)).toBe(false); // 外周
    expect(realGrid.isWalkableAt(62, 42)).toBe(true); // 地下墓所 D の入口の通路
    expect(realGrid.isWalkableAt(66, 42)).toBe(false); // D の岩盤
    expect(realGrid.isWalkableAt(122, 86)).toBe(false); // 闘技場の中央の台座
  });

  it('keeps every walkable cell at least 0.4m from walls, rocks and pillars (capsule radius 0.38m)', () => {
    const g = realGrid.clone();
    g.setGateClosed('G1', false); // 閉じた門は壁ではないので、余裕の検査から外す
    const solids = realLevel.boxes.filter(
      (b) => b.style !== 'stairs' && b.y + b.hy - realLevel.heightAt(b.x, b.z) > 0.6,
    );
    let violations = 0;
    for (let iz = 0; iz < g.rows; iz += 2) {
      for (let ix = 0; ix < g.cols; ix += 2) {
        if (!g.isWalkable(ix, iz)) continue;
        const x = g.centerX(ix);
        const z = g.centerZ(iz);
        for (const b of solids) {
          const yaw = ((b.yawDeg ?? 0) * Math.PI) / 180;
          const dx = x - b.x;
          const dz = z - b.z;
          const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
          const lz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
          const d = Math.hypot(Math.max(Math.abs(lx) - b.hx, 0), Math.max(Math.abs(lz) - b.hz, 0));
          if (d < 0.4 && b.y + b.hy - realLevel.heightAt(x, z) > 0.6) violations++;
        }
        for (const c of realLevel.cylinders) {
          if (Math.hypot(x - c.x, z - c.z) < c.radius + 0.4) violations++;
        }
      }
    }
    expect(violations).toBe(0);
  });
});

describe('GridNavigator paths in the Ashen Foundation', () => {
  const nav = new GridNavigator(realGrid);

  it('routes from area C through the L-shaped corridor of D to its exit', () => {
    const start = { x: 52, z: 22 }; // C
    const exit = { x: 78.6, z: 48.5 }; // D の出口
    const path = nav.findPath(start, exit);
    expect(path).not.toBeNull();
    if (!path) return;
    expectWalkable(realGrid, path);
    // 入口 (62,36) → 角 (62,48.5) → 出口 の順に通る（L 字を迂回できない）
    const near = (x: number, z: number, r: number) =>
      path.some((p) => Math.hypot(p.x - x, p.z - z) < r) || segmentsPassNear(path, x, z, r);
    expect(near(62, 36, 1.2)).toBe(true);
    expect(near(62, 47.5, 1.8)).toBe(true);
    expect(near(70, 48.5, 1.5)).toBe(true);
    const corner = indexOfClosest(path, 62, 47.5);
    const entrance = indexOfClosest(path, 62, 36);
    expect(entrance).toBeLessThanOrEqual(corner);
  });

  it('routes from the bonfire to the arena entrance via the main route', () => {
    const path = nav.findPath({ x: 0, z: 3 }, { x: 118, z: 82 });
    expect(path).not.toBeNull();
    if (path) expectWalkable(realGrid, path);
  });

  it('returns null when the goal is enclosed (no walkable cell nearby)', () => {
    expect(nav.findPath({ x: 0, z: 3 }, { x: -200, z: -200 })).toBeNull();
  });

  it('never walks through the blocked rock around the corridor (D)', () => {
    const path = nav.findPath({ x: 52, z: 22 }, { x: 78.6, z: 48.5 });
    if (!path) throw new Error('no path');
    // D の岩盤のなかへ直線で突っ切る経路は引かない
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1] as NavPoint;
      const b = path[i] as NavPoint;
      for (let t = 0; t <= 1; t += 0.02) {
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;
        if (x > 63.5 && x < 77 && z > 38 && z < 47) throw new Error(`inside rock at ${x}, ${z}`);
      }
    }
  });
});

function segmentsPassNear(path: readonly NavPoint[], x: number, z: number, r: number): boolean {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as NavPoint;
    const b = path[i] as NavPoint;
    for (let t = 0; t <= 1; t += 0.02) {
      if (Math.hypot(a.x + (b.x - a.x) * t - x, a.z + (b.z - a.z) * t - z) < r) return true;
    }
  }
  return false;
}

function indexOfClosest(path: readonly NavPoint[], x: number, z: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < path.length; i++) {
    const p = path[i] as NavPoint;
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** x=20 の壁（z 0..30）。z 30..40 が通り抜け。 */
const wallWithGap = createFlatLevel({ props: [wallProp('w', 20, 15, 0.5, 15)] });

describe('walls', () => {
  it('goes around a wall instead of through it', () => {
    const nav = new GridNavigator(NavGrid.build(wallWithGap));
    const path = nav.findPath({ x: 10, z: 10 }, { x: 30, z: 10 });
    expect(path).not.toBeNull();
    if (!path) return;
    expect(pathLength(path)).toBeGreaterThan(40); // まっすぐなら 20m
    expect(pathLength(path)).toBeLessThan(70);
    expectWalkable(nav.grid, path);
    // 壁の端（z=30）より北を通っている
    expect(Math.max(...path.map((p) => p.z))).toBeGreaterThan(30.5);
  });

  it('uses the direct line when nothing is in the way (no search)', () => {
    const nav = new GridNavigator(NavGrid.build(wallWithGap));
    const agent: NavAgent = { position: { x: 5, z: 5 } };
    const out = { x: 0, z: 0 };
    const next = nav.nextPoint({ x: 5, z: 5 }, { x: 15, z: 8 }, out, agent);
    expect(next).toEqual({ x: 15, z: 8 });
    expect(nav.stats.searches).toBe(0);
  });

  it('follows waypoints around the wall when asked step by step', () => {
    const nav = new GridNavigator(NavGrid.build(wallWithGap));
    const pos = { x: 10, z: 10 };
    const agent: NavAgent = { position: pos };
    const goal = { x: 30, z: 10 };
    const out = { x: 0, z: 0 };
    let maxZ = 0;
    for (let i = 0; i < 2000; i++) {
      nav.update();
      const next = nav.nextPoint(pos, goal, out, agent);
      if (!next) throw new Error('unreachable');
      const dx = next.x - pos.x;
      const dz = next.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 1e-6) {
        const step = Math.min(d, 0.06);
        pos.x += (dx / d) * step;
        pos.z += (dz / d) * step;
      }
      // 壁（x 19.5..20.5, z 0..30）の角を回るとき、カプセルの半径 0.38m 以内へ入らない
      const wx = Math.max(19.5 - pos.x, 0, pos.x - 20.5);
      const wz = Math.max(0 - pos.z, 0, pos.z - 30);
      expect(Math.hypot(wx, wz), `too close to the wall at ${pos.x},${pos.z}`).toBeGreaterThan(
        0.38,
      );
      maxZ = Math.max(maxZ, pos.z);
      if (Math.hypot(goal.x - pos.x, goal.z - pos.z) < 0.5) break;
    }
    expect(Math.hypot(goal.x - pos.x, goal.z - pos.z)).toBeLessThan(0.6);
    expect(maxZ).toBeGreaterThan(30);
  });
});

describe('gates', () => {
  const gate: GateDef = {
    id: 'G',
    kind: 'iron',
    x: 20,
    z: 20,
    yawDeg: 90, // +x へ通り抜ける。幅は z 方向
    width: 4,
    height: 3.6,
    blocking: true,
  };
  const level = createFlatLevel({
    props: [wallProp('w-s', 20, 9, 0.5, 9), wallProp('w-n', 20, 31, 0.5, 9)],
    gates: [gate],
  });

  it('blocks the way while closed and opens it when the gate opens', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    const from = { x: 10, z: 20 };
    const to = { x: 30, z: 20 };
    expect(nav.findPath(from, to)).toBeNull(); // 閉じている: 到達不能
    const v0 = nav.grid.version;
    nav.setGateClosed('G', false);
    expect(nav.grid.version).toBeGreaterThan(v0);
    const open = nav.findPath(from, to);
    expect(open).not.toBeNull();
    if (open) expect(pathLength(open)).toBeLessThan(23); // ほぼまっすぐ
    nav.setGateClosed('G', true);
    expect(nav.findPath(from, to)).toBeNull();
  });

  it('starts open or closed according to the gate definition', () => {
    const openLevel = createFlatLevel({
      props: [wallProp('w-s', 20, 9, 0.5, 9), wallProp('w-n', 20, 31, 0.5, 9)],
      gates: [{ ...gate, blocking: false }],
    });
    const nav = new GridNavigator(NavGrid.build(openLevel));
    expect(nav.findPath({ x: 10, z: 20 }, { x: 30, z: 20 })).not.toBeNull();
  });

  it('re-plans an agent already following a path when a gate closes', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    nav.setGateClosed('G', false);
    const agent: NavAgent = { position: { x: 10, z: 12 } };
    const out = { x: 0, z: 0 };
    nav.update();
    expect(nav.nextPoint(agent.position, { x: 30, z: 28 }, out, agent)).not.toBeNull();
    nav.setGateClosed('G', true);
    // 閉じた直後は古い経路で進み、引き直しの間隔のあとで到達不能になる
    let result: NavPoint | null = out;
    for (let i = 0; i < 400 && result; i++) {
      nav.update();
      result = nav.nextPoint(agent.position, { x: 30, z: 28 }, out, agent);
    }
    expect(result).toBeNull();
  });
});

describe('cliffs', () => {
  const level = createFlatLevel({
    pits: [{ minX: 16, maxX: 22, minZ: 8, maxZ: 32, depth: 3 }],
  });

  it('does not put walkable cells on or near the pit edge', () => {
    const grid = NavGrid.build(level);
    // 崖の上の縁（x=15）から 0.5m 以上離れる（カプセル半径 0.38m）
    expect(grid.isWalkableAt(15.5, 20)).toBe(false);
    expect(grid.isWalkableAt(14.6, 20)).toBe(false);
    expect(grid.isWalkableAt(14, 20)).toBe(true);
  });

  it('cannot reach the pit floor from outside', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    expect(nav.findPath({ x: 10, z: 20 }, { x: 19, z: 20 })).toBeNull();
  });

  it('routes around the pit and keeps away from the edge', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    const path = nav.findPath({ x: 10, z: 20 }, { x: 28, z: 20 });
    expect(path).not.toBeNull();
    if (!path) return;
    expectWalkable(nav.grid, path);
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1] as NavPoint;
      const b = path[i] as NavPoint;
      for (let t = 0; t <= 1; t += 0.02) {
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;
        const inPitBox = x > 15.3 && x < 22.7 && z > 7.3 && z < 32.7;
        expect(inPitBox, `too close to the pit at ${x}, ${z}`).toBe(false);
      }
    }
  });
});

describe('search scheduling and caching', () => {
  const level = createFlatLevel({
    size: 80,
    props: [wallProp('w', 40, 35, 0.5, 35)], // x=40, z 0..70。70..80 が通り抜け
  });

  it('spreads a long search over several steps within the per-step budget', () => {
    const nav = new GridNavigator(NavGrid.build(level), { budget: 100 });
    const agent: NavAgent = { position: { x: 10, z: 10 } };
    const out = { x: 0, z: 0 };
    nav.update();
    let steps = 0;
    let first: NavPoint | null = null;
    while (steps < 500) {
      const next = nav.nextPoint(agent.position, { x: 70, z: 10 }, out, agent);
      // 探索中は止まって待つ（その場の点を返す）
      if (next && (next.x !== agent.position.x || next.z !== agent.position.z)) {
        first = { ...next };
        break;
      }
      nav.update();
      steps++;
    }
    expect(first).not.toBeNull();
    expect(steps).toBeGreaterThan(2);
    expect(nav.stats.maxJobExpansions).toBeGreaterThan(100);
    // 最初の経路が出るまでの展開は、予算 × ステップ数を超えない
    expect(nav.stats.expansions).toBeLessThanOrEqual(100 * (steps + 1));
  });

  it('shares the result between agents starting from the same cell and caches it', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    const a: NavAgent = { position: { x: 10, z: 10 } };
    const b: NavAgent = { position: { x: 10.05, z: 10.05 } };
    const out = { x: 0, z: 0 };
    nav.update();
    nav.nextPoint(a.position, { x: 70, z: 10 }, out, a);
    nav.nextPoint(b.position, { x: 70, z: 10 }, out, b);
    for (let i = 0; i < 20; i++) nav.update();
    expect(nav.stats.searches).toBe(1);
    // 同じ問い合わせをもう一度（別の主体）: 探索せずキャッシュから
    const c: NavAgent = { position: { x: 10.1, z: 10.1 } };
    nav.nextPoint(c.position, { x: 70, z: 10 }, out, c);
    expect(nav.stats.searches).toBe(1);
    expect(nav.stats.cacheHits).toBe(1);
  });

  it('completes a search synchronously when update() is never called', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    const agent: NavAgent = { position: { x: 10, z: 10 } };
    const out = { x: 0, z: 0 };
    const next = nav.nextPoint(agent.position, { x: 70, z: 10 }, out, agent);
    expect(next).not.toBeNull();
    // 壁を迂回する最初の点は北寄り
    expect((next as NavPoint).z).toBeGreaterThan(10.5);
  });
});

describe('separation and stuck recovery', () => {
  const level = createFlatLevel({});

  it('pushes an agent away from a close ally', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    const me: NavAgent = { position: { x: 20, z: 20 } };
    const ally: NavAgent = { position: { x: 20.4, z: 20 } };
    const out = { x: 0, z: 0 };
    nav.update();
    nav.nextPoint(ally.position, { x: 30, z: 20 }, { x: 0, z: 0 }, ally); // 登録
    const next = nav.nextPoint(me.position, { x: 30, z: 20 }, out, me);
    expect(next).not.toBeNull();
    // 目的地は東だが、東隣の味方から離れる向き（南北のどちらか・やや西寄り）に曲がる
    const heading = Math.atan2((next as NavPoint).z - 20, (next as NavPoint).x - 20);
    expect(Math.abs(heading)).toBeGreaterThan(0.2);
  });

  it('does not separate from a dead ally', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    const me: NavAgent = { position: { x: 20, z: 20 } };
    const corpse: NavAgent = { position: { x: 20.4, z: 20 }, alive: false };
    const out = { x: 0, z: 0 };
    nav.nextPoint(corpse.position, { x: 30, z: 20 }, { x: 0, z: 0 }, corpse);
    const next = nav.nextPoint(me.position, { x: 30, z: 20 }, out, me);
    expect(next).toEqual({ x: 30, z: 20 });
  });

  it('sidesteps, then gives up (null) when an agent keeps failing to move', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    const agent: NavAgent = { position: { x: 20, z: 20 } }; // 動かない
    const goal = { x: 30, z: 20 };
    const out = { x: 0, z: 0 };
    let sidestepped = false;
    let gaveUp = false;
    for (let i = 0; i < 1200 && !gaveUp; i++) {
      nav.update();
      const next = nav.nextPoint(agent.position, goal, out, agent);
      if (!next) gaveUp = true;
      else if (Math.abs(next.z - 20) > 0.5) sidestepped = true;
    }
    expect(sidestepped).toBe(true);
    expect(gaveUp).toBe(true);
  });

  it('does not flag an agent that moves normally as stuck', () => {
    const nav = new GridNavigator(NavGrid.build(level));
    const agent: NavAgent = { position: { x: 5, z: 20 } };
    const goal = { x: 35, z: 20 };
    const out = { x: 0, z: 0 };
    for (let i = 0; i < 600; i++) {
      nav.update();
      const next = nav.nextPoint(agent.position, goal, out, agent);
      if (!next) throw new Error('gave up while moving');
      expect(Math.abs(next.z - 20)).toBeLessThan(0.01);
      (agent.position as NavPoint).x += 0.05;
    }
  });
});
