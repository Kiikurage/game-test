/**
 * レベルデータの型と、そこから地形・静的コライダー・スポーン点を組み立てるローダ。
 *
 * レベルは単一のデータ（`ashenFoundation.ts` の `LevelData`）で定義し、`createLevel()` が
 *   - 地形の高さ関数（`heightAt`）と衝突・描画共通の地形メッシュ（`terrain`）
 *   - 静的な箱・円柱のコライダー（`boxes` / `cylinders` / `boundaryBoxes`）
 *   - 地表素材（`surfaceAt`。足音用）
 * を作る。物理（Game）と描画（render/levelView）は同じ `Level` を読むので、見た目と当たりがずれない。
 *
 * 座標は篝火を原点・+x 東・+z 北（m）。向き（ヨー）は前方 = (sin yaw, cos yaw)。
 */
import type { GameOptions } from '../game';
import { GridNavigator } from '../enemy/gridNavigator';
import { NavGrid } from '../enemy/navGrid';
import type { BoxSpec } from './playground';

/** 足音用の地表素材。 */
export type SurfaceKind = 'grass' | 'stone' | 'wood' | 'underground';

export type AreaId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type AreaShape =
  | { readonly type: 'circle'; readonly cx: number; readonly cz: number; readonly r: number }
  | {
      readonly type: 'rect';
      readonly minX: number;
      readonly maxX: number;
      readonly minZ: number;
      readonly maxZ: number;
    };

export interface AreaDef {
  readonly id: AreaId;
  readonly name: string;
  readonly shape: AreaShape;
  readonly surface: SurfaceKind;
  /** 外周封鎖（`LevelData.perimeter`）で、この範囲の外側に残す余白（m）。省略時は `perimeter.areaMargin`。 */
  readonly perimeterMargin?: number;
  /** 指定すると、範囲（+ margin）を この高さの平らな床にならす。省略時は地形なりのまま。 */
  readonly floor?: {
    readonly height: number;
    /** 範囲の外側へ平らなまま広げる幅（m）。 */
    readonly margin: number;
    /** そこから周囲の地形へ滑らかにつなぐ幅（m）。 */
    readonly blend: number;
  };
}

/** メインルートの中心線の 1 点。点の間は線分で結ばれ、道幅（半幅）と高さが線形に変わる。 */
export interface RoutePoint {
  readonly x: number;
  readonly z: number;
  /** 道の高さ（m）。 */
  readonly height: number;
  /** 道の半幅（m）。この内側は道の高さに平らにならされる。 */
  readonly halfWidth: number;
}

export interface TerrainParams {
  /** 全体の傾向（北東へ緩やかに上る）。高さ = slopeX * x + slopeZ * z。 */
  readonly slopeX: number;
  readonly slopeZ: number;
  /** 大きな起伏の振幅（m）と波長（m）。 */
  readonly hillAmplitude: number;
  readonly hillWavelength: number;
  /** 細かい凹凸の振幅（m）と波長（m）。 */
  readonly bumpAmplitude: number;
  readonly bumpWavelength: number;
  /** 道の外側へ地形をなじませる幅（m）。 */
  readonly routeBlend: number;
  /** 外周の低い崖の高さ（m）と幅（m）。崖は登れない（落下死を作らないため、さらに外側に透明壁を置く）。 */
  readonly cliffHeight: number;
  readonly cliffWidth: number;
  /** 地形メッシュの格子の間隔（m）と、プレイ範囲の外側へ余分に張る幅（m）。 */
  readonly cellSize: number;
  readonly meshMargin: number;
}

/** 外周封鎖で通行領域に足す折れ線（脇道など。幅 = 半幅 × 2）。 */
export interface OpenPath {
  readonly id: string;
  readonly points: readonly (readonly [number, number])[];
  readonly halfWidth: number;
}

/**
 * 外周の封鎖（#176）。通行領域 = メインルート・ショートカット（半幅 + `routeMargin`）、エリア（形状 + `areaMargin`）、
 * 脇道（`openPaths`）の和。その外側は地形を `rise`（m）まで立ち上げ、`width`（m）で崖にする。
 * 崖は勾配が `maxSlopeDeg` を超えるので、プレイヤーも敵（ナビ格子）も登れない。通行領域の内側の地形は変えない。
 */
export interface PerimeterParams {
  readonly rise: number;
  readonly width: number;
  readonly routeMargin: number;
  readonly areaMargin: number;
  readonly openPaths: readonly OpenPath[];
}

export type BlockStyle =
  | 'wall'
  | 'rubble'
  | 'tower'
  | 'altar'
  | 'pew'
  | 'grave'
  | 'fence'
  | 'mausoleum'
  | 'stairs'
  | 'bonfire'
  | 'stone'
  | 'sarcophagus';

/** 立方体の静的物。底面は地形に埋め込み、上面は `baseY + height`。 */
export interface BlockProp {
  readonly kind: 'block';
  readonly id: string;
  readonly style: BlockStyle;
  readonly x: number;
  readonly z: number;
  readonly hx: number;
  readonly hz: number;
  /** 基準の高さからの上面の高さ（m）。 */
  readonly height: number;
  readonly yawDeg?: number;
  /** 基準の高さ。省略時は足元の地形の最低点。 */
  readonly baseY?: number;
}

/** 階段。始点 (x, z) から前方（ヨー）へ登る。1 段の高さは自動乗り越えの 0.35m 以下にすること。 */
export interface StairsProp {
  readonly kind: 'stairs';
  readonly id: string;
  readonly x: number;
  readonly z: number;
  readonly yawDeg: number;
  readonly steps: number;
  readonly stepRise: number;
  readonly stepRun: number;
  readonly width: number;
}

export type CylinderStyle = 'tree' | 'column' | 'fountain' | 'pedestal';

/** 立っている円柱（枯れ木の幹・柱・噴水・台座）。 */
export interface CylinderProp {
  readonly kind: 'cylinder';
  readonly id: string;
  readonly style: CylinderStyle;
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
}

export type PropSpec = BlockProp | StairsProp | CylinderProp;

export type EnemyType = 'undead_soldier' | 'undead_shield';
export type EnemyBehavior = 'idle_back' | 'patrol' | 'wait';

/** 敵の配置（中身の挙動は後続チケット）。 */
export interface EnemySpawn {
  readonly id: string;
  readonly type: EnemyType;
  readonly area: AreaId;
  readonly x: number;
  readonly z: number;
  readonly yaw: number;
  readonly behavior: EnemyBehavior;
  /** 巡回の半径（m）。 */
  readonly patrolRadius?: number;
}

export interface ItemSpawn {
  readonly id: string;
  readonly kind: 'flask_up' | 'relic' | 'charm';
  readonly area: AreaId;
  readonly x: number;
  readonly z: number;
}

export type InteractableKind = 'bonfire' | 'tablet' | 'lever' | 'gate';

export interface InteractableSpawn {
  readonly id: string;
  readonly kind: InteractableKind;
  /** 属するエリア。エリア外の通路上（鉄門 G1・レバー）は null。 */
  readonly area: AreaId | null;
  readonly x: number;
  readonly z: number;
}

/** 門（鉄門 G1・霧の門）。開閉の演出・操作は別チケット。ここでは位置と、塞ぐコライダのオン/オフ口だけを持つ。 */
export interface GateDef {
  readonly id: string;
  readonly kind: 'iron' | 'fog';
  readonly x: number;
  readonly z: number;
  /** 門の向き（通り抜ける方向 = 前方 (sin yaw, cos yaw)）。幅は前方に直角。 */
  readonly yawDeg: number;
  readonly width: number;
  readonly height: number;
  /** 開始時に通行を塞ぐか（コライダが有効か）。鉄門は塞ぐ、霧の門は開けておく。 */
  readonly blocking: boolean;
  /** 開けるレバー（`interactables` の id）。 */
  readonly leverId?: string;
}

export interface LevelData {
  readonly id: string;
  readonly name: string;
  /** プレイ範囲（この外側は透明壁）。 */
  readonly bounds: {
    readonly minX: number;
    readonly maxX: number;
    readonly minZ: number;
    readonly maxZ: number;
  };
  readonly terrain: TerrainParams;
  /** 外周の封鎖。省略時は封鎖しない（開けた地形）。 */
  readonly perimeter?: PerimeterParams;
  readonly areas: readonly AreaDef[];
  readonly route: readonly RoutePoint[];
  /** メインルートから分かれる道（ショートカットなど）。メインルートと同じ規則で地形をならす。 */
  readonly extraRoutes?: readonly (readonly RoutePoint[])[];
  /** 門。コライダは `Level.gates[].box`（`Game.setBoxEnabled(id, bool)` で開閉）。 */
  readonly gates: readonly GateDef[];
  /** 篝火（リスポーン点）。 */
  readonly bonfire: { readonly x: number; readonly z: number };
  /** プレイヤーの開始位置と向き。 */
  readonly playerSpawn: { readonly x: number; readonly z: number; readonly yaw: number };
  readonly props: readonly PropSpec[];
  readonly enemies: readonly EnemySpawn[];
  readonly items: readonly ItemSpawn[];
  readonly interactables: readonly InteractableSpawn[];
}

/** 地形メッシュ（頂点は x, y, z の並び。描画と衝突で同じ配列を使う）。 */
export interface TerrainMesh {
  readonly vertices: Float32Array;
  readonly indices: Uint32Array;
  /** 格子の列数・行数（頂点数）。 */
  readonly cols: number;
  readonly rows: number;
  readonly minX: number;
  readonly minZ: number;
  readonly cellSize: number;
}

/** 配置済みの箱（描画用のスタイル付き）。 */
export interface PlacedBox extends BoxSpec {
  readonly style: BlockStyle;
}

export interface PlacedCylinder {
  readonly id: string;
  readonly style: CylinderStyle;
  readonly x: number;
  /** 底面の高さ。 */
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
}

/** 配置済みの門。`box` は塞ぐコライダ（`id` = 門の id。`enabled` が開始時の状態）。 */
export interface PlacedGate {
  readonly def: GateDef;
  /** 門の足元の高さ。 */
  readonly y: number;
  readonly box: BoxSpec;
}

export interface Level {
  readonly data: LevelData;
  readonly heightAt: (x: number, z: number) => number;
  /** 道（メインルート）の重み 0..1。地面の見た目（踏み固められた土）に使う。 */
  readonly pathWeight: (x: number, z: number) => number;
  /** 通行領域までの距離（m。領域内は 0。`perimeter` がなければ常に 0）。0 より大きい所は崖・岩壁。 */
  readonly openDistance: (x: number, z: number) => number;
  readonly surfaceAt: (x: number, z: number) => SurfaceKind;
  readonly terrain: TerrainMesh;
  /** 見える静的物の箱（壁・墓石・階段など）。 */
  readonly boxes: readonly PlacedBox[];
  /** 見える静的物の円柱（木・柱）。 */
  readonly cylinders: readonly PlacedCylinder[];
  /** プレイ範囲の外周の透明壁（描画しない）。 */
  readonly boundaryBoxes: readonly BoxSpec[];
  /** 門（鉄門・霧の門）。コライダは `levelGameOptions().boxes` に含まれる。 */
  readonly gates: readonly PlacedGate[];
}

// ---------------------------------------------------------------------------

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
function valueNoise(x: number, z: number): number {
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

/** 点から形状までの距離（内側は 0）。 */
export function distanceToShape(shape: AreaShape, x: number, z: number): number {
  if (shape.type === 'circle') {
    return Math.max(0, Math.hypot(x - shape.cx, z - shape.cz) - shape.r);
  }
  const dx = Math.max(shape.minX - x, 0, x - shape.maxX);
  const dz = Math.max(shape.minZ - z, 0, z - shape.maxZ);
  return Math.hypot(dx, dz);
}

export function insideShape(shape: AreaShape, x: number, z: number): boolean {
  return distanceToShape(shape, x, z) === 0;
}

/** 2 つの形状が重なるか（接するだけは重なりとしない）。 */
export function shapesOverlap(a: AreaShape, b: AreaShape): boolean {
  if (a.type === 'rect' && b.type === 'rect') {
    return a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ;
  }
  if (a.type === 'circle' && b.type === 'circle') {
    return Math.hypot(a.cx - b.cx, a.cz - b.cz) < a.r + b.r;
  }
  const [circle, rect] = a.type === 'circle' ? [a, b] : [b, a];
  if (circle.type !== 'circle') return false;
  return distanceToShape(rect, circle.cx, circle.cz) < circle.r;
}

interface RouteSegment {
  readonly ax: number;
  readonly az: number;
  readonly bx: number;
  readonly bz: number;
  readonly ah: number;
  readonly bh: number;
  readonly aw: number;
  readonly bw: number;
  readonly len2: number;
}

function createRouteSegments(route: readonly RoutePoint[]): RouteSegment[] {
  const segments: RouteSegment[] = [];
  for (let i = 0; i + 1 < route.length; i++) {
    const a = route[i];
    const b = route[i + 1];
    if (!a || !b) continue;
    segments.push({
      ax: a.x,
      az: a.z,
      bx: b.x,
      bz: b.z,
      ah: a.height,
      bh: b.height,
      aw: a.halfWidth,
      bw: b.halfWidth,
      len2: (b.x - a.x) ** 2 + (b.z - a.z) ** 2,
    });
  }
  return segments;
}

/** 通行領域までの距離（領域内 0）。`perimeter` がなければ常に 0。 */
function createOpenDistance(data: LevelData): (x: number, z: number) => number {
  const perimeter = data.perimeter;
  if (!perimeter) return () => 0;
  // 線分: [ax, az, bx, bz, 始点の半幅, 終点の半幅]
  const segs: [number, number, number, number, number, number][] = [];
  for (const route of [data.route, ...(data.extraRoutes ?? [])]) {
    for (let i = 0; i + 1 < route.length; i++) {
      const a = route[i];
      const b = route[i + 1];
      if (!a || !b) continue;
      const m = perimeter.routeMargin;
      segs.push([a.x, a.z, b.x, b.z, a.halfWidth + m, b.halfWidth + m]);
    }
  }
  for (const path of perimeter.openPaths) {
    for (let i = 0; i + 1 < path.points.length; i++) {
      const a = path.points[i];
      const b = path.points[i + 1];
      if (!a || !b) continue;
      segs.push([a[0], a[1], b[0], b[1], path.halfWidth, path.halfWidth]);
    }
  }
  const areas = data.areas.map((a) => ({
    shape: a.shape,
    margin: a.perimeterMargin ?? perimeter.areaMargin,
  }));
  return (x, z) => {
    let best = Infinity;
    for (const [ax, az, bx, bz, wa, wb] of segs) {
      const len2 = (bx - ax) ** 2 + (bz - az) ** 2;
      const t = Math.min(1, Math.max(0, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / len2));
      const d =
        Math.hypot(x - (ax + (bx - ax) * t), z - (az + (bz - az) * t)) - (wa + (wb - wa) * t);
      if (d < best) best = d;
      if (best <= 0) return 0;
    }
    for (const a of areas) {
      const d = distanceToShape(a.shape, x, z) - a.margin;
      if (d < best) best = d;
      if (best <= 0) return 0;
    }
    return Math.max(0, best);
  };
}

/** 高さ関数と道の重み関数を作る（純粋関数。外から呼べるようにレベル全体は作らない版）。 */
export function createTerrainFunctions(data: LevelData): {
  heightAt: (x: number, z: number) => number;
  pathWeight: (x: number, z: number) => number;
  openDistance: (x: number, z: number) => number;
} {
  const { terrain: p, bounds } = data;
  const perimeter = data.perimeter;
  const openDistance = createOpenDistance(data);
  const segments = [
    ...createRouteSegments(data.route),
    ...(data.extraRoutes ?? []).flatMap((r) => createRouteSegments(r)),
  ];
  const floors = data.areas.filter((a) => a.floor);

  /** 道: 各線分の重み付き平均（継ぎ目で段差ができない）。 */
  const route = (x: number, z: number): { weight: number; height: number } => {
    let sumW = 0;
    let sumWH = 0;
    let keep = 1;
    for (const s of segments) {
      const t = Math.min(
        1,
        Math.max(0, ((x - s.ax) * (s.bx - s.ax) + (z - s.az) * (s.bz - s.az)) / s.len2),
      );
      const d = Math.hypot(x - (s.ax + (s.bx - s.ax) * t), z - (s.az + (s.bz - s.az) * t));
      const hw = s.aw + (s.bw - s.aw) * t;
      const w = 1 - smoothstep(hw, hw + p.routeBlend, d);
      sumW += w;
      sumWH += w * (s.ah + (s.bh - s.ah) * t);
      keep *= 1 - w;
    }
    return { weight: 1 - keep, height: sumW > 1e-9 ? sumWH / sumW : 0 };
  };

  const pathWeight = (x: number, z: number): number => {
    let keep = 1;
    for (const s of segments) {
      const t = Math.min(
        1,
        Math.max(0, ((x - s.ax) * (s.bx - s.ax) + (z - s.az) * (s.bz - s.az)) / s.len2),
      );
      const d = Math.hypot(x - (s.ax + (s.bx - s.ax) * t), z - (s.az + (s.bz - s.az) * t));
      const hw = s.aw + (s.bw - s.aw) * t;
      keep *= smoothstep(hw * 0.7, hw * 1.05, d);
    }
    return 1 - keep;
  };

  const heightAt = (x: number, z: number): number => {
    const hills =
      (valueNoise(x / p.hillWavelength + 11.3, z / p.hillWavelength - 4.7) - 0.5) *
      2 *
      p.hillAmplitude;
    const bumps =
      (valueNoise(x / p.bumpWavelength - 3.1, z / p.bumpWavelength + 8.2) - 0.5) *
      2 *
      p.bumpAmplitude;
    let h = p.slopeX * x + p.slopeZ * z + hills + bumps;

    const r = route(x, z);
    h += (r.height - h) * r.weight;

    for (const area of floors) {
      const f = area.floor;
      if (!f) continue;
      const w = 1 - smoothstep(f.margin, f.margin + f.blend, distanceToShape(area.shape, x, z));
      h += (f.height - h) * w;
    }

    // 外周封鎖: 通行領域の外側を岩壁として立ち上げる（高さは岩肌のむらで 0.75..1.25 倍）
    if (perimeter) {
      const d = openDistance(x, z);
      if (d > 0) {
        const n = valueNoise(x / 5 + 2.4, z / 5 - 7.9);
        // 立ち上がりは足元が急（登れない）で、頂で緩む。通行領域の間の細い尾根も低くならない
        const t = 1 - Math.min(1, d / perimeter.width);
        h += perimeter.rise * (0.75 + 0.5 * n) * (1 - t * t * t);
      }
    }

    // 外周の低い崖（プレイ範囲の端から cliffWidth の間で立ち上がる）。範囲の外は更に上がり続ける。
    const edge = Math.min(x - bounds.minX, bounds.maxX - x, z - bounds.minZ, bounds.maxZ - z);
    h += p.cliffHeight * (1 - smoothstep(0, p.cliffWidth, edge)) + Math.max(0, -edge);
    return h;
  };

  return { heightAt, pathWeight, openDistance };
}

/** 地形メッシュ（`cellSize` 格子。頂点 (ix, iz) は x = minX + ix * cellSize）。 */
export function buildTerrainMesh(
  data: LevelData,
  heightAt: (x: number, z: number) => number,
): TerrainMesh {
  const { bounds, terrain: p } = data;
  const minX = bounds.minX - p.meshMargin;
  const minZ = bounds.minZ - p.meshMargin;
  const cols = Math.ceil((bounds.maxX + p.meshMargin - minX) / p.cellSize) + 1;
  const rows = Math.ceil((bounds.maxZ + p.meshMargin - minZ) / p.cellSize) + 1;
  const vertices = new Float32Array(cols * rows * 3);
  for (let iz = 0; iz < rows; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const x = minX + ix * p.cellSize;
      const z = minZ + iz * p.cellSize;
      const o = (iz * cols + ix) * 3;
      vertices[o] = x;
      vertices[o + 1] = heightAt(x, z);
      vertices[o + 2] = z;
    }
  }
  const indices = new Uint32Array((cols - 1) * (rows - 1) * 6);
  let n = 0;
  for (let iz = 0; iz < rows - 1; iz++) {
    for (let ix = 0; ix < cols - 1; ix++) {
      const a = iz * cols + ix;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      // 上向き（+y）が表になる巻き順
      indices[n++] = a;
      indices[n++] = c;
      indices[n++] = b;
      indices[n++] = b;
      indices[n++] = c;
      indices[n++] = d;
    }
  }
  return { vertices, indices, cols, rows, minX, minZ, cellSize: p.cellSize };
}

const DEG = Math.PI / 180;
/** 箱の底面を地形へ埋め込む深さ（m）。 */
const EMBED = 1.2;

function footprintMinHeight(
  heightAt: (x: number, z: number) => number,
  x: number,
  z: number,
  hx: number,
  hz: number,
  yawDeg: number,
): number {
  const c = Math.cos(yawDeg * DEG);
  const s = Math.sin(yawDeg * DEG);
  let min = heightAt(x, z);
  for (const [lx, lz] of [
    [-hx, -hz],
    [hx, -hz],
    [-hx, hz],
    [hx, hz],
  ] as const) {
    // ヨー回転: ローカル +z が前方 (sin, cos)
    const wx = x + lx * c + lz * s;
    const wz = z - lx * s + lz * c;
    min = Math.min(min, heightAt(wx, wz));
  }
  return min;
}

function placeProps(
  props: readonly PropSpec[],
  heightAt: (x: number, z: number) => number,
): { boxes: PlacedBox[]; cylinders: PlacedCylinder[] } {
  const boxes: PlacedBox[] = [];
  const cylinders: PlacedCylinder[] = [];
  for (const prop of props) {
    if (prop.kind === 'block') {
      const yawDeg = prop.yawDeg ?? 0;
      const base =
        prop.baseY ?? footprintMinHeight(heightAt, prop.x, prop.z, prop.hx, prop.hz, yawDeg);
      const bottom = base - EMBED;
      const top = base + prop.height;
      boxes.push({
        id: prop.id,
        style: prop.style,
        x: prop.x,
        y: (top + bottom) / 2,
        z: prop.z,
        hx: prop.hx,
        hy: (top - bottom) / 2,
        hz: prop.hz,
        yawDeg,
      });
    } else if (prop.kind === 'stairs') {
      const base = heightAt(prop.x, prop.z);
      const fx = Math.sin(prop.yawDeg * DEG);
      const fz = Math.cos(prop.yawDeg * DEG);
      for (let i = 0; i < prop.steps; i++) {
        const dist = (i + 0.5) * prop.stepRun;
        const top = base + (i + 1) * prop.stepRise;
        const bottom = base - EMBED - 0.6;
        boxes.push({
          id: `${prop.id}-${i}`,
          style: 'stairs',
          x: prop.x + fx * dist,
          y: (top + bottom) / 2,
          z: prop.z + fz * dist,
          hx: prop.width / 2,
          hy: (top - bottom) / 2,
          hz: prop.stepRun / 2,
          yawDeg: prop.yawDeg,
        });
      }
    } else {
      const base = heightAt(prop.x, prop.z);
      cylinders.push({
        id: prop.id,
        style: prop.style,
        x: prop.x,
        y: base - 0.3,
        z: prop.z,
        radius: prop.radius,
        height: prop.height + 0.3,
      });
    }
  }
  return { boxes, cylinders };
}

function createBoundaryBoxes(data: LevelData): BoxSpec[] {
  const { minX, maxX, minZ, maxZ } = data.bounds;
  const t = 2; // 厚み（半分）
  const hy = 30;
  const lenX = (maxX - minX) / 2 + t * 2;
  const lenZ = (maxZ - minZ) / 2 + t * 2;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  return [
    { id: 'bound-w', x: minX - t, y: 0, z: cz, hx: t, hy, hz: lenZ },
    { id: 'bound-e', x: maxX + t, y: 0, z: cz, hx: t, hy, hz: lenZ },
    { id: 'bound-s', x: cx, y: 0, z: minZ - t, hx: lenX, hy, hz: t },
    { id: 'bound-n', x: cx, y: 0, z: maxZ + t, hx: lenX, hy, hz: t },
  ];
}

function placeGates(
  gates: readonly GateDef[],
  heightAt: (x: number, z: number) => number,
): PlacedGate[] {
  return gates.map((def) => {
    const y = heightAt(def.x, def.z);
    return {
      def,
      y,
      box: {
        id: def.id,
        x: def.x,
        y: y + def.height / 2,
        z: def.z,
        hx: def.width / 2,
        hy: def.height / 2 + EMBED / 2,
        hz: 0.3,
        yawDeg: def.yawDeg,
        enabled: def.blocking,
      },
    };
  });
}

/** データからレベルを組み立てる。 */
export function createLevel(data: LevelData): Level {
  const { heightAt, pathWeight, openDistance } = createTerrainFunctions(data);
  const areaOrder = data.areas;
  const surfaceAt = (x: number, z: number): SurfaceKind => {
    for (const area of areaOrder) if (insideShape(area.shape, x, z)) return area.surface;
    return 'grass';
  };
  const { boxes, cylinders } = placeProps(data.props, heightAt);
  return {
    data,
    heightAt,
    pathWeight,
    openDistance,
    surfaceAt,
    terrain: buildTerrainMesh(data, heightAt),
    boxes,
    cylinders,
    boundaryBoxes: createBoundaryBoxes(data),
    gates: placeGates(data.gates, heightAt),
  };
}

/** `data` の整合性を検証する。問題の説明を返す（空なら正常）。 */
export function validateLevel(data: LevelData): string[] {
  const problems: string[] = [];
  const { bounds } = data;
  const inBounds = (x: number, z: number): boolean =>
    x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;

  // エリア: ID の一意性、範囲内、重なりなし
  const areaIds = new Set<string>();
  for (const area of data.areas) {
    if (areaIds.has(area.id)) problems.push(`duplicate area id ${area.id}`);
    areaIds.add(area.id);
    const s = area.shape;
    const corners: [number, number][] =
      s.type === 'circle'
        ? [
            [s.cx - s.r, s.cz - s.r],
            [s.cx + s.r, s.cz + s.r],
          ]
        : [
            [s.minX, s.minZ],
            [s.maxX, s.maxZ],
          ];
    for (const [x, z] of corners) {
      if (!inBounds(x, z)) problems.push(`area ${area.id} is outside the bounds`);
    }
  }
  for (let i = 0; i < data.areas.length; i++) {
    for (let j = i + 1; j < data.areas.length; j++) {
      const a = data.areas[i];
      const b = data.areas[j];
      if (a && b && shapesOverlap(a.shape, b.shape)) {
        problems.push(`areas ${a.id} and ${b.id} overlap`);
      }
    }
  }

  const areaById = new Map(data.areas.map((a) => [a.id, a]));
  const ids = new Set<string>();
  const checkId = (id: string): void => {
    if (ids.has(id)) problems.push(`duplicate id ${id}`);
    ids.add(id);
  };
  const checkIn = (id: string, area: AreaId, x: number, z: number): void => {
    checkId(id);
    const def = areaById.get(area);
    if (!def) {
      problems.push(`${id}: unknown area ${area}`);
    } else if (!insideShape(def.shape, x, z)) {
      problems.push(`${id} (${x}, ${z}) is outside area ${area}`);
    }
  };
  for (const e of data.enemies) checkIn(e.id, e.area, e.x, e.z);
  for (const i of data.items) checkIn(i.id, i.area, i.x, i.z);
  for (const i of data.interactables) {
    if (i.area) checkIn(i.id, i.area, i.x, i.z);
    else checkId(i.id);
  }
  const interactableIds = new Set(data.interactables.map((i) => i.id));
  const gateIds = new Set<string>();
  for (const g of data.gates) {
    if (gateIds.has(g.id)) problems.push(`duplicate gate id ${g.id}`);
    gateIds.add(g.id);
    if (!inBounds(g.x, g.z)) problems.push(`gate ${g.id} is outside the bounds`);
    if (g.leverId && !interactableIds.has(g.leverId)) {
      problems.push(`gate ${g.id}: unknown lever ${g.leverId}`);
    }
  }
  for (const e of data.enemies) if (e.area === 'A') problems.push(`${e.id}: area A has no enemies`);

  // 門のインタラクト対象（kind: 'gate'）は同じ id の門を持つ
  for (const i of data.interactables) {
    if (i.kind === 'gate' && !gateIds.has(i.id)) problems.push(`${i.id}: no gate definition`);
  }

  const spawn = data.playerSpawn;
  const a = areaById.get('A');
  if (!inBounds(spawn.x, spawn.z)) problems.push('player spawn is outside the bounds');
  if (a && !insideShape(a.shape, spawn.x, spawn.z)) problems.push('player spawn is not in area A');
  if (!inBounds(data.bonfire.x, data.bonfire.z)) problems.push('bonfire is outside the bounds');
  if (a && !insideShape(a.shape, data.bonfire.x, data.bonfire.z)) {
    problems.push('bonfire is not in area A');
  }

  for (const prop of data.props) {
    checkId(prop.id);
    if (!inBounds(prop.x, prop.z)) problems.push(`${prop.id} is outside the bounds`);
    if (prop.kind === 'stairs' && prop.stepRise > 0.35) {
      problems.push(`${prop.id}: stepRise ${prop.stepRise} exceeds the 0.35m auto-step limit`);
    }
  }
  for (const p of data.route) {
    if (!inBounds(p.x, p.z)) problems.push(`route point (${p.x}, ${p.z}) is outside the bounds`);
  }
  return problems;
}

/** レベルごとのナビゲーション格子（静的な部分。門の開閉の状態は `NavGrid` が持つので Game ごとに作り直す）。 */
const navGridTemplates = new WeakMap<Level, NavGrid>();

/** 敵の経路問い合わせ（格子 A*）を作る。格子の生成は重い（数十 ms）ので、レベルごとに 1 回だけ。 */
export function createLevelNavigator(level: Level): GridNavigator {
  let grid = navGridTemplates.get(level);
  if (!grid) {
    grid = NavGrid.build(level);
    navGridTemplates.set(level, grid);
  }
  return new GridNavigator(grid.clone());
}

/**
 * `Game.create` へ渡すオプション（地形メッシュ・静的な箱・開始位置・敵の経路）。円柱は `game.addStaticCylinders(level.cylinders)` で足す。
 * 地形メッシュは描画（render/levelView）と同じ配列。
 */
export function levelGameOptions(
  level: Level,
): Required<
  Pick<
    GameOptions,
    'terrain' | 'terrainHeight' | 'boxes' | 'dummies' | 'spawn' | 'enemies' | 'enemyNavigator'
  >
> {
  return {
    terrain: { vertices: level.terrain.vertices, indices: level.terrain.indices },
    terrainHeight: level.heightAt,
    boxes: [...level.boxes, ...level.boundaryBoxes, ...level.gates.map((g) => g.box)],
    dummies: [],
    spawn: level.data.playerSpawn,
    enemies: level.data.enemies,
    enemyNavigator: createLevelNavigator(level),
  };
}
