import {
  type BufferAttribute,
  type BufferGeometry,
  type Mesh,
  type Object3D,
  Sphere,
} from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { assetUrl } from '../../core/assetUrl';
import { buildBlenderLods } from '../assets/blenderLod';

// レベル形状のベイク（#329）。ランタイムで組んでいた形状（地下墓所・闘技場・地下水路）を、
// ベイク時（`npm run assets:blender`）に TS の生成コードで作り、Blender パイプラインで glb にする。
//
//   ベイク: `<feature>Scene(level)`（形状だけの Group）→ `serializeBakedScene` →
//           assets-src/blender/level_meshes.py が Blender のオブジェクトに組み直す → glb
//   実行時: `loadBakedScene(name)` → 名前でメッシュ・ピボットを引き、マテリアルを付ける
//
// 形状の頂点属性は position / normal 以外をすべて `_<名前>` のカスタム属性として glb に入れ（量子化しない）、
// 読み込み時に元の名前へ戻す。Group / Mesh の名前・ローカル変換・`userData`（JSON）を保つ。

interface BakedNode {
  name: string;
  parent: number;
  /** ローカル行列（列優先 16 要素）。 */
  matrix: number[];
  /** `userData` の JSON（空なら省略）。 */
  userData?: string;
  mesh?: {
    attributes: Record<string, { itemSize: number; data: string }>;
    index: string;
  };
}

function base64Of(array: Float32Array | Uint32Array): string {
  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function serializeGeometry(g: BufferGeometry): NonNullable<BakedNode['mesh']> {
  const attributes: Record<string, { itemSize: number; data: string }> = {};
  for (const name of Object.keys(g.attributes).sort()) {
    const a = g.getAttribute(name);
    const data = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++)
      for (let k = 0; k < a.itemSize; k++) data[i * a.itemSize + k] = a.getComponent(i, k);
    attributes[name] = { itemSize: a.itemSize, data: base64Of(data) };
  }
  const index = g.getIndex();
  const count = index ? index.count : g.getAttribute('position').count;
  const idx = new Uint32Array(count);
  for (let i = 0; i < count; i++) idx[i] = index ? index.getX(i) : i;
  return { attributes, index: base64Of(idx) };
}

/**
 * 形状の木（Group / Mesh）を Blender に渡す JSON にする（決定的。同じ木なら同じ文字列）。
 * 名前は木の中で一意であること（glb のノード名になり、実行時に名前で引く）。
 */
export function serializeBakedScene(root: Object3D): string {
  const nodes: BakedNode[] = [];
  const names = new Set<string>();
  const visit = (o: Object3D, parent: number): void => {
    if (!o.name) throw new Error('baked scene: every node needs a name');
    if (names.has(o.name)) throw new Error(`baked scene: duplicate name ${o.name}`);
    names.add(o.name);
    o.updateMatrix();
    const node: BakedNode = { name: o.name, parent, matrix: o.matrix.toArray() };
    if (Object.keys(o.userData).length > 0) node.userData = JSON.stringify(o.userData);
    if ((o as { isMesh?: boolean }).isMesh === true)
      node.mesh = serializeGeometry((o as Mesh).geometry);
    const self = nodes.length;
    nodes.push(node);
    for (const child of o.children) visit(child, self);
  };
  visit(root, -1);
  return JSON.stringify({ nodes });
}

/**
 * Blender パイプラインの 1 段 LOD（`<name>` → `<name>_LOD0`）を、元の名前のメッシュ 1 つに戻す。
 * 量子化のノード変換は LOD0 側に残る（`mesh.matrix`）。
 */
function flattenSingleLods(root: Object3D): void {
  for (const [name, lod] of buildBlenderLods(root)) {
    const parent = lod.parent;
    const level = lod.levels[0]?.object;
    if (!parent || !level || lod.levels.length !== 1) continue;
    lod.updateMatrix();
    level.applyMatrix4(lod.matrix);
    level.name = name;
    const rest = { ...(lod.userData as Record<string, unknown>) };
    delete rest.lodDistances;
    level.userData = rest;
    for (const child of [...lod.children]) if (child !== level) level.add(child);
    parent.add(level);
    parent.remove(lod);
  }
}

/** GLTFLoader で読んだ木を、ベイク前の木と同じ名前・属性名・userData に戻す。 */
export function restoreBakedScene(scene: Object3D): Object3D {
  flattenSingleLods(scene);
  scene.traverse((o) => {
    // GLTFLoader はノード名の ':' などを落とすので、元の名前は extras.bakedName から戻す
    const {
      bakedName,
      bakedAttributes,
      bakedNoNormal,
      userData: raw,
    } = o.userData as {
      bakedName?: unknown;
      bakedAttributes?: unknown;
      bakedNoNormal?: unknown;
      userData?: unknown;
    };
    if (typeof bakedName === 'string') o.name = bakedName;
    o.userData = typeof raw === 'string' ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const mesh = o as Mesh;
    if ((o as { isMesh?: boolean }).isMesh !== true) return;
    const g = mesh.geometry;
    if (bakedNoNormal === true) g.deleteAttribute('normal');
    // glb のカスタム属性名は大文字（_WALLS → GLTFLoader で _walls）。元の綴りは extras.bakedAttributes
    const original = new Map<string, string>();
    if (typeof bakedAttributes === 'string')
      for (const n of JSON.parse(bakedAttributes) as string[]) original.set(n.toLowerCase(), n);
    for (const name of Object.keys(g.attributes)) {
      if (!name.startsWith('_')) continue;
      const a = g.getAttribute(name) as BufferAttribute;
      g.deleteAttribute(name);
      g.setAttribute(original.get(name.slice(1)) ?? name.slice(1), a);
    }
    // 描画用には使わない（ライトマップ用・Blender が補った UV）。fx の `uv` は TEXCOORD_0 として残る
    g.deleteAttribute('uv1');
  });
  return scene;
}

/** `public/assets/blender/<name>.glb` を読み、ベイク前の形の木にして返す。 */
export async function loadBakedScene(name: string): Promise<Object3D> {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(assetUrl(`assets/blender/${name}.glb`));
  return restoreBakedScene(gltf.scene);
}

/** `root` 以下の名前 `name` のメッシュ（無ければ例外）。 */
export function bakedMesh(root: Object3D, name: string): Mesh {
  const o = root.getObjectByName(name) as Mesh | undefined;
  if (!o?.isMesh) throw new Error(`baked scene: missing mesh ${name}`);
  return o;
}

/** メッシュのワールド座標の外接球（量子化のノード変換込み）。 */
export function worldSphereOf(mesh: Mesh): Sphere {
  mesh.updateWorldMatrix(true, false);
  mesh.geometry.computeBoundingSphere();
  const local = mesh.geometry.boundingSphere ?? new Sphere();
  return local.clone().applyMatrix4(mesh.matrixWorld);
}
