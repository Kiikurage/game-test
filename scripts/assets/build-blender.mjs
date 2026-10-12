// 使い方:
//   npm run assets:blender               Blender をヘッドレスで呼び、assets-src/blender/<name>.py のモデルを
//                                        public/assets/blender/<name>.glb（LOD・ライトマップ UV 付き）に生成する
//   npm run assets:blender -- <name>...  指定したモデルだけ生成する
//   npm run assets:blender -- --check    生成し直した結果がコミット済みの glb とバイト単位で一致するか検査する
//
// Blender は環境変数 BLENDER、無ければ /Applications/Blender.app、無ければ PATH の blender を使う。
// CI には Blender が無いので、生成物はコミットする。CI はコミット済みの glb と manifest.json の整合
// （ソースのハッシュ・LOD・UV）を src/render/assets/blenderModels.test.ts で検査するだけ。
//
// 流れ: Blender（scripts/assets/blender/export.py: モデル生成 + ライトマップ UV + glb 書き出し）
//   → Node（LOD 列を meshoptimizer で作る → 量子化 → meshopt 圧縮）→ public/assets/blender/
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import {
  dedup,
  meshopt,
  prune,
  quantize,
  reorder,
  simplifyPrimitive,
  weld,
} from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { runnerImport } from 'vite';
import { OUT_DIR, ROOT } from './config.mjs';
import { totalBytesOf } from './manifestTotal.mjs';
import { BLENDER_MODELS } from './blender/models.mjs';

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const SRC_DIR = join(ROOT, 'assets-src', 'blender');
const BLENDER_OUT = join(OUT_DIR, 'blender');
const EXPORT_PY = join(ROOT, 'scripts', 'assets', 'blender', 'export.py');
/** 出力を左右するファイル。内容が変わったら再生成が必要（テストが manifest の sourceHash と照合する）。 */
// src/render/assets/blenderModels.test.ts も同じ並びでハッシュを取る
const PIPELINE_FILES = [
  'scripts/assets/build-blender.mjs',
  'scripts/assets/blender/export.py',
  'scripts/assets/blender/models.mjs',
];

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const only = args.filter((a) => !a.startsWith('--'));

function findBlender() {
  const candidates = [process.env.BLENDER, '/Applications/Blender.app/Contents/MacOS/Blender'];
  for (const c of candidates) if (c && existsSync(c)) return c;
  const which = spawnSync('which', ['blender'], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  throw new Error('Blender not found. Set BLENDER=/path/to/blender');
}

function blenderVersion(blender) {
  const r = spawnSync(blender, ['--version'], { encoding: 'utf8' });
  return (r.stdout.split('\n')[0] ?? '').trim();
}

/**
 * モデルの出力を左右するものの SHA-256（パイプライン共通 + モデルスクリプト + 入力の SHA-256）。
 * src/render/assets/blenderModels.test.ts も同じ式で求める。
 */
function sourceHash(model, inputHash) {
  const h = createHash('sha256');
  for (const rel of [...PIPELINE_FILES, `assets-src/blender/${model.script ?? model.name}.py`]) {
    h.update(rel + '\0');
    h.update(readFileSync(join(ROOT, rel)));
    h.update('\0');
  }
  if (inputHash) h.update(`input\0${inputHash}\0`);
  return h.digest('hex');
}

/** `input` のあるモデル: TS の生成コード（src/render/levelMeshes/levelMeshes.bake.ts）で入力を作る。 */
let bakeModule;
async function modelInput(model) {
  if (!model.input) return null;
  bakeModule ??= (await runnerImport(join(ROOT, 'src/render/levelMeshes/levelMeshes.bake.ts')))
    .module;
  const text = bakeModule.bakeLevelMeshes(model.input);
  return { text, hash: createHash('sha256').update(text).digest('hex') };
}

function runBlender(blender, model, outFile, inputFile) {
  const r = spawnSync(
    blender,
    [
      '--background',
      '--factory-startup',
      '--python-exit-code',
      '1',
      '--python',
      EXPORT_PY,
      '--',
      '--model',
      join(SRC_DIR, `${model.script ?? model.name}.py`),
      '--out',
      outFile,
      '--seed',
      String(model.seed),
      ...(inputFile ? ['--input', inputFile] : []),
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  if (r.status !== 0 || !existsSync(outFile)) {
    process.stderr.write(r.stdout + r.stderr);
    throw new Error(`Blender failed for ${model.name} (exit ${r.status})`);
  }
}

function triangleCount(prim) {
  const idx = prim.getIndices();
  return (idx ? idx.getCount() : prim.getAttribute('POSITION').getCount()) / 3;
}

/** 各メッシュノード X を「X（extras.lodDistances）→ X_LOD0..n」に組み替え、LOD を作る。 */
function buildLods(doc, model) {
  const meshNodes = doc
    .getRoot()
    .listNodes()
    .filter((n) => n.getMesh());
  const report = {};
  for (const node of meshNodes) {
    const name = node.getName();
    const baseMesh = node.getMesh();
    node.setMesh(null);
    node.setExtras({ ...node.getExtras(), lodDistances: model.lods.map((l) => l.distance) });
    const tris = [];
    model.lods.forEach((lod, level) => {
      // Mesh.clone() はプリミティブを共有するので、プリミティブごとに複製する（属性は simplify が詰め直す）
      const mesh = level === 0 ? baseMesh : doc.createMesh();
      mesh.setName(`${name}_LOD${level}`);
      if (level > 0) {
        for (const src of baseMesh.listPrimitives()) {
          const prim = src.clone();
          mesh.addPrimitive(prim);
          simplifyPrimitive(prim, {
            simplifier: MeshoptSimplifier,
            ratio: lod.ratio,
            error: lod.error,
            lockBorder: false,
          });
        }
      }
      tris.push(mesh.listPrimitives().reduce((s, p) => s + triangleCount(p), 0));
      node.addChild(doc.createNode(`${name}_LOD${level}`).setMesh(mesh));
    });
    report[name] = tris;
  }
  return report;
}

async function buildModel(blender, model, outFile) {
  const tmp = mkdtempSync(join(tmpdir(), `blender-${model.name}-`));
  try {
    const raw = join(tmp, 'raw.glb');
    const input = await modelInput(model);
    let inputFile = null;
    if (input) {
      inputFile = join(tmp, 'input.json');
      writeFileSync(inputFile, input.text);
    }
    runBlender(blender, model, raw, inputFile);
    const doc = await io.read(raw);
    doc.getRoot().getAsset().generator = 'game-test scripts/assets/build-blender.mjs';
    // Blender は背面カリングなしを doubleSided として書くが、閉じた静的メッシュなので片面にする
    for (const m of doc.getRoot().listMaterials()) m.setDoubleSided(false);
    // extras.dropTexcoord0: 描画に使わない TEXCOORD_0 を捨てる（ライトマップの TEXCOORD_1 は残す。#329）
    for (const node of doc.getRoot().listNodes()) {
      if (node.getExtras().dropTexcoord0 !== true) continue;
      for (const prim of node.getMesh()?.listPrimitives() ?? [])
        prim.setAttribute('TEXCOORD_0', null);
    }
    await doc.transform(weld());
    const lods = buildLods(doc, model);
    await doc.transform(
      dedup(),
      // テクスチャ未使用でも UV は残す（TEXCOORD_1 はライトマップ用。#323 が使う）
      prune({ keepLeaves: true, keepAttributes: true }),
      reorder({ encoder: MeshoptEncoder }),
      // ライトマップ UV（TEXCOORD_1）は解像度 1024 以上でも texel 内に収まるよう 16bit
      // カスタム属性（`_` 始まり。#329 のレベル形状）は、[-1, 1] に収まるものだけ 16bit（範囲外は float のまま）。
      // meshopt の medium は内部で全属性を量子化し直すので、そちらにも同じ値を渡す
      quantize({
        quantizePosition: 14,
        quantizeNormal: 10,
        quantizeTexcoord: 16,
        quantizeGeneric: 16,
      }),
      meshopt({ encoder: MeshoptEncoder, level: 'medium', quantizeGeneric: 16 }),
    );
    const bytes = await io.writeBinary(doc);
    writeFileSync(outFile, bytes);
    return {
      inputHash: input?.hash,
      lods,
      bytes: bytes.byteLength,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
const blender = findBlender();
const version = blenderVersion(blender);
const models = BLENDER_MODELS.filter((m) => only.length === 0 || only.includes(m.name));
if (only.length > 0 && models.length !== only.length) throw new Error(`unknown model in ${only}`);

if (checkOnly) {
  let failed = false;
  const tmp = mkdtempSync(join(tmpdir(), 'blender-check-'));
  for (const model of models) {
    const out = join(tmp, `${model.name}.glb`);
    await buildModel(blender, model, out);
    const committed = join(BLENDER_OUT, `${model.name}.glb`);
    const same = existsSync(committed) && readFileSync(committed).equals(readFileSync(out));
    console.log(`${model.name}.glb ${same ? 'OK' : 'DIFFERS'}`);
    failed ||= !same;
  }
  rmSync(tmp, { recursive: true, force: true });
  if (failed) {
    console.error('Regenerated output differs from committed files. Run npm run assets:blender.');
    process.exit(1);
  }
  process.exit(0);
}

mkdirSync(BLENDER_OUT, { recursive: true });
const manifestPath = join(OUT_DIR, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entries = { ...(manifest.blender?.models ?? {}) };
for (const model of models) {
  const file = join(BLENDER_OUT, `${model.name}.glb`);
  const { lods, bytes, sha256, inputHash } = await buildModel(blender, model, file);
  entries[model.name] = {
    file: relative(OUT_DIR, file),
    bytes,
    sha256,
    sourceHash: sourceHash(model, inputHash),
    ...(inputHash ? { inputHash } : {}),
    lodDistances: model.lods.map((l) => l.distance),
    meshes: Object.fromEntries(
      Object.entries(lods).map(([k, tris]) => [k, { lodTriangles: tris }]),
    ),
  };
  console.log(`${model.name}.glb ${kb(bytes)}`);
  for (const [k, tris] of Object.entries(lods)) console.log(`  ${k}: LOD tris ${tris.join(' / ')}`);
}
manifest.blender = {
  blenderVersion: version,
  bytes: Object.values(entries).reduce((s, e) => s + e.bytes, 0),
  models: entries,
};
manifest.totalBytes = totalBytesOf(manifest);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`${version}; total ${kb(manifest.totalBytes)} -> ${relative(ROOT, OUT_DIR)}`);
