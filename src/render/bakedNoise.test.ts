import { describe, expect, it } from 'vitest';
import { DataUtils } from 'three/webgpu';
import { bakePerlin, buildNoiseAtlas } from './bakedNoise';

const half = (v: number): number => DataUtils.fromHalfFloat(v);

describe('bakePerlin', () => {
  const size = 16;
  const volume = bakePerlin(size, 4);

  it('stays within about -1..1 and has both signs', () => {
    const values = Array.from(volume, half);
    expect(Math.max(...values)).toBeLessThanOrEqual(1.05);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-1.05);
    expect(Math.max(...values)).toBeGreaterThan(0.3);
    expect(Math.min(...values)).toBeLessThan(-0.3);
  });

  it('is smooth between neighbouring voxels, including across the tile seam', () => {
    const at = (x: number, y: number, z: number): number =>
      half(
        volume[(((z + size) % size) * size + ((y + size) % size)) * size + ((x + size) % size)] ??
          0,
      );
    let maxStep = 0;
    for (let z = 0; z < size; z++)
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          maxStep = Math.max(maxStep, Math.abs(at(x, y, z) - at(x + 1, y, z)));
          maxStep = Math.max(maxStep, Math.abs(at(x, y, z) - at(x, y + 1, z)));
          maxStep = Math.max(maxStep, Math.abs(at(x, y, z) - at(x, y, z + 1)));
        }
    // 1 セル 4 ボクセル。勾配ノイズの最大傾き（約 2 / セル）から 0.5 程度
    expect(maxStep).toBeLessThan(0.6);
  });
});

describe('buildNoiseAtlas', () => {
  const size = 4;
  const volume = Uint16Array.from({ length: size ** 3 }, (_, i) => i + 1);
  const atlas = buildNoiseAtlas(volume, size);
  const tile = size + 2;
  const tiles = 2;
  const width = tile * tiles;
  const texel = (z: number, tx: number, ty: number, channel: number): number =>
    atlas[((Math.floor(z / tiles) * tile + ty) * width + (z % tiles) * tile + tx) * 2 + channel] ??
    0;

  it('puts slice z in R and slice z+1 (wrapped) in G', () => {
    for (let z = 0; z < size; z++) {
      expect(texel(z, 1, 1, 0)).toBe(volume[z * size * size] ?? -1);
      expect(texel(z, 1, 1, 1)).toBe(volume[((z + 1) % size) * size * size] ?? -1);
    }
  });

  it('wraps a one-texel border around each tile', () => {
    // 左上の余白は反対側の角（x = size-1, y = size-1）
    expect(texel(0, 0, 0, 0)).toBe(volume[(size - 1) * size + (size - 1)] ?? -1);
    // 右下の余白は最初のボクセル
    expect(texel(0, tile - 1, tile - 1, 0)).toBe(volume[0]);
  });
});
