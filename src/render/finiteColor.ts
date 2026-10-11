import { float, select, vec3 } from 'three/tsl';
import type { Node } from 'three/webgpu';

/** HDR 色の成分の上限（リニア）。太陽・熾火・黄金の光は 4 以下。これ以上は見た目に効かず、ブルームのぼかしで画面へ広がるだけ。 */
export const MAX_HDR = 16;

/** 1 成分を [0, max] へ丸める。NaN は 0、+Inf は max（`min` / `max` / `clamp` は NaN の扱いが実装依存なので比較で書く）。 */
function finite1(x: Node<'float'>, max: number): Node<'float'> {
  return select(x.greaterThan(max), float(max), select(x.greaterThanEqual(0), x, float(0)));
}

/**
 * 発光・HDR 色を有限値かつ [0, max] に収める（#258）。NaN / Inf を出さず、極端な値をブルームへ渡さない。
 * 通常の値（max 以下）は変えない。
 */
export function finiteColor(color: Node<'vec3'>, max: number = MAX_HDR): Node<'vec3'> {
  return vec3(finite1(color.x, max), finite1(color.y, max), finite1(color.z, max));
}
