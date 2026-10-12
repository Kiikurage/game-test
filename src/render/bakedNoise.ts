import {
  DataTexture,
  HalfFloatType,
  LinearFilter,
  NoColorSpace,
  RGFormat,
  RepeatWrapping,
  ClampToEdgeWrapping,
  type Texture,
} from 'three/webgpu';
import { float, floor, fract, max, mix, texture, vec2, vec3 } from 'three/tsl';
import type { Node } from 'three/webgpu';
import type { MaterialDetail } from './quality';
import {
  ATLAS,
  CELLS,
  CELLS_SIZE,
  LATTICE,
  SIZE,
  TILE,
  TILES,
} from '../../scripts/assets/noiseLayout.mjs';
import { getKtx2Loader } from './assets/ktx2';
import { assetUrl } from '../core/assetUrl';

/**
 * 焼いたノイズテクスチャ（#236、#326 でオフライン生成へ）。
 *
 * フラグメントで `mx_noise_float`（格子 8 点のハッシュ + 勾配 + 補間で 1 回あたり数百命令）や `hash` を呼ぶ代わりに、
 * `scripts/assets/build-noise-textures.mjs`（`npm run assets:noise`）が焼いた KTX2 を引く。実行時にノイズは計算しない。
 * - perlin: タイル可能な 3D パーリン（周期 {@link LATTICE} 格子セル × {@link SIZE} ボクセル）を 2D アトラス（RG 半精度）に並べたもの。
 *   8bit だと `dFdx(height)` で凹凸の法線を作る箇所で階段状になるので半精度。
 * - cells: R = 白色ノイズ（{@link bakedHash}）、G = セルノイズの F2 − F1（{@link bakedCellEdge}）。
 *
 * テクスチャのオブジェクトはモジュールで 1 つずつ持ち、マテリアルのグラフはそれを参照する。中身は
 * {@link loadNoiseTextures}（レンダラー初期化時に待つ）で KTX2 の画素に差し替える。読み込み前・失敗時は 0（模様なし）。
 *
 * three の `Data3DTexture` を使わない理由: three は 3D テクスチャにも RENDER_ATTACHMENT 用途を付けるため、
 * 一部の Chrome（Dawn）が初期化時に 3D テクスチャの 2D ビューを作ろうとして検証エラーになる。
 */

const perlinTexture = new DataTexture(
  new Uint16Array(ATLAS * ATLAS * 2),
  ATLAS,
  ATLAS,
  RGFormat,
  HalfFloatType,
);
perlinTexture.minFilter = LinearFilter;
perlinTexture.magFilter = LinearFilter;
perlinTexture.wrapS = perlinTexture.wrapT = ClampToEdgeWrapping;
perlinTexture.generateMipmaps = false;
perlinTexture.colorSpace = NoColorSpace;
perlinTexture.needsUpdate = true;

const cellsTexture = new DataTexture(
  new Uint8Array(CELLS_SIZE * CELLS_SIZE * 2),
  CELLS_SIZE,
  CELLS_SIZE,
  RGFormat,
);
cellsTexture.minFilter = LinearFilter;
cellsTexture.magFilter = LinearFilter;
cellsTexture.wrapS = cellsTexture.wrapT = RepeatWrapping;
cellsTexture.generateMipmaps = false;
cellsTexture.colorSpace = NoColorSpace;
cellsTexture.needsUpdate = true;

export function getNoiseTexture(): DataTexture {
  return perlinTexture;
}

export function getCellsTexture(): DataTexture {
  return cellsTexture;
}

function adopt(target: DataTexture, loaded: Texture): void {
  const image = loaded.image as typeof target.image;
  if (image.width !== target.image.width || image.height !== target.image.height)
    throw new Error(`noise texture size mismatch: ${image.width}x${image.height}`);
  target.image = image;
  target.needsUpdate = true;
  loaded.dispose();
}

/** 焼いたノイズの KTX2 を読み、共有テクスチャの中身を差し替える（`configureKtx2Loader` の後に呼ぶ）。 */
export async function loadNoiseTextures(): Promise<void> {
  const loader = getKtx2Loader();
  const [perlin, cells] = await Promise.all([
    loader.loadAsync(assetUrl('assets/noise/perlin.ktx2')),
    loader.loadAsync(assetUrl('assets/noise/cells.ktx2')),
  ]);
  adopt(perlinTexture, perlin);
  adopt(cellsTexture, cells);
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
  const rg = texture(perlinTexture, uvAtlas).rg;
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

/**
 * `hash(x)`（0..1 の擬似乱数）の代わり。白色ノイズのテクセルを 1 つ引く（補間しない。頂点シェーダでも使える）。
 * x → テクセルは R2 列（無理数の倍率）で散らすので、隣り合う整数でも離れたテクセルになる。
 */
export function bakedHash(x: Node<'float'> | Node<'uint'> | Node<'int'>): Node<'float'> {
  // three の `hash` と同じく入力を uint に切り捨てる（負は 0）。小数の種（0..1 のハッシュ値など）は
  // 置換前と同じく同じ値になる。切り捨てないと、置換前は一様だった石の明暗・ひびがばらつく（#326）
  const f = floor(max(float(x), 0));
  const cell = floor(fract(vec2(f.mul(0.7548776662), f.mul(0.5698402911))).mul(CELLS_SIZE));
  return texture(cellsTexture, cell.add(0.5).div(CELLS_SIZE)).level(float(0)).r;
}

/**
 * `mx_worley_noise_vec2(p)` の F2 − F1 の代わり（セル境界で 0、セル単位の距離。1 で飽和）。
 * 周波数 1 = 1 セル / 単位、周期 {@link CELLS}。
 */
export function bakedCellEdge(p: Node<'vec2'>): Node<'float'> {
  return texture(cellsTexture, p.div(CELLS)).g;
}

/** UV など 2D 座標用（z は固定オフセット）。 */
export function bakedNoise2(p: Node<'vec2'>, z = 0.37): Node<'float'> {
  return bakedNoise(vec3(p.x, p.y, float(z)));
}

// --- マテリアルの詳細度（品質プリセット）---

export type { MaterialDetail };

let materialDetail: MaterialDetail = 2;

/** 品質プリセットの `materialDetail` を設定する（マテリアルを作る前に呼ぶ）。 */
export function setMaterialDetail(detail: MaterialDetail): void {
  materialDetail = detail;
}

export function getMaterialDetail(): MaterialDetail {
  return materialDetail;
}
