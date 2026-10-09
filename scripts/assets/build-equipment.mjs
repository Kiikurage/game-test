// 使い方: npm run assets:equipment（assets:build の最後からも呼ばれる）
// 自作の簡易装備メッシュ（scripts/assets/equipment.mjs）を public/assets/equipment.glb に書き出し、
// public/assets/manifest.json に equipment の項目（サイズ・三角形数・各アイテム）を追記する。
// 防具のソケットは public/assets/characters/knight.glb の bind pose から計算するため、
// knight.glb が先に存在している必要がある（assets:build が先に作る）。
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import {
  EXTMeshoptCompression,
  EXTTextureWebP,
  KHRMeshQuantization,
  KHRTextureTransform,
} from '@gltf-transform/extensions';
import { dedup, meshopt, prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { OUT_DIR, ROOT } from './config.mjs';
import { LOADOUTS, buildEquipmentDocument } from './equipment.mjs';

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

const io = new NodeIO()
  .registerExtensions([
    EXTMeshoptCompression,
    EXTTextureWebP,
    KHRMeshQuantization,
    KHRTextureTransform,
  ])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

// knight.glb の bind pose ワールド行列
const knight = await io.read(join(OUT_DIR, 'characters', 'knight.glb'));
const bones = {};
for (const node of knight.getRoot().listNodes()) bones[node.getName()] = node.getWorldMatrix();

const { document: doc, triangles, items } = buildEquipmentDocument(bones);
await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
const file = join(OUT_DIR, 'equipment.glb');
await io.write(file, doc);
const bytes = statSync(file).size;

const loadoutTriangles = Object.fromEntries(
  Object.entries(LOADOUTS).map(([name, ids]) => [
    name,
    ids.reduce((sum, id) => sum + (items[id]?.triangles ?? 0), 0),
  ]),
);

const manifestPath = join(OUT_DIR, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.equipment = {
  file: relative(OUT_DIR, file),
  bytes,
  triangles,
  textureMemoryBytes: 0,
  items,
  loadouts: Object.fromEntries(Object.entries(LOADOUTS).map(([k, v]) => [k, [...v]])),
  loadoutTriangles,
};
manifest.totalBytes =
  Object.values(manifest.characters).reduce((s, c) => s + c.bytes, 0) +
  manifest.animations.bytes +
  manifest.props.bytes +
  bytes;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`equipment.glb ${kb(bytes)} tris ${triangles} (${Object.keys(items).length} items)`);
for (const [name, tris] of Object.entries(loadoutTriangles))
  console.log(`  loadout ${name}: ${tris} tris`);
console.log(`total ${kb(manifest.totalBytes)} -> ${relative(ROOT, OUT_DIR)}`);
