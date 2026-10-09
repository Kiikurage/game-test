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
  PropSpec,
} from './level';

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
  // 霊廟（屋根の高さ 2.2m。脇道 side_roof）とその裏手の石段（1 段 0.314m × 7 段）
  {
    kind: 'block',
    id: 'mausoleum',
    style: 'mausoleum',
    x: 29,
    z: 16,
    hx: 2,
    hz: 2,
    height: 2.2,
    baseY: 2.78,
  },
  {
    kind: 'stairs',
    id: 'mausoleum-steps',
    x: 29,
    z: 21.2,
    yawDeg: 180,
    steps: 7,
    stepRise: 2.2 / 7,
    stepRun: 0.45,
    width: 1.2,
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
  gates,
  bonfire: { x: 0, z: 0 },
  playerSpawn: { x: 0, z: -2.4, yaw: 1.0 },
  props,
  enemies,
  items,
  interactables,
};
