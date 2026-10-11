/**
 * 地下水路（#270）の描画が使う、レベルデータから引く値と手置きの配置（純粋ロジック）。
 */
import type { Level, RectDef, WaterwayDef, WaterwayRect } from '../../game/world/level';
import { GRATE, HATCH } from '../../game/world/waterway';
import type { WaterLayoutInput } from './waterLayout';

/** 天井板の厚み（`waterway.ts` の SLAB と同じ）。 */
export const SLAB = 0.15;

/** 波のシミュレーションの格子に入れる水の配置。石棺は障害物（水面を張らない・波が反射する）。 */
export function waterLayoutInput(level: Level, way: WaterwayDef): WaterLayoutInput {
  const obstacles: RectDef[] = level.boxes
    .filter((b) => b.style === 'waterway' && b.id === 'ww-sarcophagus')
    .map((b) => ({ minX: b.x - b.hx, maxX: b.x + b.hx, minZ: b.z - b.hz, maxZ: b.z + b.hz }));
  return { rects: way.rects, depth: way.depth, obstacles };
}

/** 点 (x, y, z) が水路の中（区画の内寸 + `margin`、床の 0.6m 下〜天井）か。 */
export function insideWaterway(
  way: WaterwayDef,
  x: number,
  y: number,
  z: number,
  margin = 0,
): boolean {
  return way.rects.some(
    (r) =>
      x > r.minX - margin &&
      x < r.maxX + margin &&
      z > r.minZ - margin &&
      z < r.maxZ + margin &&
      y > r.floorY - 0.6 &&
      y < r.floorY + (r.ceiling ?? way.ceiling) + SLAB,
  );
}

/** 水路の口（床板の穴・鉄格子）から `radius` 以内か（外から水路の中が見える所）。 */
export function nearWaterwayMouth(
  x: number,
  z: number,
  radius: number,
  hatchOpen: boolean,
  grateOpen: boolean,
): boolean {
  return (
    (hatchOpen && Math.hypot(x - HATCH.x, z - HATCH.z) < radius) ||
    (grateOpen && Math.hypot(x - GRATE.x, z - GRATE.z) < radius)
  );
}

/** 床の高さ（区画の中なら区画の床。外は `fallback`）。 */
export function floorAt(
  rects: readonly WaterwayRect[],
  x: number,
  z: number,
  fallback: number,
): number {
  for (const r of rects) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return r.floorY;
  }
  return fallback;
}

/** 偽のライトの種類。 */
export const LIGHT_KIND = {
  /** たいまつ（暖色の点光源。ゆらぐ）。 */
  torch: 0,
  /** 床板の穴から差す光（寒色。下向きのスポット）。 */
  shaft: 1,
  /** 光る苔（青白い弱い点光源）。 */
  moss: 2,
} as const;

export interface WaterLight {
  readonly kind: (typeof LIGHT_KIND)[keyof typeof LIGHT_KIND];
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** リニアの色 × 強さ。 */
  readonly color: readonly [number, number, number];
  /** 届く距離（m。ここで 0 になる）。 */
  readonly range: number;
}

/** 壁のたいまつの取り付け位置（壁の面上の点と、通路側への法線）。炎の位置は `torchFlame`。 */
export interface TorchMount {
  readonly x: number;
  readonly z: number;
  readonly nx: number;
  readonly nz: number;
  /** 金具の高さ（ワールド）。 */
  readonly y: number;
}

/**
 * たいまつ: 東西の水路の北の壁（中ほど）、北の水路の東の壁（墓室の口の向かい）、上り階段の西の壁。
 * 天井が 2.2m と低いので、地下墓所のたいまつより低く短い。
 */
export function waterwayTorches(floorY: number): TorchMount[] {
  return [
    { x: 53.5, z: 29, nx: 0, nz: -1, y: floorY + 1.3 },
    { x: 67, z: 35, nx: -1, nz: 0, y: floorY + 1.3 },
    { x: 65, z: 41.7, nx: 1, nz: 0, y: floorY + 0.82 + 1.3 },
  ];
}

/** たいまつの炎の中心。 */
export function torchFlame(t: TorchMount): [number, number, number] {
  return [t.x + t.nx * 0.34, t.y + 0.42, t.z + t.nz * 0.34];
}

/** 光る苔の塊（壁の水際）。位置は壁の面上。 */
export const MOSS_PATCHES: readonly { x: number; y: number; z: number; r: number }[] = [
  { x: 48.6, y: 1.45, z: 27, r: 0.75 },
  { x: 59.4, y: 1.4, z: 29, r: 0.6 },
  { x: 67, y: 1.5, z: 38.3, r: 0.7 },
  { x: 60, y: 1.4, z: 33.7, r: 0.55 },
  { x: 45, y: 1.35, z: 28.4, r: 0.45 },
];

/** 偽のライトの一覧（たいまつ、床板の穴の光、苔）。`hatchOpen` でなければ穴の光は弱い（板の隙間から）。 */
export function waterwayLights(floorY: number): WaterLight[] {
  const lights: WaterLight[] = [];
  for (const t of waterwayTorches(floorY)) {
    const [x, y, z] = torchFlame(t);
    lights.push({ kind: LIGHT_KIND.torch, x, y, z, color: [1.65, 0.72, 0.26], range: 9 });
  }
  lights.push({
    kind: LIGHT_KIND.shaft,
    x: HATCH.x,
    y: floorY + 3.2,
    z: HATCH.z,
    color: [0.55, 0.66, 0.82],
    range: 7,
  });
  for (const m of MOSS_PATCHES.slice(0, 3)) {
    lights.push({
      kind: LIGHT_KIND.moss,
      x: m.x,
      y: m.y,
      z: m.z,
      color: [0.12, 0.3, 0.36],
      range: 2.6,
    });
  }
  return lights;
}

/** 天井から雫が落ちる所（ステップ周期と位相。決定的）。 */
export const DRIP_SPOTS: readonly { x: number; z: number; period: number; phase: number }[] = [
  { x: 47.3, z: 28.4, period: 151, phase: 17 },
  { x: 51.9, z: 27.6, period: 211, phase: 90 },
  { x: 56.4, z: 28.3, period: 173, phase: 40 },
  { x: 62.7, z: 27.8, period: 233, phase: 130 },
  { x: 66.3, z: 31.2, period: 191, phase: 66 },
  { x: 65.6, z: 36.6, period: 163, phase: 5 },
  { x: 63.2, z: 34.4, period: 257, phase: 200 },
  { x: 66.2, z: 39.1, period: 139, phase: 101 },
];

/** 天井から水面までの落下にかかるステップ数（約 1.05m の自由落下 ≈ 0.46s）。 */
export const DRIP_FALL_STEPS = 28;
