/** 地形の高さ関数（純粋関数）。原点付近は物理の平らな地面（y=0）と一致させる。 */

/** 原点周りの完全に平らな半径（m）。 */
export const FLAT_RADIUS = 9;
/** 平地から起伏へ遷移する幅（m）。 */
const BLEND_WIDTH = 16;

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 値ノイズ（0..1）。 */
export function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

function fbm(x: number, z: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, z * freq);
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum;
}

/** ワールド座標 (x, z) の地形の高さ（m）。 */
export function terrainHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  const blend = smooth(Math.min(1, Math.max(0, (r - FLAT_RADIUS) / BLEND_WIDTH)));
  // なだらかな丘 + 細かい起伏
  const hills = (fbm(x * 0.045 + 11.3, z * 0.045 - 4.7, 4) - 0.5) * 12;
  const bumps = (fbm(x * 0.2 - 3.1, z * 0.2 + 8.2, 2) - 0.5) * 0.9;
  // 遠方は山並みとして盛り上げ、霞の中に稜線のシルエットを作る
  const rim = 26 * (1 - Math.exp(-Math.pow(Math.max(0, (r - 55) / 70), 1.6)));
  return (hills + bumps + rim) * blend;
}
