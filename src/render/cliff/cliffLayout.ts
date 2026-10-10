import type { Level } from '../../game/world/level';
import { valueNoise } from '../levelSurface';

/**
 * 外周の崖（#176）の岩塊・枯れ草の配置（純粋ロジック。GPU に依存しない。決定的）。
 *
 * 崖は高さ場の滑らかな稜線なので、基部の瓦礫・斜面の張り出し・上端の岩と枯れ草で輪郭を崩す。
 * 配置は `Level.openDistance`（通行領域までの距離）の帯で決める:
 *  - 基部（崖の足元。d = 0.3..0.9m。足元は垂直に近いので壁に半分埋まる）: 岩塊の山
 *  - 上端（2.5..4.4m）: 岩と、枯れ草のシルエット（稜線の外側）
 *  斜面の途中には置かない（浮いて見える）。
 * 通行領域の内側（d = 0）には置かない。脇道（`perimeter.openPaths`）の周りは開けておく。
 * 当たり判定・ナビには影響しない（描画だけ）。
 */

export interface CliffItem {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
  /** 水平方向の大きさ（岩塊の山の半径は約 0.9m × scale）。 */
  readonly scale: number;
  /** 縦の伸び（scale に対する倍率）。 */
  readonly stretch: number;
  /** 空間バケット（カリング用。この単位で InstancedMesh を分ける）。 */
  readonly bucket: string;
}

export interface CliffPlacements {
  readonly rocks: readonly CliffItem[];
  readonly grass: readonly CliffItem[];
}

/** バケットの一辺（m）。視錐台カリングが効くよう、崖全体を 1 つにしない。 */
export const CLIFF_BUCKET_SIZE = 48;

const ROCK_CELL = 1.25;
const GRASS_CELL = 0.85;
/** 脇道の中心線から、この余白（半幅に足す）以内には置かない。 */
const PATH_CLEARANCE = 2.6;

function hash2(ix: number, iz: number, salt: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(salt, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function distanceToSegment(
  x: number,
  z: number,
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len2 = dx * dx + dz * dz;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[1]) * dz) / len2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
}

/**
 * `density`（0..1）は品質プリセットの `cliffDetail`。low では岩塊と枯れ草を間引く
 * （間引きは位置ごとのハッシュで決まるので、density を上げると必ず上位集合になる）。
 */
export function layoutCliff(level: Level, density: number): CliffPlacements {
  const rocks: CliffItem[] = [];
  const grass: CliffItem[] = [];
  if (!level.data.perimeter || density <= 0) return { rocks, grass };

  const { bounds } = level.data;
  const paths = level.data.perimeter.openPaths;
  const blockers = [
    ...level.boxes.map((b) => ({ x: b.x, z: b.z, r: Math.hypot(b.hx, b.hz) + 1.2 })),
    ...level.cylinders.map((c) => ({ x: c.x, z: c.z, r: c.radius + 1.2 })),
  ];

  const blocked = (x: number, z: number): boolean => {
    for (const path of paths) {
      for (let i = 0; i + 1 < path.points.length; i++) {
        const a = path.points[i];
        const b = path.points[i + 1];
        if (a && b && distanceToSegment(x, z, a, b) < path.halfWidth + PATH_CLEARANCE) return true;
      }
    }
    return blockers.some((b) => Math.hypot(x - b.x, z - b.z) < b.r);
  };
  const bucketOf = (x: number, z: number): string =>
    `${Math.floor(x / CLIFF_BUCKET_SIZE)},${Math.floor(z / CLIFF_BUCKET_SIZE)}`;

  // 岩塊
  for (let gz = bounds.minZ - 4; gz < bounds.maxZ + 4; gz += ROCK_CELL) {
    for (let gx = bounds.minX - 4; gx < bounds.maxX + 4; gx += ROCK_CELL) {
      const ix = Math.round(gx / ROCK_CELL);
      const iz = Math.round(gz / ROCK_CELL);
      const x = gx + hash2(ix, iz, 1) * ROCK_CELL;
      const z = gz + hash2(ix, iz, 2) * ROCK_CELL;
      const d = level.openDistance(x, z);
      // 崖は足元が垂直に近く（d = 0.5m で高さ約 3m）、途中に置くと壁に浮いて見える。足元と上端の帯だけに置く
      const foot = d >= 0.3 && d <= 0.9;
      const top = d >= 2.5 && d <= 4.4;
      if (!foot && !top) continue;
      // 群れ: 低周波のノイズで、山が固まる所と空く所を作る
      const cluster = smoothstep(0.3, 0.6, valueNoise(x * 0.22 + 5, z * 0.22 - 3));
      const chance = foot ? 0.2 + 0.6 * cluster : 0.14 + 0.4 * cluster;
      const size = foot
        ? 0.8 + 1.0 * hash2(ix, iz, 3) * hash2(ix, iz, 4)
        : 0.55 + 0.7 * hash2(ix, iz, 3);
      // 間引き用のハッシュは chance と別に引く（density で上位集合を保つ）
      if (hash2(ix, iz, 5) > chance) continue;
      if (hash2(ix, iz, 6) > density) continue;
      if (blocked(x, z)) continue;
      // 足元は崖の高さではなく、手前（通行領域側）の地面の高さに据える
      const ground = foot
        ? Math.min(
            level.heightAt(x + 1, z),
            level.heightAt(x - 1, z),
            level.heightAt(x, z + 1),
            level.heightAt(x, z - 1),
          )
        : level.heightAt(x, z);
      rocks.push({
        x,
        y: ground - 0.1 * size,
        z,
        yaw: hash2(ix, iz, 7) * Math.PI * 2,
        scale: size,
        stretch: 0.7 + 0.5 * hash2(ix, iz, 8),
        bucket: bucketOf(x, z),
      });
    }
  }

  // 上端の枯れ草（稜線の外側に少量。シルエットとして空に抜ける）
  for (let gz = bounds.minZ - 4; gz < bounds.maxZ + 4; gz += GRASS_CELL) {
    for (let gx = bounds.minX - 4; gx < bounds.maxX + 4; gx += GRASS_CELL) {
      const ix = Math.round(gx / GRASS_CELL);
      const iz = Math.round(gz / GRASS_CELL);
      const x = gx + hash2(ix, iz, 11) * GRASS_CELL;
      const z = gz + hash2(ix, iz, 12) * GRASS_CELL;
      const d = level.openDistance(x, z);
      if (d < 2.2 || d > 6) continue;
      const cluster = smoothstep(0.35, 0.65, valueNoise(x * 0.3 - 9, z * 0.3 + 2));
      // 稜線（d ≈ 3）に近いほど濃い
      const rim = 1 - smoothstep(0, 1, Math.abs(d - 3.2) / 2.8);
      if (hash2(ix, iz, 13) > 0.1 + 0.55 * cluster * rim) continue;
      if (hash2(ix, iz, 14) > density) continue;
      if (blocked(x, z)) continue;
      const size = 1.1 + 1.3 * hash2(ix, iz, 15);
      grass.push({
        x,
        y: level.heightAt(x, z) - 0.03,
        z,
        yaw: hash2(ix, iz, 16) * Math.PI * 2,
        scale: size,
        stretch: 0.8 + 0.6 * hash2(ix, iz, 17),
        bucket: bucketOf(x, z),
      });
    }
  }
  return { rocks, grass };
}
