// Blender で生成してコミットした glb（npm run assets:blender）の検査。CI には Blender が無いので、
// 生成し直す代わりに「ソースと生成物の対応」「LOD とライトマップ UV の形」を確かめる。
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ROOT = new URL('../../../', import.meta.url).pathname;
const read = (rel: string): Buffer => readFileSync(ROOT + rel);

// scripts/assets/build-blender.mjs の PIPELINE_FILES と同じ並び
const PIPELINE_FILES = [
  'scripts/assets/build-blender.mjs',
  'scripts/assets/blender/export.py',
  'scripts/assets/blender/models.mjs',
];

interface ModelEntry {
  file: string;
  bytes: number;
  sha256: string;
  sourceHash: string;
  lodDistances: number[];
  meshes: Record<string, { lodTriangles: number[] }>;
}
interface Manifest {
  blender?: { blenderVersion: string; bytes: number; models: Record<string, ModelEntry> };
}
interface Gltf {
  nodes: {
    name?: string;
    mesh?: number;
    children?: number[];
    extras?: { lodDistances?: number[] };
  }[];
  meshes: { primitives: { attributes: Record<string, number>; indices?: number }[] }[];
  accessors: { count: number }[];
}

const manifest = JSON.parse(read('public/assets/manifest.json').toString('utf8')) as Manifest;
const blender = manifest.blender;

function sourceHash(name: string): string {
  const h = createHash('sha256');
  for (const rel of [...PIPELINE_FILES, `assets-src/blender/${name}.py`]) {
    h.update(rel + '\0');
    h.update(read(rel));
    h.update('\0');
  }
  return h.digest('hex');
}

function readGltf(buf: Buffer): Gltf {
  expect(buf.toString('utf8', 0, 4)).toBe('glTF');
  const jsonLength = buf.readUInt32LE(12);
  return JSON.parse(buf.toString('utf8', 20, 20 + jsonLength)) as Gltf;
}

describe('Blender-generated assets', () => {
  it('has a manifest section', () => {
    expect(blender).toBeDefined();
    expect(Object.keys(blender?.models ?? {}).length).toBeGreaterThan(0);
  });

  for (const [name, entry] of Object.entries(blender?.models ?? {})) {
    describe(name, () => {
      const buf = read(`public/assets/${entry.file}`);

      it('is up to date with its sources (run npm run assets:blender after editing them)', () => {
        expect(sourceHash(name)).toBe(entry.sourceHash);
        expect(buf.byteLength).toBe(entry.bytes);
        expect(createHash('sha256').update(buf).digest('hex')).toBe(entry.sha256);
      });

      it('has LOD levels with decreasing triangles and lightmap UVs', () => {
        const gltf = readGltf(buf);
        const lodRoots = gltf.nodes.filter((n) => n.extras?.lodDistances);
        expect(lodRoots.map((n) => n.name).sort()).toEqual(Object.keys(entry.meshes).sort());
        for (const rootNode of lodRoots) {
          expect(rootNode.extras?.lodDistances).toEqual(entry.lodDistances);
          const children = (rootNode.children ?? []).map((i) => gltf.nodes[i]);
          const tris = entry.lodDistances.map((_, level) => {
            const child = children.find((c) => c?.name === `${rootNode.name ?? ''}_LOD${level}`);
            expect(child?.mesh).toBeDefined();
            const mesh = gltf.meshes[child?.mesh ?? -1];
            let sum = 0;
            for (const prim of mesh?.primitives ?? []) {
              expect(prim.attributes).toHaveProperty('TEXCOORD_1');
              expect(prim.indices).toBeDefined();
              sum += (gltf.accessors[prim.indices ?? -1]?.count ?? 0) / 3;
            }
            return sum;
          });
          expect(tris).toEqual(entry.meshes[rootNode.name ?? '']?.lodTriangles);
          for (let i = 1; i < tris.length; i++) expect(tris[i]).toBeLessThan(tris[i - 1] ?? 0);
        }
      });
    });
  }
});
