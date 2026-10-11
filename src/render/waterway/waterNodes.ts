import type { Node, Texture, UniformNode } from 'three/webgpu';
import { abs, float, fract, int, min, texture, vec2 } from 'three/tsl';
import type { WaterGrid } from './waterLayout';
import { CAUSTIC_RANGE, CAUSTIC_TILE, SLOPE_RANGE, type WaterTextures } from './waterTextures';

/**
 * 水面・壁・床が共有する TSL の部品（#270）: 格子のテクスチャの引き方、流れに乗せたスクロール（フローマップ）、コースティクス。
 */

export type F = Node<'float'>;
export type V2 = Node<'vec2'>;
export type V3 = Node<'vec3'>;
export type V4 = Node<'vec4'>;

/** 水の場（波のシミュレーション・格子の静的データ・タイルテクスチャ・シミュレーション時間）。 */
export interface WaterFields {
  readonly grid: WaterGrid;
  /** 波（R = 高さ m、G / B = ∂h/∂x, ∂h/∂z、A = 泡）。 */
  readonly sim: Texture;
  /** 格子の静的データ（R = 壁までの距離 m、G / B = 流れ m/s、A = 水のマスク）。 */
  readonly layout: Texture;
  readonly textures: WaterTextures;
  /** シミュレーション時間（秒。ゲームの固定ステップ / 60）。 */
  readonly time: UniformNode<'float', number>;
}

/** ワールド (x, z) → 格子のテクスチャ座標（セル中心で線形補間）。 */
export function gridUv(grid: WaterGrid, xz: V2): V2 {
  return xz
    .sub(vec2(grid.originX, grid.originZ))
    .div(vec2(grid.nx * grid.cell, grid.nz * grid.cell));
}

/** 波のシミュレーションの値（頂点シェーダからも引けるよう LOD 0 を明示）。 */
export function simAt(fields: WaterFields, xz: V2): V4 {
  return texture(fields.sim, gridUv(fields.grid, xz)).level(int(0));
}

/** 格子の静的データ。 */
export function layoutAt(fields: WaterFields, xz: V2): V4 {
  return texture(fields.layout, gridUv(fields.grid, xz));
}

/** 勾配テクスチャの値 → 勾配（生成スクリプトの符号化の逆）。 */
export function decodeSlope(rgba: V4): V2 {
  return rgba.xy.sub(0.5).mul(2 * SLOPE_RANGE);
}

/**
 * フローマップの 2 位相（流れでスクロールした模様を周期 `period` 秒ごとに巻き戻し、半周期ずらした 2 枚を重ねる）。
 * `offset(k)` は位相 k の流れの移動量（m）に掛ける時間、`weight` は位相 1 の重み。
 */
export interface FlowPhases {
  readonly t0: F;
  readonly t1: F;
  readonly weight: F;
}

export function flowPhases(time: F, period: number): FlowPhases {
  const p0 = fract(time.div(period));
  const p1 = fract(time.div(period).add(0.5));
  return { t0: p0.mul(period), t1: p1.mul(period), weight: abs(p0.mul(2).sub(1)) };
}

/** 流れに乗せた勾配テクスチャ（2 位相）。`flow` は m/s、`tile` はテクスチャ 1 枚の大きさ（m）。 */
export function flowSlope(tex: Texture, xz: V2, flow: V2, phases: FlowPhases, tile: number): V2 {
  const a = decodeSlope(texture(tex, xz.sub(flow.mul(phases.t0)).div(tile)));
  const b = decodeSlope(texture(tex, xz.sub(flow.mul(phases.t1)).div(tile).add(vec2(0.37, 0.61))));
  return a.mul(float(1).sub(phases.weight)).add(b.mul(phases.weight));
}

/**
 * コースティクスの明るさ（平均 ≈ 1）。2 枚の焼いたコースティクスを別の向きにスクロールし、min で重ねる
 * （2 枚の焦線が交わる所だけが明るく、時間で形が崩れては結び直す）。`uv` は m 単位の面の座標、`distort` は波の勾配によるずれ（m）。
 */
export function causticsAt(fields: WaterFields, uv: V2, distort: V2): F {
  const t = fields.time;
  const p = uv.add(distort).div(CAUSTIC_TILE);
  const a = texture(fields.textures.caustics, p.add(vec2(t.mul(0.043), t.mul(0.019)))).x;
  const b = texture(
    fields.textures.caustics,
    p
      .mul(1.13)
      .add(vec2(t.mul(-0.027), t.mul(0.037)))
      .add(vec2(0.21, 0.53)),
  ).y;
  // 2 枚の min の平均はおよそ 0.6 / CAUSTIC_RANGE。平均 1 に正規化する
  return min(a, b).mul(CAUSTIC_RANGE / 0.6);
}
