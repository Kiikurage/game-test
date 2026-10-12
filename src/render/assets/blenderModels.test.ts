// Blender で生成してコミットした glb（npm run assets:blender）の検査。CI には Blender が無いので、
// 生成し直す代わりに「ソースと生成物の対応」「LOD とライトマップ UV の形」を確かめる。
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BLENDER_MODELS } from '../../../scripts/assets/blender/models.mjs';
import { bakeLevelMeshes } from '../levelMeshes/levelMeshes.bake';

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
  inputHash?: string;
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

const sha256 = (data: string | Buffer): string => createHash('sha256').update(data).digest('hex');

/** scripts/assets/build-blender.mjs の sourceHash と同じ式（入力は TS の生成コードで作り直す）。 */
function sourceHash(name: string): { source: string; input?: string } {
  const model = BLENDER_MODELS.find((m) => m.name === name);
  if (!model) throw new Error(`${name} is not in models.mjs`);
  const input = model.input ? sha256(bakeLevelMeshes(model.input)) : undefined;
  const h = createHash('sha256');
  for (const rel of [...PIPELINE_FILES, `assets-src/blender/${model.script ?? name}.py`]) {
    h.update(rel + '\0');
    h.update(read(rel));
    h.update('\0');
  }
  if (input) h.update(`input\0${input}\0`);
  return { source: h.digest('hex'), input };
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
        // レベル形状（input あり）は、レベルのデータや生成コードが変わると input のハッシュが変わる
        const { source, input } = sourceHash(name);
        expect(input).toBe(entry.inputHash);
        expect(source).toBe(entry.sourceHash);
        expect(buf.byteLength).toBe(entry.bytes);
        expect(sha256(buf)).toBe(entry.sha256);
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
