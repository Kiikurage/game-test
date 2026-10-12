import {
  DataTexture,
  HalfFloatType,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  ClampToEdgeWrapping,
  DataUtils,
  type Texture,
} from 'three/webgpu';
import type { WaterGrid } from './waterLayout';
import { getKtx2Loader } from '../assets/ktx2';
import { assetUrl } from '../../core/assetUrl';

/**
 * 水のテクスチャ（#270）。`scripts/assets/build-water-textures.mjs` がオフラインで決定的に生成したタイル可能なテクスチャ（KTX2 / UASTC、ミップマップ同梱。#328）。
 *  - ripple: 細かいさざ波の勾配（RG）と高さ（B）。タイル `RIPPLE_TILE` m
 *  - swell : ゆるいうねりの勾配（RG）。タイル `SWELL_TILE` m
 *  - caustics: R / G = 2 枚のコースティクス（min で重ねる）、B = 泡の模様
 * 読み込みに失敗したら平らな 1 画素のテクスチャで代用する（水面は平らになるだけで、ゲームは続行する）。
 */

/** 勾配の符号化の範囲（生成スクリプトの SLOPE_RANGE）。 */
export const SLOPE_RANGE = 1.5;
/** コースティクスの符号化の範囲（生成スクリプトの CAUSTIC_RANGE）。 */
export const CAUSTIC_RANGE = 4;
export const RIPPLE_TILE = 0.9;
export const SWELL_TILE = 4.2;
export const CAUSTIC_TILE = 1.25;

export interface WaterTextures {
  readonly ripple: Texture;
  readonly swell: Texture;
  readonly caustics: Texture;
}

function placeholder(r: number, g: number, b: number): DataTexture {
  const t = new DataTexture(new Uint8Array([r, g, b, 255]), 1, 1, RGBAFormat);
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

/** 読み込みに失敗したときの代用（勾配 0 = 平ら、コースティクスは平均の明るさ、泡なし）。 */
export function placeholderWaterTextures(): WaterTextures {
  return {
    ripple: placeholder(128, 128, 128),
    swell: placeholder(128, 128, 128),
    caustics: placeholder(64, 64, 0),
  };
}

/** KTX2 を読み込む（失敗はそのまま投げる。呼び出し側が代用に切り替える）。 */
export async function loadWaterTextures(): Promise<WaterTextures> {
  const loader = getKtx2Loader();
  const load = async (name: string): Promise<Texture> => {
    const tex = await loader.loadAsync(assetUrl(`assets/water/${name}`));
    tex.colorSpace = NoColorSpace;
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearMipmapLinearFilter;
    // ミップマップはファイルに入っている（圧縮テクスチャは GPU で生成できない）
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  };
  const [ripple, swell, caustics] = await Promise.all([
    load('water-ripple.ktx2'),
    load('water-swell.ktx2'),
    load('water-caustics.ktx2'),
  ]);
  return { ripple, swell, caustics };
}

/**
 * 格子の静的なデータのテクスチャ（半精度 RGBA。セル中心で線形補間）:
 * R = 壁までの距離（m）、G / B = 流れ（m/s）、A = 水のマスク。
 */
export function createLayoutTexture(grid: WaterGrid): DataTexture {
  const { nx, nz } = grid;
  const data = new Uint16Array(nx * nz * 4);
  for (let k = 0; k < nx * nz; k++) {
    data[k * 4] = DataUtils.toHalfFloat(grid.wallDistance[k] ?? 0);
    data[k * 4 + 1] = DataUtils.toHalfFloat(grid.flow[k * 2] ?? 0);
    data[k * 4 + 2] = DataUtils.toHalfFloat(grid.flow[k * 2 + 1] ?? 0);
    data[k * 4 + 3] = DataUtils.toHalfFloat(grid.mask[k] ?? 0);
  }
  const t = new DataTexture(data, nx, nz, RGBAFormat, HalfFloatType);
  t.magFilter = LinearFilter;
  t.minFilter = LinearFilter;
  t.wrapS = ClampToEdgeWrapping;
  t.wrapT = ClampToEdgeWrapping;
  t.generateMipmaps = false;
  t.colorSpace = NoColorSpace;
  t.needsUpdate = true;
  return t;
}
