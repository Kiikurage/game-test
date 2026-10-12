// 焼いたノイズテクスチャの寸法（noise.mjs の生成と src/render/bakedNoise.ts のサンプルで共有する。依存なし）。
export const SIZE = 62;
export const LATTICE = 8;
export const TILE = SIZE + 2;
export const TILES = 8;
export const ATLAS = TILE * TILES;
export const CELLS_SIZE = 512;
export const CELLS = 8;
