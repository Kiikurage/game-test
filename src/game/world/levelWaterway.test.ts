import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../game';
import { NavGrid } from '../enemy/navGrid';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { ASHEN_FOUNDATION } from './ashenFoundation';
import {
  createLevel,
  DARK_VISION_MULTIPLIER,
  ECHO_HEARING_MULTIPLIER,
  levelGameOptions,
  validateLevel,
} from './level';
import { footstepSurfaceOf } from './footstepSurface';
import { GRATE, HATCH, subtractRects } from './waterway';
import { waterwayOf } from './waterway.system';

const DT = 1 / 60;
const level = createLevel(ASHEN_FOUNDATION);
const way = ASHEN_FOUNDATION.waterways?.[0];
if (!way) throw new Error('no waterway');
const C_FLOOR = 3.4;
const WATER_FLOOR = C_FLOOR - 2.4;
const EXIT_Y = 5.9;

describe('side_waterway level data (spec 14.1.3)', () => {
  it('passes the level validation', () => {
    expect(validateLevel(ASHEN_FOUNDATION)).toEqual([]);
  });

  it('has a 2m x 2m rotten floorboard at (44, 28) with a 2.4m drop to the water floor', () => {
    expect(HATCH).toMatchObject({ x: 44, z: 28, half: 1 });
    const hatch = level.boxes.find((b) => b.id === HATCH.id);
    expect(hatch).toBeDefined();
    if (!hatch) return;
    expect([hatch.hx * 2, hatch.hz * 2]).toEqual([2, 2]);
    // 床と同じ高さで穴を塞ぐ
    expect(hatch.y + hatch.hy).toBeCloseTo(C_FLOOR, 6);
    const under = way.rects.find((r) => r.id === 'hatch');
    expect(under).toMatchObject({ minX: 43, maxX: 45, minZ: 27, maxZ: 29, noCeiling: true });
    expect(C_FLOOR - (under?.floorY ?? 0)).toBeCloseTo(2.4, 6);
  });

  it('is a 2m wide, 2.2m high, 0.15m deep tunnel of about 47m', () => {
    expect(way.ceiling).toBe(2.2);
    expect(way.depth).toBe(0.15);
    // 水路の中心線に沿った全長: 床板 (44, 28) → 東 (66, 28) → 北 (66, 44) → 東 (72, 44) → 北の出口 (72, 47.25)
    const length = 22 + 16 + 6 + 3.25;
    expect(length).toBeGreaterThan(44);
    expect(length).toBeLessThan(50);
    for (const id of ['west', 'north']) {
      const r = way.rects.find((x) => x.id === id);
      if (!r) throw new Error(id);
      const narrow = Math.min(r.maxX - r.minX, r.maxZ - r.minZ);
      expect(narrow).toBe(2);
    }
  });

  it('branches into a 5m x 4m burial chamber and has the drip spot at (66, 40) in the water', () => {
    const chamber = way.rects.find((r) => r.id === 'chamber');
    expect(chamber).toBeDefined();
    if (!chamber) return;
    expect([chamber.maxX - chamber.minX, chamber.maxZ - chamber.minZ]).toEqual([5, 4]);
    // 本線 (x 65..67) の西に接する（分岐）
    expect(chamber.maxX).toBe(65);
    expect(level.surfaceAt(66, 40, WATER_FLOOR + 0.1)).toBe('water');
    expect(level.surfaceAt(66, 39, WATER_FLOOR + 0.1)).toBe('water');
  });

  it('ends at an iron grate at (72, 45) that opens into the side of the D corridor at (72, 47)', () => {
    expect(GRATE).toMatchObject({ x: 72, z: 45 });
    const grate = level.boxes.find((b) => b.id === GRATE.id);
    expect(grate).toBeDefined();
    if (!grate) return;
    // 水路の内寸（幅 2m）を塞ぐ。床から天井まで
    expect(grate.hx * 2).toBe(2);
    expect(grate.y - grate.hy).toBeCloseTo(EXIT_Y, 6);
    expect(grate.y + grate.hy).toBeCloseTo(EXIT_Y + 2.6, 6);
    // 出口の床 = D の通路の床（z = 47.25 の岩盤の面）
    const exit = way.rects.find((r) => r.id === 'exit');
    expect(exit?.maxZ).toBe(47.25);
    expect(Math.abs(level.heightAt(72, 47.6) - EXIT_Y)).toBeLessThan(0.05);
    // 盾持ち (74, 49) の背後 2.5m 前後に出る
    const shield = ASHEN_FOUNDATION.enemies.find((e) => e.id === 'd-shield-1');
    expect(Math.hypot((shield?.x ?? 0) - 72, (shield?.z ?? 0) - 47)).toBeGreaterThan(2.3);
    expect(Math.hypot((shield?.x ?? 0) - 72, (shield?.z ?? 0) - 47)).toBeLessThan(3.2);
    // 待ち伏せの石棺 (62, 51.5) は水路から通らない
    expect(way.rects.every((r) => r.maxX < 62 || r.minZ > 50 || r.maxZ < 50)).toBe(true);
  });

  it('rises only by steps within the auto-step limit and every floor is below the chapel floor first', () => {
    const treads = way.rects.filter((r) => /^(s1|s2)-/.test(r.id));
    expect(treads).toHaveLength(18);
    let prev = WATER_FLOOR;
    for (const t of treads) {
      expect(t.floorY - prev, t.id).toBeGreaterThan(0.25);
      expect(t.floorY - prev, t.id).toBeLessThanOrEqual(0.28);
      prev = t.floorY;
    }
    expect(prev).toBeCloseTo(EXIT_Y, 6);
    // 水路の水のある区画は同じ床の高さ（歩行速度に影響しない浅い水）
    for (const r of way.rects.filter((x) => x.water)) expect(r.floorY).toBe(WATER_FLOOR);
  });

  it('keeps the terrain above the tunnel (or opens a hole) so the player never hits the terrain', () => {
    const holes = ASHEN_FOUNDATION.terrainHoles ?? [];
    const inHole = (x: number, z: number): boolean =>
      holes.some((h) => x > h.minX && x < h.maxX && z > h.minZ && z < h.maxZ);
    for (const r of way.rects) {
      for (let x = r.minX + 0.25; x < r.maxX; x += 0.5) {
        for (let z = r.minZ + 0.25; z < r.maxZ; z += 0.5) {
          if (inHole(x, z)) continue;
          // 地形の面が床より下（床板の下に隠れる）か、頭の高さ（約 1.8m）+ 余裕より上にある
          const rise = level.heightAt(x, z) - r.floorY;
          expect(
            rise <= 0.1 || rise >= 1.95,
            `${r.id} (${x.toFixed(2)}, ${z.toFixed(2)}) terrain ${rise.toFixed(2)}m above the floor`,
          ).toBe(true);
        }
      }
    }
  });

  it('cuts the terrain mesh at the hatch hole and above the rising stairs, and nowhere else around', () => {
    const { vertices, indices, cols, minX, minZ, cellSize } = level.terrain;
    const covered = new Set<number>();
    for (let i = 0; i < indices.length; i += 6) {
      const a = indices[i] as number;
      const ix = a % cols;
      const iz = Math.floor(a / cols);
      covered.add(iz * 100000 + ix);
    }
    const has = (x: number, z: number): boolean => {
      const ix = Math.floor((x - minX) / cellSize);
      const iz = Math.floor((z - minZ) / cellSize);
      return covered.has(iz * 100000 + ix) || covered.has(iz * 100000 + ix + 1);
    };
    expect(vertices.length).toBeGreaterThan(0);
    // 穴の中心は三角形がない（セルの左下の頂点を起点にした三角形の有無）
    for (const [x, z] of [
      [43.5, 27.5],
      [44.5, 27.5],
      [43.5, 28.5],
      [44.5, 28.5],
    ] as const) {
      const ix = Math.floor((x - minX) / cellSize);
      const iz = Math.floor((z - minZ) / cellSize);
      expect(covered.has(iz * 100000 + ix), `hole cell ${x},${z}`).toBe(false);
    }
    // 床板の周り（穴の外）は床がある
    for (const [x, z] of [
      [42.5, 28.5],
      [45.5, 28.5],
      [44.5, 26.5],
      [44.5, 29.5],
    ] as const) {
      const ix = Math.floor((x - minX) / cellSize);
      const iz = Math.floor((z - minZ) / cellSize);
      expect(covered.has(iz * 100000 + ix), `floor cell ${x},${z}`).toBe(true);
    }
    // D の通路（出口の手前）の床は穴にならない
    expect(has(72.5, 48.5)).toBe(true);
  });

  it('keeps the d-mass-s rock mass closed above the tunnel (no open slot) and leaves the corridor face', () => {
    const pieces = level.boxes.filter((b) => b.id.startsWith('d-mass-s-'));
    expect(pieces.length).toBeGreaterThan(3);
    // 元の id は西の端の帯（岩盤の西面 = 通路の東の壁）として残る。水路の上は別の塊
    const strip = level.boxes.find((b) => b.id === 'd-mass-s');
    expect((strip?.x ?? 0) - (strip?.hx ?? 0)).toBeCloseTo(63.25, 6);
    expect((strip?.hx ?? 9) * 2).toBeLessThan(3);
    // 水路の出口 (72, 46) の天井の上は岩盤で埋まっている（上面 9.2m）
    const lintel = pieces.find(
      (b) => Math.abs(b.x - 72) < 1.1 && Math.abs(b.z - 46.1) < 1.2 && b.y - b.hy > 8,
    );
    expect(lintel, 'lintel above the exit').toBeDefined();
    expect((lintel?.y ?? 0) + (lintel?.hy ?? 0)).toBeCloseTo(9.2, 6);
    // 出口の内寸（x 71..73, z 45..47.25, y 5.9..8.1）は何も塞がない
    for (const b of level.boxes) {
      if (b.style === 'waterway') continue;
      const inX = Math.abs(b.x - 72) < b.hx + 1 - 0.05;
      const inZ = Math.abs(b.z - 46.1) < b.hz + 1.1 - 0.05;
      const inY = b.y - b.hy < EXIT_Y + 2.6 - 1e-3 && b.y + b.hy > EXIT_Y + 1e-3;
      if (b.id === GRATE.id) continue;
      expect(inX && inZ && inY, `${b.id} blocks the exit`).toBe(false);
    }
  });

  it('subtracts rectangles from a rectangle exactly (area preserved)', () => {
    const base = { minX: 0, maxX: 10, minZ: 0, maxZ: 6 };
    const holes = [
      { minX: 2, maxX: 4, minZ: 1, maxZ: 5 },
      { minX: 3, maxX: 7, minZ: 4, maxZ: 8 },
    ];
    const rest = subtractRects(base, holes);
    const area = rest.reduce((s, r) => s + (r.maxX - r.minX) * (r.maxZ - r.minZ), 0);
    // 10*6 - (2*4) - (4*2 は z 4..6 の部分) + 重なり (3..4, 4..5 = 1)
    expect(area).toBeCloseTo(60 - 8 - 8 + 1, 6);
  });
});

describe('dark and echo zones (spec 14.3.1)', () => {
  it('covers the crypt (D) and the waterway, but not the chapel floor above the waterway', () => {
    for (const kind of ['dark', 'echo'] as const) {
      expect(level.zoneAt(65, 42, 5)[kind], `crypt ${kind}`).toBe(true);
      expect(level.zoneAt(70, 49, 5.8)[kind], `crypt corridor ${kind}`).toBe(true);
      expect(level.zoneAt(50, 28, WATER_FLOOR + 0.1)[kind], `waterway ${kind}`).toBe(true);
      expect(level.zoneAt(44, 28, WATER_FLOOR + 0.1)[kind], `hatch shaft ${kind}`).toBe(true);
      expect(level.zoneAt(62.5, 35, WATER_FLOOR + 0.1)[kind], `chamber ${kind}`).toBe(true);
      expect(level.zoneAt(72, 46, EXIT_Y + 0.1)[kind], `exit ${kind}`).toBe(true);
      // 水路の真上（礼拝堂の床）・屋外は含まない
      expect(level.zoneAt(50, 28, C_FLOOR)[kind], `chapel floor ${kind}`).toBe(false);
      expect(level.zoneAt(50, 28)[kind], `no y ${kind}`).toBe(false);
      expect(level.zoneAt(0, 0, 0)[kind], `bonfire ${kind}`).toBe(false);
      expect(level.zoneAt(50, 18, C_FLOOR)[kind], `chapel ${kind}`).toBe(false);
      expect(level.zoneAt(59.9, 40, 4)[kind], `west of crypt ${kind}`).toBe(false);
      expect(level.zoneAt(78.5, 45, 6)[kind], `east of crypt ${kind}`).toBe(false);
    }
  });

  it('gives 0.7x vision and 1.3x hearing inside, 1x outside', () => {
    expect(DARK_VISION_MULTIPLIER).toBe(0.7);
    expect(ECHO_HEARING_MULTIPLIER).toBe(1.3);
    expect(level.visionMultiplierAt(65, 42, 5)).toBe(0.7);
    expect(level.hearingMultiplierAt(65, 42, 5)).toBe(1.3);
    expect(level.visionMultiplierAt(50, 28, WATER_FLOOR + 0.1)).toBe(0.7);
    expect(level.hearingMultiplierAt(50, 28, WATER_FLOOR + 0.1)).toBe(1.3);
    expect(level.visionMultiplierAt(50, 28, C_FLOOR)).toBe(1);
    expect(level.hearingMultiplierAt(50, 28, C_FLOOR)).toBe(1);
  });
});

describe('footstep surface in the waterway', () => {
  it('is water in the water and keeps the area surface above it', () => {
    expect(level.surfaceAt(50, 28, WATER_FLOOR + 0.05)).toBe('water');
    expect(level.surfaceAt(50, 28, C_FLOOR)).toBe('stone');
    expect(level.surfaceAt(50, 28)).toBe('stone');
    // 階段・出口の床は水ではない（D の素材のまま）
    expect(level.surfaceAt(72, 46, EXIT_Y + 0.05)).toBe('underground');
    expect(footstepSurfaceOf('water')).toBe('crypt');
  });
});

describe('the waterway is excluded from the enemy navigation grid', () => {
  const nav = NavGrid.build(level);

  it('keeps the chapel floor above the tunnel walkable', () => {
    for (const x of [48.5, 52.5, 55.5, 58.5]) {
      for (const z of [27.5]) {
        expect(nav.isWalkable(nav.cellX(x), nav.cellZ(z)), `${x},${z}`).toBe(true);
      }
    }
  });

  it('blocks the hatch cells and the grate alcove', () => {
    for (const [x, z] of [
      [43.5, 27.5],
      [44.5, 28.5],
      [72.5, 45.5],
      [71.5, 46.5],
    ] as const) {
      expect(nav.isWalkable(nav.cellX(x), nav.cellZ(z)), `${x},${z}`).toBe(false);
    }
    // D の通路は歩ける
    expect(nav.isWalkable(nav.cellX(72.5), nav.cellZ(48.5))).toBe(true);
  });
});

/** 物理（Rapier）込みで水路を走る。 */
describe('walking the waterway (physics)', () => {
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
  function walk(waypoints: readonly (readonly [number, number])[], tol = 0.45): void {
    for (const [wx, wz] of waypoints) {
      let frames = 0;
      for (;;) {
        const dx = wx - pos().x;
        const dz = wz - pos().z;
        if (Math.hypot(dx, dz) < tol) break;
        expect(
          frames++,
          `stuck before (${wx}, ${wz}) at ${pos().x}, ${pos().z}, y=${pos().y}`,
        ).toBeLessThan(500);
        aim(Math.atan2(dx, dz));
        input.setMove(0, 1);
        run(6);
      }
    }
    input.setMove(0, 0);
    run(8);
  }
  const unhurt = (): void => {
    expect(game.playerTarget.health.current).toBe(game.playerTarget.health.max);
  };

  const TUNNEL: [number, number][] = [
    [50, 28],
    [64, 28],
    [66, 30],
    [66, 38],
    [66, 41.5],
    [66, 43.5],
    [68, 44],
    [71, 44],
    [72, 44.6],
  ];

  it('breaks the floorboard when stepped on, drops 2.4m into the water without damage, and the hole stays open', () => {
    const state = waterwayOf(game);
    game.teleportPlayer(42, 28, Math.PI / 2);
    run(10);
    expect(pos().y).toBeCloseTo(C_FLOOR, 1);
    // 開く前は床板がコライダ（上を歩ける。割れるのは踏んだとき）
    expect(state.hatchBroken).toBe(false);
    walk([[44, 28]], 0.3);
    run(60);
    expect(state.hatchBroken).toBe(true);
    expect(pos().y).toBeLessThan(WATER_FLOOR + 0.3);
    expect(pos().y).toBeGreaterThan(WATER_FLOOR - 0.3);
    expect(game.player.grounded).toBe(true);
    unhurt();
  }, 30_000);

  it('runs from the hatch through the tunnel to the grate, which blocks until it is opened, then out to D', () => {
    game.teleportPlayer(44, 28, 0, WATER_FLOOR + 0.02);
    waterwayOf(game).breakHatch();
    run(20);
    expect(pos().y).toBeLessThan(WATER_FLOOR + 0.3);
    walk(TUNNEL);
    // 階段を上りきって、鉄格子の手前（z 44.6）に着く。床は出口の高さ
    expect(Math.abs(pos().y - EXIT_Y)).toBeLessThan(0.3);
    expect(game.player.grounded).toBe(true);
    // 開通前は格子が塞ぐ
    walk([[72, 44.7]], 0.3);
    input.setMove(0, 1);
    for (let i = 0; i < 20; i++) {
      aim(0);
      run(6);
    }
    input.setMove(0, 0);
    expect(pos().z).toBeLessThan(45);
    // 開通 → D の通路へ出る
    expect(waterwayOf(game).openGrate()).toBe(true);
    walk([
      [72, 46.5],
      [72, 48.5],
    ]);
    expect(pos().z).toBeGreaterThan(47.5);
    expect(Math.abs(pos().y - level.heightAt(72, 48.5))).toBeLessThan(0.3);
    expect(game.player.grounded).toBe(true);
    unhurt();
  }, 60_000);

  it('walks into the burial chamber and back without getting stuck', () => {
    game.teleportPlayer(66, 32, Math.PI, WATER_FLOOR + 0.02);
    run(20);
    walk([
      [66, 35],
      [63, 35],
      [61.5, 36],
      [63, 35],
      [66, 35],
    ]);
    expect(pos().y).toBeLessThan(WATER_FLOOR + 0.3);
    expect(pos().x).toBeGreaterThan(65);
  }, 30_000);

  it('goes back into the waterway from D after the grate is open', () => {
    waterwayOf(game).openGrate();
    game.teleportPlayer(72, 49, Math.PI, level.heightAt(72, 49));
    run(10);
    walk([
      [72, 46.5],
      [72, 44.6],
      [71, 44],
      [68, 44],
      [66, 43.5],
      [66, 38],
      [66, 30],
    ]);
    expect(pos().y).toBeLessThan(WATER_FLOOR + 0.35);
  }, 60_000);

  it('cannot return to the chapel: the 2.4m step is not climbable', () => {
    game.teleportPlayer(44, 28, 0, WATER_FLOOR + 0.02);
    waterwayOf(game).breakHatch();
    run(20);
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      input.setMove(0, 1);
      input.press('dodge');
      for (let i = 0; i < 20; i++) {
        aim(yaw);
        run(6);
      }
      input.setMove(0, 0);
      run(10);
      expect(pos().y, `yaw ${yaw}`).toBeLessThan(WATER_FLOOR + 1);
    }
  }, 60_000);
});
