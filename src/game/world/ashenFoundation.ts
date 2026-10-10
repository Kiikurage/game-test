/**
 * フィールド「灰の礎（Ashen Foundation）」のレベルデータ（仕様書 7 章）。
 * 座標は篝火を原点・+x 東・+z 北（m）。エリア A〜C は歩けるグレーボックス、D〜F は範囲・床の高さだけ
 * 先に決めてあり、地形は A〜C と同じ高さ関数でつながっている（後続チケットで壁・内部を足す）。
 * 数値は初期値（グレーボックスで調整する）。
 */
import type {
  BlockProp,
  CylinderProp,
  EnemySpawn,
  GateDef,
  InteractableSpawn,
  ItemSpawn,
  LevelData,
  OpenPath,
  PerimeterParams,
  PropSpec,
  SidePathDef,
} from './level';
import type { BoxSpec } from './playground';

/** 礼拝堂の床の高さ（m）。B の道は篝火の高さ 0 からここまで緩く上る。 */
const C_FLOOR = 3.4;
/**
 * 中庭・闘技場の床の高さ（m）。地下墓所は床を平らにせず、C（3.4）から E（7.4）へ通路が緩く上る。
 * `D_BASE` は地下墓所の岩盤の基準高さ（通路の床より高い）。
 */
const D_BASE = 5.4;
const E_FLOOR = 7.4;
const F_FLOOR = 9.9;
const WALL_T = 0.35;
const WALL_H = 3.6;

/** x 方向に延びる壁（z 固定）。 */
function wallX(
  id: string,
  z: number,
  x0: number,
  x1: number,
  height: number,
  style: BlockProp['style'] = 'wall',
): BlockProp {
  return {
    kind: 'block',
    id,
    style,
    x: (x0 + x1) / 2,
    z,
    hx: (x1 - x0) / 2,
    hz: WALL_T,
    height,
    baseY: C_FLOOR,
  };
}

/** z 方向に延びる壁（x 固定）。 */
function wallZ(
  id: string,
  x: number,
  z0: number,
  z1: number,
  height: number,
  style: BlockProp['style'] = 'wall',
): BlockProp {
  return {
    kind: 'block',
    id,
    style,
    x,
    z: (z0 + z1) / 2,
    hx: WALL_T,
    hz: (z1 - z0) / 2,
    height,
    baseY: C_FLOOR,
  };
}

function grave(id: string, x: number, z: number, yawDeg: number, height = 1): BlockProp {
  return { kind: 'block', id, style: 'grave', x, z, hx: 0.32, hz: 0.12, height, yawDeg };
}

function tree(id: string, x: number, z: number, height = 4.4): CylinderProp {
  return { kind: 'cylinder', id, style: 'tree', x, z, radius: 0.26, height };
}

function pewRow(id: string, x: number, z: number): BlockProp {
  return {
    kind: 'block',
    id,
    style: 'pew',
    x,
    z,
    hx: 1.7,
    hz: 0.3,
    height: 0.85,
    baseY: C_FLOOR,
  };
}

/** 任意の向きの壁（始点 → 終点）。厚みは WALL_T の 2 倍。`extend` は両端を延ばして継ぎ目の隙間を消す。 */
function wallSeg(
  id: string,
  [x0, z0]: readonly [number, number],
  [x1, z1]: readonly [number, number],
  height: number,
  baseY: number | undefined,
  opts: { style?: BlockProp['style']; extend?: number; halfThickness?: number } = {},
): BlockProp {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const extend = opts.extend ?? 0;
  return {
    kind: 'block',
    id,
    style: opts.style ?? 'wall',
    x: (x0 + x1) / 2,
    z: (z0 + z1) / 2,
    hx: len / 2 + extend,
    hz: opts.halfThickness ?? WALL_T,
    height,
    ...(baseY === undefined ? {} : { baseY }),
    yawDeg: (Math.atan2(-(z1 - z0), x1 - x0) * 180) / Math.PI,
  };
}

/** 軸に平行な矩形の塊（地下墓所の岩盤など）。 */
function mass(
  id: string,
  [x0, x1]: readonly [number, number],
  [z0, z1]: readonly [number, number],
  height: number,
  baseY: number | undefined,
): BlockProp {
  return {
    kind: 'block',
    id,
    style: 'wall',
    x: (x0 + x1) / 2,
    z: (z0 + z1) / 2,
    hx: (x1 - x0) / 2,
    hz: (z1 - z0) / 2,
    height,
    ...(baseY === undefined ? {} : { baseY }),
  };
}

// --- D 地下墓所: 通路幅 2.5m の L 字（入口 (62,36) → 北へ → 角 → 東へ → 出口 (78.6,48.5)）。岩盤の塊で囲む ---
const D_WALL_H = 3.8;
const D_PROPS: PropSpec[] = [
  mass('d-wall-w', [60, 60.75], [35.5, 53.75], D_WALL_H, D_BASE),
  mass('d-cap-n', [60, 64], [52.75, 53.75], D_WALL_H, D_BASE),
  mass('d-mass-n', [63.25, 78.6], [49.75, 53.75], D_WALL_H, D_BASE),
  mass('d-mass-s', [63.25, 78.6], [35.5, 47.25], D_WALL_H, D_BASE),
  // 角の奥の窪み（石棺。蓋を押しのけて亡者兵が起き上がる手続きモーションは別チケット）
  {
    kind: 'block',
    id: 'd-sarcophagus',
    style: 'sarcophagus',
    x: 62,
    z: 51.5,
    hx: 0.8,
    hz: 0.95,
    height: 0.75,
  },
];

// --- E 中庭 (84..104, 48..68): 外壁に 西の入口・南の崩れ口の 2 か所。北東の角に霧の門 (104,68) ---
const E_WALL_H = 3.3;
const E_PROPS: PropSpec[] = [
  // 西壁（入口 z 48..54）、南壁（崩れ口 x 92..96）、東壁、北壁（霧の門の手前で止める）
  mass('e-wall-w', [83.65, 84.35], [54, 68], E_WALL_H, E_FLOOR),
  mass('e-wall-s1', [84, 92], [47.65, 48.35], E_WALL_H, E_FLOOR),
  mass('e-wall-s2', [96, 104], [47.65, 48.35], E_WALL_H, E_FLOOR),
  mass('e-wall-e', [103.65, 104.35], [48, 64.5], E_WALL_H, E_FLOOR),
  mass('e-wall-n', [84, 100.8], [67.65, 68.35], E_WALL_H, E_FLOOR),
  // 崩れ口の瓦礫
  {
    kind: 'block',
    id: 'e-rubble-1',
    style: 'rubble',
    x: 91.6,
    z: 49,
    hx: 0.8,
    hz: 0.5,
    height: 0.9,
    yawDeg: 25,
    baseY: E_FLOOR,
  },
  {
    kind: 'block',
    id: 'e-rubble-2',
    style: 'rubble',
    x: 96.5,
    z: 49.3,
    hx: 0.7,
    hz: 0.6,
    height: 1.2,
    yawDeg: -30,
    baseY: E_FLOOR,
  },
  // 崩れた噴水（障害物）と、位置取りのための壁の欠片・折れた柱
  { kind: 'cylinder', id: 'e-fountain', style: 'fountain', x: 94, z: 58, radius: 2.2, height: 1.3 },
  {
    kind: 'block',
    id: 'e-wall-frag',
    style: 'wall',
    x: 90,
    z: 62.5,
    hx: 2.2,
    hz: WALL_T,
    height: 1.7,
    baseY: E_FLOOR,
  },
  {
    kind: 'cylinder',
    id: 'e-column-1',
    style: 'column',
    x: 89,
    z: 55.5,
    radius: 0.45,
    height: 2.4,
  },
  { kind: 'cylinder', id: 'e-column-2', style: 'column', x: 99, z: 63, radius: 0.45, height: 3 },
  { kind: 'cylinder', id: 'e-column-3', style: 'column', x: 88, z: 66, radius: 0.5, height: 1.6 },
];

// --- ショートカット（G1 から A へ向かう道）の入口の両側と、G1 の北の道（中庭へ続く北進路）の東壁 ---
const SHORTCUT_END: readonly [number, number] = [68, 8];
const G1_POS: readonly [number, number] = [78, 32];
const LANE_PROPS: PropSpec[] = [
  // 鉄門 G1 より南（ショートカット）の両側の壁。道は幅 約 5m
  wallSeg('lane-s-e', [70.9, 6.8], [80.9, 30.8], 4.2, undefined, { extend: 0.4 }),
  wallSeg('lane-s-w', [65.1, 9.2], [75.1, 33.2], 4.2, undefined, { extend: 0.4 }),
  // G1 より北（中庭へ続く北進路）の両側。西は地下墓所の岩盤、東は壁（脇道 S4 の亀裂の壁の位置）
  wallSeg('lane-n-w', [75.1, 33.2], [78, 36], 4.2, undefined, { extend: 0.3 }),
  wallSeg('lane-n-e0', [80.9, 30.8], [82.5, 36], 4.2, undefined, { extend: 0.3 }),
  mass('lane-n-e', [82.15, 82.85], [36, 46.5], 4.2, undefined),
];

// --- F 闘技場: 直径 32m。外周の壁（北東側の霧の門からの通路 1 か所を除く）、柱 4 本、中央の台座 ---
const F_CENTER = { x: 122, z: 86 };
const F_RING_R = 16.5;
const F_RING_N = 24;
const F_ENTRY_DEG = 225;
const F_WALL_H = 3.4;

function arenaRing(): BlockProp[] {
  const walls: BlockProp[] = [];
  const half = F_RING_R * Math.tan(Math.PI / F_RING_N);
  for (let i = 1; i < F_RING_N; i++) {
    // i = 0 を飛ばして通路の口（幅 約 4.3m）にする
    const theta = ((F_ENTRY_DEG + (i * 360) / F_RING_N) * Math.PI) / 180;
    walls.push({
      kind: 'block',
      id: `f-wall-${i}`,
      style: 'wall',
      x: F_CENTER.x + Math.cos(theta) * F_RING_R,
      z: F_CENTER.z + Math.sin(theta) * F_RING_R,
      hx: half + 0.25,
      hz: 0.5,
      height: F_WALL_H,
      baseY: F_FLOOR,
      yawDeg: (Math.atan2(-Math.cos(theta), -Math.sin(theta)) * 180) / Math.PI,
    });
  }
  return walls;
}

const F_PROPS: PropSpec[] = [
  ...arenaRing(),
  // 霧の門から闘技場の口へ続く通路の壁（幅 約 4.3m）
  wallSeg('f-pass-l', [100.46, 68], [108.8, 76.3], 3.4, E_FLOOR, { extend: 0.3 }),
  wallSeg('f-pass-r', [104, 64.46], [111.86, 72.3], 3.4, E_FLOOR, { extend: 0.3 }),
  // 柱 4 本（高さ 4m・半径 0.7m）を円周付近（r = 12m）に等間隔。通路の口の正面を避ける
  ...[0, 90, 180, 270].map((deg, i): CylinderProp => ({
    kind: 'cylinder',
    id: `f-pillar-${i + 1}`,
    style: 'column',
    x: F_CENTER.x + Math.cos((deg * Math.PI) / 180) * 12,
    z: F_CENTER.z + Math.sin((deg * Math.PI) / 180) * 12,
    radius: 0.7,
    height: 4,
  })),
  // 中央の古い台座
  {
    kind: 'cylinder',
    id: 'f-pedestal',
    style: 'pedestal',
    x: F_CENTER.x,
    z: F_CENTER.z,
    radius: 1.6,
    height: 0.9,
  },
];

// --- 脇道の足場（仕様書 14 章。グレーボックス）---
// 屋根・岩棚・壁上はプレイヤーだけが上がれる高所。敵のナビ格子には含めない（`navSolid`）。
// 座標・寸法は初期値（グレーボックスで調整する）。#190（外周の崖の岩肌化）は `sidePaths` の範囲を避けること。

/** 霊廟の屋根（高さ 2.2m）。基準は裏手の石段の足元の地形（heightAt(29, 21.6) ≈ 2.76）。 */
const ROOF_BASE = 2.76;
const ROOF_H = 2.2;
/** 北壁上の回廊の床（礼拝堂の床 + 2.8m）。 */
const WALL_TOP_Y = C_FLOOR + 2.8;
/** 回廊（北壁の上）。幅 1.5m・長さ 14m（x 40..54。うち x 46..54 が仕様の「幅 1.5m・長さ 8m」の回廊で、西は岩棚の終端）。 */
const WALL_TOP = { minX: 40, maxX: 54, minZ: 31.5, maxZ: 33 };

/**
 * 岩棚（side_ledge）の中心線。崖の足元 (35, 19) から、倒れた柵の隙間 (33, 23) を通り、礼拝堂の西の外壁沿いに北へ上って
 * 北壁の上 (40, 32) へ出る。仕様の (44, 26) は礼拝堂の内側（西壁の内）なので、折れ曲がりを外側 (35.5, 27.5)・(38, 29.8) に
 * 取り直した。全長 約 22m（岩棚 約 16m + 壁上 6m）。
 */
const LEDGE_POINTS: readonly (readonly [number, number])[] = [
  [35, 19],
  [33, 22],
  [33, 25],
  [35.5, 27.5],
  [38, 29.8],
  [39.6, 32],
];
const LEDGE_HALF_WIDTH = 0.6;
const LEDGE_SLAB = 0.5;
/** 岩棚の床は 地形（約 3.4m）+ 少し から 北壁の上（6.2m）まで一定勾配で上る（段の高さ ≒ 0.09m。自動乗り越えの範囲）。 */
const LEDGE_START_Y = 3.4;
/** 透明壁: 床の縁から 0.05m 離して厚み 0.2m。 */
const GUARD_HALF_T = 0.1;
const GUARD_OFFSET = LEDGE_HALF_WIDTH + 0.05 + GUARD_HALF_T;
/** 岩棚・壁上の足場の範囲の半幅（透明壁の外面まで）。 */
const LEDGE_FOOTPRINT = GUARD_OFFSET + GUARD_HALF_T;

function slabBlock(
  id: string,
  x: number,
  z: number,
  hx: number,
  hz: number,
  yawDeg: number,
  top: number,
): BlockProp {
  const base = 3;
  return {
    kind: 'block',
    id,
    style: 'stairs',
    x,
    z,
    hx,
    hz,
    height: top - base,
    baseY: base,
    yawDeg,
    navSolid: true,
  };
}

function guardBox(
  id: string,
  x: number,
  z: number,
  hx: number,
  hz: number,
  yawDeg: number,
  bottom: number,
  top: number,
): BoxSpec {
  return { id, x, y: (bottom + top) / 2, z, hx, hy: (top - bottom) / 2, hz, yawDeg };
}

/** 岩棚の足場（0.5m ごとの小さな段）と、その両脇の透明壁。 */
function buildLedge(): { props: BlockProp[]; guards: BoxSpec[] } {
  const props: BlockProp[] = [];
  const guards: BoxSpec[] = [];
  const legs = LEDGE_POINTS.slice(0, -1).map((a, i) => {
    const b = LEDGE_POINTS[i + 1] as readonly [number, number];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { a, b, len, dx: (b[0] - a[0]) / len, dz: (b[1] - a[1]) / len };
  });
  const total = legs.reduce((sum, leg) => sum + leg.len, 0);
  const topAt = (s: number): number => LEDGE_START_Y + (WALL_TOP_Y - LEDGE_START_Y) * (s / total);
  let s = 0;
  legs.forEach((leg, k) => {
    const yawDeg = (Math.atan2(leg.dx, leg.dz) * 180) / Math.PI;
    const count = Math.max(1, Math.round(leg.len / LEDGE_SLAB));
    const seg = leg.len / count;
    for (let j = 0; j < count; j++) {
      const mid = (j + 0.5) * seg;
      props.push(
        slabBlock(
          `ledge-${k}-${j}`,
          leg.a[0] + leg.dx * mid,
          leg.a[1] + leg.dz * mid,
          LEDGE_HALF_WIDTH,
          seg / 2 + 0.02,
          yawDeg,
          topAt(s + (j + 1) * seg),
        ),
      );
    }
    s += leg.len;
    const legTop = topAt(s);
    // 継ぎ目の隙間を埋める四角（外側の角）
    props.push(
      slabBlock(
        `ledge-joint-${k}`,
        leg.b[0] + (k === legs.length - 1 ? 0.2 : 0),
        leg.b[1] + (k === legs.length - 1 ? 0.1 : 0),
        LEDGE_HALF_WIDTH,
        LEDGE_HALF_WIDTH,
        0,
        legTop,
      ),
    );
    // 透明壁。曲がりの外側だけ 0.8m 延ばして角の隙間を塞ぐ
    const next = legs[k + 1];
    const prev = legs[k - 1];
    const outerSide = (from: typeof leg, to: typeof leg | undefined): number => {
      if (!to) return 0;
      const cross = from.dx * to.dz - from.dz * to.dx;
      return cross < 0 ? 1 : -1; // 右へ曲がる（cross < 0）なら外側は左（+1）
    };
    const nl = [-leg.dz, leg.dx] as const;
    const bottom = legTop - 3.2;
    for (const side of [1, -1] as const) {
      const extStart = prev && outerSide(prev, leg) === side ? 0.8 : 0;
      const extEnd =
        next && outerSide(leg, next) === side ? 0.8 : k === legs.length - 1 && side === 1 ? 0.8 : 0;
      const along = (leg.len + extStart + extEnd) / 2 - extStart;
      guards.push(
        guardBox(
          `ledge-guard-${k}-${side > 0 ? 'l' : 'r'}`,
          (leg.a[0] + leg.b[0]) / 2 + leg.dx * (along - leg.len / 2) + nl[0] * side * GUARD_OFFSET,
          (leg.a[1] + leg.b[1]) / 2 + leg.dz * (along - leg.len / 2) + nl[1] * side * GUARD_OFFSET,
          GUARD_HALF_T,
          (leg.len + extStart + extEnd) / 2,
          yawDeg,
          bottom,
          legTop + 1,
        ),
      );
    }
  });
  return { props, guards };
}

/** 壁上回廊の透明壁。北は全長、南は落下ポイント 3 か所（x = 47, 50, 53。幅 1.5m）だけ開ける。 */
const DROP_X = [47, 50, 53] as const;
function buildWallTopGuards(): BoxSpec[] {
  const bottom = WALL_TOP_Y - 0.8;
  const top = WALL_TOP_Y + 1;
  const guards: BoxSpec[] = [];
  const north = WALL_TOP.maxZ + GUARD_HALF_T;
  const south = WALL_TOP.minZ - GUARD_HALF_T;
  const westX = WALL_TOP.minX - 1;
  guards.push(
    guardBox(
      'wall-top-guard-n',
      (westX + WALL_TOP.maxX + 0.2) / 2,
      north,
      (WALL_TOP.maxX + 0.2 - westX) / 2,
      GUARD_HALF_T,
      0,
      bottom,
      top,
    ),
  );
  const edges = [
    WALL_TOP.minX,
    ...DROP_X.flatMap((x) => [x - 0.75, x + 0.75]),
    WALL_TOP.maxX + 0.2,
  ];
  for (let i = 0; i < edges.length; i += 2) {
    const x0 = edges[i] as number;
    const x1 = edges[i + 1] as number;
    guards.push(
      guardBox(
        `wall-top-guard-s${i / 2}`,
        (x0 + x1) / 2,
        south,
        (x1 - x0) / 2,
        GUARD_HALF_T,
        0,
        bottom,
        top,
      ),
    );
  }
  guards.push(
    guardBox(
      'wall-top-guard-e',
      WALL_TOP.maxX + 0.1,
      (WALL_TOP.minZ + WALL_TOP.maxZ) / 2,
      GUARD_HALF_T,
      (WALL_TOP.maxZ - WALL_TOP.minZ) / 2 + 0.2,
      0,
      bottom,
      top,
    ),
  );
  return guards;
}

const LEDGE = buildLedge();
const SIDE_GUARDS: BoxSpec[] = [...LEDGE.guards, ...buildWallTopGuards()];
const SIDE_PROPS: PropSpec[] = [
  ...LEDGE.props,
  // 北壁の上の回廊の床（礼拝堂の北壁 chapel-n の上に幅 1.5m で被せる）
  {
    kind: 'block',
    id: 'wall-top',
    style: 'stairs',
    x: (WALL_TOP.minX + WALL_TOP.maxX) / 2,
    z: (WALL_TOP.minZ + WALL_TOP.maxZ) / 2,
    hx: (WALL_TOP.maxX - WALL_TOP.minX) / 2,
    hz: (WALL_TOP.maxZ - WALL_TOP.minZ) / 2,
    height: WALL_TOP_Y - C_FLOOR,
    baseY: C_FLOOR,
    navSolid: true,
  },
];

/**
 * 脇道の高所の足場の範囲（#110）。敵のナビ格子には含めない。外周の崖の岩塊（#190）などの装飾は、
 * `sidePathDistance`（level.ts）でこの範囲から離して置くこと。
 */
const SIDE_PATH_DEFS: SidePathDef[] = [
  {
    id: 'side_roof',
    points: [],
    halfWidth: 0,
    rects: [
      // 霊廟（屋根）と裏手の石段
      { minX: 27, maxX: 31, minZ: 14, maxZ: 18 },
      { minX: 28.4, maxX: 29.6, minZ: 18, maxZ: 21.6 },
    ],
    spots: [
      { id: 'letter', x: 29, z: 16 },
      { id: 'drop-edge', x: 29, z: 13.8 },
    ],
  },
  {
    id: 'side_ledge',
    points: LEDGE_POINTS,
    halfWidth: LEDGE_FOOTPRINT,
    rects: [WALL_TOP],
    spots: [
      { id: 'ring', x: 38, z: 29.8 },
      { id: 'bell', x: 50, z: 32 },
      { id: 'charm', x: 52, z: 32.5 },
      // 壁上から礼拝堂内へ降りる落下ポイントの着地点（仕様 14.1.2）
      { id: 'drop-w', x: 47, z: 30.8 },
      { id: 'drop-m', x: 50, z: 30.8 },
      { id: 'drop-e', x: 53, z: 30.8 },
    ],
  },
];

/**
 * 脇道（仕様書 14 章）の通行領域。外周封鎖（`PERIMETER`）が崖にしない範囲で、脇道の本実装（別チケット）が
 * 屋根・岩棚・蔵・壁上回廊の地形を足すときの余地。S3（水路）は地下で、入口の床板 (44, 28) は C の内側なので不要。
 * 幅は 14 章の経路（幅 1.2〜1.6m）より広く取ってある。
 */
const SIDE_PATHS: OpenPath[] = [
  // side_roof: B 北端の倒れた柵 (33, 18.5〜23) → 霊廟の裏手 (28〜29, 20〜23.5) の石段
  {
    id: 'side_roof',
    points: [
      [33, 14],
      [33, 23.5],
      [29, 23.5],
      [29, 21],
    ],
    halfWidth: 3,
  },
  // side_ledge: 崖下 (35, 19) → 倒れた柵の隙間 → 礼拝堂の西の外壁沿い → 北壁の上（足場は SIDE_PATH_DEFS）。始点は side_roof と重なる
  {
    id: 'side_ledge',
    points: LEDGE_POINTS,
    halfWidth: 2.5,
  },
  // side_wall: 北進路の東壁 (82, 41) → 蔵 (83..87, 40..43) → 石段 → 壁上回廊 (86, 44) → (86, 66) → (100, 67) → 霧の門の脇 (101, 65)
  {
    id: 'side_wall',
    points: [
      [80.5, 41],
      [85, 41.5],
      [86, 44],
      [86, 66],
      [100, 67],
      [101, 65],
    ],
    halfWidth: 2.5,
  },
];

/**
 * 外周の封鎖（#176）。道・エリア・脇道の外側を岩壁（崖）にして、D・G1・霧の門の迂回を物理的に不可にする。
 * 地形データだけで実現するので、敵のナビ格子（#43）も同じ崖を避ける。余白は「壁の外側に出られても行き止まり」
 * になる程度（エリアの壁・道のすぐ外）に絞る。D は岩盤の塊が外壁なので余白 0（C 側から D の外壁沿いに回り込ませない）。
 */
const PERIMETER: PerimeterParams = {
  rise: 7,
  width: 3,
  routeMargin: 1.5,
  areaMargin: 2.5,
  openPaths: SIDE_PATHS,
};

const props: PropSpec[] = [
  // --- A 篝火「灰の炉」 ---
  {
    kind: 'block',
    id: 'bonfire-base',
    style: 'bonfire',
    x: 0,
    z: 0,
    hx: 0.7,
    hz: 0.7,
    height: 0.5,
  },
  {
    kind: 'block',
    id: 'stele-a-stone',
    style: 'stone',
    x: -4.6,
    z: 3.4,
    hx: 0.55,
    hz: 0.18,
    height: 1.7,
    // 篝火の方（南東）を向ける
    yawDeg: 127,
  },
  tree('tree-a1', -6.4, -3.2),
  tree('tree-a2', 4.2, 6.6, 3.8),

  // --- B 墓地の小径 ---
  grave('grave-b1', 9.7, 6.6, 20),
  grave('grave-b2', 14.5, 9.0, -15, 1.2),
  grave('grave-b3', 21.4, 13.9, 35),
  grave('grave-b4', 14.9, -3.7, 10, 0.8),
  grave('grave-b5', 22.1, -0.2, -30),
  grave('grave-b6', 28.3, 2.2, 5, 1.1),
  grave('grave-b7', 31.3, 3.5, 50),
  tree('tree-b1', 16.5, 11.2),
  tree('tree-b2', 12.8, -5.4, 3.9),
  tree('tree-b3', 38, 7),
  // 北側の柵（途中の 2m は倒れている。脇道 side_roof の手がかり）
  ...[22, 24, 26, 28, 30, 34, 36].map((x, i): BlockProp => ({
    kind: 'block',
    id: `fence-b${i}`,
    style: 'fence',
    x: x + 1,
    z: 23,
    hx: 1,
    hz: 0.08,
    height: 1.1,
  })),
  // 霊廟（屋根の高さ 2.2m。脇道 side_roof）とその裏手の石段（1 段 0.275m × 8 段。プレイヤーの実効の自動乗り越えは 0.29m 程度なので、仕様の 0.3m × 7 段から変更）
  {
    kind: 'block',
    id: 'mausoleum',
    style: 'mausoleum',
    x: 29,
    z: 16,
    hx: 2,
    hz: 2,
    height: ROOF_H,
    baseY: ROOF_BASE,
    navSolid: true,
  },
  {
    kind: 'stairs',
    id: 'mausoleum-steps',
    x: 29,
    z: 21.6,
    yawDeg: 180,
    steps: 8,
    stepRise: ROOF_H / 8,
    stepRun: 0.45,
    width: 1.2,
    navSolid: true,
  },

  // --- C 崩れた礼拝堂（20m × 20m。入口は西の門・南の崩れ口・東の崩れ口の 3 か所） ---
  wallZ('chapel-w1', 40, 12, 14.5, WALL_H),
  wallZ('chapel-w2', 40, 19.5, 26, WALL_H),
  wallZ('chapel-w3', 40, 26, 32, 2),
  wallX('chapel-s1', 12, 40, 47.5, WALL_H),
  wallX('chapel-s2', 12, 53, 57, WALL_H),
  wallX('chapel-s3', 12, 57, 60, 1.6, 'rubble'),
  wallZ('chapel-e1', 60, 12, 24, WALL_H),
  wallZ('chapel-e2', 60, 30, 32, WALL_H),
  wallX('chapel-n', 32, 40, 60, 2.8),
  // 崩れた壁の瓦礫
  {
    kind: 'block',
    id: 'rubble-1',
    style: 'rubble',
    x: 46.6,
    z: 10.9,
    hx: 0.9,
    hz: 0.5,
    height: 0.9,
    yawDeg: 20,
  },
  {
    kind: 'block',
    id: 'rubble-2',
    style: 'rubble',
    x: 54.6,
    z: 10.6,
    hx: 0.7,
    hz: 0.6,
    height: 1.2,
    yawDeg: -35,
  },
  {
    kind: 'block',
    id: 'rubble-3',
    style: 'rubble',
    x: 61.6,
    z: 23.2,
    hx: 0.8,
    hz: 0.5,
    height: 0.8,
    yawDeg: 70,
  },
  // 祭壇・長椅子・柱
  {
    kind: 'block',
    id: 'altar',
    style: 'altar',
    x: 50,
    z: 26,
    hx: 2,
    hz: 0.6,
    height: 1.1,
    baseY: C_FLOOR,
  },
  ...[20, 22.5, 25].flatMap((z) => [pewRow(`pew-w-${z}`, 45, z), pewRow(`pew-e-${z}`, 55, z)]),
  { kind: 'cylinder', id: 'column-1', style: 'column', x: 46, z: 29.5, radius: 0.5, height: 3.2 },
  { kind: 'cylinder', id: 'column-2', style: 'column', x: 54, z: 29.5, radius: 0.5, height: 2.1 },
  // 礼拝堂の塔（高さ 18m のランドマーク。北西の外側）
  {
    kind: 'block',
    id: 'chapel-tower',
    style: 'tower',
    x: 44,
    z: 36,
    hx: 3,
    hz: 3,
    height: 18,
  },
  ...SIDE_PROPS,
  ...D_PROPS,
  ...E_PROPS,
  ...LANE_PROPS,
  ...F_PROPS,
];

const enemies: EnemySpawn[] = [
  // B
  {
    id: 'b-undead-1',
    type: 'undead_soldier',
    area: 'B',
    x: 22,
    z: 6,
    yaw: -Math.PI / 2,
    behavior: 'idle_back',
  },
  {
    id: 'b-undead-2',
    type: 'undead_soldier',
    area: 'B',
    x: 32,
    z: 12,
    yaw: Math.PI / 2,
    behavior: 'patrol',
    patrolRadius: 6,
  },
  // C
  {
    id: 'c-undead-1',
    type: 'undead_soldier',
    area: 'C',
    x: 46,
    z: 17,
    yaw: Math.PI,
    behavior: 'patrol',
    patrolRadius: 3,
  },
  {
    id: 'c-undead-2',
    type: 'undead_soldier',
    area: 'C',
    x: 50,
    z: 29,
    yaw: Math.PI,
    behavior: 'wait',
  },
  {
    id: 'c-shield-1',
    type: 'undead_shield',
    area: 'C',
    x: 50,
    z: 23.5,
    yaw: Math.PI,
    behavior: 'wait',
  },
  // D（通路奥の盾持ちと、L 字の角の窪みの石棺。石棺の亡者兵は半分進んだ時点で起き上がる: 別チケット）
  {
    id: 'd-shield-1',
    type: 'undead_shield',
    area: 'D',
    x: 74,
    z: 49,
    yaw: -Math.PI / 2,
    behavior: 'wait',
  },
  // 石棺の亡者兵（待ち伏せ）は起き上がりモーションと同時に別チケットで追加する（棺の上に直置きすると蓋の上に乗るため、ここでは置かない）。
  // E（噴水の周り）
  {
    id: 'e-undead-1',
    type: 'undead_soldier',
    area: 'E',
    x: 91,
    z: 56.5,
    yaw: -Math.PI / 2,
    behavior: 'wait',
  },
  {
    id: 'e-undead-2',
    type: 'undead_soldier',
    area: 'E',
    x: 97,
    z: 61,
    yaw: Math.PI / 2,
    behavior: 'patrol',
    patrolRadius: 3,
  },
  {
    id: 'e-shield-1',
    type: 'undead_shield',
    area: 'E',
    x: 94,
    z: 54.5,
    yaw: -Math.PI / 2,
    behavior: 'wait',
  },
];

const items: ItemSpawn[] = [{ id: 'flask-c', kind: 'flask_up', area: 'C', x: 54, z: 26.8 }];

const interactables: InteractableSpawn[] = [
  { id: 'bonfire', kind: 'bonfire', area: 'A', x: 0, z: 0 },
  { id: 'stele-a', kind: 'tablet', area: 'A', x: -4.6, z: 3.4 },
  // 鉄門 G1（78,32）とレバー（80,36）は中庭の外の通路上、霧の門（104,68）は中庭の北東の角
  { id: 'G1', kind: 'gate', area: null, x: 78, z: 32 },
  { id: 'lever-g1', kind: 'lever', area: null, x: 80, z: 36 },
  { id: 'fog-gate', kind: 'gate', area: 'E', x: 104, z: 68 },
];

const gates: GateDef[] = [
  // 鉄門: 中庭側（北）からだけレバーで開く。開く前は通路を塞ぐ。通り抜ける向き = 北北東（A 側 → 中庭側）
  {
    id: 'G1',
    kind: 'iron',
    x: G1_POS[0],
    z: G1_POS[1],
    yawDeg: (Math.atan2(G1_POS[0] - SHORTCUT_END[0], G1_POS[1] - SHORTCUT_END[1]) * 180) / Math.PI,
    width: 5.2,
    height: 3.6,
    blocking: true,
    leverId: 'lever-g1',
  },
  // 霧の門: 闘技場の口へ向かう北東向き。ボス戦中だけ塞ぐ（開始時は通れる）
  {
    id: 'fog-gate',
    kind: 'fog',
    x: 104,
    z: 68,
    yawDeg: 45,
    width: 4.4,
    height: 6,
    blocking: false,
  },
];

export const ASHEN_FOUNDATION: LevelData = {
  id: 'ashen-foundation',
  name: '灰の礎',
  bounds: { minX: -11, maxX: 141, minZ: -11, maxZ: 105 },
  perimeter: PERIMETER,
  terrain: {
    slopeX: 0.06,
    slopeZ: 0.03,
    hillAmplitude: 0.9,
    hillWavelength: 30,
    bumpAmplitude: 0.12,
    bumpWavelength: 3.5,
    routeBlend: 7,
    cliffHeight: 4,
    cliffWidth: 3,
    cellSize: 1,
    meshMargin: 8,
  },
  areas: [
    {
      id: 'A',
      name: '篝火「灰の炉」',
      shape: { type: 'circle', cx: 0, cz: 0, r: 8 },
      surface: 'stone',
      floor: { height: 0, margin: 0, blend: 8 },
    },
    {
      id: 'B',
      name: '墓地の小径',
      shape: { type: 'rect', minX: 10, maxX: 35, minZ: 0, maxZ: 15 },
      surface: 'grass',
    },
    {
      id: 'C',
      name: '崩れた礼拝堂',
      shape: { type: 'rect', minX: 40, maxX: 60, minZ: 12, maxZ: 32 },
      surface: 'stone',
      floor: { height: C_FLOOR, margin: 2, blend: 9 },
    },
    {
      id: 'D',
      name: '地下墓所',
      shape: { type: 'rect', minX: 60, maxX: 78, minZ: 36, maxZ: 52 },
      surface: 'underground',
      perimeterMargin: 0,
    },
    {
      id: 'E',
      name: '中庭',
      shape: { type: 'rect', minX: 84, maxX: 104, minZ: 48, maxZ: 68 },
      surface: 'stone',
      floor: { height: E_FLOOR, margin: 1, blend: 6 },
    },
    {
      id: 'F',
      name: '闘技場',
      shape: { type: 'circle', cx: 122, cz: 86, r: 16 },
      surface: 'stone',
      floor: { height: F_FLOOR, margin: 1, blend: 6 },
    },
  ],
  // メインルート: A → B（緩い上り）→ C の西の門。C の東の崩れ口から D の入口へ（空白区間 約 10m）
  route: [
    { x: 0, z: 0, height: 0, halfWidth: 5 },
    { x: 10, z: 0, height: 0, halfWidth: 4.5 },
    { x: 22, z: 6, height: 1.15, halfWidth: 4 },
    { x: 32, z: 12, height: 2.3, halfWidth: 5.5 },
    { x: 40, z: 17, height: C_FLOOR, halfWidth: 4.5 },
    { x: 52, z: 17, height: C_FLOOR, halfWidth: 3 },
    { x: 57.7, z: 17, height: C_FLOOR, halfWidth: 3 },
    { x: 58, z: 21, height: C_FLOOR, halfWidth: 3 },
    { x: 58.5, z: 27, height: C_FLOOR, halfWidth: 3 },
    { x: 61, z: 28, height: C_FLOOR, halfWidth: 3.5 },
    // D 地下墓所: 入口 (62,36) → 北へ → L 字の角 (62,48.5) → 東へ → 出口 (78,48.5)
    { x: 62, z: 36, height: 4.2, halfWidth: 2.5 },
    { x: 62, z: 48.5, height: 5, halfWidth: 2 },
    { x: 78, z: 48.5, height: 6.2, halfWidth: 2 },
    // E 中庭: 西の入口 → 噴水の南を回って北東の霧の門へ
    { x: 84, z: 51, height: E_FLOOR, halfWidth: 3 },
    { x: 91.5, z: 52.5, height: E_FLOOR, halfWidth: 3 },
    { x: 98.5, z: 56, height: E_FLOOR, halfWidth: 3 },
    { x: 102, z: 62, height: E_FLOOR, halfWidth: 2.5 },
    { x: 104, z: 68, height: E_FLOOR, halfWidth: 2.5 },
    // 霧の門 → F 闘技場へ（緩い上り）
    { x: 111, z: 75, height: F_FLOOR, halfWidth: 3 },
    { x: 118, z: 82, height: F_FLOOR, halfWidth: 3 },
  ],
  extraRoutes: [
    // ショートカット: 鉄門 G1（78,32）→ 北の道（レバー (80,36)）→ 中庭の西の入口 の、G1 から A への道
    [
      { x: 84, z: 51, height: E_FLOOR, halfWidth: 3 },
      { x: 80.5, z: 47, height: 6.5, halfWidth: 2.2 },
      { x: 80.2, z: 37, height: 5.6, halfWidth: 2.2 },
      { x: G1_POS[0], z: G1_POS[1], height: 5.5, halfWidth: 2.6 },
      { x: SHORTCUT_END[0], z: SHORTCUT_END[1], height: 4.2, halfWidth: 2.6 },
      { x: 34, z: -4.5, height: 1.7, halfWidth: 2.6 },
      { x: 8, z: -5, height: 0, halfWidth: 2.6 },
    ],
  ],
  sidePaths: SIDE_PATH_DEFS,
  guards: SIDE_GUARDS,
  gates,
  bonfire: { x: 0, z: 0 },
  playerSpawn: { x: 0, z: -2.4, yaw: 1.0 },
  props,
  enemies,
  items,
  interactables,
};
