import type { Matrix4 } from 'three/webgpu';
import type { AreaShape, Level } from '../game/world/level';
import { placeMatrix, isEnvironmentZone, type EnvPlacement } from './environmentLayout';

/** 地面の見た目に使う純粋ロジック（石畳の割合・枯れ草の配置）。GPU に依存しない。 */

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** 値ノイズ（0..1）。 */
export function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smoothstep(0, 1, x - ix);
  const fz = smoothstep(0, 1, z - iz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

/** 形状の符号つき距離（内側が負）。 */
export function signedDistance(shape: AreaShape, x: number, z: number): number {
  if (shape.type === 'circle') return Math.hypot(x - shape.cx, z - shape.cz) - shape.r;
  const dx = Math.max(shape.minX - x, x - shape.maxX);
  const dz = Math.max(shape.minZ - z, z - shape.maxZ);
  if (dx > 0 || dz > 0) return Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
  return Math.max(dx, dz);
}

/**
 * 石畳（敷石）の割合 0..1。石の地表素材のエリア（A 篝火の空き地・C 礼拝堂の床・E/F）の内側が 1、
 * 縁は草に侵されて不規則に薄れる。
 */
export function stoneAmount(level: Level, x: number, z: number): number {
  let amount = 0;
  for (const area of level.data.areas) {
    if (area.surface !== 'stone' && area.surface !== 'underground') continue;
    // 縁の位置を低周波ノイズで揺らし、草が石畳を侵している様子にする
    const wobble = (valueNoise(x * 0.42 + 3.1, z * 0.42 - 7.7) - 0.5) * 3.4;
    const d = signedDistance(area.shape, x, z) + wobble;
    amount = Math.max(amount, 1 - smoothstep(-2.2, 0.4, d));
  }
  return amount;
}

export interface GrassPlacements {
  readonly a: readonly Matrix4[];
  readonly b: readonly Matrix4[];
  readonly c: readonly Matrix4[];
}

const GRASS_CELL = 1.25;

/**
 * 枯れ草の房の配置（A〜C のあたり）。道・石畳・壁や墓石の足元・篝火のすぐ脇には置かない。
 * 低周波のノイズで密度に濃淡をつけ、群生と禿げ地を作る。決定的。
 */
export function layoutGrass(level: Level): GrassPlacements {
  const out: { a: Matrix4[]; b: Matrix4[]; c: Matrix4[] } = { a: [], b: [], c: [] };
  const { bounds } = level.data;
  const minX = Math.max(bounds.minX + 2, -12);
  const maxX = 66;
  const minZ = bounds.minZ + 2;
  const maxZ = 44;
  // 障害物の近傍判定用（箱は回転を考慮せず外接円で粗く判定）
  const blockers = [
    ...level.boxes
      .filter((b) => b.style !== 'stairs')
      .map((b) => ({ x: b.x, z: b.z, r: Math.hypot(b.hx, b.hz) + 0.25 })),
    ...level.cylinders.map((c) => ({ x: c.x, z: c.z, r: c.radius + 0.35 })),
  ].filter((b) => isEnvironmentZone(b.x, b.z));
  for (let gz = minZ; gz < maxZ; gz += GRASS_CELL) {
    for (let gx = minX; gx < maxX; gx += GRASS_CELL) {
      const ix = Math.round(gx / GRASS_CELL);
      const iz = Math.round(gz / GRASS_CELL);
      const jx = hash2(ix, iz);
      const jz = hash2(iz + 91, ix - 17);
      const x = gx + jx * GRASS_CELL;
      const z = gz + jz * GRASS_CELL;
      const patch =
        valueNoise(x * 0.16 + 12, z * 0.16 - 5) * 0.65 + valueNoise(x * 0.5, z * 0.5) * 0.35;
      const density = smoothstep(0.28, 0.55, patch);
      if (hash2(ix * 7 + 3, iz * 13 + 5) > density) continue;
      if (level.pathWeight(x, z) > 0.35) continue;
      if (stoneAmount(level, x, z) > 0.25) continue;
      if (Math.hypot(x, z) < 2.6) continue;
      if (blockers.some((b) => Math.hypot(x - b.x, z - b.z) < b.r)) continue;
      // 礼拝堂の床の上・墓地の外の崖際は避ける
      if (!isEnvironmentZone(x, z)) continue;
      const h = level.heightAt(x, z);
      const s = 0.8 + 0.7 * hash2(ix + 5, iz + 9);
      const m = placeMatrix(x, h - 0.01, z, hash2(ix - 3, iz + 4) * Math.PI * 2, [
        s,
        s * (0.8 + 0.5 * hash2(ix, iz + 99)),
        s,
      ]);
      const pick = hash2(ix + 41, iz + 43);
      (pick < 0.34 ? out.a : pick < 0.67 ? out.b : out.c).push(m);
    }
  }
  return out;
}

/**
 * 地面に散らす小石・瓦礫の小山（A〜C）。道の上・石畳・障害物の上には置かない。決定的。
 * バケットは環境メッシュと同じ 24m 格子。
 */
export function layoutClutter(level: Level): EnvPlacement[] {
  const out: EnvPlacement[] = [];
  const blockers = [
    ...level.boxes
      .filter((b) => b.style !== 'stairs')
      .map((b) => ({ x: b.x, z: b.z, r: Math.hypot(b.hx, b.hz) + 0.6 })),
    ...level.cylinders.map((c) => ({ x: c.x, z: c.z, r: c.radius + 0.6 })),
  ].filter((b) => isEnvironmentZone(b.x, b.z));
  const { bounds } = level.data;
  const cell = 4.2;
  for (let gz = bounds.minZ + 2; gz < 42; gz += cell) {
    for (let gx = bounds.minX + 2; gx < 64; gx += cell) {
      const ix = Math.round(gx / cell);
      const iz = Math.round(gz / cell);
      if (hash2(ix * 5 + 1, iz * 11 + 2) > 0.3) continue;
      const x = gx + hash2(ix, iz + 3) * cell;
      const z = gz + hash2(iz, ix + 8) * cell;
      if (!isEnvironmentZone(x, z)) continue;
      if (level.pathWeight(x, z) > 0.5 || stoneAmount(level, x, z) > 0.2) continue;
      if (Math.hypot(x, z) < 3 || blockers.some((b) => Math.hypot(x - b.x, z - b.z) < b.r))
        continue;
      const big = hash2(ix + 17, iz - 4) < 0.12;
      const yaw = hash2(ix - 9, iz + 6) * Math.PI * 2;
      const s = big ? 0.55 + 0.3 * hash2(ix, iz) : 0.9 + 0.5 * hash2(iz, ix);
      out.push({
        id: big ? 'RubblePile' : 'StoneScatter',
        matrix: placeMatrix(x, level.heightAt(x, z) - 0.03, z, yaw, [s, s, s]),
        bucket: `${Math.floor(x / 24)},${Math.floor(z / 24)}`,
      });
    }
  }
  return out;
}
