// ベイク済みのレベル形状（#329）が、実行時に組んでいたものと同じ形に戻るか。
// glb を GLTFLoader で読み、`restoreBakedScene` した木を、TS の生成コードで作り直した木と比べる。
import { readFileSync } from 'node:fs';
import { Box3, type Mesh, type Object3D } from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { describe, expect, it } from 'vitest';
import { restoreBakedScene } from './bakedScene';
import { bakeScene } from './levelMeshes.bake';

const ROOT = new URL('../../../', import.meta.url).pathname;

async function loadGlb(name: string): Promise<Object3D> {
  const buf = readFileSync(`${ROOT}public/assets/blender/${name}.glb`);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const gltf = await loader.parseAsync(ab, '');
  return restoreBakedScene(gltf.scene);
}

function meshesOf(root: Object3D): Map<string, Mesh> {
  root.updateMatrixWorld(true);
  const out = new Map<string, Mesh>();
  root.traverse((o) => {
    if ((o as { isMesh?: boolean }).isMesh === true) out.set(o.name, o as Mesh);
  });
  return out;
}

const triangles = (m: Mesh): number =>
  (m.geometry.index?.count ?? m.geometry.getAttribute('position').count) / 3;

describe.each(['crypt', 'arena', 'waterway'])('level_%s.glb', (input) => {
  it('restores the same meshes, attributes, triangles and placement', async () => {
    const baked = meshesOf(await loadGlb(`level_${input}`));
    const source = meshesOf(bakeScene(input));
    expect([...baked.keys()].sort()).toEqual([...source.keys()].sort());
    for (const [name, src] of source) {
      const got = baked.get(name);
      if (!got) throw new Error(name);
      expect(triangles(got), name).toBe(triangles(src));
      const attrs = (m: Mesh): string[] =>
        Object.keys(m.geometry.attributes)
          .filter((a) => a !== 'uv' || 'uv' in src.geometry.attributes)
          .sort();
      expect(attrs(got), name).toEqual(attrs(src));
      const a = new Box3().setFromObject(src);
      const b = new Box3().setFromObject(got);
      expect(a.min.distanceTo(b.min), name).toBeLessThan(0.01);
      expect(a.max.distanceTo(b.max), name).toBeLessThan(0.01);
      // 位置以外の属性: 成分ごとの最小・最大が一致する（量子化の誤差まで）
      for (const attr of attrs(src)) {
        if (attr === 'position') continue;
        const range = (m: Mesh): number[] => {
          const x = m.geometry.getAttribute(attr);
          const out: number[] = [];
          for (let k = 0; k < x.itemSize; k++) {
            let lo = Infinity;
            let hi = -Infinity;
            for (let i = 0; i < x.count; i++) {
              const v = x.getComponent(i, k);
              lo = Math.min(lo, v);
              hi = Math.max(hi, v);
            }
            out.push(lo, hi);
          }
          return out;
        };
        const r0 = range(src);
        const r1 = range(got);
        r0.forEach((v, i) => {
          expect(Math.abs((r1[i] ?? NaN) - v), `${name}.${attr}`).toBeLessThan(0.01);
        });
      }
    }
  });
});
