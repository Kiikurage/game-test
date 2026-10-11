import { describe, expect, it } from 'vitest';
import { isCorpsePose, isCorpseVariant } from '../../core/corpses';
import { WORLD_INTERACTABLES } from '../../game/data/world/interactables';
import { ASHEN_FOUNDATION } from '../../game/world/ashenFoundation';
import { createLevel } from '../../game/world/level';
import { standHeight } from './standHeight';

const level = createLevel(ASHEN_FOUNDATION);
const site = (id: string) => WORLD_INTERACTABLES.find((d) => d.id === id)?.site;

describe('standHeight', () => {
  it('uses the terrain on open ground', () => {
    expect(standHeight(level, { x: 24, z: 9 })).toBeCloseTo(level.heightAt(24, 9));
  });

  it('stands on the mausoleum roof and on the ledge, above the terrain', () => {
    expect(standHeight(level, { x: 29, z: 16 })).toBeGreaterThan(level.heightAt(29, 16) + 2);
    expect(standHeight(level, { x: 38, z: 29.8 })).toBeGreaterThan(level.heightAt(38, 29.8) + 2);
  });

  it('stands on the waterway floor, below the terrain', () => {
    const y = standHeight(level, { x: 62.4, z: 35, site: site('corpse_knight') });
    expect(y).toBeLessThan(level.heightAt(62.4, 35) - 1);
  });
});

describe('corpse data', () => {
  const corpses = WORLD_INTERACTABLES.filter((d) => d.corpse);

  it('marks the loot targets that are corpses, with a valid pose and variant', () => {
    expect(corpses.map((d) => d.id)).toEqual([
      'corpse_b_flask',
      'corpse_roof',
      'corpse_ledge',
      'npc_knight', // 生きている間の姿（もたれて座る）。息絶えると corpse_knight が出る
      'corpse_knight',
    ]);
    for (const d of corpses) {
      expect(d.kind).toBe(d.id === 'npc_knight' ? 'talk' : 'loot');
      expect(isCorpsePose(d.corpse?.pose)).toBe(true);
      expect(isCorpseVariant(d.corpse?.variant)).toBe(true);
    }
  });
});
