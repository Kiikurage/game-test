import { describe, expect, it } from 'vitest';
import { SchemaError } from '../../core/schema';
import { WORLD_INTERACTABLES } from '../data/world/interactables';
import { loadLevelData } from './levelLoader';
import json from './levels/ashenFoundation.json';
import { GRATE, HATCH } from './waterway';

function clone(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(json)) as Record<string, unknown>;
}

function first(list: unknown): Record<string, unknown> {
  const item = (list as Record<string, unknown>[])[0];
  if (!item) throw new Error('empty list');
  return item;
}

describe('loadLevelData', () => {
  it('loads the ashen foundation and expands the generated parts', () => {
    const level = loadLevelData(json);
    const ids = level.props.map((p) => p.id);
    // 地下墓所の岩盤 1 つが、水路の通る所をくり抜いた複数の塊になる
    expect(ids.filter((id) => id.startsWith('d-mass-s')).length).toBeGreaterThan(1);
    expect(level.props.some((p) => p.kind === 'block' && p.style === 'waterway')).toBe(true);
    expect(level.waterways).toHaveLength(1);
    expect(level.terrainHoles?.length).toBeGreaterThan(0);
    expect(level.zones?.length).toBeGreaterThan(0);
    // JSON だけのキーは残さない
    expect(level.props.some((p) => 'carve' in p)).toBe(false);
    expect(level.interactables.some((i) => (i.kind as string) === 'generate')).toBe(false);
    // 配置データのうち main の対象は入る
    const placed = WORLD_INTERACTABLES.find((d) => d.site === 'main');
    if (placed) expect(level.interactables.map((i) => i.id)).toContain(placed.id);
  });

  it('keeps the hatch / grate positions in the JSON in sync with waterway.ts', () => {
    const level = loadLevelData(json);
    const hatch = level.props.find((p) => p.id === HATCH.id);
    const grate = level.props.find((p) => p.id === GRATE.id);
    expect(hatch).toMatchObject({ x: HATCH.x, z: HATCH.z, hx: HATCH.half, hz: HATCH.half });
    expect(grate).toMatchObject({
      x: GRATE.x,
      z: GRATE.z,
      hx: GRATE.halfWidth,
      hz: GRATE.halfThickness,
    });
    expect(level.interactables.find((i) => i.id === 'hatch-waterway')).toMatchObject({
      x: HATCH.x,
      z: HATCH.z,
    });
    expect(level.interactables.find((i) => i.id === 'grate-waterway')).toMatchObject({
      x: GRATE.x,
      z: GRATE.z,
    });
  });

  it('rejects invalid data with the path and source', () => {
    const bad = clone();
    first(bad.enemies).behavior = 'sleep';
    expect(() => loadLevelData(bad, 'x.json')).toThrow(SchemaError);
    expect(() => loadLevelData(bad, 'x.json')).toThrow('x.json: $.enemies[0].behavior');

    const unknownKey = clone();
    first(unknownKey.props).colour = 'red';
    expect(() => loadLevelData(unknownKey)).toThrow('$.props[0].colour: unknown key');
  });

  it('rejects duplicate ids and dangling lever references', () => {
    const dup = clone();
    const props = dup.props as Record<string, unknown>[];
    props.push({ ...props[0] });
    expect(() => loadLevelData(dup)).toThrow('duplicate prop id');

    const lever = clone();
    first(lever.gates).leverId = 'nope';
    expect(() => loadLevelData(lever)).toThrow('unknown lever "nope"');
  });

  it('requires "waterway" when the props ask for it', () => {
    const noWaterway = clone();
    delete noWaterway.waterway;
    expect(() => loadLevelData(noWaterway)).toThrow('needs "waterway"');
  });
});
