import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASHEN_FOUNDATION } from '../game/world/ashenFoundation';
import { createLevel } from '../game/world/level';
import { ENVIRONMENT_IDS, type EnvironmentId } from './assets/environment';
import { isEnvironmentZone, layoutEnvironment } from './environmentLayout';
import { layoutClutter, layoutGrass, stoneAmount } from './levelSurface';

const level = createLevel(ASHEN_FOUNDATION);
const layout = layoutEnvironment(level);

const assetPath = (name: string): string =>
  new URL(`../../public/assets/${name}`, import.meta.url).pathname;

interface Manifest {
  environment: {
    bytes: number;
    triangles: number;
    textureMemoryBytes: number;
    items: Record<string, { triangles: number }>;
  };
  totalBytes: number;
}
const manifest = JSON.parse(readFileSync(assetPath('manifest.json'), 'utf8')) as Manifest;

interface GlbJson {
  nodes?: { name?: string }[];
}
function readGlbJson(file: string): GlbJson {
  const buf = readFileSync(assetPath(file));
  expect(buf.toString('utf8', 0, 4)).toBe('glTF');
  const jsonLength = buf.readUInt32LE(12);
  return JSON.parse(buf.toString('utf8', 20, 20 + jsonLength)) as GlbJson;
}

describe('environment.glb', () => {
  it('contains exactly the items declared in ENVIRONMENT_IDS', () => {
    const names = (readGlbJson('environment.glb').nodes ?? []).map((n) => n.name).sort();
    expect(names).toEqual([...ENVIRONMENT_IDS].sort());
    expect(Object.keys(manifest.environment.items).sort()).toEqual([...ENVIRONMENT_IDS].sort());
  });

  it('is hand-made (no textures) and small', () => {
    expect(manifest.environment.textureMemoryBytes).toBe(0);
    expect(manifest.environment.bytes).toBeLessThan(800 * 1024);
    const json = readGlbJson('environment.glb') as GlbJson & { images?: unknown[] };
    expect(json.images ?? []).toHaveLength(0);
  });

  it('keeps every item within a per-item triangle budget', () => {
    for (const [id, item] of Object.entries(manifest.environment.items)) {
      expect(item.triangles, id).toBeLessThan(id === 'Tower' ? 7000 : 1500);
    }
  });
});

describe('environment layout (areas A to C)', () => {
  const trianglesOf = (id: EnvironmentId): number => manifest.environment.items[id]?.triangles ?? 0;

  it('replaces every collider of A to C and the tower except stairs and the waterway', () => {
    for (const box of level.boxes) {
      if (!isEnvironmentZone(box.x, box.z)) continue;
      // 階段・地下水路（#111）・腐った床板は環境メッシュに置き換えない（水路・床板は waterway.view.ts が描く）
      if (box.style === 'stairs' || box.style === 'waterway' || box.style === 'hatch') {
        expect(layout.coveredIds.has(box.id)).toBe(false);
      } else {
        expect(layout.coveredIds.has(box.id), box.id).toBe(true);
      }
    }
    for (const cyl of level.cylinders) {
      if (isEnvironmentZone(cyl.x, cyl.z)) expect(layout.coveredIds.has(cyl.id), cyl.id).toBe(true);
    }
  });

  it('leaves areas D to F as graybox', () => {
    for (const id of layout.coveredIds) {
      const box = level.boxes.find((b) => b.id === id);
      if (box) expect(isEnvironmentZone(box.x, box.z), id).toBe(true);
    }
    expect(layout.coveredIds.has('d-mass-s')).toBe(false);
    expect(layout.coveredIds.has('f-wall-3')).toBe(false);
  });

  it('places the spec items: graves, trees, fence, lanterns, altar, pews, tower, mausoleum', () => {
    const count = (id: EnvironmentId): number =>
      layout.placements.filter((p) => p.id === id).length;
    expect(count('GraveRound') + count('GraveCross') + count('GraveBroken')).toBe(7);
    expect(count('GraveMound')).toBe(7);
    expect(count('DeadTreeA') + count('DeadTreeB') + count('DeadTreeC')).toBe(5);
    expect(count('FenceSection') + count('FenceBroken')).toBe(7);
    expect(count('FenceFallen')).toBe(1);
    expect(count('LanternPost')).toBeGreaterThanOrEqual(4);
    expect(count('Altar')).toBe(1);
    expect(count('PewA') + count('PewBroken')).toBe(6);
    expect(count('Tower')).toBe(1);
    expect(count('Mausoleum')).toBe(1);
    expect(count('Stele')).toBe(1);
    expect(count('Bonfire')).toBe(1);
    expect(count('ColumnTall')).toBe(1);
    expect(count('ColumnBroken')).toBe(1);
  });

  it('tiles every chapel wall with modules that cover its length', () => {
    const modules = layout.placements.filter((p) => p.id.startsWith('Wall'));
    // 礼拝堂の壁の総延長 約 63m を 2m ごとのモジュールで並べる
    expect(modules.length).toBeGreaterThanOrEqual(28);
    expect(modules.length).toBeLessThanOrEqual(48);
    expect(modules.some((p) => p.id === 'WallFullWindow')).toBe(true);
  });

  it('keeps the placed tower footprint and height equal to its collider', () => {
    const tower = layout.placements.find((p) => p.id === 'Tower');
    const box = level.boxes.find((b) => b.style === 'tower');
    if (!tower || !box) throw new Error('no tower');
    const e = tower.matrix.elements;
    // 6m × 18m のモジュールを 1:1 で置く（スケール 1）
    expect(Math.hypot(e[0], e[1], e[2])).toBeCloseTo(1, 6);
    expect(Math.hypot(e[4], e[5], e[6])).toBeCloseTo(1, 6);
    expect(e[13]).toBeCloseTo(box.y + box.hy - 18, 6);
    expect(box.hx).toBe(3);
  });

  it('stays within the triangle budget (environment + grass + clutter)', () => {
    const all = [...layout.placements, ...layoutClutter(level)];
    const tris = all.reduce((s, p) => s + trianglesOf(p.id), 0);
    const grass = layoutGrass(level);
    const grassTris = (grass.a.length + grass.b.length + grass.c.length) * 5;
    // 結合後のメッシュは 24m 格子 × 3 マテリアル以下
    const buckets = new Set(all.map((p) => p.bucket));
    expect(buckets.size).toBeLessThanOrEqual(16);
    expect(tris + grassTris, `env ${tris} grass ${grassTris}`).toBeLessThan(60_000);
  });

  it('keeps grass off the path, the paving and the props', () => {
    const grass = layoutGrass(level);
    const all = [...grass.a, ...grass.b, ...grass.c];
    expect(all.length).toBeGreaterThan(300);
    expect(all.length).toBeLessThan(6000);
    for (const m of all) {
      const x = m.elements[12];
      const z = m.elements[14];
      expect(level.pathWeight(x, z)).toBeLessThanOrEqual(0.35);
      expect(stoneAmount(level, x, z)).toBeLessThanOrEqual(0.25);
      expect(Math.hypot(x, z)).toBeGreaterThan(2.5);
    }
  });

  it('is deterministic', () => {
    const again = layoutEnvironment(level);
    expect(again.placements.length).toBe(layout.placements.length);
    expect(again.placements[3]?.matrix.elements).toEqual(layout.placements[3]?.matrix.elements);
  });
});
