import { Euler, Matrix4, Quaternion, Vector3 } from 'three/webgpu';
import type {
  BlockProp,
  CylinderProp,
  Level,
  PlacedBox,
  PlacedCylinder,
} from '../game/world/level';
import type { EnvironmentId } from './assets/environment';

/**
 * レベルのコライダ（箱・円柱）を環境メッシュへ置き換える配置計算（純粋ロジック。GPU に依存しない）。
 * 寸法は `Level` のコライダ（`placeProps` の結果）に合わせるので、見た目と当たりがずれない。
 * 対象はエリア A〜C と礼拝堂の塔（x < 62 かつ z < 40）。それ以外は従来のグレーボックスのまま。
 */

const DEG = Math.PI / 180;

export interface EnvPlacement {
  readonly id: EnvironmentId;
  readonly matrix: Matrix4;
  /** 空間バケット（結合の単位）。 */
  readonly bucket: string;
}

export interface EnvironmentLayout {
  readonly placements: readonly EnvPlacement[];
  /** 置き換えたコライダ / 円柱の id（グレーボックスの表示を消す）。 */
  readonly coveredIds: ReadonlySet<string>;
}

/** 環境メッシュの対象範囲（エリア A〜C と塔）。 */
export function isEnvironmentZone(x: number, z: number): boolean {
  return x < 62 && z < 40;
}

const BUCKET_SIZE = 24;
const bucketOf = (x: number, z: number): string =>
  `${Math.floor(x / BUCKET_SIZE)},${Math.floor(z / BUCKET_SIZE)}`;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

const QUAT = new Quaternion();
const EULER = new Euler();

/** 位置・向き・拡大・傾きの行列。 */
export function placeMatrix(
  x: number,
  y: number,
  z: number,
  yaw: number,
  scale: readonly [number, number, number] = [1, 1, 1],
  tilt: readonly [number, number] = [0, 0],
): Matrix4 {
  QUAT.setFromEuler(EULER.set(tilt[0], yaw, tilt[1], 'YXZ'));
  return new Matrix4().compose(new Vector3(x, y, z), QUAT, new Vector3(...scale));
}

/** ローカル（箱の向き）の (lx, lz) をワールドへ。 */
function localToWorld(yaw: number, lx: number, lz: number): [number, number] {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [lx * c + lz * s, -lx * s + lz * c];
}

interface ModuleSpec {
  readonly id: EnvironmentId;
  /** モジュールの名目高さ（m）。 */
  readonly height: number;
}

const WALL_FULL: readonly ModuleSpec[] = [
  { id: 'WallFullA', height: 3.6 },
  { id: 'WallFullB', height: 3.6 },
  { id: 'WallFullWindow', height: 3.6 },
  { id: 'WallFullBeam', height: 3.6 },
];
const WALL_MID: ModuleSpec = { id: 'WallMid', height: 2.8 };
const WALL_LOW: ModuleSpec = { id: 'WallLow', height: 2 };
const WALL_MODULE_LENGTH = 2;
const WALL_MODULE_THICKNESS = 0.7;

export function layoutEnvironment(level: Level): EnvironmentLayout {
  const placements: EnvPlacement[] = [];
  const covered = new Set<string>();
  const boxById = new Map<string, PlacedBox>(level.boxes.map((b) => [b.id, b]));
  const cylById = new Map<string, PlacedCylinder>(level.cylinders.map((c) => [c.id, c]));
  const add = (id: EnvironmentId, matrix: Matrix4, x: number, z: number): void => {
    placements.push({ id, matrix, bucket: bucketOf(x, z) });
  };

  let treeIndex = 0;
  let columnIndex = 0;
  for (const prop of level.data.props) {
    if (prop.kind === 'block') {
      const box = boxById.get(prop.id);
      if (!box || !isEnvironmentZone(prop.x, prop.z)) continue;
      if (layoutBlock(prop, box, add, level)) covered.add(prop.id);
    } else if (prop.kind === 'cylinder') {
      const cyl = cylById.get(prop.id);
      if (!cyl || !isEnvironmentZone(prop.x, prop.z)) continue;
      if (layoutCylinder(prop, cyl, add, prop.style === 'tree' ? treeIndex++ : columnIndex++)) {
        covered.add(prop.id);
      }
    }
  }

  // 篝火の土台（灰・石の輪・突き立つ剣）。コライダ（bonfire-base）の位置に置く
  // 倒れた柵（北の柵の途中の 2m の欠け）
  const fenceGap = level.data.props.filter((p) => p.id.startsWith('fence-b'));
  if (fenceGap.length > 0) {
    const gapX = 33;
    const gapZ = 23;
    add(
      'FenceFallen',
      placeMatrix(gapX, level.heightAt(gapX, gapZ) - 0.02, gapZ, 0.12),
      gapX,
      gapZ,
    );
  }

  // 壁際の小石・欠片
  for (const prop of level.data.props) {
    if (prop.kind !== 'block' || !prop.id.startsWith('chapel-') || prop.style === 'rubble')
      continue;
    const box = boxById.get(prop.id);
    if (!box) continue;
    const alongX = prop.hx >= prop.hz;
    const length = 2 * Math.max(prop.hx, prop.hz);
    const n = Math.max(1, Math.floor(length / 3.2));
    for (let i = 0; i < n; i++) {
      const h = hashString(`${prop.id}:scatter:${i}`);
      if (h < 0.3) continue;
      const side = h < 0.65 ? -1 : 1;
      const along = (hashString(`${prop.id}:s:${i}`) - 0.5) * (length - 1.2);
      const off = side * (Math.min(prop.hx, prop.hz) + 0.55);
      const [wx, wz] = alongX
        ? localToWorld((prop.yawDeg ?? 0) * DEG, along, off)
        : localToWorld((prop.yawDeg ?? 0) * DEG, off, along);
      const x = prop.x + wx;
      const z = prop.z + wz;
      add(
        'StoneScatter',
        placeMatrix(x, level.heightAt(x, z) - 0.02, z, alongX ? 0 : Math.PI / 2, [1, 1, 1]),
        x,
        z,
      );
    }
  }

  // ランタイン柱（A: 篝火の周り、B: 小径の脇、C: 西の門）
  for (const lamp of LANTERNS) {
    const y = level.heightAt(lamp.x, lamp.z);
    add('LanternPost', placeMatrix(lamp.x, y - 0.03, lamp.z, lamp.yaw * DEG), lamp.x, lamp.z);
  }

  return { placements, coveredIds: covered };
}

/** ランタン柱の位置（x, z, 向き: 腕が伸びる方向 = ローカル +X）。 */
const LANTERNS: readonly { x: number; z: number; yaw: number }[] = [
  { x: -3.6, z: -1.4, yaw: -30 },
  { x: 3.7, z: 3.3, yaw: 130 },
  { x: 13.6, z: 3.6, yaw: 90 },
  { x: 25.4, z: 10.8, yaw: 200 },
  { x: 38.6, z: 13.6, yaw: 70 },
  { x: 41.6, z: 20.8, yaw: 0 },
];

function layoutBlock(
  prop: BlockProp,
  box: PlacedBox,
  add: (id: EnvironmentId, matrix: Matrix4, x: number, z: number) => void,
  level: Level,
): boolean {
  const yaw = (prop.yawDeg ?? 0) * DEG;
  const top = box.y + box.hy;
  const base = top - prop.height;
  const h = hashString(prop.id);
  switch (prop.style) {
    case 'grave': {
      const id: EnvironmentId = h < 0.4 ? 'GraveRound' : h < 0.7 ? 'GraveCross' : 'GraveBroken';
      const lean: [number, number] = [
        (hashString(`${prop.id}:a`) - 0.5) * 0.1,
        (hashString(`${prop.id}:b`) - 0.5) * 0.1,
      ];
      add(
        id,
        placeMatrix(
          prop.x,
          base - 0.03,
          prop.z,
          yaw,
          [
            Math.min(1.25, (2 * prop.hx) / 0.62),
            prop.height / 1.0,
            Math.min(1.3, (2 * prop.hz) / 0.22),
          ],
          lean,
        ),
        prop.x,
        prop.z,
      );
      // 盛り土（墓石の正面側）
      const [wx, wz] = localToWorld(yaw, 0, 0.06);
      const mx = prop.x + wx;
      const mz = prop.z + wz;
      add('GraveMound', placeMatrix(mx, level.heightAt(mx, mz) - 0.02, mz, yaw), mx, mz);
      return true;
    }
    case 'fence': {
      const id: EnvironmentId = h < 0.3 ? 'FenceBroken' : 'FenceSection';
      add(
        id,
        placeMatrix(prop.x, base - 0.02, prop.z, yaw, [(2 * prop.hx) / 2, prop.height / 1.1, 1]),
        prop.x,
        prop.z,
      );
      return true;
    }
    case 'stone': {
      add(
        'Stele',
        placeMatrix(prop.x, base - 0.02, prop.z, yaw, [
          (2 * prop.hx) / 1.1,
          prop.height / 1.7,
          (2 * prop.hz) / 0.36,
        ]),
        prop.x,
        prop.z,
      );
      return true;
    }
    case 'bonfire': {
      const y = level.heightAt(prop.x, prop.z);
      add('Bonfire', placeMatrix(prop.x, y - 0.02, prop.z, 0.4), prop.x, prop.z);
      return true;
    }
    case 'altar': {
      add(
        'Altar',
        placeMatrix(prop.x, base - 0.02, prop.z, yaw + Math.PI, [
          (2 * prop.hx) / 3.9,
          prop.height / 1.18,
          (2 * prop.hz) / 1.1,
        ]),
        prop.x,
        prop.z,
      );
      return true;
    }
    case 'pew': {
      const id: EnvironmentId = h < 0.3 ? 'PewBroken' : 'PewA';
      add(
        id,
        placeMatrix(prop.x, base - 0.02, prop.z, yaw + (h < 0.5 ? 0 : Math.PI), [
          (2 * prop.hx) / 3.32,
          prop.height / 0.88,
          (2 * prop.hz) / 0.6,
        ]),
        prop.x,
        prop.z,
      );
      return true;
    }
    case 'mausoleum': {
      add(
        'Mausoleum',
        placeMatrix(prop.x, base, prop.z, yaw, [
          (2 * prop.hx) / 4,
          prop.height / 2.2,
          (2 * prop.hz) / 4,
        ]),
        prop.x,
        prop.z,
      );
      return true;
    }
    case 'tower': {
      add(
        'Tower',
        placeMatrix(prop.x, base, prop.z, yaw, [
          (2 * prop.hx) / 6,
          prop.height / 18,
          (2 * prop.hz) / 6,
        ]),
        prop.x,
        prop.z,
      );
      return true;
    }
    case 'wall':
    case 'rubble': {
      layoutWall(prop, base, add);
      return true;
    }
    default:
      return false; // stairs など: グレーボックスのまま
  }
}

/** 壁・瓦礫の帯を 2m ごとのモジュールで並べる。 */
function layoutWall(
  prop: BlockProp,
  base: number,
  add: (id: EnvironmentId, matrix: Matrix4, x: number, z: number) => void,
): void {
  const yawBase = (prop.yawDeg ?? 0) * DEG;
  const alongX = prop.hx >= prop.hz;
  const half = Math.max(prop.hx, prop.hz);
  const thickHalf = Math.min(prop.hx, prop.hz);
  const length = 2 * half;
  const moduleYaw = alongX ? yawBase : yawBase - Math.PI / 2;

  if (prop.style === 'rubble') {
    if (length <= 2.8) {
      add(
        'RubblePile',
        placeMatrix(prop.x, base - 0.04, prop.z, moduleYaw, [
          length / 2,
          prop.height / 1.2,
          (2 * thickHalf) / 1.0,
        ]),
        prop.x,
        prop.z,
      );
      return;
    }
  }
  const n = Math.max(1, Math.round(length / WALL_MODULE_LENGTH));
  const seg = length / n;
  for (let i = 0; i < n; i++) {
    const along = -half + seg * (i + 0.5);
    const [wx, wz] = alongX ? localToWorld(yawBase, along, 0) : localToWorld(yawBase, 0, along);
    const x = prop.x + wx;
    const z = prop.z + wz;
    const h = hashString(`${prop.id}:${i}`);
    if (prop.style === 'rubble') {
      add(
        'WallRubble',
        placeMatrix(x, base - 0.04, z, moduleYaw + (h < 0.5 ? 0 : Math.PI), [
          seg / 2,
          prop.height / 1.3,
          (2 * thickHalf) / 0.5,
        ]),
        x,
        z,
      );
      continue;
    }
    let spec: ModuleSpec;
    if (prop.height >= 3.3) {
      const windowSlot = n >= 3 && i > 0 && i < n - 1 && i % 3 === 1;
      // 窓は端を避けて 3 つに 1 つ。残りは欠けの違う 2 種と、崩れた屋根の梁が突き出す 1 種
      const variant = h < 0.35 ? 0 : h < 0.7 ? 1 : 3;
      spec = windowSlot ? (WALL_FULL[2] as ModuleSpec) : (WALL_FULL[variant] as ModuleSpec);
    } else if (prop.height >= 2.4) {
      spec = WALL_MID;
    } else {
      spec = WALL_LOW;
    }
    add(
      spec.id,
      placeMatrix(x, base - 0.04, z, moduleYaw + (h < 0.5 ? 0 : Math.PI), [
        seg / WALL_MODULE_LENGTH,
        prop.height / spec.height,
        (2 * thickHalf) / WALL_MODULE_THICKNESS,
      ]),
      x,
      z,
    );
  }
}

function layoutCylinder(
  prop: CylinderProp,
  cyl: PlacedCylinder,
  add: (id: EnvironmentId, matrix: Matrix4, x: number, z: number) => void,
  index: number,
): boolean {
  const ground = cyl.y + 0.3;
  const visible = cyl.height - 0.3;
  const yaw = hashString(prop.id) * Math.PI * 2;
  if (prop.style === 'tree') {
    const id: EnvironmentId = (['DeadTreeA', 'DeadTreeB', 'DeadTreeC'] as const)[
      index % 3
    ] as EnvironmentId;
    const s = visible / 4;
    add(id, placeMatrix(prop.x, ground - 0.05, prop.z, yaw, [s, s, s]), prop.x, prop.z);
    return true;
  }
  // column
  const tall = visible >= 2.8;
  const modH = tall ? 3.2 : 2.1;
  const r = (prop.radius / 0.5) * 0.9;
  add(
    tall ? 'ColumnTall' : 'ColumnBroken',
    placeMatrix(prop.x, ground - 0.05, prop.z, yaw, [r, visible / modH, r]),
    prop.x,
    prop.z,
  );
  return true;
}
