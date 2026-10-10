/**
 * 脇道 `side_waterway`（地下水路。仕様 14.1.3）の地形データを区画から組み立てる（#111。グレーボックス）。
 *
 * 水路は地形の下にある。高さ場（地形メッシュ）は 1 枚の面なので、次のように作る。
 *  - 区画（`WaterwayRect`: 軸に平行な内寸の矩形 + 床の高さ）の並びが水路の形を決める。階段の 1 段も 1 区画。
 *  - 区画ごとに 床（板）・天井（板）・外側の壁を `BlockProp`（style `waterway`）で作る。板は地形に埋め込まず（`embed`）、
 *    地形の下に浮かせる。敵のナビ格子は style `waterway` を無視する（地下なので C の床の上を塞がない）。
 *  - 腐った床板の真下と、上り階段の上（地形が頭の高さまで来る所）は、地形メッシュに穴を開ける（`terrainHoles`）。
 *  - 地下墓所の岩盤 `d-mass-s` を、水路の通る所だけくり抜いて（`carveMass`）、天井の上を埋め直す。
 */
import type { BlockProp, RectDef, WaterwayDef, WaterwayRect, ZoneDef, ZoneRect } from './level';

export const WATERWAY_ID = 'side_waterway';
/** 腐った床板（C 祭壇裏の北西）。踏むと割れて水路へ落ちる。穴の大きさ 2m × 2m（地形の 1m 格子 2 × 2 セル）。 */
export const HATCH = { id: 'floor-hatch', x: 44, z: 28, half: 1 } as const;
/** 水路の出口の鉄格子（内側から押して開く）。D 地下墓所の通路奥の側面（z = 47.25 の岩盤の面）へ出る。 */
export const GRATE = { id: 'iron-grate', x: 72, z: 45, halfWidth: 1, halfThickness: 0.15 } as const;
/** 暗所・反響ゾーンの地下墓所（エリア D）の範囲。 */
export const CRYPT_RECT: RectDef = { minX: 60, maxX: 78, minZ: 36, maxZ: 52 };

const CEILING = 2.2; // 天井 2.2m
/** 段の前後の天井（床から）。自動乗り越えは段の高さ（0.35m）だけカプセルを持ち上げるので、頭上にその分の余裕が要る。 */
const STAIR_CEILING = 2.6;
const DEPTH = 0.15; // 水深
const WALL_T = 0.4;
const SLAB = 0.15; // 天井板の厚み
/** 段の奥行き。プレイヤーのカプセル（半径 0.35m）+ 自動乗り越えの最小幅（0.1m）より短いと上れない。 */
const TREAD_RUN = 0.45;
/** 階段の段数（6 + 12）。1 段 = (出口 - 水路の床) / 18。 */
const STEPS_1 = 6;
const STEPS_2 = 12;

const EPS = 1e-6;

interface Built {
  readonly def: WaterwayDef;
  readonly props: readonly BlockProp[];
  readonly holes: readonly RectDef[];
  readonly zones: readonly ZoneDef[];
}

function rect(
  id: string,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  floorY: number,
  extra: {
    noCeiling?: boolean;
    water?: boolean;
    ceiling?: number;
    open?: readonly ('w' | 'e' | 's' | 'n')[];
  } = {},
): WaterwayRect {
  return { id, minX, maxX, minZ, maxZ, floorY, ...extra };
}

/**
 * 水路の区画。座標は仕様書の初期値から次のように取り直した。
 *  - (44, 28) → (58, 36) → (66, 40) → (72, 45) の斜めの線は、礼拝堂の北壁（z = 32。地面から 1.2m 下まで埋まっている）の下を
 *    通れないので、礼拝堂の東の崩れ口（x = 60, z 24..30。壁がない）の下を東へ抜け、x = 66 を北へ進む形にした。
 *    全長 約 47m（仕様は約 48m）。
 *  - 墓室 5m × 4m は x = 66 の通路から西（左）へ分かれる (60..65, 33..37)。
 *  - 雫 (66, 40) は水底（平らな区画の北端）。そこから上り階段（6 段 + 角の踊り場 + 12 段）で 4.9m 上がり、
 *    鉄格子 (72, 45) の先の出口は D の通路の床（z = 47.25 の面）に揃える。
 */
function buildRects(floorY: number, exitY: number): WaterwayRect[] {
  const rise = (exitY - floorY) / (STEPS_1 + STEPS_2);
  const stairStart = 43 - STEPS_1 * TREAD_RUN;
  const rects: WaterwayRect[] = [
    // 腐った床板の真下（天井なし。ここへ落ちてくる）
    rect('hatch', 43, 45, 27, 29, floorY, { noCeiling: true, water: true }),
    // 礼拝堂の床下を東へ（天井は礼拝堂の床の 0.2m 下）。x = 60 の崩れ口の下を通る
    rect('west', 45, 67, 27, 29, floorY, { water: true }),
    // x = 66 を北へ（雫は (66, 40)）
    rect('north', 65, 67, 29, stairStart - 0.9, floorY, { water: true }),
    rect('north-up', 65, 67, stairStart - 0.9, stairStart, floorY, {
      water: true,
      ceiling: STAIR_CEILING,
    }),
    // 墓室（5m × 4m）
    rect('chamber', 60, 65, 33, 37, floorY, { water: true }),
  ];
  for (let i = 0; i < STEPS_1; i++) {
    const z0 = 43 - STEPS_1 * TREAD_RUN + i * TREAD_RUN;
    rects.push(
      rect(`s1-${i}`, 65, 67, z0, z0 + TREAD_RUN, floorY + (i + 1) * rise, {
        ceiling: STAIR_CEILING,
      }),
    );
  }
  const cornerY = floorY + STEPS_1 * rise;
  rects.push(rect('corner', 65, 67, 43, 45, cornerY, { ceiling: STAIR_CEILING }));
  for (let j = 0; j < STEPS_2; j++) {
    const x0 = 67 + j * TREAD_RUN;
    rects.push(
      rect(`s2-${j}`, x0, x0 + TREAD_RUN, 43, 45, cornerY + (j + 1) * rise, {
        ceiling: STAIR_CEILING,
      }),
    );
  }
  // 階段の上の踊り場と、鉄格子 (72, 45) から出口 (72, 47.25) まで
  rects.push(rect('top', 67 + STEPS_2 * TREAD_RUN, 73, 43, 45, exitY, { ceiling: STAIR_CEILING }));
  // 北の面は D の通路の側面へ開いている
  rects.push(rect('exit', 71, 73, 45, 47.25, exitY, { open: ['n'], ceiling: STAIR_CEILING }));
  return rects;
}

const overlaps = (a: RectDef, b: RectDef): boolean =>
  a.minX < b.maxX - EPS && b.minX < a.maxX - EPS && a.minZ < b.maxZ - EPS && b.minZ < a.maxZ - EPS;

/** 区画の 1 辺のうち、ほかの区画と接していない（壁が要る）区間。 */
function openIntervals(
  r: WaterwayRect,
  side: 'w' | 'e' | 's' | 'n',
  all: readonly WaterwayRect[],
): [number, number][] {
  const vertical = side === 'w' || side === 'e';
  const line = side === 'w' ? r.minX : side === 'e' ? r.maxX : side === 's' ? r.minZ : r.maxZ;
  const a = vertical ? r.minZ : r.minX;
  const b = vertical ? r.maxZ : r.maxX;
  const covered: [number, number][] = [];
  for (const o of all) {
    if (o === r) continue;
    const touches = vertical
      ? o.minX <= line + EPS && o.maxX >= line - EPS
      : o.minZ <= line + EPS && o.maxZ >= line - EPS;
    if (!touches) continue;
    const lo = Math.max(a, vertical ? o.minZ : o.minX);
    const hi = Math.min(b, vertical ? o.maxZ : o.maxX);
    if (hi - lo > EPS) covered.push([lo, hi]);
  }
  covered.sort((p, q) => p[0] - q[0]);
  const out: [number, number][] = [];
  let cursor = a;
  for (const [lo, hi] of covered) {
    if (lo - cursor > EPS) out.push([cursor, lo]);
    cursor = Math.max(cursor, hi);
  }
  if (b - cursor > EPS) out.push([cursor, b]);
  return out;
}

/** 水路の壁・床・天井。 */
function buildShell(rects: readonly WaterwayRect[], ceiling: number): BlockProp[] {
  const props: BlockProp[] = [];
  const block = (
    id: string,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    bottom: number,
    top: number,
  ): BlockProp => ({
    kind: 'block',
    id,
    style: 'waterway',
    x: (minX + maxX) / 2,
    z: (minZ + maxZ) / 2,
    hx: (maxX - minX) / 2,
    hz: (maxZ - minZ) / 2,
    height: top - bottom,
    baseY: bottom,
    embed: 0,
  });
  for (const r of rects) {
    const ceil = r.ceiling ?? ceiling;
    props.push(block(`ww-floor-${r.id}`, r.minX, r.maxX, r.minZ, r.maxZ, r.floorY - 0.6, r.floorY));
    if (!r.noCeiling) {
      props.push(
        block(
          `ww-ceil-${r.id}`,
          r.minX,
          r.maxX,
          r.minZ,
          r.maxZ,
          r.floorY + ceil,
          r.floorY + ceil + SLAB,
        ),
      );
    }
    const bottom = r.floorY - 0.8;
    const top = r.floorY + ceil + SLAB;
    for (const side of ['w', 'e', 's', 'n'] as const) {
      if (r.open?.includes(side)) continue;
      const vertical = side === 'w' || side === 'e';
      const ownA = vertical ? r.minZ : r.minX;
      const ownB = vertical ? r.maxZ : r.maxX;
      openIntervals(r, side, rects).forEach(([lo, hi], k) => {
        // 自分の角では壁を WALL_T だけ延ばして隅を閉じる（ほかの区画の中に食い込むなら延ばさない）
        const make = (a: number, b: number): BlockProp => {
          const line =
            side === 'w' ? r.minX : side === 'e' ? r.maxX : side === 's' ? r.minZ : r.maxZ;
          const out = side === 'w' || side === 's' ? -1 : 1;
          const t0 = Math.min(line, line + out * WALL_T);
          const t1 = Math.max(line, line + out * WALL_T);
          return vertical
            ? block(`ww-wall-${r.id}-${side}${k}`, t0, t1, a, b, bottom, top)
            : block(`ww-wall-${r.id}-${side}${k}`, a, b, t0, t1, bottom, top);
        };
        let a = lo;
        let b = hi;
        const grow = (from: number, to: number): boolean => {
          const probe = vertical
            ? { minX: r.minX - WALL_T, maxX: r.maxX + WALL_T, minZ: from, maxZ: to }
            : { minX: from, maxX: to, minZ: r.minZ - WALL_T, maxZ: r.maxZ + WALL_T };
          return !rects.some((o) => o !== r && overlaps(o, probe));
        };
        if (Math.abs(lo - ownA) < EPS && grow(lo - WALL_T, lo)) a = lo - WALL_T;
        if (Math.abs(hi - ownB) < EPS && grow(hi, hi + WALL_T)) b = hi + WALL_T;
        props.push(make(a, b));
      });
    }
  }
  return props;
}

/** 矩形 `base` から `holes` を引いた残りを、軸に平行な矩形の並びで返す。 */
export function subtractRects(base: RectDef, holes: readonly RectDef[]): RectDef[] {
  const xs = new Set<number>([base.minX, base.maxX]);
  const zs = new Set<number>([base.minZ, base.maxZ]);
  for (const h of holes) {
    for (const x of [h.minX, h.maxX]) if (x > base.minX && x < base.maxX) xs.add(x);
    for (const z of [h.minZ, h.maxZ]) if (z > base.minZ && z < base.maxZ) zs.add(z);
  }
  const xList = [...xs].sort((a, b) => a - b);
  const zList = [...zs].sort((a, b) => a - b);
  // 行ごとに残る区間をまとめ、同じ x 範囲が縦に続くものを 1 枚にする
  const rows: { z0: number; z1: number; spans: [number, number][] }[] = [];
  for (let k = 0; k + 1 < zList.length; k++) {
    const z0 = zList[k] as number;
    const z1 = zList[k + 1] as number;
    const spans: [number, number][] = [];
    for (let i = 0; i + 1 < xList.length; i++) {
      const x0 = xList[i] as number;
      const x1 = xList[i + 1] as number;
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      if (holes.some((h) => cx > h.minX && cx < h.maxX && cz > h.minZ && cz < h.maxZ)) continue;
      const last = spans[spans.length - 1];
      if (last && Math.abs(last[1] - x0) < EPS) last[1] = x1;
      else spans.push([x0, x1]);
    }
    rows.push({ z0, z1, spans });
  }
  const out: RectDef[] = [];
  const open: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
  for (const row of rows) {
    const next: typeof open = [];
    for (const [x0, x1] of row.spans) {
      const prev = open.find((o) => Math.abs(o.minX - x0) < EPS && Math.abs(o.maxX - x1) < EPS);
      if (prev) {
        prev.maxZ = row.z1;
        next.push(prev);
        open.splice(open.indexOf(prev), 1);
      } else {
        next.push({ minX: x0, maxX: x1, minZ: row.z0, maxZ: row.z1 });
      }
    }
    out.push(...open);
    open.length = 0;
    open.push(...next);
  }
  out.push(...open);
  return out;
}

/**
 * 岩盤の塊 `mass`（`BlockProp`）から水路の通る区画をくり抜き、残りの塊と、天井の上を埋める塊（水路の天井 〜 岩盤の上面）を返す。
 * くり抜きは壁の面より 0.02m だけ広げ（壁と岩盤の面が重なってちらつかないように）、壁は岩盤の中に隠れる。
 */
export function carveMass(
  mass: BlockProp,
  rects: readonly WaterwayRect[],
  ceiling: number,
): BlockProp[] {
  const base = mass.baseY ?? 0;
  const top = base + mass.height;
  const footprint = {
    minX: mass.x - mass.hx,
    maxX: mass.x + mass.hx,
    minZ: mass.z - mass.hz,
    maxZ: mass.z + mass.hz,
  };
  const bottom = base - 1.2;
  const cuts = rects.filter(
    (r) => overlaps(r, footprint) && r.floorY + (r.ceiling ?? ceiling) + SLAB > bottom - EPS,
  );
  const inflate = (r: RectDef): RectDef => ({
    minX: r.minX - 0.02,
    maxX: r.maxX + 0.02,
    minZ: r.minZ - 0.02,
    maxZ: r.maxZ + 0.02,
  });
  const clip = (r: RectDef): RectDef => ({
    minX: Math.max(r.minX, footprint.minX),
    maxX: Math.min(r.maxX, footprint.maxX),
    minZ: Math.max(r.minZ, footprint.minZ),
    maxZ: Math.min(r.maxZ, footprint.maxZ),
  });
  const holes = cuts.map((r) => clip(inflate(r)));
  const make = (id: string, r: RectDef, from: number, to: number): BlockProp => ({
    kind: 'block',
    id,
    style: mass.style,
    x: (r.minX + r.maxX) / 2,
    z: (r.minZ + r.maxZ) / 2,
    hx: (r.maxX - r.minX) / 2,
    hz: (r.maxZ - r.minZ) / 2,
    height: to - from,
    baseY: from,
    embed: 0,
    ...(mass.navSolid ? { navSolid: true } : {}),
  });
  // 西の端は穴のない帯として元の id のまま残す（岩盤の西面 = 通路の東の壁。既存の寸法の検査が読む）
  const cutMinX = Math.min(...holes.map((h) => h.minX));
  const strip = cutMinX > footprint.minX ? { ...footprint, maxX: cutMinX } : undefined;
  const rest = strip ? { ...footprint, minX: cutMinX } : footprint;
  const out: BlockProp[] = [];
  if (strip) out.push(make(mass.id, strip, bottom, top));
  subtractRects(rest, holes).forEach((r, i) => out.push(make(`${mass.id}-${i}`, r, bottom, top)));
  cuts.forEach((r, i) => {
    const hole = holes[i];
    if (hole) {
      out.push(
        make(`${mass.id}-lintel-${r.id}`, hole, r.floorY + (r.ceiling ?? ceiling) + SLAB, top),
      );
    }
  });
  return out;
}

/** 水路 1 本ぶんのデータ一式を作る。`floorY` は水路の床（C の床 - 落下 2.4m）、`exitY` は D の通路の床。 */
export function buildWaterway(
  floorY: number,
  exitY: number,
  crypt: RectDef = CRYPT_RECT,
): Built & { rects: readonly WaterwayRect[] } {
  const rects = buildRects(floorY, exitY);
  const def: WaterwayDef = { id: WATERWAY_ID, ceiling: CEILING, depth: DEPTH, rects };
  const props = buildShell(rects, CEILING);
  // 墓室の石棺（瀕死の騎士がもたれる。会話・大剣は E11）
  props.push({
    kind: 'block',
    id: 'ww-sarcophagus',
    style: 'waterway',
    x: 61.3,
    z: 35,
    hx: 0.8,
    hz: 0.95,
    height: 0.75,
    baseY: floorY,
    embed: 0.2,
  });

  // 地形メッシュの穴: 床板の真下と、上り階段（地形が頭の高さまで来る）の上
  const holes: RectDef[] = [
    {
      minX: HATCH.x - HATCH.half,
      maxX: HATCH.x + HATCH.half,
      minZ: HATCH.z - HATCH.half,
      maxZ: HATCH.z + HATCH.half,
    },
    { minX: 65, maxX: 67, minZ: 42, maxZ: 45 },
    { minX: 67, maxX: 73, minZ: 43, maxZ: 45 },
    { minX: 71, maxX: 73, minZ: 45, maxZ: 47 },
  ];

  const zoneRects = (): ZoneRect[] =>
    rects.map((r) => ({
      minX: r.minX,
      maxX: r.maxX,
      minZ: r.minZ,
      maxZ: r.maxZ,
      minY: r.floorY - 0.6,
      maxY: r.floorY + (r.ceiling ?? CEILING) + SLAB,
    }));
  const zones: ZoneDef[] = [
    { id: 'dark-crypt', kind: 'dark', rects: [crypt] },
    { id: 'dark-waterway', kind: 'dark', rects: zoneRects() },
    { id: 'echo-crypt', kind: 'echo', rects: [crypt] },
    { id: 'echo-waterway', kind: 'echo', rects: zoneRects() },
  ];
  return { def, props, holes, zones, rects };
}
