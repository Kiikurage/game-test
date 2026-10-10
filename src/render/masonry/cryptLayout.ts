/**
 * 地下墓所（D）・中庭（E）・鉄門 G1 の環境配置データ（純粋ロジック。GPU に依存しない）。
 * 位置は `ashenFoundation.ts` の壁コライダの面に合わせて手で置く（`cryptLayout.test.ts` が面との整合と通路の余白を検証する）。
 */

/** 壁面の取り付け位置。`(x, z)` は壁の表面の点、`(nx, nz)` は空間側を向く単位法線。 */
export interface WallMount {
  readonly x: number;
  readonly z: number;
  readonly nx: number;
  readonly nz: number;
}

/** 壁から空間側へ張り出してよい最大量（m）。通路幅 2.5m を侵さないための上限。 */
export const MAX_PROTRUSION = 0.4;

/** 石積みに置き換えるグレーボックスの id（`LevelView` はこれらを描かない）。`lane-*` は G1 の両側の壁。 */
export function isMasonryProp(id: string): boolean {
  return id.startsWith('d-') || id.startsWith('e-') || id.startsWith('lane-');
}

/** `LevelView` が描かない門（G1 の鉄門）とレバー。石積み側が描く。 */
export function isMasonryGate(id: string): boolean {
  return id === 'G1';
}

export const MASONRY_LEVER_ID = 'lever-g1';

/** 地下墓所のたいまつ（壁の高さ 1.85m）。通路の左右に互い違い。 */
export const D_TORCHES: readonly WallMount[] = [
  { x: 60.75, z: 39.4, nx: 1, nz: 0 },
  { x: 63.25, z: 42.4, nx: -1, nz: 0 },
  { x: 60.75, z: 45.6, nx: 1, nz: 0 },
  { x: 66.6, z: 49.75, nx: 0, nz: -1 },
  { x: 71.2, z: 47.25, nx: 0, nz: 1 },
  { x: 75.6, z: 49.75, nx: 0, nz: -1 },
  { x: 60.75, z: 51.6, nx: 1, nz: 0 },
];

/** 中庭のたいまつ（壁の内側）。霧の門の両脇と、入口・崩れ口の脇。 */
export const E_TORCHES: readonly WallMount[] = [
  { x: 84.35, z: 58.5, nx: 1, nz: 0 },
  { x: 84.35, z: 64.5, nx: 1, nz: 0 },
  { x: 90.0, z: 67.65, nx: 0, nz: -1 },
  { x: 99.6, z: 67.65, nx: 0, nz: -1 },
  { x: 103.65, z: 62.6, nx: -1, nz: 0 },
  { x: 103.65, z: 56.6, nx: -1, nz: 0 },
  { x: 103.65, z: 51.6, nx: -1, nz: 0 },
  { x: 88.2, z: 48.35, nx: 0, nz: 1 },
];

/** 地下墓所の壁龕（棺を納める壁の窪み風の浮き彫り。2 段）。 */
export const D_NICHES: readonly WallMount[] = [
  { x: 60.75, z: 36.9, nx: 1, nz: 0 },
  { x: 60.75, z: 42.6, nx: 1, nz: 0 },
  { x: 60.75, z: 48.4, nx: 1, nz: 0 },
  { x: 63.25, z: 38.6, nx: -1, nz: 0 },
  { x: 63.25, z: 45.2, nx: -1, nz: 0 },
  { x: 68.8, z: 47.25, nx: 0, nz: 1 },
  { x: 73.4, z: 47.25, nx: 0, nz: 1 },
  { x: 69.2, z: 49.75, nx: 0, nz: -1 },
  { x: 73.0, z: 49.75, nx: 0, nz: -1 },
];

/** 蜘蛛の巣（apex は壁面上の点、`along` は壁面に沿った水平方向、`y` は地面からの高さ）。 */
export interface WebMount extends WallMount {
  readonly y: number;
  /** 壁面に沿って広がる水平方向（単位ベクトル）。 */
  readonly ax: number;
  readonly az: number;
  readonly radius: number;
}

export const D_WEBS: readonly WebMount[] = [
  // 石棺の奥の窪みの左右の角
  { x: 60.75, z: 52.75, nx: 1, nz: 0, y: 3.0, ax: 0, az: -1, radius: 1.3 },
  { x: 63.25, z: 52.75, nx: -1, nz: 0, y: 3.0, ax: 0, az: -1, radius: 1.5 },
  { x: 60.75, z: 52.75, nx: 0, nz: -1, y: 2.5, ax: 1, az: 0, radius: 1.2 },
  // 通路の奥と L 字の角
  { x: 60.75, z: 47.2, nx: 1, nz: 0, y: 3.1, ax: 0, az: -1, radius: 1.1 },
  { x: 78.5, z: 47.25, nx: 0, nz: 1, y: 3.2, ax: -1, az: 0, radius: 1.4 },
  { x: 63.25, z: 36.2, nx: -1, nz: 0, y: 2.8, ax: 0, az: 1, radius: 1.2 },
];

/** 地下墓所で通路を縁取る水平の帯（アーチの起点の持ち送り）のワールドの高さ（m）。床は 3.5 → 5.0 と上るので一定の高さにする。 */
export const D_BAND_HEIGHTS = { impost: 7.35 } as const;

/** 通路の中心線（D。入口 → 角 → 出口）。余白の検証用。 */
export const D_CENTERLINE: readonly (readonly [number, number])[] = [
  [62, 36],
  [62, 48.5],
  [78, 48.5],
];

/** 点から折れ線までの距離。 */
export function distanceToPolyline(
  x: number,
  z: number,
  line: readonly (readonly [number, number])[],
): number {
  let best = Infinity;
  for (let i = 0; i + 1 < line.length; i++) {
    const [ax, az] = line[i] as readonly [number, number];
    const [bx, bz] = line[i + 1] as readonly [number, number];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return best;
}
