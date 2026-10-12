import { Group, Mesh } from 'three/webgpu';
import type { ArenaDef } from '../../game/world/arena';
import type { Level } from '../../game/world/level';
import {
  createColumnGeometry,
  createFloorDiscGeometry,
  createPedestalGeometry,
  createWallRingGeometry,
  mergeAll,
} from './arenaGeometry';

/** 床の円盤を地面よりわずかに浮かせる（m）。 */
const FLOOR_LIFT = 0.012;
/** 壁の内側 / 外側の半径。内面は当たり判定（24 角形。角で 16.14m）より内側に出ない。 */
export const WALL_INNER = 16.12;
export const WALL_OUTER = 17.3;

/** 外周の壁の円弧（霧の門側の切れ目を除く）。範囲は壁のコライダ（f-wall-*）の端から読む。 */
export function arenaWallArc(
  level: Level,
  def: ArenaDef,
): { start: number; end: number; height: number } | null {
  const { center } = def;
  const walls = level.boxes.filter((b) => /^f-wall-\d+$/.test(b.id));
  const angleOf = (b: { x: number; z: number }): number =>
    Math.atan2(b.z - center.z, b.x - center.x);
  const first = walls.find((b) => b.id === 'f-wall-1');
  const last = walls.find((b) => b.id === `f-wall-${walls.length}`);
  if (!first || !last) return null;
  const ring = Math.hypot(first.x - center.x, first.z - center.z);
  const half = Math.atan(first.hx / ring);
  const a0 = angleOf(first);
  const span = (((angleOf(last) - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return { start: a0 - half, end: a0 + span + half, height: first.hy * 2 };
}

/**
 * 闘技場の石の形状（床・外周の壁・柱 4 本・中央の台座。マテリアルなし）。ベイク時だけ呼ぶ（#329）。
 * 実行時は glb（`level_arena`）を読み、`arena.view.ts` がマテリアルを付ける。
 */
export function buildArenaScene(level: Level, def: ArenaDef): Group {
  const { center, floorY } = def;
  const root = new Group();
  root.name = 'arena';
  const add = (name: string, mesh: Mesh): void => {
    mesh.name = name;
    root.add(mesh);
  };
  add(
    'arena:floor',
    new Mesh(
      createFloorDiscGeometry(center.x, center.z, floorY + FLOOR_LIFT, def.circle.radius + 0.5),
    ),
  );
  const arc = arenaWallArc(level, def);
  if (arc) {
    add(
      'arena:wall',
      new Mesh(
        createWallRingGeometry({
          cx: center.x,
          cz: center.z,
          floorY,
          inner: WALL_INNER,
          outer: WALL_OUTER,
          height: arc.height,
          start: arc.start,
          end: arc.end,
        }),
      ),
    );
  }
  add(
    'arena:columns',
    new Mesh(
      mergeAll(
        def.pillars.map((p) =>
          createColumnGeometry({
            x: p.x,
            y: floorY,
            z: p.z,
            radius: p.radius,
            height: def.pillarHeight,
          }),
        ),
      ),
    ),
  );
  add(
    'arena:pedestal',
    new Mesh(
      createPedestalGeometry({
        x: def.pedestal.x,
        z: def.pedestal.z,
        y: floorY,
        radius: def.pedestal.radius,
        height: def.pedestal.topY - floorY,
      }),
    ),
  );
  return root;
}
