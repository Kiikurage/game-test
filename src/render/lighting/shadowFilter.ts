import { Fn, float, reference, texture, vec2 } from 'three/tsl';
import type { DirectionalLightShadow, Node } from 'three/webgpu';

/**
 * 画面ノイズを使わない決定的な PCF（#401）。
 *
 * three r186 標準の `PCFShadowFilter` は、画面座標の `interleavedGradientNoise` で回した 5 点の Vogel 円盤で影を引く。
 * TAA で時間方向に均す前提のノイズなので、TAA を常用しないこのゲームでは影の縁や自己影が 1 画素ごとの粒になって残る。
 * ここでは影マップの比較サンプル（ハードウェアの 2×2 双線形比較）を 4×4 の固定格子で二項重み（1,3,3,1）の平均にする。
 * 格子は影の座標に対して固定で、サンプル位置が連続に動くので、画素ごとの乱数が入らない。
 *
 * `shadow.radius`（影マップのテクセル数）が格子の半幅に対応する。`light.shadow.filterNode` に渡して使う
 * （ShadowNode は `shadow.filterNode` があれば `renderer.shadowMap.type` の既定フィルタより優先する）。
 */

/** 格子の 1 辺あたりの点数。 */
const TAPS = 4;
/** 二項重み（1,3,3,1）。 */
const WEIGHTS = [1, 3, 3, 1] as const;
const WEIGHT_SUM = 8;
/** `shadow.radius` に対する格子の半幅の比（格子の外側の点の中心位置 = radius * この値 テクセル）。 */
const EXTENT_PER_RADIUS = 0.8;

interface ShadowFilterInputs {
  depthTexture: Parameters<typeof texture>[0];
  shadowCoord: Node<'vec3'>;
  shadow: object;
  depthLayer?: Node<'int'>;
}

const filter = Fn((args: { readonly [key: string]: unknown }) => {
  const { depthTexture, shadowCoord, shadow, depthLayer } = args as unknown as ShadowFilterInputs;
  const mapSize = reference('mapSize', 'vec2', shadow);
  const radius = reference('radius', 'float', shadow);
  const texelSize = vec2(1).div(mapSize);
  // 外側の点の中心位置（UV）。点の間隔は 2 * extent / (TAPS - 1)
  const extent = radius.mul(EXTENT_PER_RADIUS).mul(texelSize.x);
  const spacing = extent.mul(2 / (TAPS - 1));

  let sum: Node<'float'> = float(0);
  for (let j = 0; j < TAPS; j++) {
    for (let i = 0; i < TAPS; i++) {
      const offset = vec2(i - (TAPS - 1) / 2, j - (TAPS - 1) / 2).mul(spacing);
      let depth = texture(depthTexture, shadowCoord.xy.add(offset));
      if ((depthTexture as { isArrayTexture?: boolean }).isArrayTexture === true) {
        depth = depth.depth(depthLayer as Node<'int'>);
      }
      const tap = depth.compare(shadowCoord.z) as unknown as Node<'float'>;
      sum = sum.add(tap.mul((WEIGHTS[i] as number) * (WEIGHTS[j] as number)));
    }
  }
  return sum.div(WEIGHT_SUM * WEIGHT_SUM);
});

/** 太陽など、影を落とす光に `shadow.filterNode` として設定する（three の型定義に `filterNode` が無いのでここで型を付ける）。 */
export function useDeterministicPCF(shadow: DirectionalLightShadow): void {
  (shadow as unknown as { filterNode: unknown }).filterNode = filter;
}
