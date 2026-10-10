import {
  CircleGeometry,
  Group,
  Mesh,
  MeshStandardNodeMaterial,
  type BufferGeometry,
  type Material,
} from 'three/webgpu';
import { color, float, mix, mx_noise_float, positionWorld, time, vec3, vec4 } from 'three/tsl';
import type { Level, PlacedBox, PlacedCylinder } from '../../game/world/level';
import { createMetalMaterial } from '../levelMaterials';
import {
  D_BAND_HEIGHTS,
  D_NICHES,
  D_TORCHES,
  D_WEBS,
  E_TORCHES,
  isMasonryProp,
  type WallMount,
} from './cryptLayout';
import { FxBuilder, createFlameMaterial, createWebMaterial } from './glowMaterials';
import { MasonryBuilder, hashSeed, type Vec3 } from './masonryGeometry';
import { createMasonryMaterial } from './masonryMaterial';
import { PropBuilder } from './propBuilder';

const DEG = Math.PI / 180;

/** 地下墓所は冷たく暗い石、中庭は夕日を受ける温かい砂岩。 */
const TINT_D: Vec3 = [0.19, 0.2, 0.235];
const TINT_E: Vec3 = [0.3, 0.27, 0.22];

const IRON: Vec3 = [0.045, 0.042, 0.04];
const RUST: Vec3 = [0.1, 0.055, 0.035];
const WOOD: Vec3 = [0.07, 0.045, 0.03];
const COAL: Vec3 = [0.03, 0.025, 0.022];

/** 描画で公開する可動パーツ（開閉・蓋・レバーの動作は別チケット側が回す）。 */
export interface CryptProps {
  readonly root: Group;
  /**
   * 石棺の蓋。`pivot` は蓋の中心（閉じた位置）にあり、`pivot.position` / `pivot.rotation` を動かすと蓋だけが動く。
   * 閉じた状態は `closed`（position / rotation.y のコピー）。起き上がり演出は `closed.y + 0.25 〜 0.5` ずらして横へずらす想定。
   */
  readonly sarcophagusLid: {
    readonly pivot: Group;
    readonly closed: { x: number; y: number; z: number; rotationY: number };
  } | null;
  /**
   * 鉄門 G1 の 2 枚の扉。`pivot` は蝶番の位置（足元）にあり、`rotation.y` を `closedRotationY` から
   * `closedRotationY + openDelta`（約 ±90°。北＝中庭側へ開く）へ回すと開く。持ち上げるなら `position.y` を動かす。
   */
  readonly gateLeaves: readonly {
    readonly pivot: Group;
    readonly closedRotationY: number;
    readonly openDelta: number;
  }[];
  /** レバーの持ち手。`pivot.rotation.z` を `closedRotationZ`（引く前）→ `openRotationZ`（引いた後）へ。 */
  readonly leverHandle: {
    readonly pivot: Group;
    readonly closedRotationZ: number;
    readonly openRotationZ: number;
  } | null;
  readonly stats: { readonly triangles: number; readonly meshes: number };
}

interface Frame {
  /** 壁表面の点（地面の高さは含まない）。 */
  x: number;
  z: number;
  nx: number;
  nz: number;
  /** 接線（法線を左へ 90°）。 */
  tx: number;
  tz: number;
  yaw: number;
}

function frameOf(m: { x: number; z: number; nx: number; nz: number }): Frame {
  return { x: m.x, z: m.z, nx: m.nx, nz: m.nz, tx: m.nz, tz: -m.nx, yaw: Math.atan2(m.nx, m.nz) };
}

type Area = 'D' | 'E';

interface Parts {
  readonly masonry: MasonryBuilder;
  readonly props: PropBuilder;
  readonly flames: FxBuilder;
  readonly webs: FxBuilder;
  readonly torchLights: [number, number, number, number][];
  readonly tint: Vec3;
}

export function buildCrypt(level: Level, detail: 0 | 1 | 2): CryptProps {
  const ground = (x: number, z: number): number => level.heightAt(x, z);
  const parts: Record<Area, Parts> = {
    D: makeParts(ground, TINT_D),
    E: makeParts(ground, TINT_E),
  };
  const areaOf = (x: number): Area => (x >= 83 ? 'E' : 'D');
  const extras = new Group();
  extras.name = 'crypt-extras';
  // G1 の路地（lane-*）とその門・レバー（D・E とは別のマテリアル = たいまつなし。ドローコール節約のため 1 メッシュ）
  const lane = new MasonryBuilder(ground);

  // --- 壁・瓦礫・柱・噴水 ---
  const boxes = new Map<string, PlacedBox>(level.boxes.map((b) => [b.id, b]));
  // 見える高さ（上面 - 地面）。コライダの箱は地形へ埋め込まれているので `box.hy * 2` ではない
  const propHeight = new Map<string, number>();
  for (const prop of level.data.props)
    if (prop.kind === 'block') propHeight.set(prop.id, prop.height);
  for (const box of level.boxes) {
    if (!isMasonryProp(box.id)) continue;
    if (box.id.startsWith('lane-')) {
      lane.addBox({
        x: box.x,
        y: box.y,
        z: box.z,
        hx: box.hx,
        hy: box.hy,
        hz: box.hz,
        yaw: (box.yawDeg ?? 0) * DEG,
        tint: TINT_D,
        cell: 0.5,
      });
      continue;
    }
    const p = parts[areaOf(box.x)];
    if (box.id === 'd-sarcophagus') continue;
    if (box.style === 'rubble') {
      addRubblePile(p.masonry, box, propHeight.get(box.id) ?? box.hy);
      continue;
    }
    const ruin = box.id.startsWith('e-wall') ? 0.55 : 0;
    p.masonry.addBox({
      x: box.x,
      y: box.y,
      z: box.z,
      hx: box.hx,
      hy: box.hy,
      hz: box.hz,
      yaw: (box.yawDeg ?? 0) * DEG,
      tint: p.tint,
      ruin,
      cell: 0.5,
    });
  }
  for (const cyl of level.cylinders) {
    if (!isMasonryProp(cyl.id)) continue;
    const p = parts[areaOf(cyl.x)];
    if (cyl.style === 'fountain') addFountain(p.masonry, cyl, extras);
    else addColumn(p.masonry, cyl, p.tint);
  }

  // --- 地下墓所: 台座・持ち送りの帯、壁龕、たいまつ、蜘蛛の巣 ---
  const dFaces: readonly (readonly [number, number, number, number, number, number])[] = [
    // [x0, z0, x1, z1, nx, nz]
    [60.75, 35.6, 60.75, 52.7, 1, 0],
    [63.25, 35.6, 63.25, 47.25, -1, 0],
    [63.25, 49.75, 63.25, 52.7, -1, 0],
    [63.25, 47.25, 78.5, 47.25, 0, 1],
    [63.25, 49.75, 78.5, 49.75, 0, -1],
    [60.75, 52.75, 63.25, 52.75, 0, -1],
  ];
  for (const [x0, z0, x1, z1, nx, nz] of dFaces) {
    // 通路の床は傾いているので、帯は水平（ワールドの一定の高さ）にして石積みの段と平行にする
    const m = parts.D.masonry;
    bandAt(m, [x0, z0], [x1, z1], [nx, nz], D_BAND_HEIGHTS.impost, 0.2, 0.13, TINT_D);
    bandAt(m, [x0, z0], [x1, z1], [nx, nz], D_BAND_HEIGHTS.impost + 0.2, 0.1, 0.07, TINT_D);
  }
  for (const [x0, z0, x1, z1, nx, nz] of dFaces) {
    addDebris(parts.D.masonry, ground, [x0, z0], [x1, z1], [nx, nz], 0.35, 0.18, 'D', TINT_D);
  }
  for (const n of D_NICHES) addNiche(parts.D.masonry, ground, frameOf(n));
  D_TORCHES.forEach((t, i) => {
    addTorch(parts.D, ground, frameOf(t), i, 2.5);
  });
  for (const w of D_WEBS) addWeb(parts.D.webs, ground, w);

  // --- 中庭: 台座の帯、控え壁、たいまつ ---
  const eFaces: readonly (readonly [number, number, number, number, number, number])[] = [
    [84.35, 54, 84.35, 68, 1, 0],
    [84, 48.35, 92, 48.35, 0, 1],
    [96, 48.35, 104, 48.35, 0, 1],
    [103.65, 48.3, 103.65, 64.5, -1, 0],
    [84, 67.65, 100.8, 67.65, 0, -1],
  ];
  for (const [x0, z0, x1, z1, nx, nz] of eFaces) {
    const m = parts.E.masonry;
    strip(m, ground, [x0, z0], [x1, z1], [nx, nz], 0, 0.5, 0.1, TINT_E);
    addPilasters(m, ground, [x0, z0], [x1, z1], [nx, nz], E_TORCHES, boxes);
    addDebris(m, ground, [x0, z0], [x1, z1], [nx, nz], 1.1, 0.5, 'E', TINT_E);
  }
  E_TORCHES.forEach((t, i) => {
    addTorch(parts.E, ground, frameOf(t), i + 7, 1.7);
  });

  const materials: Record<Area, Material> = {
    D: createMasonryMaterial({ detail, torches: parts.D.torchLights }),
    E: createMasonryMaterial({ detail, torches: parts.E.torchLights }),
  };
  const metal = createMetalMaterial();

  // --- 石棺（蓋は別メッシュ + ピボット）---
  const lid = addSarcophagus(
    parts.D.masonry,
    boxes.get('d-sarcophagus'),
    propHeight.get('d-sarcophagus') ?? 0.75,
    ground,
    materials.D,
    extras,
  );

  // --- 鉄門 G1・レバー ---
  const gate = addGateAndLever(level, lane, extras, metal);

  // --- メッシュ化 ---
  const root = new Group();
  root.name = 'crypt';
  let triangles = 0;
  let meshes = 0;
  const addMesh = (
    geometry: BufferGeometry | null,
    material: Material,
    name: string,
    cast: boolean,
    receive: boolean,
    into: Group = root,
  ): Mesh | null => {
    if (!geometry) return null;
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    into.add(mesh);
    triangles += (geometry.index ? geometry.index.count : 0) / 3;
    meshes++;
    return mesh;
  };
  const laneMaterial = createMasonryMaterial({ detail, torches: [] });
  addMesh(lane.build(), laneMaterial, 'env:crypt:lane', true, true);
  const flameMaterial = createFlameMaterial();
  const webMaterial = createWebMaterial();
  for (const area of ['D', 'E'] as const) {
    const p = parts[area];
    addMesh(p.masonry.build(), materials[area], `env:crypt:${area}`, true, true);
    addMesh(p.props.build(), metal, `env:crypt-props:${area}`, false, true);
    const flames = addMesh(p.flames.build(), flameMaterial, `env:crypt-glow:${area}`, false, false);
    if (flames) flames.renderOrder = 2;
    const web = addMesh(p.webs.build(), webMaterial, `env:crypt-web:${area}`, false, false);
    if (web) web.renderOrder = 1;
  }
  root.add(extras);
  extras.traverse((o) => {
    const mesh = o as Mesh;
    if ((mesh as { isMesh?: boolean }).isMesh === true) {
      const g = mesh.geometry;
      triangles += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
      meshes++;
    }
  });
  return {
    root,
    sarcophagusLid: lid,
    gateLeaves: gate?.leaves ?? [],
    leverHandle: gate?.lever ?? null,
    stats: { triangles, meshes },
  };
}

function makeParts(ground: (x: number, z: number) => number, tint: Vec3): Parts {
  return {
    masonry: new MasonryBuilder(ground),
    props: new PropBuilder(),
    flames: new FxBuilder(),
    webs: new FxBuilder(),
    torchLights: [],
    tint,
  };
}

// ---------------------------------------------------------------------------
// 壁に沿った帯

/** 水平な帯（ワールドの高さ `yBottom` から `height`）。壁面に沿って 1 本の箱。 */
function bandAt(
  m: MasonryBuilder,
  a: readonly [number, number],
  b: readonly [number, number],
  n: readonly [number, number],
  yBottom: number,
  height: number,
  protrude: number,
  tint: Vec3,
): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / len;
  const dz = (b[1] - a[1]) / len;
  m.addBox({
    x: (a[0] + b[0]) / 2 + n[0] * protrude * 0.5,
    y: yBottom + height / 2,
    z: (a[1] + b[1]) / 2 + n[1] * protrude * 0.5,
    hx: protrude / 2,
    hy: height / 2,
    hz: len / 2,
    yaw: Math.atan2(dx, dz),
    tint,
    cell: 0.8,
  });
}

/**
 * 壁面に沿う帯（台座）。地面の傾きに合わせて短い箱へ分け、傾ける。
 * `yOff` は地面からの下端の高さ、`protrude` は壁面からの張り出し（`MAX_PROTRUSION` 以下）。
 */
function strip(
  m: MasonryBuilder,
  ground: (x: number, z: number) => number,
  a: readonly [number, number],
  b: readonly [number, number],
  n: readonly [number, number],
  yOff: number,
  height: number,
  protrude: number,
  tint: Vec3,
): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const pieces = Math.max(1, Math.ceil(len / 1.6));
  const dx = (b[0] - a[0]) / len;
  const dz = (b[1] - a[1]) / len;
  const yaw = Math.atan2(dx, dz); // 長さ方向 = ローカル z
  // 地面の細かな凹凸には追従せず、面の両端の高さを結ぶ直線を基準にする（帯が段々にならない）
  const gA = ground(a[0] + n[0] * 0.3, a[1] + n[1] * 0.3);
  const gB = ground(b[0] + n[0] * 0.3, b[1] + n[1] * 0.3);
  const sink = yOff === 0 ? 0.3 : 0;
  for (let i = 0; i < pieces; i++) {
    const s0 = (i / pieces) * len;
    const s1 = ((i + 1) / pieces) * len;
    const run = s1 - s0;
    const y0 = gA + ((gB - gA) * s0) / len + yOff - sink;
    const y1 = gA + ((gB - gA) * s1) / len + yOff - sink;
    const h = height + sink;
    m.addBox({
      x: a[0] + dx * ((s0 + s1) / 2) + n[0] * protrude * 0.5,
      y: (y0 + y1) / 2 + h / 2,
      z: a[1] + dz * ((s0 + s1) / 2) + n[1] * protrude * 0.5,
      hx: protrude / 2,
      hy: h / 2,
      hz: run / 2 + 0.02,
      yaw,
      tiltX: -Math.atan2(y1 - y0, run),
      tint,
      cell: 0.8,
    });
  }
}

/** 中庭の壁の控え壁（壁面から 0.2m 張り出す柱型）。たいまつの位置を避けて等間隔。 */
function addPilasters(
  m: MasonryBuilder,
  ground: (x: number, z: number) => number,
  a: readonly [number, number],
  b: readonly [number, number],
  n: readonly [number, number],
  torches: readonly WallMount[],
  boxes: ReadonlyMap<string, PlacedBox>,
): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / len;
  const dz = (b[1] - a[1]) / len;
  const yaw = Math.atan2(n[0], n[1]);
  const top = boxes.get('e-wall-w');
  const wallTop = top ? top.y + top.hy : 10;
  for (let s = 1.4; s < len - 0.6; s += 4.3) {
    const x = a[0] + dx * s;
    const z = a[1] + dz * s;
    if (torches.some((t) => Math.hypot(t.x - x, t.z - z) < 1.3)) continue;
    const gy = ground(x, z);
    const h = hashSeed(`${x.toFixed(1)}:${z.toFixed(1)}`);
    const height = wallTop - gy - 0.35 - h * 0.7;
    m.addBox({
      x: x + n[0] * 0.1,
      y: gy + height / 2 - 0.05,
      z: z + n[1] * 0.1,
      hx: 0.26,
      hy: height / 2 + 0.05,
      hz: 0.1,
      yaw,
      tint: TINT_E,
      ruin: 0.25,
      cell: 0.26,
    });
  }
}

/** 壁際に落ちた石の欠片（低く小さい。見た目だけで、足を取らない高さ）。 */
function addDebris(
  m: MasonryBuilder,
  ground: (x: number, z: number) => number,
  a: readonly [number, number],
  b: readonly [number, number],
  n: readonly [number, number],
  reach: number,
  perMeter: number,
  tag: string,
  tint: Vec3,
): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / len;
  const dz = (b[1] - a[1]) / len;
  const count = Math.round(len * perMeter);
  for (let i = 0; i < count; i++) {
    const key = `${tag}:${a[0]},${a[1]}:${i}`;
    const s = 0.4 + hashSeed(`${key}:s`) * (len - 0.8);
    const off = 0.12 + hashSeed(`${key}:o`) * reach;
    const size = 0.07 + hashSeed(`${key}:z`) * 0.1;
    const x = a[0] + dx * s + n[0] * off;
    const z = a[1] + dz * s + n[1] * off;
    m.addBox({
      x,
      y: ground(x, z) + size * 0.55,
      z,
      hx: size * (1 + hashSeed(`${key}:x`) * 0.8),
      hy: size * 0.6,
      hz: size * (0.8 + hashSeed(`${key}:y`) * 0.7),
      yaw: hashSeed(`${key}:r`) * 6.28,
      tiltX: (hashSeed(`${key}:t`) - 0.5) * 0.5,
      tiltZ: (hashSeed(`${key}:u`) - 0.5) * 0.5,
      tint,
      scatter: true,
      cell: 0.4,
    });
  }
}

// ---------------------------------------------------------------------------
// 壁龕・たいまつ・蜘蛛の巣

function wallBox(
  m: MasonryBuilder,
  f: Frame,
  along: number,
  gy: number,
  y: number,
  halfAlong: number,
  halfY: number,
  protrude: number,
  tint: Vec3,
  cell = 0.5,
): void {
  m.addBox({
    x: f.x + f.tx * along + f.nx * protrude * 0.5,
    y: gy + y,
    z: f.z + f.tz * along + f.nz * protrude * 0.5,
    hx: halfAlong,
    hy: halfY,
    hz: protrude * 0.5,
    yaw: f.yaw,
    tint,
    cell,
  });
}

/** 壁龕: 縁取りと暗い奥。下の段には棺の小口が少し突き出す。 */
function addNiche(m: MasonryBuilder, ground: (x: number, z: number) => number, f: Frame): void {
  const gy = ground(f.x + f.nx * 0.3, f.z + f.nz * 0.3);
  const seed = hashSeed(`${f.x},${f.z}`);
  const width = 1.0;
  const rows: readonly (readonly [number, number])[] = [
    [0.62, 0.62],
    [1.5, 0.6],
  ];
  rows.forEach(([y0, h], row) => {
    const mid = y0 + h / 2;
    // 暗い奥（壁面より少し手前に貼る）
    wallBox(m, f, 0, gy, mid, width / 2, h / 2, 0.025, [0.02, 0.02, 0.026], 0.5);
    // 縁取り
    wallBox(m, f, 0, gy, y0 - 0.05, width / 2 + 0.14, 0.05, 0.14, TINT_D);
    wallBox(m, f, 0, gy, y0 + h + 0.06, width / 2 + 0.14, 0.06, 0.14, TINT_D);
    wallBox(m, f, -(width / 2 + 0.07), gy, mid, 0.07, h / 2 + 0.05, 0.12, TINT_D);
    wallBox(m, f, width / 2 + 0.07, gy, mid, 0.07, h / 2 + 0.05, 0.12, TINT_D);
    // 棺の小口（段ごとに出入りがある）
    const has = row === 0 ? seed > 0.2 : seed > 0.55;
    if (has) {
      const out = 0.22 + hashSeed(`${f.x},${f.z},${row}`) * 0.12;
      wallBox(m, f, 0, gy, y0 + 0.2, width / 2 - 0.1, 0.17, out, TINT_D, 0.3);
      wallBox(m, f, 0, gy, y0 + 0.4, width / 2 - 0.06, 0.04, out + 0.04, TINT_D, 0.3);
    }
  });
}

/** たいまつ 1 本: 鉄の取り付け具と木の柄、炎、壁と床の光だまり。ライトは足さず、石積みマテリアルへ光源として渡す。 */
function addTorch(
  p: Parts,
  ground: (x: number, z: number) => number,
  f: Frame,
  index: number,
  intensity: number,
): void {
  const gy = ground(f.x + f.nx * 0.5, f.z + f.nz * 0.5);
  const y = gy + 1.85;
  const at = (n: number, t: number, up: number): [number, number, number] => [
    f.x + f.nx * n + f.tx * t,
    y + up,
    f.z + f.nz * n + f.tz * t,
  ];
  const rot = { yaw: f.yaw };
  p.props.box(at(0.03, 0, 0), [0.07, 0.17, 0.03], IRON, rot);
  p.props.box(at(0.17, 0, -0.02), [0.022, 0.022, 0.16], IRON, rot);
  p.props.cylinder(at(0.31, 0, 0.02), 0.085, 0.055, 0.15, IRON, rot, 10);
  p.props.cylinder(at(0.36, 0, 0.3), 0.04, 0.034, 0.58, WOOD, { yaw: f.yaw, tiltX: 0.16 }, 7);
  p.props.cylinder(at(0.4, 0, 0.62), 0.085, 0.05, 0.15, COAL, { yaw: f.yaw, tiltX: 0.16 }, 8);
  const phase = hashSeed(index * 3.7);
  const head = at(0.43, 0, 0.72);
  const w = 0.42;
  const hgt = 0.7;
  // 炎: 交差した 2 枚
  p.flames.quad(
    [head[0] - f.tx * (w / 2), head[1] - 0.04, head[2] - f.tz * (w / 2)],
    [head[0] + f.tx * (w / 2), head[1] - 0.04, head[2] + f.tz * (w / 2)],
    [head[0] - f.tx * (w / 2), head[1] - 0.04 + hgt, head[2] - f.tz * (w / 2)],
    0,
    phase,
    1,
  );
  p.flames.quad(
    [head[0] - f.nx * (w / 2), head[1] - 0.04, head[2] - f.nz * (w / 2)],
    [head[0] + f.nx * (w / 2), head[1] - 0.04, head[2] + f.nz * (w / 2)],
    [head[0] - f.nx * (w / 2), head[1] - 0.04 + hgt, head[2] - f.nz * (w / 2)],
    0,
    phase,
    1,
  );
  // 壁の光だまり
  const S = 4.2;
  const wc = at(0.045, 0, 0.55);
  p.flames.quad(
    [wc[0] - f.tx * (S / 2), wc[1] - S / 2, wc[2] - f.tz * (S / 2)],
    [wc[0] + f.tx * (S / 2), wc[1] - S / 2, wc[2] + f.tz * (S / 2)],
    [wc[0] - f.tx * (S / 2), wc[1] + S / 2, wc[2] - f.tz * (S / 2)],
    1,
    phase,
    0.5 * (intensity / 2.5),
  );
  // 床の光だまり
  const fx = f.x + f.nx * 1.0;
  const fz = f.z + f.nz * 1.0;
  const R = 3.6;
  const fy = ground(fx, fz) + 0.05;
  p.flames.quad(
    [fx - R / 2, fy, fz - R / 2],
    [fx + R / 2, fy, fz - R / 2],
    [fx - R / 2, fy, fz + R / 2],
    1,
    phase,
    0.36 * (intensity / 2.5),
  );
  p.torchLights.push([head[0], head[1] + 0.2, head[2], intensity]);
}

/** 蜘蛛の巣: 壁面に沿う扇形（apex から「真下」と「壁に沿った水平方向」の間）。 */
function addWeb(
  fx: FxBuilder,
  ground: (x: number, z: number) => number,
  w: {
    x: number;
    z: number;
    nx: number;
    nz: number;
    y: number;
    ax: number;
    az: number;
    radius: number;
  },
): void {
  const gy = ground(w.x + w.nx * 0.3, w.z + w.nz * 0.3);
  fx.webSector(
    [w.x + w.nx * 0.03, gy + w.y, w.z + w.nz * 0.03],
    [0, -1, 0],
    [w.ax, 0, w.az],
    w.radius,
  );
}

// ---------------------------------------------------------------------------
// 瓦礫・柱・噴水・石棺

function addRubblePile(m: MasonryBuilder, box: PlacedBox, height: number): void {
  const yaw = (box.yawDeg ?? 0) * DEG;
  const top = box.y + box.hy;
  // コライダの箱は地形へ埋め込まれているので、上面（= 見える高さ）から height だけ下を地面にする
  const bottom = top - height;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const r1 = hashSeed(`${box.id}:${i}:a`);
    const r2 = hashSeed(`${box.id}:${i}:b`);
    const r3 = hashSeed(`${box.id}:${i}:c`);
    const lx = (r1 * 2 - 1) * (box.hx - 0.2);
    const lz = (r2 * 2 - 1) * (box.hz - 0.15);
    // 中心ほど高く積む
    const hump = 1 - Math.min(1, Math.hypot(lx / box.hx, lz / box.hz));
    const size = 0.2 + r3 * 0.22;
    const cy = bottom + size * 0.6 + hump * (height - size * 1.4) * (0.55 + r3 * 0.45);
    const wx = box.x + lx * Math.cos(yaw) + lz * Math.sin(yaw);
    const wz = box.z - lx * Math.sin(yaw) + lz * Math.cos(yaw);
    m.addBox({
      x: wx,
      y: Math.min(cy, top - size * 0.5),
      z: wz,
      hx: size * (0.8 + r1 * 0.5),
      hy: size * 0.55,
      hz: size * (0.7 + r2 * 0.5),
      yaw: r1 * 6.28,
      tiltX: (r2 - 0.5) * 0.7,
      tiltZ: (r3 - 0.5) * 0.7,
      tint: TINT_E,
      scatter: true,
      cell: 0.5,
    });
  }
}

function addColumn(m: MasonryBuilder, cyl: PlacedCylinder, tint: Vec3): void {
  const r = cyl.radius;
  // コライダの底は床より 0.3m 下（`environmentLayout.layoutCylinder` と同じ）。床から見える高さ = height - 0.3
  const gy = cyl.y + 0.3;
  const visible = cyl.height - 0.3;
  const intact = visible >= 2.6;
  m.addBox({
    x: cyl.x,
    y: gy + 0.11,
    z: cyl.z,
    hx: r * 1.5,
    hy: 0.15,
    hz: r * 1.5,
    yaw: hashSeed(cyl.id) * 3,
    tint,
    cell: 0.5,
  });
  const capH = intact ? 0.32 : 0;
  m.addDrum({
    x: cyl.x,
    y: gy + 0.24,
    z: cyl.z,
    rBottom: r * 1.0,
    rTop: r * 0.9,
    height: visible - 0.24 - capH,
    tint,
    topJitter: intact ? 0 : 0.4,
    segments: 14,
  });
  if (intact) {
    m.addBox({
      x: cyl.x,
      y: gy + visible - 0.16,
      z: cyl.z,
      hx: r * 1.45,
      hy: 0.16,
      hz: r * 1.45,
      yaw: hashSeed(cyl.id) * 3,
      tint,
      cell: 0.5,
    });
  } else {
    // 折れた先の欠片が根元に転がる（見た目だけ。低くて足を取らない）
    for (let i = 0; i < 2; i++) {
      const a = hashSeed(`${cyl.id}:f${i}`) * 6.28;
      m.addBox({
        x: cyl.x + Math.cos(a) * (r + 0.4),
        y: gy + 0.12,
        z: cyl.z + Math.sin(a) * (r + 0.4),
        hx: 0.3,
        hy: 0.12,
        hz: 0.22,
        yaw: a,
        tiltZ: 0.12,
        tint,
        scatter: true,
        cell: 0.3,
      });
    }
  }
}

function addFountain(m: MasonryBuilder, cyl: PlacedCylinder, extras: Group): void {
  const R = cyl.radius;
  const gy = cyl.y + 0.3;
  // 床から見える高さ（コライダ height - 0.3）に合わせて縦を縮める（基準は rim 上面 1.2m）
  const k = (cyl.height - 0.3) / 1.2;
  // 入口（西）側に崩れ口
  const gapAngle = Math.atan2(51 - cyl.z, 84 - cyl.x);
  m.addLathe({
    x: cyl.x,
    y: gy,
    z: cyl.z,
    profile: [
      [R + 0.12, 0],
      [R + 0.12, 0.3 * k],
      [R, 0.3 * k],
      [R, 1.05 * k],
      [R + 0.06, 1.05 * k],
      [R + 0.06, 1.2 * k],
      [R - 0.42, 1.2 * k],
      [R - 0.42, 0.5 * k],
      [0.5, 0.5 * k],
    ],
    tint: TINT_E,
    segments: 32,
    gap: { angle: gapAngle, width: 1.3, height: 0.74 * k },
  });
  // 中央の台座と、折れた柱
  m.addDrum({
    x: cyl.x,
    y: gy + 0.5 * k,
    z: cyl.z,
    rBottom: 0.56,
    rTop: 0.46,
    height: 0.62 * k,
    tint: TINT_E,
    segments: 16,
  });
  m.addDrum({
    x: cyl.x,
    y: gy + 1.12 * k,
    z: cyl.z,
    rBottom: 0.3,
    rTop: 0.26,
    height: 0.95 * k,
    tint: TINT_E,
    topJitter: 0.4,
    segments: 12,
  });
  // 水盤の底に沈んだ欠片
  m.addBox({
    x: cyl.x + 0.95,
    y: gy + 0.6 * k,
    z: cyl.z + 0.4,
    hx: 0.34,
    hy: 0.1,
    hz: 0.24,
    yaw: 0.8,
    tiltZ: 0.15,
    tint: TINT_E,
    scatter: true,
    cell: 0.3,
  });
  // 淀んだ水面
  const water = new MeshStandardNodeMaterial({ roughness: 0.1, metalness: 0 });
  const ripple = mx_noise_float(
    vec3(positionWorld.x.mul(3), positionWorld.z.mul(3), time.mul(0.35)),
  );
  const tone = mix(color(0x1c3330), color(0x3b5a48), ripple.mul(0.5).add(0.5));
  water.colorNode = vec4(tone, 1);
  // 空を映す代わりに、弱い自己発光で水面が真っ黒にならないようにする
  water.emissiveNode = tone.mul(0.22);
  water.roughnessNode = float(0.12).add(ripple.mul(0.05));
  const surface = new Mesh(new CircleGeometry(R - 0.4, 32), water);
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(cyl.x, gy + 0.72 * k, cyl.z);
  surface.name = 'env:crypt-water';
  surface.receiveShadow = true;
  extras.add(surface);
}

/** 石棺: 台座と身は他の石積みと同じメッシュ、蓋だけ別メッシュ（`Group` のピボットで動かせる）。 */
function addSarcophagus(
  m: MasonryBuilder,
  box: PlacedBox | undefined,
  height: number,
  ground: (x: number, z: number) => number,
  material: Material,
  extras: Group,
): NonNullable<CryptProps['sarcophagusLid']> | null {
  if (!box) return null;
  const base = box.y + box.hy - height;
  const yaw = (box.yawDeg ?? 0) * DEG;
  const tint = TINT_D;
  const common = { x: box.x, z: box.z, yaw, tint } as const;
  m.addBox({ ...common, y: base + 0.06, hx: box.hx, hy: 0.06, hz: box.hz, cell: 0.5 });
  m.addBox({
    ...common,
    y: base + 0.27,
    hx: box.hx - 0.08,
    hy: 0.15,
    hz: box.hz - 0.07,
    cell: 0.4,
  });
  m.addBox({
    ...common,
    y: base + 0.445,
    hx: box.hx - 0.03,
    hy: 0.025,
    hz: box.hz - 0.02,
    cell: 0.5,
  });

  // 蓋（ローカル座標でピボット = 蓋の中心・下面）
  const pivotY = base + 0.47;
  const lidBuilder = new MasonryBuilder(ground);
  const lc = { x: box.x, z: box.z, yaw, tint } as const;
  lidBuilder.addBox({
    ...lc,
    y: pivotY + 0.08,
    hx: box.hx - 0.02,
    hy: 0.08,
    hz: box.hz - 0.01,
    cell: 0.5,
  });
  lidBuilder.addBox({
    ...lc,
    y: pivotY + 0.19,
    hx: box.hx - 0.2,
    hy: 0.035,
    hz: box.hz - 0.13,
    cell: 0.5,
  });
  // 浮き彫りの十字
  lidBuilder.addBox({ ...lc, y: pivotY + 0.245, hx: 0.05, hy: 0.02, hz: 0.55, cell: 0.4 });
  lidBuilder.addBox({ ...lc, y: pivotY + 0.245, hx: 0.3, hy: 0.02, hz: 0.05, cell: 0.4 });
  const geometry = lidBuilder.build();
  geometry.translate(-box.x, -pivotY, -box.z);
  const pivot = new Group();
  pivot.name = 'sarcophagus-lid:d-sarcophagus';
  pivot.position.set(box.x, pivotY, box.z);
  pivot.rotation.y = 0;
  const lidMesh = new Mesh(geometry, material);
  lidMesh.name = 'env:crypt:lid';
  lidMesh.castShadow = true;
  lidMesh.receiveShadow = true;
  pivot.add(lidMesh);
  extras.add(pivot);
  return { pivot, closed: { x: box.x, y: pivotY, z: box.z, rotationY: 0 } };
}

// ---------------------------------------------------------------------------
// 鉄門 G1 とレバー

interface GateResult {
  readonly leaves: CryptProps['gateLeaves'];
  readonly lever: CryptProps['leverHandle'];
}

function addGateAndLever(
  level: Level,
  lane: MasonryBuilder,
  extras: Group,
  metal: Material,
): GateResult | null {
  const g = level.gates.find((p) => p.def.id === 'G1');
  if (!g) return null;
  const { def } = g;
  const yaw = def.yawDeg * DEG;
  const nx = Math.sin(yaw);
  const nz = Math.cos(yaw);
  const tx = Math.cos(yaw);
  const tz = -Math.sin(yaw);
  const gy = g.y;
  const half = def.width / 2;
  const m = lane;
  const pos = (along: number, fwd = 0): [number, number] => [
    def.x + tx * along + nx * fwd,
    def.z + tz * along + nz * fwd,
  ];

  // 石の門柱と楣
  for (const side of [-1, 1] as const) {
    const [px, pz] = pos(side * (half + 0.3));
    m.addBox({
      x: px,
      y: gy + 2.15,
      z: pz,
      hx: 0.4,
      hy: 2.25,
      hz: 0.46,
      yaw,
      tint: TINT_D,
      cell: 0.5,
    });
    m.addBox({
      x: px,
      y: gy + 4.5,
      z: pz,
      hx: 0.5,
      hy: 0.14,
      hz: 0.55,
      yaw,
      tint: TINT_D,
      cell: 0.5,
    });
    m.addBox({
      x: px,
      y: gy + 0.2,
      z: pz,
      hx: 0.5,
      hy: 0.2,
      hz: 0.55,
      yaw,
      tint: TINT_D,
      cell: 0.5,
    });
  }
  const [lx, lz] = pos(0);
  m.addBox({
    x: lx,
    y: gy + def.height + 0.4,
    z: lz,
    hx: half + 0.5,
    hy: 0.32,
    hz: 0.42,
    yaw,
    tint: TINT_D,
    ruin: 0.12,
    cell: 0.5,
  });

  // 扉 2 枚（ローカル座標 = 門の向き。蝶番を原点に作り、pivot を蝶番へ置く）
  const leaves: { pivot: Group; closedRotationY: number; openDelta: number }[] = [];
  const leafBuilders: { builder: PropBuilder; pivot: Group }[] = [];
  const leafW = half - 0.04;
  for (const side of [-1, 1] as const) {
    const b = new PropBuilder();
    const dir = -side; // 蝶番から中央へ向かう向き（左の蝶番 = -x → +x へ）
    const H = def.height;
    const bars = Math.round(leafW / 0.2);
    for (let i = 0; i <= bars; i++) {
      const x = dir * (0.05 + ((leafW - 0.1) * i) / bars);
      b.box([x, H / 2 + 0.04, 0], [i === 0 || i === bars ? 0.04 : 0.021, H / 2 - 0.1, 0.021], IRON);
      b.cylinder([x, H - 0.02, 0], 0, i === 0 || i === bars ? 0.04 : 0.032, 0.2, IRON, {}, 4);
    }
    for (const y of [0.35, H * 0.5, H - 0.3]) {
      b.box([dir * (leafW / 2), y, 0], [leafW / 2, 0.045, 0.035], RUST);
    }
    // 斜めの補強
    const diag = Math.atan2(H * 0.5 - 0.35, leafW);
    b.box(
      [dir * (leafW / 2), (0.35 + H * 0.5) / 2, 0.04],
      [Math.hypot(leafW, H * 0.5 - 0.35) / 2, 0.03, 0.02],
      RUST,
      {
        tiltZ: dir * diag,
      },
    );
    // 蝶番の帯と、合わせ目の錠
    for (const y of [0.5, H - 0.5]) {
      b.box([dir * 0.25, y, 0.03], [0.25, 0.06, 0.02], RUST);
    }
    b.cylinder(
      [dir * (leafW - 0.1), H * 0.45, 0.06],
      0.07,
      0.07,
      0.05,
      RUST,
      { tiltX: Math.PI / 2 },
      10,
    );
    const pivot = new Group();
    pivot.name = `gate:G1:leaf:${side < 0 ? 'left' : 'right'}`;
    const [hx0, hz0] = pos(side * (half - 0.02));
    pivot.position.set(hx0, gy, hz0);
    pivot.rotation.y = yaw;
    leaves.push({ pivot, closedRotationY: yaw, openDelta: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
    leafBuilders.push({ builder: b, pivot });
    extras.add(pivot);
  }

  // レバー（石の台 + 鉄の持ち手。持ち手は pivot.rotation.z で倒す）
  const leverDef = level.data.interactables.find((i) => i.kind === 'lever');
  let lever: CryptProps['leverHandle'] = null;
  let leverPivot: Group | null = null;
  let leverBuilder: PropBuilder | null = null;
  if (leverDef) {
    const ly = level.heightAt(leverDef.x, leverDef.z);
    const lm = lane;
    lm.addBox({
      x: leverDef.x,
      y: ly + 0.5,
      z: leverDef.z,
      hx: 0.24,
      hy: 0.55,
      hz: 0.2,
      yaw,
      tint: TINT_D,
      cell: 0.4,
    });
    lm.addBox({
      x: leverDef.x,
      y: ly + 1.07,
      z: leverDef.z,
      hx: 0.3,
      hy: 0.06,
      hz: 0.26,
      yaw,
      tint: TINT_D,
      cell: 0.4,
    });
    lm.addBox({
      x: leverDef.x,
      y: ly + 0.1,
      z: leverDef.z,
      hx: 0.32,
      hy: 0.1,
      hz: 0.28,
      yaw,
      tint: TINT_D,
      cell: 0.4,
    });
    const pivot = new Group();
    pivot.name = 'lever:lever-g1:handle';
    pivot.position.set(leverDef.x + nx * 0.23, ly + 0.9, leverDef.z + nz * 0.23);
    pivot.rotation.set(0, yaw, -0.7);
    const b = new PropBuilder();
    b.box([0, 0.32, 0], [0.025, 0.32, 0.025], IRON);
    b.cylinder([0, 0.66, 0], 0.055, 0.055, 0.07, RUST, {}, 10);
    b.cylinder([0, 0, 0.0], 0.05, 0.05, 0.1, RUST, { tiltX: Math.PI / 2 }, 10);
    // 扇形の目盛板（台の前面）
    leverPivot = pivot;
    leverBuilder = b;
    lever = { pivot, closedRotationZ: -0.7, openRotationZ: 0.7 };
    extras.add(pivot);
    const plate = new PropBuilder();
    plate.box(
      [leverDef.x + nx * 0.215, ly + 0.9, leverDef.z + nz * 0.215],
      [0.17, 0.2, 0.012],
      IRON,
      { yaw },
    );
    const plateGeometry = plate.build();
    if (plateGeometry) {
      const plateMesh = new Mesh(plateGeometry, metal);
      plateMesh.name = 'lever:plate';
      extras.add(plateMesh);
    }
  }

  for (const { builder, pivot } of leafBuilders) {
    const geometry = builder.build();
    if (!geometry) continue;
    const mesh = new Mesh(geometry, metal);
    mesh.castShadow = true;
    mesh.name = `${pivot.name}:mesh`;
    pivot.add(mesh);
  }
  if (leverPivot && leverBuilder) {
    const geometry = leverBuilder.build();
    if (geometry) {
      const mesh = new Mesh(geometry, metal);
      mesh.castShadow = true;
      leverPivot.add(mesh);
    }
  }
  return { leaves, lever };
}
