import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLAYER_ARMOR_IDS, PLAYER_CAPE_IDS } from './playerKit';

const assetPath = (name: string): string =>
  new URL(`../../../public/assets/${name}`, import.meta.url).pathname;

interface Manifest {
  characters: Record<string, { triangles: { output: number } }>;
  props: { triangles: number };
  player: {
    bytes: number;
    triangles: number;
    textureMemoryBytes: number;
    items: Record<string, { triangles: number; bone: string }>;
  };
  totalBytes: number;
}
const manifest = JSON.parse(readFileSync(assetPath('manifest.json'), 'utf8')) as Manifest;

interface GlbNode {
  name?: string;
  extras?: { bone?: string; position?: number[]; quaternion?: number[]; pivot?: number[] };
}
function readGlbNodes(file: string): GlbNode[] {
  const buf = readFileSync(assetPath(file));
  expect(buf.toString('utf8', 0, 4)).toBe('glTF');
  const jsonLength = buf.readUInt32LE(12);
  return (
    (JSON.parse(buf.toString('utf8', 20, 20 + jsonLength)) as { nodes?: GlbNode[] }).nodes ?? []
  );
}

describe('player.glb (旅の騎士の装備)', () => {
  const nodes = readGlbNodes('player.glb');
  const knightNodeNames = new Set(readGlbNodes('characters/knight.glb').map((n) => n.name));

  it('contains exactly the armor and the three cape segments', () => {
    expect(nodes.map((n) => n.name).sort()).toEqual(
      [...PLAYER_ARMOR_IDS, ...PLAYER_CAPE_IDS].sort(),
    );
  });

  it('gives every item a unit-quaternion socket on a bone that exists in knight.glb', () => {
    for (const node of nodes) {
      const { bone, position, quaternion } = node.extras ?? {};
      expect(knightNodeNames.has(bone), `${node.name} -> ${bone}`).toBe(true);
      expect(position, node.name).toHaveLength(3);
      expect(quaternion, node.name).toHaveLength(4);
      expect(Math.hypot(...(quaternion ?? [])), node.name).toBeCloseTo(1, 3);
    }
  });

  it('hangs the cape from hinges that descend from the shoulders, on the same bone', () => {
    const segs = PLAYER_CAPE_IDS.map((id) => nodes.find((n) => n.name === id)?.extras);
    const ys = segs.map((e) => e?.pivot?.[1] ?? NaN);
    expect(ys[0]).toBeGreaterThan(1.4); // 肩の高さ
    expect(ys[1]).toBeLessThan(ys[0] ?? 0);
    expect(ys[2]).toBeLessThan(ys[1] ?? 0);
    expect(new Set(segs.map((e) => e?.bone)).size).toBe(1);
  });

  it('puts the helm on the head and the cuirass on the chest', () => {
    const bone = (id: string): string | undefined => nodes.find((n) => n.name === id)?.extras?.bone;
    expect(bone('Knight_Helm')).toBe('Head');
    expect(bone('Knight_Cuirass')).toBe('spine_03');
    expect(bone('Knight_Pauldron_L')).toBe('upperarm_l');
    expect(bone('Knight_Pauldron_R')).toBe('upperarm_r');
  });
});

describe('player kit budget (docs/assets.md)', () => {
  it('uses no textures and stays small', () => {
    expect(manifest.player.textureMemoryBytes).toBe(0);
    expect(manifest.player.bytes).toBeLessThanOrEqual(100 * 1024);
    expect(manifest.totalBytes).toBeLessThanOrEqual(3 * 1024 * 1024);
  });

  it('keeps the player (knight + sword/shield + armor) within the 25,000 triangle budget', () => {
    const knight = manifest.characters['knight']?.triangles.output ?? Infinity;
    expect(knight + manifest.props.triangles + manifest.player.triangles).toBeLessThanOrEqual(
      25_000,
    );
  });
});
