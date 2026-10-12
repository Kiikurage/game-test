import { bakeCells, bakePerlin, buildNoiseAtlas } from '../../scripts/assets/noise.mjs';

/**
 * マテリアル用ノイズ（bakedNoise.ts）をロード時に作る Worker。メインスレッドを止めずに生成する。
 * 返す配列: perlin = ATLAS² の RG 半精度（Uint16Array）、cells = CELLS_SIZE² の RG 8bit（Uint8Array）。
 */
export interface NoiseWorkerResult {
  perlin: Uint16Array;
  cells: Uint8Array;
  ms: number;
}

const start = performance.now();
const perlin = buildNoiseAtlas(bakePerlin());
const cells = bakeCells();
const result: NoiseWorkerResult = { perlin, cells, ms: performance.now() - start };
(self as unknown as { postMessage(m: unknown, t: Transferable[]): void }).postMessage(result, [
  perlin.buffer,
  cells.buffer,
]);
