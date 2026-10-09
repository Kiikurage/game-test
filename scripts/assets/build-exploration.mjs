// 使い方: npm run assets:exploration（build-equipment.mjs の最後からも呼ばれる）
// 探索用の簡易メッシュ（scripts/assets/exploration.mjs）を public/assets/exploration.glb に書き出し、
// public/assets/manifest.json に exploration の項目（サイズ・三角形数・各アイテム）を追記する。
// 背中のソケットは public/assets/characters/knight.glb の bind pose から計算するため、
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
import { totalBytesOf } from './manifestTotal.mjs';
import { PLANTED_SWORD, buildExplorationDocument } from './exploration.mjs';

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

const { document: doc, triangles, items } = buildExplorationDocument(bones);
await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
const file = join(OUT_DIR, 'exploration.glb');
await io.write(file, doc);
const bytes = statSync(file).size;

const manifestPath = join(OUT_DIR, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.exploration = {
  file: relative(OUT_DIR, file),
  bytes,
  triangles,
  textureMemoryBytes: 0,
  items,
  plantedSword: PLANTED_SWORD,
};
manifest.totalBytes = totalBytesOf(manifest);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`exploration.glb ${kb(bytes)} tris ${triangles} (${Object.keys(items).length} items)`);
for (const [id, item] of Object.entries(items)) console.log(`  ${id}: ${item.triangles} tris`);
console.log(`total ${kb(manifest.totalBytes)} -> ${relative(ROOT, OUT_DIR)}`);
