import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EQUIPMENT_IDS, LOADOUTS, parseLoadoutName } from './equipment';

const assetPath = (name: string): string =>
  new URL(`../../../public/assets/${name}`, import.meta.url).pathname;

interface Manifest {
  characters: Record<string, { triangles: { output: number } }>;
  equipment: {
    bytes: number;
    triangles: number;
    textureMemoryBytes: number;
    items: Record<string, { triangles: number; bone: string }>;
    loadouts: Record<string, string[]>;
    loadoutTriangles: Record<string, number>;
  };
  totalBytes: number;
}

const manifest = JSON.parse(readFileSync(assetPath('manifest.json'), 'utf8')) as Manifest;

interface GlbNode {
  name?: string;
  extras?: { bone?: string; position?: number[]; quaternion?: number[] };
}

function readGlbNodes(file: string): GlbNode[] {
  const buf = readFileSync(assetPath(file));
  expect(buf.toString('utf8', 0, 4)).toBe('glTF');
  const jsonLength = buf.readUInt32LE(12);
  return (
    (JSON.parse(buf.toString('utf8', 20, 20 + jsonLength)) as { nodes?: GlbNode[] }).nodes ?? []
  );
}

describe('equipment.glb', () => {
  const nodes = readGlbNodes('equipment.glb');
  const knightNodeNames = new Set(readGlbNodes('characters/knight.glb').map((n) => n.name));

  it('contains exactly the items declared in EQUIPMENT_IDS', () => {
    expect(nodes.map((n) => n.name).sort()).toEqual([...EQUIPMENT_IDS].sort());
  });

  it('gives every item a socket on a bone that exists in knight.glb', () => {
    for (const node of nodes) {
      const { bone, position, quaternion } = node.extras ?? {};
      expect(bone, node.name).toBeDefined();
      expect(knightNodeNames.has(bone), `${node.name} -> ${bone}`).toBe(true);
      expect(position, node.name).toHaveLength(3);
      expect(quaternion, node.name).toHaveLength(4);
      const length = Math.hypot(...(quaternion ?? []));
      expect(length).toBeCloseTo(1, 3);
    }
  });

  it('keeps the runtime loadouts in sync with the build script (manifest)', () => {
    for (const [name, ids] of Object.entries(LOADOUTS)) {
      expect(manifest.equipment.loadouts[name]).toEqual([...ids]);
      for (const id of ids) expect(EQUIPMENT_IDS).toContain(id);
    }
    expect(Object.keys(manifest.equipment.loadouts).sort()).toEqual(Object.keys(LOADOUTS).sort());
  });

  it('equips each enemy type as the spec describes (5.2 / 5.3 / 6.1)', () => {
    expect(LOADOUTS.soldier).toEqual(
      expect.arrayContaining(['Sword_Rusty', 'Cuirass', 'Pauldron_L', 'Pauldron_R']),
    );
    expect(LOADOUTS.shieldbearer).toEqual(
      expect.arrayContaining(['Axe_Rusty', 'GreatShield', 'Helm_Pot']),
    );
    expect(LOADOUTS.boss).toEqual(
      expect.arrayContaining(['GreatAxe', 'GreatShield', 'Helm_Great', 'CuirassHeavy', 'Cape']),
    );
  });

  it('parses loadout names from untrusted input', () => {
    expect(parseLoadoutName('boss')).toBe('boss');
    expect(parseLoadoutName('nope')).toBeUndefined();
    expect(parseLoadoutName(null)).toBeUndefined();
  });
});

describe('equipment budget (docs/assets.md)', () => {
  it('uses no textures and stays small', () => {
    expect(manifest.equipment.textureMemoryBytes).toBe(0);
    expect(manifest.equipment.bytes).toBeLessThanOrEqual(200 * 1024);
    expect(manifest.totalBytes).toBeLessThanOrEqual(3 * 1024 * 1024);
  });

  it('keeps character + loadout within the 25,000 triangle per-character budget', () => {
    const knight = manifest.characters['knight']?.triangles.output ?? Infinity;
    for (const [name, tris] of Object.entries(manifest.equipment.loadoutTriangles)) {
      expect(knight + tris, name).toBeLessThanOrEqual(25_000);
    }
  });
});
