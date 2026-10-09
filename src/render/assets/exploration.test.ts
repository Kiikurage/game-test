import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLANTED_SWORD_SIZE } from '../../core/plantedSwords';
import { EXPLORATION_IDS } from './exploration';

const assetPath = (name: string): string =>
  new URL(`../../../public/assets/${name}`, import.meta.url).pathname;

interface Manifest {
  exploration: {
    bytes: number;
    triangles: number;
    textureMemoryBytes: number;
    items: Record<string, { triangles: number; bone?: string }>;
    plantedSword: { length: number; buriedTip: number; buriedPommel: number };
  };
  totalBytes: number;
}

const manifest = JSON.parse(readFileSync(assetPath('manifest.json'), 'utf8')) as Manifest;

interface Socket {
  bone?: string;
  position?: number[];
  quaternion?: number[];
}
interface GlbNode {
  name?: string;
  extras?: Socket & { sockets?: Record<string, Socket>; length?: number };
}

function readGlbNodes(file: string): GlbNode[] {
  const buf = readFileSync(assetPath(file));
  expect(buf.toString('utf8', 0, 4)).toBe('glTF');
  const jsonLength = buf.readUInt32LE(12);
  return (
    (JSON.parse(buf.toString('utf8', 20, 20 + jsonLength)) as { nodes?: GlbNode[] }).nodes ?? []
  );
}

describe('exploration.glb', () => {
  const nodes = readGlbNodes('exploration.glb');
  const knightNodeNames = new Set(readGlbNodes('characters/knight.glb').map((n) => n.name));
  const node = (name: string): GlbNode | undefined => nodes.find((n) => n.name === name);

  const checkSocket = (label: string, s: Socket | undefined): void => {
    expect(s?.bone, label).toBeDefined();
    expect(knightNodeNames.has(s?.bone), `${label} -> ${s?.bone}`).toBe(true);
    expect(s?.position, label).toHaveLength(3);
    expect(s?.quaternion, label).toHaveLength(4);
    expect(Math.hypot(...(s?.quaternion ?? [])), label).toBeCloseTo(1, 3);
  };

  it('contains exactly the items declared in EXPLORATION_IDS', () => {
    expect(nodes.map((n) => n.name).sort()).toEqual([...EXPLORATION_IDS].sort());
  });

  it('gives the greatsword a hand socket and a back socket on existing bones', () => {
    const sword = node('GravekeeperGreatsword');
    checkSocket('greatsword', sword?.extras);
    checkSocket('greatsword.hand', sword?.extras?.sockets?.['hand']);
    checkSocket('greatsword.back', sword?.extras?.sockets?.['back']);
    expect(sword?.extras?.sockets?.['hand']?.bone).toBe('hand_r');
    expect(sword?.extras?.sockets?.['back']?.bone).toBe('spine_03');
    expect(sword?.extras?.length).toBe(1.5); // 全長 1.5m（仕様書 14.4 節）
  });

  it('gives the oil jar a hand socket for throwing', () => {
    checkSocket('oil jar', node('OilJar')?.extras);
    expect(node('OilJar')?.extras?.bone).toBe('hand_r');
  });

  it('keeps the planted sword size in sync with the placement helper', () => {
    expect(manifest.exploration.plantedSword).toEqual(PLANTED_SWORD_SIZE);
  });
});

describe('exploration budget (docs/assets.md)', () => {
  it('uses no textures, stays small and keeps every mesh low-poly', () => {
    expect(manifest.exploration.textureMemoryBytes).toBe(0);
    expect(manifest.exploration.bytes).toBeLessThanOrEqual(100 * 1024);
    expect(manifest.totalBytes).toBeLessThanOrEqual(3 * 1024 * 1024);
    expect(manifest.exploration.triangles).toBeLessThanOrEqual(4_000);
    for (const [id, item] of Object.entries(manifest.exploration.items)) {
      expect(item.triangles, id).toBeLessThanOrEqual(1_000);
    }
  });

  it('keeps the instanced meshes (cairn, planted sword) very cheap', () => {
    expect(manifest.exploration.items['Cairn']?.triangles).toBeLessThanOrEqual(300);
    expect(manifest.exploration.items['PlantedSword']?.triangles).toBeLessThanOrEqual(300);
  });
});
