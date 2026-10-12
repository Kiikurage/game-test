// 焼いたノイズテクスチャの生成（純粋関数。#236 → #326 でオフライン生成へ移した）。
// build-noise-textures.mjs が KTX2 に書き、src/render/bakedNoise.ts が読む。ユニットテストもここを直接呼ぶ。
//
// perlin: タイル可能な 3D パーリンノイズ（周期 LATTICE 格子セル、1 周期 SIZE ボクセル）を 2D アトラスに並べたもの。
//   各スライス z のタイル（SIZE + 余白 2）を TILES × TILES に並べる。R = スライス z、G = スライス z+1（巻き付け）。
//   タイルの周囲 1 テクセルは反対側の端のコピー（ハードウェアの双線形補間がタイルをまたいでも隣を拾わない）。
//   SIZE = 62 にしてアトラスを 2 の冪（512²）に収める（KTX2 の配信規則。scripts/assets/check.mjs）。
// cells: 512² の 8bit 2 チャンネル。
//   R = 白色ノイズ（テクセル単位で独立な一様乱数。シェーダの `bakedHash` がテクセル中心を引く）
//   G = タイル可能なセルノイズ（ボロノイ）の F2 − F1（セル単位の距離。0..1 に飽和）。1 タイル CELLS × CELLS セル
import { DataUtils } from 'three';
import { CELLS, CELLS_SIZE, LATTICE, SIZE } from './noiseLayout.mjs';

export * from './noiseLayout.mjs';

/** 固定シードの xorshift（毎回同じ模様にする）。 */
function xorshift(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x100000000;
  };
}

function makePermutation() {
  const perm = new Uint8Array(256);
  for (let i = 0; i < 256; i++) perm[i] = i;
  const rand = xorshift(0x9e3779b9);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }
  return perm;
}

const GRADS = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
];

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

/** 周期 `lattice` のパーリンノイズ（約 -1..1、半精度）を size³ ボクセルに焼く。 */
export function bakePerlin(size = SIZE, lattice = LATTICE) {
  const perm = makePermutation();
  const hash = (x, y, z) => {
    const xi = ((x % lattice) + lattice) % lattice;
    const yi = ((y % lattice) + lattice) % lattice;
    const zi = ((z % lattice) + lattice) % lattice;
    return perm[(perm[(perm[xi] + yi) & 255] + zi) & 255];
  };
  const grad = (h, x, y, z) => {
    const g = GRADS[h % 12];
    return g[0] * x + g[1] * y + g[2] * z;
  };
  const data = new Uint16Array(size * size * size);
  const k = lattice / size;
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const px = x * k;
        const py = y * k;
        const pz = z * k;
        const x0 = Math.floor(px);
        const y0 = Math.floor(py);
        const z0 = Math.floor(pz);
        const fx = px - x0;
        const fy = py - y0;
        const fz = pz - z0;
        const u = fade(fx);
        const v = fade(fy);
        const w = fade(fz);
        const n = (dx, dy, dz) => grad(hash(x0 + dx, y0 + dy, z0 + dz), fx - dx, fy - dy, fz - dz);
        const value = lerp(
          lerp(lerp(n(0, 0, 0), n(1, 0, 0), u), lerp(n(0, 1, 0), n(1, 1, 0), u), v),
          lerp(lerp(n(0, 0, 1), n(1, 0, 1), u), lerp(n(0, 1, 1), n(1, 1, 1), u), v),
          w,
        );
        data[(z * size + y) * size + x] = DataUtils.toHalfFloat(value);
      }
    }
  }
  return data;
}

/** 3D ノイズを 2D アトラス（RG）に並べる。タイル数は ceil(sqrt(size))。 */
export function buildNoiseAtlas(volume, size = SIZE) {
  const tile = size + 2;
  const tiles = Math.ceil(Math.sqrt(size));
  const atlas = tile * tiles;
  const out = new Uint16Array(atlas * atlas * 2);
  const wrap = (i) => (i + size) % size;
  for (let z = 0; z < size; z++) {
    const ox = (z % tiles) * tile;
    const oy = Math.floor(z / tiles) * tile;
    const z1 = (z + 1) % size;
    for (let ty = 0; ty < tile; ty++) {
      for (let tx = 0; tx < tile; tx++) {
        const x = wrap(tx - 1);
        const y = wrap(ty - 1);
        const o = ((oy + ty) * atlas + ox + tx) * 2;
        out[o] = volume[(z * size + y) * size + x];
        out[o + 1] = volume[(z1 * size + y) * size + x];
      }
    }
  }
  return out;
}

/** cells テクスチャ（RG 8bit、size²）。R = 白色ノイズ、G = セルノイズの F2 − F1。 */
export function bakeCells(size = CELLS_SIZE, cells = CELLS) {
  const rand = xorshift(0x326c0de);
  const out = new Uint8Array(size * size * 2);
  for (let i = 0; i < size * size; i++) out[i * 2] = Math.floor(rand() * 256);
  const pts = [];
  for (let j = 0; j < cells; j++)
    for (let i = 0; i < cells; i++) pts.push([i + rand(), j + rand()]);
  const point = (i, j) => {
    const wi = ((i % cells) + cells) % cells;
    const wj = ((j % cells) + cells) % cells;
    const p = pts[wj * cells + wi];
    return [p[0] + (i - wi), p[1] + (j - wj)];
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = ((x + 0.5) / size) * cells;
      const v = ((y + 0.5) / size) * cells;
      const ci = Math.floor(u);
      const cj = Math.floor(v);
      let d1 = Infinity;
      let d2 = Infinity;
      for (let dj = -2; dj <= 2; dj++) {
        for (let di = -2; di <= 2; di++) {
          const p = point(ci + di, cj + dj);
          const d = Math.hypot(p[0] - u, p[1] - v);
          if (d < d1) {
            d2 = d1;
            d1 = d;
          } else if (d < d2) d2 = d;
        }
      }
      out[(y * size + x) * 2 + 1] = Math.round(Math.min(1, d2 - d1) * 255);
    }
  }
  return out;
}
