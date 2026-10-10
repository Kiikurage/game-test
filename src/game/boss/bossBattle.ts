import { BOSS_WALL } from './bossData';

/**
 * ボス戦のルールの純粋な幾何（6.6 節の壁際の位置取り・柱）。three / Rapier に依存しない。
 */

export interface Circle2D {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

export interface Point2D {
  readonly x: number;
  readonly z: number;
}

/** 壁（アリーナの縁）までの距離。中心から半径までの余り（壁の外なら負）。 */
export function wallGap(arena: Circle2D, p: Point2D): number {
  return arena.radius - Math.hypot(p.x - arena.x, p.z - arena.z);
}

/**
 * プレイヤーが壁に追い詰められているか。壁際（`BOSS_WALL.playerWallGap` 以内）で、ボスがプレイヤーより中央側にいる
 * （= プレイヤーの後ろにボスが下がる余地がなく、プレイヤーには逃げ場がない）とき true。
 */
export function pinnedAgainstWall(arena: Circle2D, boss: Point2D, player: Point2D): boolean {
  if (wallGap(arena, player) > BOSS_WALL.playerWallGap) return false;
  const bossR = Math.hypot(boss.x - arena.x, boss.z - arena.z);
  const playerR = Math.hypot(player.x - arena.x, player.z - arena.z);
  return bossR < playerR;
}

const TWO_PI = Math.PI * 2;

function angleDiff(a: number, b: number): number {
  let d = (b - a) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return Math.abs(d);
}

/**
 * 扇形の判定（頂点 `origin`・向き `yaw`・角度 `arcDeg`・射程 `range`）が、円（柱）に触れるか。
 * 垂直方向は見ない（柱は高さ 4m で、判定の高さを覆う）。
 */
export function sectorTouchesCircle(
  origin: Point2D,
  yaw: number,
  arcDeg: number,
  range: number,
  circle: Circle2D,
): boolean {
  const dx = circle.x - origin.x;
  const dz = circle.z - origin.z;
  const dist = Math.hypot(dx, dz);
  if (dist - circle.radius > range) return false;
  if (arcDeg >= 360 || dist <= circle.radius) return true;
  const half = (arcDeg / 2) * (Math.PI / 180) + Math.asin(Math.min(1, circle.radius / dist));
  return angleDiff(yaw, Math.atan2(dx, dz)) <= half;
}
