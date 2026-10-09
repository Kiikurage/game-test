// equipment.mjs の型宣言（テストから使う部分だけ）。
export interface VertexInfo {
  n: [number, number, number];
  edge: number;
}
export type ColorFn = (
  p: [number, number, number],
  seed: number,
  info?: VertexInfo,
) => [number, number, number];
export const COLORS: Record<string, ColorFn>;
export function edgeness(geo: {
  positions: number[];
  normals: number[];
  indices: number[];
}): Float32Array;
