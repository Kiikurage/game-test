import type { Texture } from 'three/webgpu';

/** テクスチャの UV 位置の色（リニア RGB）を out へ書く。取得できなければ white。 */
export type TextureSampler = (
  map: Texture,
  u: number,
  v: number,
  out: [number, number, number],
) => void;

const SIZE = 32;

/**
 * 縮小コピー（32x32）を作って UV で引くサンプラ。LOD の頂点色を焼くときの「遠目の色」用なので粗くてよい。
 * ブラウザ（canvas）専用。画像を読めない環境では白を返す。
 */
export function createCanvasSampler(): TextureSampler {
  const cache = new WeakMap<Texture, Uint8ClampedArray | null>();
  const read = (map: Texture): Uint8ClampedArray | null => {
    let data = cache.get(map);
    if (data !== undefined) return data;
    data = null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(map.image as CanvasImageSource, 0, 0, SIZE, SIZE);
        data = ctx.getImageData(0, 0, SIZE, SIZE).data;
      }
    } catch {
      data = null;
    }
    cache.set(map, data);
    return data;
  };
  return (map, u, v, out) => {
    const data = read(map);
    if (!data) {
      out[0] = out[1] = out[2] = 1;
      return;
    }
    const wrap = (t: number): number => t - Math.floor(t);
    const x = Math.min(SIZE - 1, Math.floor(wrap(u) * SIZE));
    // glTF のテクスチャは flipY=false（v=0 が画像の上端）
    const y = Math.min(SIZE - 1, Math.floor(wrap(v) * SIZE));
    const i = (y * SIZE + x) * 4;
    // sRGB → リニア（近似）
    out[0] = Math.pow((data[i] ?? 255) / 255, 2.2);
    out[1] = Math.pow((data[i + 1] ?? 255) / 255, 2.2);
    out[2] = Math.pow((data[i + 2] ?? 255) / 255, 2.2);
  };
}
