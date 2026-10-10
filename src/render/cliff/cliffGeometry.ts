import { BufferGeometry, Float32BufferAttribute } from 'three/webgpu';

/** 崖の岩塊の山・枯れ草の手続き的ジオメトリ（#190）。いずれも非インデックスの 1 つのジオメトリ。 */

function hash3(x: number, y: number, z: number, seed: number): number {
  let h =
    Math.imul(Math.round(x * 997), 374761393) +
    Math.imul(Math.round(y * 991), 668265263) +
    Math.imul(Math.round(z * 983), 1274126177) +
    Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

// 正二十面体（20 面）
const T = (1 + Math.sqrt(5)) / 2;
const ICO_VERTS: readonly (readonly [number, number, number])[] = [
  [-1, T, 0],
  [1, T, 0],
  [-1, -T, 0],
  [1, -T, 0],
  [0, -1, T],
  [0, 1, T],
  [0, -1, -T],
  [0, 1, -T],
  [T, 0, -1],
  [T, 0, 1],
  [-T, 0, -1],
  [-T, 0, 1],
];
const ICO_FACES: readonly (readonly [number, number, number])[] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

/** 角張った岩 1 つ（20 面）。頂点は位置から決まる乱数で半径をゆがめ、下を平らに切る。 */
function pushRock(
  out: number[],
  cx: number,
  cy: number,
  cz: number,
  radius: number,
  squash: number,
  seed: number,
): void {
  const vertex = (i: number): [number, number, number] => {
    const v = ICO_VERTS[i] ?? [0, 0, 0];
    const len = Math.hypot(...v);
    const k = 0.72 + 0.55 * hash3(v[0], v[1], v[2], seed);
    const y = (v[1] / len) * k * squash;
    return [
      cx + (v[0] / len) * k * radius,
      Math.max(cy + y * radius, cy - radius * 0.28),
      cz + (v[2] / len) * k * radius,
    ];
  };
  for (const [a, b, c] of ICO_FACES) {
    out.push(...vertex(a), ...vertex(b), ...vertex(c));
  }
}

function flatNormals(positions: readonly number[]): number[] {
  const normals: number[] = [];
  for (let i = 0; i < positions.length; i += 9) {
    const ax = (positions[i + 3] ?? 0) - (positions[i] ?? 0);
    const ay = (positions[i + 4] ?? 0) - (positions[i + 1] ?? 0);
    const az = (positions[i + 5] ?? 0) - (positions[i + 2] ?? 0);
    const bx = (positions[i + 6] ?? 0) - (positions[i] ?? 0);
    const by = (positions[i + 7] ?? 0) - (positions[i + 1] ?? 0);
    const bz = (positions[i + 8] ?? 0) - (positions[i + 2] ?? 0);
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    for (let k = 0; k < 3; k++) normals.push(nx, ny, nz);
  }
  return normals;
}

/**
 * 岩塊の山: 大 1 + 中 2 + 小 1 の岩を寄せた塊（80 三角形）。半径 約 0.9m、原点が足元。
 * インスタンスごとの回転・拡縮で変化をつける。
 */
export function createRockPileGeometry(): BufferGeometry {
  const positions: number[] = [];
  pushRock(positions, 0, 0.3, 0, 0.62, 0.8, 1);
  pushRock(positions, 0.62, 0.14, 0.22, 0.38, 0.75, 2);
  pushRock(positions, -0.42, 0.12, 0.5, 0.33, 0.9, 3);
  pushRock(positions, 0.12, 0.07, -0.62, 0.26, 0.7, 4);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(flatNormals(positions), 3));
  return geometry;
}

/**
 * 枯れ草の房: 反った細い葉 7 枚（約 14 三角形）。高さ 約 0.8m、原点が根元。
 * マテリアルは `createGrassMaterial`（高さで根元が暗く先が明るい。風で揺れる）。
 */
export function createDryGrassGeometry(): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const blades = 7;
  for (let i = 0; i < blades; i++) {
    const yaw = (i / blades) * Math.PI * 2 + hash3(i, 0, 0, 9) * 0.6;
    const lean = 0.18 + 0.4 * hash3(i, 1, 0, 9);
    const height = 0.55 + 0.4 * hash3(i, 2, 0, 9);
    const half = 0.035;
    const dx = Math.sin(yaw);
    const dz = Math.cos(yaw);
    const px = dz; // 葉の幅方向（進行方向に直交）
    const pz = -dx;
    const ox = (hash3(i, 3, 0, 9) - 0.5) * 0.12;
    const oz = (hash3(i, 4, 0, 9) - 0.5) * 0.12;
    const mid = 0.55;
    // 根元（幅 2*half）→ 中ほど（細く、少し反る）→ 先端（尖って大きく反る）
    const midX = ox + dx * lean * 0.35 * height;
    const midZ = oz + dz * lean * 0.35 * height;
    const tipX = ox + dx * lean * height;
    const tipZ = oz + dz * lean * height;
    const b0 = [ox - px * half, 0, oz - pz * half];
    const b1 = [ox + px * half, 0, oz + pz * half];
    const m0 = [midX - px * half * 0.6, height * mid, midZ - pz * half * 0.6];
    const m1 = [midX + px * half * 0.6, height * mid, midZ + pz * half * 0.6];
    const tip = [tipX, height, tipZ];
    positions.push(...b0, ...b1, ...m1, ...b0, ...m1, ...m0, ...m0, ...m1, ...tip);
    for (let k = 0; k < 9; k++) normals.push(-dx * 0.5, 0.8, -dz * 0.5);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  return geometry;
}
