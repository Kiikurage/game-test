// 使い方:
//   npm run assets:water            地下水路の水（#270）のタイル可能なテクスチャを生成して public/assets/water/ に書く
//   npm run assets:water -- --check 生成し直した結果がコミット済みのファイルとバイト単位で一致するか検査する
//
// 外部データは使わない。すべて固定シードの手続き生成で、同じ Node.js（zlib）と ktx2-encoder なら毎回同じバイト列になる。
// 8bit RGB の画像を作り、KTX2（UASTC + Zstandard、ミップマップ付き、リニア値。scripts/assets/ktx2.mjs の 'data'）で書く（#328）。
// 画像の先頭行が v = 1 になるように上下反転して格納する（PNG を TextureLoader の flipY で読んでいたときと同じ向き）。
//   water-ripple.ktx2  512²  細かいさざ波の勾配（R = ∂h/∂u、G = ∂h/∂v を [-SLOPE_RANGE, SLOPE_RANGE] → 0..255、B = 高さ）
//   water-swell.ktx2   256²  ゆるいうねりの勾配（同じ符号化）
//   water-caustics.ktx2 512² R / G = 別の海面から焼いたコースティクス（強度 I を I / CAUSTIC_RANGE で 0..1 に。平均 ≈ 1 / CAUSTIC_RANGE）、
//                           B = 泡・浮きかすの模様（セル境界のネットワーク）
// 勾配はタイル内の周期関数（整数の波数ベクトルの正弦波の和）から解析的に求めるので継ぎ目が出ない。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { encodeKtx2 } from './ktx2.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(ROOT, 'public', 'assets', 'water');
/** 勾配の符号化範囲（シェーダ `waterTextures.ts` の SLOPE_RANGE と一致させる）。 */
export const SLOPE_RANGE = 1.5;
/** コースティクスの強度の符号化範囲（シェーダの CAUSTIC_RANGE と一致させる）。 */
export const CAUSTIC_RANGE = 4;

// ---------------------------------------------------------------- PNG

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** 8bit RGB の PNG（フィルタなし・zlib 最大圧縮）。 */
function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let i = 0; i < width * 3; i++) raw[row + 1 + i] = rgb[y * width * 3 + i];
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- 乱数・周期関数

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * タイル [0,1)² で周期的な高さ場の波の一覧。波数ベクトルは整数（= 継ぎ目なし）、振幅は |k|^-power。
 * `aniso` > 0 で u 方向（流れの方向）の波を伸ばす（v 方向の波数を優先）。
 */
function spectrum(seed, kMin, kMax, power, count, aniso = 0) {
  const rand = mulberry32(seed);
  const waves = [];
  const seen = new Set();
  while (waves.length < count) {
    const ang = rand() * Math.PI * 2;
    const r = kMin * Math.pow(kMax / kMin, rand());
    let kx = Math.round(Math.cos(ang) * r * (1 - aniso * 0.6));
    const ky = Math.round(Math.sin(ang) * r);
    if (kx === 0 && ky === 0) continue;
    if (kx < 0 || (kx === 0 && ky < 0)) kx = -kx; // 符号違いの重複を避ける
    const key = `${kx},${ky}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const k = Math.hypot(kx, ky);
    waves.push({
      kx,
      ky,
      amp: Math.pow(k, -power) * (0.6 + 0.8 * rand()),
      phase: rand() * Math.PI * 2,
    });
  }
  return waves;
}

/** 波の和の高さと勾配を size² の格子で求める（勾配はタイル 1 = 1 単位あたり）。 */
function evaluate(waves, size) {
  const n = size * size;
  const h = new Float64Array(n);
  const gx = new Float64Array(n);
  const gy = new Float64Array(n);
  // 行ごとに cos/sin を分離して計算量を抑える: cos(a + b) = cos a cos b - sin a sin b
  const cu = new Float64Array(size);
  const su = new Float64Array(size);
  for (const w of waves) {
    const tw = Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const a = (tw * w.kx * x) / size + w.phase;
      cu[x] = Math.cos(a);
      su[x] = Math.sin(a);
    }
    for (let y = 0; y < size; y++) {
      const b = (tw * w.ky * y) / size;
      const cb = Math.cos(b);
      const sb = Math.sin(b);
      const row = y * size;
      for (let x = 0; x < size; x++) {
        const c = cu[x] * cb - su[x] * sb;
        const s = su[x] * cb + cu[x] * sb;
        h[row + x] += w.amp * c;
        gx[row + x] -= w.amp * tw * w.kx * s;
        gy[row + x] -= w.amp * tw * w.ky * s;
      }
    }
  }
  return { h, gx, gy };
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const toByte = (v) => Math.round(clamp01(v) * 255);

/**
 * 勾配テクスチャ。`slopeScale` は勾配の大きさの目標（RMS）。符号化は SLOPE_RANGE で飽和させる。
 */
function slopeTexture(seed, size, kMin, kMax, power, count, targetRms, aniso = 0) {
  const { h, gx, gy } = evaluate(spectrum(seed, kMin, kMax, power, count, aniso), size);
  const n = size * size;
  let s2 = 0;
  let hMin = Infinity;
  let hMax = -Infinity;
  for (let i = 0; i < n; i++) {
    s2 += gx[i] * gx[i] + gy[i] * gy[i];
    hMin = Math.min(hMin, h[i]);
    hMax = Math.max(hMax, h[i]);
  }
  const k = targetRms / Math.sqrt(s2 / n / 2);
  const rgb = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    rgb[i * 3] = toByte((gx[i] * k) / (2 * SLOPE_RANGE) + 0.5);
    rgb[i * 3 + 1] = toByte((gy[i] * k) / (2 * SLOPE_RANGE) + 0.5);
    rgb[i * 3 + 2] = toByte((h[i] - hMin) / (hMax - hMin));
  }
  return rgb;
}

/**
 * コースティクス: 周期的な水面を通った平行光が底に作る明るさ。
 * 光子を細かい格子から出し、水面の勾配に比例してずらして（近軸近似: 変位 ∝ 深さ·(1 - 1/n)·勾配）底へ落とし、
 * 双線形で周期的に積む。平均 1 に正規化する。`displacement` は光子の変位の RMS（タイル単位）で、
 * 0.02 前後で最初の焦線（明るい網目）がはっきり出る（大きすぎると焦線が重なって霞む）。
 */
function caustics(seed, size, displacement) {
  const sub = 4;
  const src = size * sub;
  const { gx, gy } = evaluate(spectrum(seed, 3, 11, 2.2, 40), src);
  const acc = new Float64Array(size * size);
  let g2 = 0;
  for (let i = 0; i < gx.length; i++) g2 += gx[i] * gx[i] + gy[i] * gy[i];
  const bend = displacement / Math.sqrt(g2 / gx.length);
  for (let y = 0; y < src; y++) {
    for (let x = 0; x < src; x++) {
      const i = y * src + x;
      // 光子の到達点（テクセル単位）
      let px = (x + 0.5) / sub - bend * gx[i] * size;
      let py = (y + 0.5) / sub - bend * gy[i] * size;
      px -= 0.5;
      py -= 0.5;
      const ix = Math.floor(px);
      const iy = Math.floor(py);
      const fx = px - ix;
      const fy = py - iy;
      const x0 = ((ix % size) + size) % size;
      const y0 = ((iy % size) + size) % size;
      const x1 = (x0 + 1) % size;
      const y1 = (y0 + 1) % size;
      acc[y0 * size + x0] += (1 - fx) * (1 - fy);
      acc[y0 * size + x1] += fx * (1 - fy);
      acc[y1 * size + x0] += (1 - fx) * fy;
      acc[y1 * size + x1] += fx * fy;
    }
  }
  // 1 テクセルのぼかし（光子の離散化のざらつきを消す）
  const out = new Float64Array(size * size);
  const mean = (sub * sub) | 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let s = 0;
      let w = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const k = (dx === 0 ? 2 : 1) * (dy === 0 ? 2 : 1);
          s += acc[((y + dy + size) % size) * size + ((x + dx + size) % size)] * k;
          w += k;
        }
      }
      out[y * size + x] = s / w / mean;
    }
  }
  return out;
}

/** 泡・浮きかす: 周期的なセル（ボロノイ）の境界のネットワーク。0..1（1 = 境界の泡）。 */
function foam(seed, size, cells) {
  const rand = mulberry32(seed);
  const pts = [];
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) pts.push([(i + rand()) / cells, (j + rand()) / cells]);
  }
  const grid = (i, j) =>
    pts[(((j % cells) + cells) % cells) * cells + (((i % cells) + cells) % cells)];
  const out = new Float64Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const ci = Math.floor(u * cells);
      const cj = Math.floor(v * cells);
      let d1 = Infinity;
      let d2 = Infinity;
      for (let dj = -2; dj <= 2; dj++) {
        for (let di = -2; di <= 2; di++) {
          const p = grid(ci + di, cj + dj);
          const ox = Math.floor((ci + di) / cells);
          const oy = Math.floor((cj + dj) / cells);
          const d = Math.hypot(p[0] + ox - u, p[1] + oy - v);
          if (d < d1) {
            d2 = d1;
            d1 = d;
          } else if (d < d2) d2 = d;
        }
      }
      const edge = (d2 - d1) * cells; // 境界で 0
      out[y * size + x] = Math.pow(clamp01(1 - edge / 0.35), 2.2);
    }
  }
  return out;
}

async function build() {
  const files = {};
  // 細かいさざ波（タイル 0.9m を想定: 波長 約 2〜15cm）
  files['water-ripple.ktx2'] = encodePng(
    512,
    512,
    slopeTexture(0x270a, 512, 6, 46, 1.35, 260, 0.32),
  );
  // ゆるいうねり（タイル 4m を想定: 波長 約 0.4〜2m）。流れの方向（u）へ少し伸ばす
  files['water-swell.ktx2'] = encodePng(
    256,
    256,
    slopeTexture(0x270b, 256, 2, 10, 1.6, 70, 0.22, 0.5),
  );

  const size = 512;
  const ca = caustics(0x270c, size, 0.019);
  const cb = caustics(0x270d, size, 0.022);
  const fm = foam(0x270e, size, 14);
  const rgb = new Uint8Array(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    rgb[i * 3] = toByte(ca[i] / CAUSTIC_RANGE);
    rgb[i * 3 + 1] = toByte(cb[i] / CAUSTIC_RANGE);
    rgb[i * 3 + 2] = toByte(fm[i]);
  }
  files['water-caustics.ktx2'] = encodePng(size, size, rgb);
  for (const [name, png] of Object.entries(files)) {
    files[name] = Buffer.from(await encodeKtx2(png, 'data', { flipY: true }));
  }
  return files;
}

const checkOnly = process.argv.includes('--check');
const files = await build();
mkdirSync(OUT_DIR, { recursive: true });
let mismatch = 0;
for (const [name, data] of Object.entries(files)) {
  const path = join(OUT_DIR, name);
  if (checkOnly) {
    let same;
    try {
      same = readFileSync(path).equals(data);
    } catch {
      same = false;
    }
    if (!same) {
      console.error(`mismatch: ${name}`);
      mismatch++;
    }
  } else {
    writeFileSync(path, data);
    console.log(`${name} ${data.length} bytes`);
  }
}
if (checkOnly) {
  if (mismatch > 0) process.exit(1);
  console.log('water textures are up to date');
}
