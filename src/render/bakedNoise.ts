import {
  ClampToEdgeWrapping,
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  RGFormat,
} from 'three/webgpu';
import { float, floor, fract, mix, texture, vec2, vec3 } from 'three/tsl';
import type { Node } from 'three/webgpu';
import type { QualityLevel } from './quality';

/**
 * ロード時に一度だけ焼いたタイル可能な 3D パーリンノイズ（#236）。
 *
 * フラグメントで `mx_noise_float`（パーリン。格子 8 点のハッシュ + 勾配 + 補間で 1 回あたり数百命令）を
 * 何度も呼ぶ代わりに、3D テクスチャを 1 回サンプルする。モバイル GPU（Adreno など）は整数ハッシュが遅く、
 * 石積み・地形・闘技場のマテリアルがノイズ 10 回超で、これが主因だった。
 *
 * - 格子周期 {@link LATTICE}（= 8 格子セル）× {@link SIZE}³ ボクセル（1 セルあたり 8 ボクセル）。半精度 float。
 *   8bit だと `dFdx(height)` で凹凸の法線を作る箇所で階段状になるので使わない。
 * - 値の範囲・周波数は `mx_noise_float(p)` とほぼ同じ（`bakedNoise(p)` は p の周波数 1 = 格子 1 セル/m）。
 *   周期は 8（ワールド座標 p の単位）で繰り返す。低周波の項は 1 周期が十分に広い（`p * 0.13` なら約 60m）。
 * - ミップマップなし・線形補間・リピート。
 */
const SIZE = 64;
const LATTICE = 8;

/** 周期 `period` の整数格子ハッシュ（置換表）。 */
function makePermutation(): Uint8Array {
  const perm = new Uint8Array(256);
  for (let i = 0; i < 256; i++) perm[i] = i;
  // 固定シードの Fisher-Yates（毎回同じ模様にする）
  let s = 0x9e3779b9;
  const rand = (): number => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x100000000;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = perm[i] ?? 0;
    perm[i] = perm[j] ?? 0;
    perm[j] = t;
  }
  return perm;
}

const GRADS: readonly (readonly [number, number, number])[] = [
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

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

/** 周期 LATTICE のパーリンノイズ（約 -1..1）を焼いたバイト列（半精度）を作る。純粋関数（テスト用に公開）。 */
export function bakePerlin(size = SIZE, lattice = LATTICE): Uint16Array {
  const perm = makePermutation();
  const hash = (x: number, y: number, z: number): number => {
    const xi = ((x % lattice) + lattice) % lattice;
    const yi = ((y % lattice) + lattice) % lattice;
    const zi = ((z % lattice) + lattice) % lattice;
    return perm[((perm[((perm[xi] ?? 0) + yi) & 255] ?? 0) + zi) & 255] ?? 0;
  };
  const grad = (h: number, x: number, y: number, z: number): number => {
    const g = GRADS[h % 12] ?? [0, 0, 0];
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
        const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
        const n = (dx: number, dy: number, dz: number): number =>
          grad(hash(x0 + dx, y0 + dy, z0 + dz), fx - dx, fy - dy, fz - dz);
        const value = lerp(
          lerp(lerp(n(0, 0, 0), n(1, 0, 0), u), lerp(n(0, 1, 0), n(1, 1, 0), u), v),
          lerp(lerp(n(0, 0, 1), n(1, 0, 1), u), lerp(n(0, 1, 1), n(1, 1, 1), u), v),
          w,
        );
        // 改良パーリン（12 勾配）の値域は約 ±1。mx_noise_float と同程度の振幅
        data[(z * size + y) * size + x] = DataUtils.toHalfFloat(value);
      }
    }
  }
  return data;
}

/** タイルの 1 辺（ボクセル 64 + 周囲 1 テクセルの巻き付け余白）と、アトラスのタイル数（8 × 8 = 64 スライス）。 */
const TILE = SIZE + 2;
const TILES = 8;
const ATLAS = TILE * TILES;

/**
 * 3D ノイズを 2D アトラス（RG 半精度）に並べる。R = スライス z、G = 次のスライス z+1（巻き付け）。
 * 各タイルは周囲に 1 テクセルの余白（反対側の端のコピー）を持ち、ハードウェアの双線形補間がタイルをまたいでも
 * 隣のタイルを拾わない。z 方向の補間はシェーダで 1 回の `mix(R, G, t)`。
 *
 * three の `Data3DTexture` を使わない理由: three は 3D テクスチャにも RENDER_ATTACHMENT 用途を付けるため、
 * 一部の Chrome（Dawn）が初期化時に 3D テクスチャの 2D ビューを作ろうとして検証エラーになる。
 */
export function buildNoiseAtlas(volume: Uint16Array, size = SIZE): Uint16Array {
  const tile = size + 2;
  const tiles = Math.ceil(Math.sqrt(size));
  const atlas = tile * tiles;
  const out = new Uint16Array(atlas * atlas * 2);
  const wrap = (i: number): number => (i + size) % size;
  for (let z = 0; z < size; z++) {
    const ox = (z % tiles) * tile;
    const oy = Math.floor(z / tiles) * tile;
    const z1 = (z + 1) % size;
    for (let ty = 0; ty < tile; ty++) {
      for (let tx = 0; tx < tile; tx++) {
        const x = wrap(tx - 1);
        const y = wrap(ty - 1);
        const o = ((oy + ty) * atlas + ox + tx) * 2;
        out[o] = volume[(z * size + y) * size + x] ?? 0;
        out[o + 1] = volume[(z1 * size + y) * size + x] ?? 0;
      }
    }
  }
  return out;
}

let cached: DataTexture | null = null;

export function getNoiseTexture(): DataTexture {
  if (cached) return cached;
  const texture = new DataTexture(
    buildNoiseAtlas(bakePerlin()),
    ATLAS,
    ATLAS,
    RGFormat,
    HalfFloatType,
  );
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  cached = texture;
  return texture;
}

/**
 * `mx_noise_float(p)` の代わり（約 -1..1）。`p` は vec3。周波数 1 = 格子 1 セル / 単位。
 * アトラスを 1 回サンプルして z 方向だけ手で補間する（ALU 約 20 命令。`mx_noise_float` は数百命令）。
 */
export function bakedNoise(p: Node<'vec3'>): Node<'float'> {
  const q = p.div(LATTICE);
  const f = fract(q);
  const zf = f.z.mul(SIZE);
  const zi = floor(zf);
  const tile = vec2(zi.mod(TILES), floor(zi.div(TILES)));
  // タイル内の座標（テクセル）: ボクセル i は i + 1.5 の中心（余白 1 + 半テクセル）
  const uvAtlas = tile.mul(TILE).add(f.xy.mul(SIZE)).add(1.5).div(ATLAS);
  const rg = texture(getNoiseTexture(), uvAtlas).rg;
  return mix(rg.x, rg.y, zf.sub(zi));
}

/** `mx_fractal_noise_float(p, octaves, 2, 0.5)` の代わり（振幅 1, 0.5, 0.25...、周波数 ×2 ずつ）。 */
export function bakedFractal(p: Node<'vec3'>, octaves: number): Node<'float'> {
  let sum: Node<'float'> = bakedNoise(p);
  let amp = 1;
  let freq = 1;
  for (let i = 1; i < octaves; i++) {
    amp *= 0.5;
    freq *= 2;
    sum = sum.add(bakedNoise(p.mul(freq)).mul(amp));
  }
  return sum;
}

/** UV など 2D 座標用（z は固定オフセット）。 */
export function bakedNoise2(p: Node<'vec2'>, z = 0.37): Node<'float'> {
  return bakedNoise(vec3(p.x, p.y, float(z)));
}

// --- マテリアルの詳細度（品質プリセット）---

/** マテリアルのノイズ層の数などを決める。0 = low、1 = medium（モバイル既定）、2 = high。 */
export type MaterialDetail = 0 | 1 | 2;

let materialDetail: MaterialDetail = 2;

export function setMaterialDetail(level: QualityLevel): void {
  materialDetail = level === 'low' ? 0 : level === 'medium' ? 1 : 2;
}

export function getMaterialDetail(): MaterialDetail {
  return materialDetail;
}
