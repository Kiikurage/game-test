// 使い方: npm run assets:environment
// 環境メッシュ（scripts/assets/environment.mjs: 墓地・礼拝堂の墓石・枯れ木・柵・石壁・塔など）を
// public/assets/environment.glb に書き出し、public/assets/manifest.json に environment の項目を追記する。
// 外部素材・テクスチャなし（すべてコード生成。色は頂点カラー）。
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
import { buildEnvironmentDocument } from './environment.mjs';

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

const { document: doc, triangles, items } = buildEnvironmentDocument();
await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
const file = join(OUT_DIR, 'environment.glb');
await io.write(file, doc);
const bytes = statSync(file).size;

const manifestPath = join(OUT_DIR, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.environment = {
  file: relative(OUT_DIR, file),
  bytes,
  triangles,
  textureMemoryBytes: 0,
  items,
};
manifest.totalBytes = totalBytesOf(manifest);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`environment.glb ${kb(bytes)} tris ${triangles} (${Object.keys(items).length} items)`);
for (const [id, item] of Object.entries(items)) console.log(`  ${id}: ${item.triangles} tris`);
console.log(`total ${kb(manifest.totalBytes)} -> ${relative(ROOT, OUT_DIR)}`);
