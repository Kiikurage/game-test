import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CORPSE_POSES, CORPSE_VARIANTS } from '../../core/corpses';
import { EQUIPMENT_IDS } from '../assets/equipment';
import { CORPSE_POSE_DEFS } from './corpsePoses';
import { CORPSE_VARIANT_DEFS } from './corpseVariants';
import { OUTFIT_MESHES } from '../undead/variants';

const glbNodeNames = (file: string): Set<string | undefined> => {
  const buf = readFileSync(new URL(`../../../public/assets/${file}`, import.meta.url).pathname);
  const json = JSON.parse(buf.toString('utf8', 20, 20 + buf.readUInt32LE(12))) as {
    nodes: { name?: string }[];
  };
  return new Set(json.nodes.map((n) => n.name));
};

describe('corpse pose / variant definitions', () => {
  const knight = glbNodeNames('characters/knight.glb');

  it('defines every pose and variant', () => {
    expect(Object.keys(CORPSE_POSE_DEFS).sort()).toEqual([...CORPSE_POSES].sort());
    expect(Object.keys(CORPSE_VARIANT_DEFS).sort()).toEqual([...CORPSE_VARIANTS].sort());
  });

  it('turns only bones that exist in knight.glb', () => {
    for (const [pose, def] of Object.entries(CORPSE_POSE_DEFS)) {
      for (const turn of def.turns) {
        expect(knight.has(turn.bone), `${pose}: ${turn.bone}`).toBe(true);
      }
    }
  });

  it('anchors every pose on meshes that exist and uses valid gear and outfit names', () => {
    expect(knight.has('Head_Skin')).toBe(true);
    expect(knight.has('Male_Ranger_Body')).toBe(true);
    for (const name of [...OUTFIT_MESHES.hood, ...OUTFIT_MESHES.pauldron]) {
      expect(knight.has(name), name).toBe(true);
    }
    for (const def of Object.values(CORPSE_VARIANT_DEFS)) {
      for (const id of def.gear) expect(EQUIPMENT_IDS).toContain(id);
    }
  });

  it('gives the variants different looks (body type or outfit)', () => {
    const looks = Object.values(CORPSE_VARIANT_DEFS).map((v) =>
      [v.build.width, v.build.height, v.hood, v.pauldron, v.belts, v.cloth].join(),
    );
    expect(new Set(looks).size).toBe(CORPSE_VARIANTS.length);
  });
});
