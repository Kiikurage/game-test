// 配信アセットの検査（tech-direction §4.1・§4.3・§4.4、#331）。CI の check / build ジョブが実行し、違反があれば exit 1。
//
//   node scripts/assets/check.mjs            public/assets/ の形式・予算・manifest.json の整合
//   node scripts/assets/check.mjs --dist     加えて dist/ の内容ハッシュ名と配信予算（先に vite build）
//
// 予算は下の BUDGET。超えたら、アセット側を削るか、理由を docs に書いたうえで予算を見直す。
import { readFileSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, posix } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { HASHED_PREFIX, isHashedName, listFiles } from './hashedAssets.mjs';
import { totalBytesOf } from './manifestTotal.mjs';

const MB = 1024 * 1024;

export const BUDGET = {
  /** §4.3 初回ダウンロードの合計（dist 全体） */
  totalBytes: 40 * MB,
  /** §4.3 開始画面までに必要な分（index.html と、そこから静的に辿れる JS / CSS） */
  startScreenBytes: 5 * MB,
  /** 1 ファイルの上限（段階的に読むため、1 本で帯域を占有しない） */
  fileBytes: 8 * MB,
  /** glb 1 本の三角形数（全メッシュ・全 LOD の合計） */
  glbTriangles: 400_000,
  /** テクスチャの一辺 */
  textureSize: 2048,
};

/** public/assets/ に置いてよい形式（§4.1: メッシュは glb、テクスチャは KTX2、音声は Ogg）。 */
const ALLOWED_EXT = new Set(['.glb', '.ktx2', '.ogg', '.json']);

/** dist で内容ハッシュ名にしなくてよいもの（入口の HTML と、three 同梱の Basis トランスコーダ。KTX2Loader が固定名で読む）。 */
const UNHASHED_DIST = [/^index\.html$/, /^basis\//];

/** Vite が付けるハッシュ（`name-XXXXXXXX.ext`）。 */
const VITE_HASH = /-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;

const root = new URL('../../', import.meta.url).pathname;
const publicDir = join(root, 'public');
const distDir = join(root, 'dist');

const errors = [];
const fail = (msg) => errors.push(msg);
const fmt = (n) => `${(n / MB).toFixed(2)}MB`;

function isPow2(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

/** KTX2 のヘッダから寸法を読む（識別子 12B → vkFormat, typeSize, pixelWidth, pixelHeight）。 */
export function ktx2Size(buf) {
  const magic = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 28 || magic.some((b, i) => buf[i] !== b)) return undefined;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return { width: view.getUint32(20, true), height: view.getUint32(24, true) };
}

function checkTextureSize(where, size) {
  if (!size) {
    fail(`${where}: KTX2 として読めない`);
    return;
  }
  const { width, height } = size;
  if (!isPow2(width) || !isPow2(height)) fail(`${where}: ${width}x${height} が 2 の冪でない`);
  if (Math.max(width, height) > BUDGET.textureSize)
    fail(`${where}: ${width}x${height} が上限 ${BUDGET.textureSize} を超える`);
}

async function checkGlb(io, rel, path) {
  const doc = await io.read(path);
  const r = doc.getRoot();
  let triangles = 0;
  for (const mesh of r.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMode() !== 4) continue; // TRIANGLES
      const count = prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION')?.getCount() ?? 0;
      triangles += count / 3;
    }
  }
  if (triangles > BUDGET.glbTriangles)
    fail(`${rel}: 三角形 ${triangles} が上限 ${BUDGET.glbTriangles} を超える`);
  for (const tex of r.listTextures()) {
    const where = `${rel} のテクスチャ ${tex.getName() || tex.getURI() || '(無名)'}`;
    if (tex.getMimeType() !== 'image/ktx2') {
      fail(`${where}: 形式 ${tex.getMimeType()}（KTX2 にする）`);
      continue;
    }
    const image = tex.getImage();
    checkTextureSize(where, image ? ktx2Size(image) : undefined);
  }
  return triangles;
}

async function checkPublic() {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const files = listFiles(publicDir).filter((f) => f.startsWith(HASHED_PREFIX));
  let total = 0;
  for (const rel of files) {
    const path = join(publicDir, rel);
    const bytes = statSync(path).size;
    total += bytes;
    const ext = posix.extname(rel);
    if (!ALLOWED_EXT.has(ext)) fail(`${rel}: 配信できない形式 ${ext}`);
    if (bytes > BUDGET.fileBytes)
      fail(`${rel}: ${fmt(bytes)} が 1 ファイルの上限 ${fmt(BUDGET.fileBytes)} を超える`);
    if (ext === '.glb') {
      const tris = await checkGlb(io, rel, path);
      console.log(`  ${rel}  ${fmt(bytes)}  ${tris} tris`);
    } else if (ext === '.ktx2') {
      checkTextureSize(rel, ktx2Size(readFileSync(path)));
    }
  }
  if (total > BUDGET.totalBytes)
    fail(`public/assets 合計 ${fmt(total)} が上限 ${fmt(BUDGET.totalBytes)} を超える`);
  console.log(`public/assets: ${files.length} files, ${fmt(total)}`);

  // manifest.json（ビルドスクリプトの記録）が実ファイルと一致するか
  const manifest = JSON.parse(readFileSync(join(publicDir, 'assets/manifest.json'), 'utf8'));
  const entries = [
    ...Object.values(manifest.characters),
    manifest.animations,
    manifest.props,
    manifest.equipment,
    manifest.exploration,
    manifest.environment,
    manifest.player,
    ...Object.values(manifest.blender?.models ?? {}),
  ].filter(Boolean);
  for (const e of entries) {
    const path = join(publicDir, 'assets', e.file);
    if (!existsSync(path)) fail(`manifest.json: ${e.file} が無い`);
    else if (statSync(path).size !== e.bytes)
      fail(
        `manifest.json: ${e.file} の bytes ${e.bytes} が実サイズ ${statSync(path).size} と違う（再ビルドで更新する）`,
      );
  }
  if (manifest.totalBytes !== totalBytesOf(manifest))
    fail(
      `manifest.json: totalBytes ${manifest.totalBytes} が各 bytes の合計 ${totalBytesOf(manifest)} と違う`,
    );
}

/**
 * 開始画面（`#app[data-state=ready]`）までに読むファイル。boot.ts はローディング中に main を動的 import し、
 * `createGameApp` がメッシュ・テクスチャを読み終えてから開始画面を出すので、次をすべて含める:
 * index.html から辿れるコード（script / link、JS の静的・動的 import）、Basis トランスコーダ、glb と KTX2。
 * 音声は開始画面と並行して読む（main.ts の `preloadGroup('title')` は待たない）ので含めない。
 */
function startScreenFiles(files) {
  const seen = new Set();
  const queue = [];
  const add = (rel) => {
    if (seen.has(rel) || !existsSync(join(distDir, rel))) return;
    seen.add(rel);
    queue.push(rel);
  };
  add('index.html');
  while (queue.length > 0) {
    const rel = queue.shift();
    const text = readFileSync(join(distDir, rel), 'utf8');
    if (rel.endsWith('.html')) {
      for (const m of text.matchAll(/(?:src|href)="\/game-test\/([^"]+)"/g)) add(m[1]);
    } else if (rel.endsWith('.js')) {
      const dir = posix.dirname(rel);
      for (const m of text.matchAll(
        /(?:^|[;\s}])import\s*(?:[^'"`()]*?from\s*)?["'`](\.{1,2}\/[^"'`]+)["'`]/g,
      ))
        add(posix.normalize(posix.join(dir, m[1])));
      for (const m of text.matchAll(/import\(\s*["'`](\.{1,2}\/[^"'`]+)["'`]\s*\)/g))
        add(posix.normalize(posix.join(dir, m[1])));
    }
  }
  for (const rel of files) if (/^basis\/|^assets\/.*\.(glb|ktx2)$/.test(rel)) add(rel);
  return [...seen];
}

/** 配信時の大きさ（§4.3 は圧縮後。Pages は gzip で返すので gzip -9 の大きさで見積もる）。 */
const sizeCache = new Map();
function servedBytes(rel) {
  let n = sizeCache.get(rel);
  if (n === undefined) {
    n = gzipSync(readFileSync(join(distDir, rel)), { level: 9 }).length;
    sizeCache.set(rel, n);
  }
  return n;
}

function checkDist() {
  if (!existsSync(join(distDir, 'index.html'))) {
    fail('dist/ が無い（先に vite build）');
    return;
  }
  const files = listFiles(distDir);
  let total = 0;
  for (const rel of files) {
    total += servedBytes(rel);
    if (UNHASHED_DIST.some((re) => re.test(rel))) continue;
    if (!isHashedName(rel) && !VITE_HASH.test(rel))
      fail(`dist/${rel}: 名前に内容ハッシュが無い（§4.4）`);
  }
  if (total > BUDGET.totalBytes)
    fail(`dist 合計（圧縮後）${fmt(total)} が上限 ${fmt(BUDGET.totalBytes)} を超える`);
  const start = startScreenFiles(files);
  const startBytes = start.reduce((s, rel) => s + servedBytes(rel), 0);
  console.log(`dist（圧縮後）: ${files.length} files, ${fmt(total)}`);
  console.log(`開始画面まで（圧縮後）: ${fmt(startBytes)}`);
  for (const rel of start) console.log(`  ${rel}  ${fmt(servedBytes(rel))}`);
  if (startBytes > BUDGET.startScreenBytes)
    fail(
      `開始画面までの ${fmt(startBytes)}（圧縮後）が上限 ${fmt(BUDGET.startScreenBytes)} を超える`,
    );
}

await checkPublic();
if (process.argv.includes('--dist')) checkDist();

if (errors.length > 0) {
  console.error(`\nアセット検査: ${errors.length} 件の違反`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('アセット検査: OK');
