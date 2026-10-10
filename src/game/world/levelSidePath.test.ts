import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../game';
import { NavGrid } from '../enemy/navGrid';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { ASHEN_FOUNDATION } from './ashenFoundation';
import { createLevel, levelGameOptions, sidePathDistance } from './level';

const DT = 1 / 60;
const level = createLevel(ASHEN_FOUNDATION);
const DEG = Math.PI / 180;

const sidePath = (id: string) => {
  const def = ASHEN_FOUNDATION.sidePaths?.find((p) => p.id === id);
  if (!def) throw new Error(`no side path ${id}`);
  return def;
};
const spot = (pathId: string, id: string): { x: number; z: number } => {
  const s = sidePath(pathId).spots.find((p) => p.id === id);
  if (!s) throw new Error(`no spot ${id}`);
  return s;
};

/** 岩棚の小さな段（`ledge-<leg>-<n>`）を並び順に。 */
const ledgeSlabs = () =>
  level.boxes
    .filter((b) => /^ledge-\d+-\d+$/.test(b.id))
    .sort((a, b) => {
      const [la, na] = a.id.split('-').slice(1).map(Number) as [number, number];
      const [lb, nb] = b.id.split('-').slice(1).map(Number) as [number, number];
      return la - lb || na - nb;
    });

describe('side path terrain data (spec 14.1.1 / 14.1.2)', () => {
  it('has a flat roof 2.2m above the foot of the back stairs, reached by 8 steps of at most 0.29m', () => {
    const mausoleum = level.boxes.find((b) => b.id === 'mausoleum');
    if (!mausoleum) throw new Error('no mausoleum');
    const roof = mausoleum.y + mausoleum.hy;
    // 霊廟の範囲 (27..31, 14..18)
    expect([mausoleum.x - mausoleum.hx, mausoleum.x + mausoleum.hx]).toEqual([27, 31]);
    expect([mausoleum.z - mausoleum.hz, mausoleum.z + mausoleum.hz]).toEqual([14, 18]);
    const steps = level.boxes.filter((b) => b.id.startsWith('mausoleum-steps-'));
    expect(steps).toHaveLength(8);
    const foot = level.heightAt(29, 21.6);
    expect(roof - foot).toBeCloseTo(2.2, 1);
    let prev = foot;
    for (const step of steps) {
      const top = step.y + step.hy;
      // Rapier の自動乗り越えは 0.3m の段でも止まる（実測 0.28m まで）。0.35m の仕様値より小さく取る
      expect(top - prev).toBeLessThanOrEqual(0.29);
      expect(step.hx * 2).toBeCloseTo(1.2, 6);
      prev = top;
    }
    // 最上段は屋根と同じ高さで、屋根の北面に接する
    expect(Math.abs(roof - prev)).toBeLessThan(0.01);
    const last = steps[steps.length - 1];
    expect((last?.z ?? 0) - (last?.hz ?? 0)).toBeCloseTo(18, 6);
  });

  it('makes the ledge pass through the gap in the north fence of B', () => {
    const fences = level.boxes.filter((b) => b.style === 'fence').sort((a, b) => a.x - b.x);
    let gapMin = 0;
    let gapMax = 0;
    for (let i = 0; i + 1 < fences.length; i++) {
      const a = fences[i];
      const b = fences[i + 1];
      if (a && b && b.x - b.hx - (a.x + a.hx) > 1) {
        gapMin = a.x + a.hx;
        gapMax = b.x - b.hx;
      }
    }
    expect(gapMax).toBeGreaterThan(gapMin);
    // 岩棚の中心線 x = 33 の両側 0.85m（足場 + 透明壁）が欠けの中に収まる
    expect(33 - 0.85).toBeGreaterThan(gapMin);
    expect(33 + 0.85).toBeLessThan(gapMax);
  });

  it('builds a 1.2m wide ledge that is about 22m long, rises gently and never exceeds 20 degrees', () => {
    const slabs = ledgeSlabs();
    expect(slabs.length).toBeGreaterThan(20);
    let length = 0;
    let prevTop = level.heightAt(35, 19);
    let prev = { x: 35, z: 19 };
    let maxSlope = 0;
    let prevId = '';
    for (const slab of slabs) {
      const sameLeg = slab.id.split('-')[1] === prevId.split('-')[1];
      expect(slab.hx * 2, slab.id).toBeCloseTo(1.2, 6);
      const top = slab.y + slab.hy;
      const rise = top - prevTop;
      // 段差は自動乗り越え（0.35m）の範囲、下りはない
      expect(rise, slab.id).toBeLessThanOrEqual(0.29);
      expect(rise, slab.id).toBeGreaterThanOrEqual(-0.01);
      const run = Math.hypot(slab.x - prev.x, slab.z - prev.z);
      if (sameLeg) maxSlope = Math.max(maxSlope, Math.atan2(top - prevTop, run));
      length += run;
      prevTop = top;
      prev = slab;
      prevId = slab.id;
    }
    expect(maxSlope / DEG).toBeLessThan(20);
    // 壁上の回廊 (x 40..46) を含めた全長
    const total = length + 0.25 + (46 - 40);
    expect(total).toBeGreaterThan(19);
    expect(total).toBeLessThan(25);
    // 終点は北壁の上の床（礼拝堂の床 + 2.8m）
    expect(prevTop).toBeCloseTo(3.4 + 2.8, 2);
    // 岩棚の足元は地形と同じ高さ付近（0.35m の自動乗り越えで乗れる）
    const first = slabs[0];
    expect((first ? first.y + first.hy : 0) - level.heightAt(35, 19)).toBeLessThanOrEqual(0.35);
  });

  it('has a 1.5m wide, 2.8m high wall-top corridor with a bell and a charm spot, and 3 drop points', () => {
    const top = level.boxes.find((b) => b.id === 'wall-top');
    if (!top) throw new Error('no wall-top');
    expect(top.hz * 2).toBeCloseTo(1.5, 6);
    expect(top.y + top.hy).toBeCloseTo(3.4 + 2.8, 6);
    // 鐘 (50, 32)・護符 (52, 32.5) は回廊の上
    for (const id of ['bell', 'charm']) {
      const s = spot('side_ledge', id);
      expect(Math.abs(s.x - top.x)).toBeLessThan(top.hx);
      expect(Math.abs(s.z - top.z)).toBeLessThan(top.hz);
    }
    expect(spot('side_ledge', 'bell')).toMatchObject({ x: 50, z: 32 });
    expect(spot('side_ledge', 'charm')).toMatchObject({ x: 52, z: 32.5 });
    // 落下ポイント 3 か所の着地点（高さ 2.8m ≦ 3m）
    const drops = ['drop-w', 'drop-m', 'drop-e'].map((id) => spot('side_ledge', id));
    expect(drops.map((d) => d.x)).toEqual([47, 50, 53]);
    for (const d of drops) {
      expect(d.z).toBe(30.8);
      expect(top.y + top.hy - level.heightAt(d.x, d.z)).toBeLessThanOrEqual(3);
    }
  });

  it('keeps every side path footprint inside the open region of the perimeter (no cliff over it)', () => {
    for (const path of ASHEN_FOUNDATION.sidePaths ?? []) {
      for (const [x, z] of path.points) {
        expect(level.openDistance(x, z), `${path.id} ${x},${z}`).toBe(0);
      }
      for (const r of path.rects) {
        for (const [x, z] of [
          [r.minX, r.minZ],
          [r.maxX, r.maxZ],
        ] as const) {
          expect(level.openDistance(x, z), `${path.id} ${x},${z}`).toBe(0);
        }
      }
    }
  });

  it('answers sidePathDistance for decoration exclusion (#190)', () => {
    expect(sidePathDistance(ASHEN_FOUNDATION, 35, 19)).toBe(0); // 岩棚の起点
    expect(sidePathDistance(ASHEN_FOUNDATION, 29, 16)).toBe(0); // 屋根
    expect(sidePathDistance(ASHEN_FOUNDATION, 50, 32)).toBe(0); // 壁上
    expect(sidePathDistance(ASHEN_FOUNDATION, 29, 16, ['side_ledge'])).toBeGreaterThan(5);
    expect(level.sidePathDistance(35, 19.5)).toBe(0);
    expect(sidePathDistance(ASHEN_FOUNDATION, 20, 5)).toBeGreaterThan(10);
  });
});

describe('side paths are not part of the enemy navigation grid', () => {
  const nav = NavGrid.build(level);

  /** 足場の範囲（折れ線 + 矩形）の中のセルの歩行可否を調べる。 */
  function walkableCellsInside(ids: readonly string[]): string[] {
    const found: string[] = [];
    for (let iz = 0; iz < nav.rows; iz++) {
      for (let ix = 0; ix < nav.cols; ix++) {
        const x = nav.centerX(ix);
        const z = nav.centerZ(iz);
        if (sidePathDistance(ASHEN_FOUNDATION, x, z, ids) > 0) continue;
        if (nav.isWalkable(ix, iz)) found.push(`${x.toFixed(2)},${z.toFixed(2)}`);
      }
    }
    return found;
  }

  it('has no walkable cell on the mausoleum roof and its stairs', () => {
    expect(walkableCellsInside(['side_roof'])).toEqual([]);
  });

  it('has no walkable cell on the ledge or the wall-top corridor', () => {
    expect(walkableCellsInside(['side_ledge'])).toEqual([]);
  });

  it('lets the enemies reach the chapel floor under the wall-top drop points', () => {
    const start = nav.nearestWalkable(0, 0);
    const seen = new Set<number>([start]);
    const stack = [start];
    while (stack.length > 0) {
      const i = stack.pop() as number;
      const ix = i % nav.cols;
      const iz = Math.floor(i / nav.cols);
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!nav.isWalkable(ix + dx, iz + dz)) continue;
          const j = nav.index(ix + dx, iz + dz);
          if (!seen.has(j)) {
            seen.add(j);
            stack.push(j);
          }
        }
      }
    }
    for (const id of ['drop-w', 'drop-m', 'drop-e']) {
      const s = spot('side_ledge', id);
      const cell = nav.nearestWalkable(s.x, s.z, 6);
      expect(cell, `${id} has a walkable cell nearby`).toBeGreaterThanOrEqual(0);
      expect(seen.has(cell), `${id} is connected to the bonfire`).toBe(true);
    }
  });
});

/** 物理（Rapier）込みで脇道を歩く。 */
describe('walking the side paths (physics)', () => {
  let game: Game;
  let input: FakeInput;

  beforeEach(async () => {
    resetTuning();
    tuning.camera.autoFollow = false;
    input = new FakeInput();
    game = await Game.create({ input, ...levelGameOptions(level), enemies: [] });
    game.addStaticCylinders(level.cylinders);
    for (let i = 0; i < 10; i++) game.update(DT);
  });

  const pos = () => game.player.feet;
  const run = (frames: number): void => {
    for (let i = 0; i < frames; i++) {
      game.update(DT);
      input.endStep();
    }
  };
  const aim = (yaw: number): void => {
    game.teleportPlayer(pos().x, pos().z, yaw, pos().y);
  };
  function walk(waypoints: readonly (readonly [number, number])[], tol = 0.5): void {
    for (const [wx, wz] of waypoints) {
      let frames = 0;
      for (;;) {
        const dx = wx - pos().x;
        const dz = wz - pos().z;
        if (Math.hypot(dx, dz) < tol) break;
        expect(
          frames++,
          `stuck before (${wx}, ${wz}) at ${pos().x}, ${pos().z}, y=${pos().y}`,
        ).toBeLessThan(400);
        aim(Math.atan2(dx, dz));
        input.setMove(0, 1);
        run(6);
      }
    }
    input.setMove(0, 0);
    run(8);
  }
  /** 向きを固定して前進入力を一定時間押し続ける（縁・壁へ押し付ける）。 */
  function push(yaw: number, seconds: number): void {
    input.setMove(0, 1);
    for (let i = 0; i < seconds * 10; i++) {
      aim(yaw);
      run(6);
    }
    input.setMove(0, 0);
    run(10);
  }
  const unhurt = (): void => {
    expect(game.playerTarget.health.current).toBe(game.playerTarget.health.max);
  };

  const ROOF_ROUTE: [number, number][] = [
    [33, 17],
    [31.5, 20],
    [29, 22.5],
    [29, 19.5],
    [29, 16],
  ];
  const LEDGE_ROUTE: [number, number][] = [
    [35, 19],
    [33, 22],
    [33, 25],
    [35.5, 27.5],
    [38, 29.8],
    [39.6, 32],
    [44, 32],
    [50, 32],
    [53, 32],
  ];

  it('climbs from B to the mausoleum roof by the stairs and steps off its south edge without damage', () => {
    game.teleportPlayer(33, 14, Math.PI);
    run(10);
    walk(ROOF_ROUTE);
    expect(pos().y).toBeGreaterThan(4.7);
    expect(pos().y).toBeLessThan(5.05);
    expect(game.player.grounded).toBe(true);
    // 屋根の南縁 (29, 13.8) から降りる（高さ 2.2〜2.6m）
    walk([[29, 14.3]], 0.4);
    push(Math.PI, 3);
    expect(pos().z).toBeLessThan(13.3);
    expect(pos().y).toBeLessThan(3.3);
    expect(game.player.grounded).toBe(true);
    unhurt();
  }, 30_000);

  it('walks the ledge from the cliff foot to the wall-top corridor without getting stuck', () => {
    game.teleportPlayer(35.6, 17.2, Math.PI);
    run(10);
    walk(LEDGE_ROUTE);
    expect(Math.hypot(pos().x - 53, pos().z - 32)).toBeLessThan(1);
    expect(pos().y).toBeGreaterThan(6.1);
    expect(pos().y).toBeLessThan(6.35);
    expect(game.player.grounded).toBe(true);
    unhurt();
  }, 30_000);

  it('steps off the wall-top corridor at the three drop points and lands on the chapel floor without damage', () => {
    for (const x of [47, 50, 53]) {
      game.teleportPlayer(x, 32, Math.PI, 6.3);
      run(10);
      push(Math.PI, 3);
      expect(pos().z, `drop at x=${x}`).toBeLessThan(31.2);
      expect(Math.abs(pos().y - 3.4), `drop at x=${x}`).toBeLessThan(0.3);
      expect(game.player.grounded).toBe(true);
      unhurt();
    }
  }, 30_000);

  it('can walk back along the ledge from the wall top to the cliff foot', () => {
    game.teleportPlayer(53, 32, -Math.PI / 2, 6.3);
    run(10);
    walk([...LEDGE_ROUTE].reverse().slice(1));
    expect(Math.hypot(pos().x - 35, pos().z - 19)).toBeLessThan(1);
    expect(pos().y).toBeLessThan(3.8);
    expect(game.player.grounded).toBe(true);
    unhurt();
  }, 30_000);

  it('cannot fall off the ledge sideways (invisible walls on both sides)', () => {
    const slabs = ledgeSlabs();
    for (const slab of [slabs[3], slabs[12], slabs[20], slabs[slabs.length - 3]]) {
      if (!slab) throw new Error('no slab');
      const top = slab.y + slab.hy;
      const yaw = (slab.yawDeg ?? 0) * DEG;
      for (const side of [Math.PI / 2, -Math.PI / 2]) {
        game.teleportPlayer(slab.x, slab.z, yaw, top + 0.05);
        run(10);
        push(yaw + side, 3);
        expect(pos().y, `${slab.id} pushed to ${side}`).toBeGreaterThan(top - 0.45);
        unhurt();
      }
    }
  }, 60_000);

  it('cannot fall off the wall-top corridor except through the drop points', () => {
    // 北側へ押しても落ちない（外は礼拝堂の外）
    for (const x of [44, 48.5, 51.5]) {
      game.teleportPlayer(x, 32.2, 0, 6.3);
      run(10);
      push(0, 3);
      expect(pos().y, `north at x=${x}`).toBeGreaterThan(6);
    }
    // 南側の落下ポイントの間（壁がある所）では落ちない
    for (const x of [44, 48.5, 51.5]) {
      game.teleportPlayer(x, 32.2, Math.PI, 6.3);
      run(10);
      push(Math.PI, 3);
      expect(pos().y, `south at x=${x}`).toBeGreaterThan(6);
    }
    // 東の端（x = 54）の先へも進めない
    game.teleportPlayer(52, 32.2, Math.PI / 2, 6.3);
    run(10);
    push(Math.PI / 2, 3);
    expect(pos().x).toBeLessThan(54.2);
    expect(pos().y).toBeGreaterThan(6);
  }, 60_000);
});
