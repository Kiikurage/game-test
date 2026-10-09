// geometry.mjs の型宣言（テストから使う部分だけ）。
export interface Geo {
  positions: number[];
  normals: number[];
  indices: number[];
}
export function box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): Geo;
export function lathe(strips: [number, number][][], segments?: number): Geo;
