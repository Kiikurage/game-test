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
  InteractableSpawn,
  ItemSpawn,
  LevelData,
  PropSpec,
} from './level';

/** 礼拝堂の床の高さ（m）。B の道は篝火の高さ 0 からここまで緩く上る。 */
const C_FLOOR = 3.4;
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
];

const items: ItemSpawn[] = [{ id: 'flask-c', kind: 'flask_up', area: 'C', x: 54, z: 26.8 }];

const interactables: InteractableSpawn[] = [
  { id: 'bonfire', kind: 'bonfire', area: 'A', x: 0, z: 0 },
  { id: 'stele-a', kind: 'tablet', area: 'A', x: -4.6, z: 3.4 },
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
      floor: { height: 7.4, margin: 1, blend: 6 },
    },
    {
      id: 'F',
      name: '闘技場',
      shape: { type: 'circle', cx: 122, cz: 86, r: 16 },
      surface: 'stone',
      floor: { height: 9.9, margin: 1, blend: 6 },
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
    { x: 62, z: 38, height: 4, halfWidth: 4 },
  ],
  bonfire: { x: 0, z: 0 },
  playerSpawn: { x: 0, z: -2.4, yaw: 1.0 },
  props,
  enemies,
  items,
  interactables,
};
