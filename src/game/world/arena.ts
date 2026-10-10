import type { Level } from './level';

/**
 * F 闘技場（仕様書 6.6 / 7.1 節）の定義。レベルデータ（`ashenFoundation.ts` の `f-*` 静的物とエリア F）から読み取るので、
 * ボス戦のルール（壁際の位置取り・柱の判定）・描画・撃破演出が同じ寸法を共有する。
 *
 *   const arena = arenaOf(level);
 *   bossSystemOf(game).spawn({ x: arena.center.x, z: arena.center.z, arena: arena.circle, pillars: arena.pillars });
 *   arena.bonfireSlot  // 撃破後に篝火を灯す位置（台座の上面の中央）
 */
export interface ArenaDef {
  readonly center: { readonly x: number; readonly z: number };
  /** 床の高さ（m）。 */
  readonly floorY: number;
  /** 床の円（ボスの `BossSpawnOptions.arena`）。半径 = 内径 32m の半分。 */
  readonly circle: { readonly x: number; readonly z: number; readonly radius: number };
  /** 柱（円）。並びは `BossSpawnOptions.pillars` の添字 = `bossPillarHit.pillar` の添字。 */
  readonly pillars: readonly { readonly x: number; readonly z: number; readonly radius: number }[];
  /** 柱の高さ（m。床から）。 */
  readonly pillarHeight: number;
  /** 中央の台座。 */
  readonly pedestal: {
    readonly x: number;
    readonly z: number;
    readonly radius: number;
    /** 上面の高さ（m、ワールド）。 */
    readonly topY: number;
  };
  /** 撃破後に篝火を灯す位置（台座の上面の中央。ワールド座標）。 */
  readonly bonfireSlot: { readonly x: number; readonly y: number; readonly z: number };
  /** 霧の門からの通路の口（壁の切れ目）の中心。 */
  readonly entry: { readonly x: number; readonly z: number };
}

/** `arenaOf` の見た目が差し替える静的物の ID（`LevelView` はこれらのグレーボックスを作らない）。 */
export function isArenaProp(id: string): boolean {
  return /^f-(wall-\d+|pillar-\d+|pedestal)$/.test(id);
}

const cache = new WeakMap<Level, ArenaDef | null>();

/** レベルに闘技場がなければ `null`。 */
export function arenaOf(level: Level): ArenaDef | null {
  const cached = cache.get(level);
  if (cached !== undefined) return cached;
  const area = level.data.areas.find((a) => a.id === 'F');
  const pedestal = level.cylinders.find((c) => c.id === 'f-pedestal');
  let def: ArenaDef | null = null;
  if (area?.shape.type === 'circle' && pedestal) {
    const { cx, cz, r } = area.shape;
    const floorY = area.floor?.height ?? level.heightAt(cx, cz);
    const pillars = level.cylinders
      .filter((c) => c.id.startsWith('f-pillar-'))
      .sort((a, b) => a.id.localeCompare(b.id));
    const topY = pedestal.y + pedestal.height;
    // 通路の口 = 外周壁の切れ目（壁 f-wall-1 と最後の壁の中間の方角）
    const walls = level.boxes.filter((b) => /^f-wall-\d+$/.test(b.id));
    const first = walls.find((b) => b.id === 'f-wall-1');
    const last = walls.find((b) => b.id === `f-wall-${walls.length}`);
    const ring = first ? Math.hypot(first.x - cx, first.z - cz) : r + 0.5;
    const mx = first && last ? (first.x + last.x) / 2 - cx : -ring;
    const mz = first && last ? (first.z + last.z) / 2 - cz : 0;
    const md = Math.hypot(mx, mz) || 1;
    def = {
      center: { x: cx, z: cz },
      floorY,
      circle: { x: cx, z: cz, radius: r },
      pillars: pillars.map((p) => ({ x: p.x, z: p.z, radius: p.radius })),
      pillarHeight: pillars[0] ? pillars[0].height - 0.3 : 4,
      pedestal: { x: pedestal.x, z: pedestal.z, radius: pedestal.radius, topY },
      bonfireSlot: { x: pedestal.x, y: topY, z: pedestal.z },
      entry: { x: cx + (mx / md) * ring, z: cz + (mz / md) * ring },
    };
  }
  cache.set(level, def);
  return def;
}

/**
 * 闘技場のムード（夕闇 → ほぼ夜）の重み 0..1。霧の門の通路を歩いてくる間に滑らかに上がる
 * （闘技場の中心から `outer` m より外で 0、`inner` m より内で 1。smootherstep）。
 */
export function arenaMoodWeight(
  arena: ArenaDef,
  x: number,
  z: number,
  outer = 38,
  inner = 17,
): number {
  const d = Math.hypot(x - arena.center.x, z - arena.center.z);
  const t = Math.min(1, Math.max(0, (outer - d) / (outer - inner)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
