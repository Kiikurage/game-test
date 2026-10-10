import { describe, expect, it } from 'vitest';
import { ASHEN_FOUNDATION } from '../../game/world/ashenFoundation';
import { createLevel } from '../../game/world/level';
import { QUALITY_PRESETS } from '../quality';
import { layoutCliff } from './cliffLayout';
import { createDryGrassGeometry, createRockPileGeometry } from './cliffGeometry';

const level = createLevel(ASHEN_FOUNDATION);
const full = layoutCliff(level, 1);

describe('layoutCliff', () => {
  it('places rocks and dry grass deterministically', () => {
    const again = layoutCliff(level, 1);
    expect(again.rocks.length).toBe(full.rocks.length);
    expect(again.rocks[0]).toEqual(full.rocks[0]);
    expect(full.rocks.length).toBeGreaterThan(100);
    expect(full.grass.length).toBeGreaterThan(50);
  });

  it('keeps instance counts within the budget', () => {
    // 1 インスタンスの岩は約 100 三角形、枯れ草は約 14。全体で約 25 万を超えない目安
    expect(full.rocks.length).toBeLessThan(1500);
    expect(full.grass.length).toBeLessThan(3000);
  });

  it('never places anything inside the walkable region', () => {
    for (const item of [...full.rocks, ...full.grass]) {
      expect(level.openDistance(item.x, item.z)).toBeGreaterThan(0.2);
    }
  });

  it('keeps the side-path footprint (#110 ledge, mausoleum roof/stairs) clear of rocks and grass', () => {
    // 脇道の足場の範囲（`Level.sidePathDistance`）から、岩の半径 + 余白以上離れている
    expect(ASHEN_FOUNDATION.sidePaths?.length).toBeGreaterThan(0);
    for (const item of [...full.rocks, ...full.grass]) {
      expect(level.sidePathDistance(item.x, item.z)).toBeGreaterThan(0.9 * item.scale + 1);
    }
  });

  it('leaves the ledge centerline and the stairs behind the mausoleum clear', () => {
    // 岩棚 (35,19)→(44,26)→(52,31) の中心線と、霊廟裏の石段 (28,20) 付近
    const line: [number, number][] = [];
    for (let t = 0; t <= 1; t += 0.05) {
      line.push([35 + 9 * t, 19 + 7 * t], [44 + 8 * t, 26 + 5 * t]);
    }
    line.push([28, 20], [28.5, 21], [29, 22]);
    for (const [px, pz] of line) {
      const near = [...full.rocks, ...full.grass].filter(
        (i) => Math.hypot(i.x - px, i.z - pz) < 1.8,
      );
      expect(near).toEqual([]);
    }
  });

  it('thins out on low quality and keeps a subset', () => {
    const low = layoutCliff(level, QUALITY_PRESETS.low.cliffDetail);
    const medium = layoutCliff(level, QUALITY_PRESETS.medium.cliffDetail);
    expect(low.rocks.length).toBeLessThan(medium.rocks.length);
    expect(medium.rocks.length).toBeLessThan(full.rocks.length);
    const keys = new Set(full.rocks.map((r) => `${r.x},${r.z}`));
    expect(low.rocks.every((r) => keys.has(`${r.x},${r.z}`))).toBe(true);
    expect(layoutCliff(level, 0).rocks).toEqual([]);
  });
});

describe('cliff geometry', () => {
  it('stays small', () => {
    const rock = createRockPileGeometry();
    const grass = createDryGrassGeometry();
    expect(rock.getAttribute('position').count / 3).toBeLessThanOrEqual(80);
    expect(grass.getAttribute('position').count / 3).toBeLessThanOrEqual(30);
  });
});
