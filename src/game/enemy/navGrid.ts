import { MOVEMENT } from '../data';
import type { Level, PlacedBox, PlacedCylinder, TerrainMesh } from '../world/level';

/**
 * 敵のナビゲーション用の格子（#43）。レベルデータ（地形の高さ・箱・円柱・門）から作る。
 *
 * 地形は平面（x, z）の高さ場として扱う（地下墓所も同じ高さ場の上にある）。各セルは
 *  - 表面の高さ: 地形、または乗れる低い箱・階段の上面
 *  - 固体: 高さ `stepHeight` を超える箱・円柱・外周の外
 * を持つ。隣り合うセルの高さの差が `maxSlopeDeg` の勾配を超える縁（崖・段差）は通れない。
 * 固体と通れない縁から `CLEARANCE_CELLS` セル以内を歩行不可にして、敵のカプセル（半径 0.35〜0.38m）が
 * 壁・崖縁に触れない余裕を取る。門は閉じている間だけ、周囲のセルを塞ぐ（開閉で `version` が進む）。
 */
export interface NavGridOptions {
  readonly cellSize?: number;
  /** 乗り越えられる段差（m）。 */
  readonly stepHeight?: number;
  /** 登れる坂の最大角度（度）。 */
  readonly maxSlopeDeg?: number;
}

export interface GridCell {
  readonly ix: number;
  readonly iz: number;
}

/** 歩行不可にする固体・縁からの距離（セル数）。0.25m × 3 = 0.75m（壁面から 0.5〜0.75m の余裕）。 */
const CLEARANCE_CELLS = 3;
const DEFAULT_CELL = 0.25;
/** `walkLine` が線の両側に取る余裕（m）。 */
const LINE_MARGIN = 0.15;
/** 壁・崖縁から この距離（セル）までは、近いほど経路探索のコストを上げて通路の中央を通す。 */
const CLEARANCE_COST_CELLS = 6;

const NEIGHBORS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

export class NavGrid {
  readonly cols: number;
  readonly rows: number;
  readonly minX: number;
  readonly minZ: number;
  readonly cellSize: number;
  /** セルの表面の高さ。 */
  readonly height: Float32Array;
  /** 静的な歩行可否（門は開いている扱い）。 */
  private readonly walkable: Uint8Array;
  /** 歩けないセルまでの距離（2 倍のセル数、最大 250）。壁沿いを避けるコストに使う。 */
  private readonly clearance: Uint8Array;
  /** 閉じている門が塞いでいる数。 */
  private readonly gateBlock: Uint8Array;
  private readonly gateCells = new Map<string, Int32Array>();
  private readonly gateClosed = new Map<string, boolean>();
  /** 門の開閉で進む。経路のキャッシュの無効化に使う。 */
  private versionCounter = 0;

  private constructor(
    cols: number,
    rows: number,
    minX: number,
    minZ: number,
    cellSize: number,
    height: Float32Array,
    walkable: Uint8Array,
    clearance: Uint8Array,
  ) {
    this.cols = cols;
    this.rows = rows;
    this.minX = minX;
    this.minZ = minZ;
    this.cellSize = cellSize;
    this.height = height;
    this.walkable = walkable;
    this.clearance = clearance;
    this.gateBlock = new Uint8Array(cols * rows);
  }

  get version(): number {
    return this.versionCounter;
  }

  get cellCount(): number {
    return this.cols * this.rows;
  }

  /** レベルから格子を作る。 */
  static build(level: Level, options: NavGridOptions = {}): NavGrid {
    const cellSize = options.cellSize ?? DEFAULT_CELL;
    const stepHeight = options.stepHeight ?? MOVEMENT.stepHeight;
    const slope = Math.tan(((options.maxSlopeDeg ?? MOVEMENT.maxSlopeDeg) * Math.PI) / 180);
    const { bounds } = level.data;
    const minX = bounds.minX;
    const minZ = bounds.minZ;
    const cols = Math.floor((bounds.maxX - minX) / cellSize) + 1;
    const rows = Math.floor((bounds.maxZ - minZ) / cellSize) + 1;
    const n = cols * rows;
    const height = new Float32Array(n);
    const ground = new Float32Array(n);
    const solid = new Uint8Array(n);
    for (let iz = 0; iz < rows; iz++) {
      for (let ix = 0; ix < cols; ix++) {
        const h = meshHeight(
          level.terrain,
          minX + (ix + 0.5) * cellSize,
          minZ + (iz + 0.5) * cellSize,
        );
        ground[iz * cols + ix] = h;
        height[iz * cols + ix] = h;
      }
    }
    const cell = { minX, minZ, cols, rows, cellSize };
    for (const box of level.boxes) rasterBox(cell, box, ground, height, solid, stepHeight);
    for (const cylinder of level.cylinders) rasterCylinder(cell, cylinder, ground, solid);

    // 通れない縁（崖・段差）にあたる両側のセルと、固体・外周に接するセルを「縁」とする
    const edge = new Uint8Array(n);
    for (let iz = 0; iz < rows; iz++) {
      for (let ix = 0; ix < cols; ix++) {
        const i = iz * cols + ix;
        if (solid[i]) {
          edge[i] = 1;
          continue;
        }
        const onBorder = ix === 0 || iz === 0 || ix === cols - 1 || iz === rows - 1;
        if (onBorder) edge[i] = 1;
        for (const [dx, dz] of NEIGHBORS) {
          const jx = ix + dx;
          const jz = iz + dz;
          if (jx < 0 || jz < 0 || jx >= cols || jz >= rows) continue;
          const j = jz * cols + jx;
          if (solid[j]) {
            edge[i] = 1;
            break;
          }
          const dist = cellSize * Math.hypot(dx, dz);
          if (Math.abs((height[j] ?? 0) - (height[i] ?? 0)) > dist * slope) {
            edge[i] = 1;
            break;
          }
        }
      }
    }
    // 縁から CLEARANCE_CELLS セルまで歩行不可（縁 = 距離 1。dilate を繰り返す）
    let blocked = edge;
    for (let step = 2; step < CLEARANCE_CELLS; step++) blocked = dilate(blocked, cols, rows);
    const walkable = new Uint8Array(n);
    for (let i = 0; i < n; i++) walkable[i] = blocked[i] ? 0 : 1;
    const clearance = clearanceField(walkable, cols, rows);

    const grid = new NavGrid(cols, rows, minX, minZ, cellSize, height, walkable, clearance);
    for (const gate of level.gates) {
      const cells = rasterGate(cell, gate.def, gate.box);
      grid.gateCells.set(gate.def.id, cells);
      grid.gateClosed.set(gate.def.id, false);
      grid.setGateClosed(gate.def.id, gate.box.enabled !== false);
    }
    return grid;
  }

  /** 静的なデータ（高さ・歩行可否）を共有し、門の開閉の状態だけ独立させた複製。 */
  clone(): NavGrid {
    const copy = new NavGrid(
      this.cols,
      this.rows,
      this.minX,
      this.minZ,
      this.cellSize,
      this.height,
      this.walkable,
      this.clearance,
    );
    copy.gateBlock.set(this.gateBlock);
    for (const [id, cells] of this.gateCells) copy.gateCells.set(id, cells);
    for (const [id, closed] of this.gateClosed) copy.gateClosed.set(id, closed);
    copy.versionCounter = this.versionCounter;
    return copy;
  }

  /** 門を閉じる / 開ける。変化があれば `version` が進む。門の id がなければ false。 */
  setGateClosed(id: string, closed: boolean): boolean {
    const cells = this.gateCells.get(id);
    if (!cells) return false;
    if (this.gateClosed.get(id) === closed) return true;
    this.gateClosed.set(id, closed);
    for (const i of cells) {
      const v = this.gateBlock[i] ?? 0;
      this.gateBlock[i] = closed ? v + 1 : Math.max(0, v - 1);
    }
    this.versionCounter++;
    return true;
  }

  index(ix: number, iz: number): number {
    return iz * this.cols + ix;
  }

  inside(ix: number, iz: number): boolean {
    return ix >= 0 && iz >= 0 && ix < this.cols && iz < this.rows;
  }

  cellX(x: number): number {
    return Math.floor((x - this.minX) / this.cellSize);
  }

  cellZ(z: number): number {
    return Math.floor((z - this.minZ) / this.cellSize);
  }

  centerX(ix: number): number {
    return this.minX + (ix + 0.5) * this.cellSize;
  }

  centerZ(iz: number): number {
    return this.minZ + (iz + 0.5) * this.cellSize;
  }

  /** (x, z) のセルの表面の高さ（格子の外は端のセル）。 */
  heightAtPoint(x: number, z: number): number {
    const ix = Math.min(this.cols - 1, Math.max(0, this.cellX(x)));
    const iz = Math.min(this.rows - 1, Math.max(0, this.cellZ(z)));
    return this.height[iz * this.cols + ix] ?? 0;
  }

  /** セル番号の歩行可否（門の開閉を反映）。 */
  isWalkableIndex(i: number): boolean {
    return this.walkable[i] === 1 && this.gateBlock[i] === 0;
  }

  isWalkable(ix: number, iz: number): boolean {
    return this.inside(ix, iz) && this.isWalkableIndex(iz * this.cols + ix);
  }

  /** 壁・崖縁を避けるコスト（0 = 十分に離れている、1 = 縁のすぐ隣）。 */
  edgePenalty(i: number): number {
    const cells = (this.clearance[i] ?? 250) / 2;
    return Math.max(0, CLEARANCE_COST_CELLS - cells) / CLEARANCE_COST_CELLS;
  }

  /** 世界座標 (x, z) のセルが歩けるか。 */
  isWalkableAt(x: number, z: number): boolean {
    return this.isWalkable(this.cellX(x), this.cellZ(z));
  }

  /**
   * (x, z) に最も近い歩けるセルの番号（`maxCells` セル以内。なければ -1）。
   * 歩けるセルの上ならそのセル。
   */
  nearestWalkable(x: number, z: number, maxCells = 12): number {
    const cx = this.cellX(x);
    const cz = this.cellZ(z);
    if (this.isWalkable(cx, cz)) return cz * this.cols + cx;
    let best = -1;
    let bestD = Infinity;
    for (let r = 1; r <= maxCells; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const ix = cx + dx;
          const iz = cz + dz;
          if (!this.isWalkable(ix, iz)) continue;
          const d = (this.centerX(ix) - x) ** 2 + (this.centerZ(iz) - z) ** 2;
          if (d < bestD) {
            bestD = d;
            best = iz * this.cols + ix;
          }
        }
      }
      // 次のリングはこの距離より必ず遠い
      if (best >= 0 && bestD <= (r * this.cellSize) ** 2) break;
    }
    return best;
  }

  /**
   * 線分 (ax, az)–(bx, bz) が歩けるセルだけを通るか。始点と終点から `endSlack`（m）以内は
   * 判定しない（壁際に立つ敵・プレイヤーが縁のセルにいても直線で近付けるように）。
   */
  walkLine(ax: number, az: number, bx: number, bz: number, endSlack = 0.8): boolean {
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) return true;
    const step = this.cellSize * 0.5;
    const count = Math.ceil(len / step);
    // 凸の角を掠めないよう、線の両側 LINE_MARGIN の点も調べる
    const nx = (-dz / len) * LINE_MARGIN;
    const nz = (dx / len) * LINE_MARGIN;
    for (let k = 0; k <= count; k++) {
      const d = Math.min(len, k * step);
      if (d < endSlack || len - d < endSlack) continue;
      const t = d / len;
      const x = ax + dx * t;
      const z = az + dz * t;
      if (
        !this.isWalkableAt(x, z) ||
        !this.isWalkableAt(x + nx, z + nz) ||
        !this.isWalkableAt(x - nx, z - nz)
      ) {
        return false;
      }
    }
    return true;
  }
}

/** 歩けないセルまでの距離（chamfer 2-3 距離。値 2 = 1 セル）。歩けないセルは 0。 */
function clearanceField(walkable: Uint8Array, cols: number, rows: number): Uint8Array<ArrayBuffer> {
  const d = new Uint8Array(walkable.length);
  const MAX = 250;
  for (let i = 0; i < d.length; i++) d[i] = walkable[i] ? MAX : 0;
  const at = (ix: number, iz: number): number =>
    ix < 0 || iz < 0 || ix >= cols || iz >= rows ? 0 : (d[iz * cols + ix] ?? 0);
  for (let iz = 0; iz < rows; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const i = iz * cols + ix;
      if (!d[i]) continue;
      d[i] = Math.min(
        d[i] ?? MAX,
        at(ix - 1, iz) + 2,
        at(ix, iz - 1) + 2,
        at(ix - 1, iz - 1) + 3,
        at(ix + 1, iz - 1) + 3,
      );
    }
  }
  for (let iz = rows - 1; iz >= 0; iz--) {
    for (let ix = cols - 1; ix >= 0; ix--) {
      const i = iz * cols + ix;
      if (!d[i]) continue;
      d[i] = Math.min(
        d[i] ?? MAX,
        at(ix + 1, iz) + 2,
        at(ix, iz + 1) + 2,
        at(ix + 1, iz + 1) + 3,
        at(ix - 1, iz + 1) + 3,
      );
    }
  }
  return d;
}

/** 地形メッシュ（衝突と同じ頂点・三角形）の (x, z) での高さ。`heightAt` より速く、実際の足元と一致する。 */
function meshHeight(mesh: TerrainMesh, x: number, z: number): number {
  const fx = (x - mesh.minX) / mesh.cellSize;
  const fz = (z - mesh.minZ) / mesh.cellSize;
  const ix = Math.min(mesh.cols - 2, Math.max(0, Math.floor(fx)));
  const iz = Math.min(mesh.rows - 2, Math.max(0, Math.floor(fz)));
  const u = Math.min(1, Math.max(0, fx - ix));
  const v = Math.min(1, Math.max(0, fz - iz));
  const at = (cx: number, cz: number): number => mesh.vertices[(cz * mesh.cols + cx) * 3 + 1] ?? 0;
  const ha = at(ix, iz);
  const hb = at(ix + 1, iz);
  const hc = at(ix, iz + 1);
  const hd = at(ix + 1, iz + 1);
  // 四角は b–c の対角線で 2 枚の三角形（a, c, b）と（b, c, d）に分かれる
  return u + v <= 1
    ? ha + u * (hb - ha) + v * (hc - ha)
    : hd + (1 - u) * (hc - hd) + (1 - v) * (hb - hd);
}

/** 値の立っているセルの 8 近傍へ広げる。 */
function dilate(src: Uint8Array, cols: number, rows: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(src.length);
  for (let iz = 0; iz < rows; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const i = iz * cols + ix;
      if (src[i]) {
        out[i] = 1;
        continue;
      }
      for (const [dx, dz] of NEIGHBORS) {
        const jx = ix + dx;
        const jz = iz + dz;
        if (jx < 0 || jz < 0 || jx >= cols || jz >= rows) continue;
        if (src[jz * cols + jx]) {
          out[i] = 1;
          break;
        }
      }
    }
  }
  return out;
}

interface CellSpace {
  readonly minX: number;
  readonly minZ: number;
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;
}

const DEG = Math.PI / 180;

/** 回転した長方形（中心 (cx, cz)、半幅 hx / hz、ヨー）に中心が入るセルを列挙する。 */
function forEachCellInRect(
  space: CellSpace,
  cx: number,
  cz: number,
  hx: number,
  hz: number,
  yawDeg: number,
  visit: (i: number) => void,
): void {
  const c = Math.cos(yawDeg * DEG);
  const s = Math.sin(yawDeg * DEG);
  const ex = Math.abs(c) * hx + Math.abs(s) * hz;
  const ez = Math.abs(s) * hx + Math.abs(c) * hz;
  const x0 = Math.max(0, Math.floor((cx - ex - space.minX) / space.cellSize));
  const x1 = Math.min(space.cols - 1, Math.floor((cx + ex - space.minX) / space.cellSize));
  const z0 = Math.max(0, Math.floor((cz - ez - space.minZ) / space.cellSize));
  const z1 = Math.min(space.rows - 1, Math.floor((cz + ez - space.minZ) / space.cellSize));
  for (let iz = z0; iz <= z1; iz++) {
    for (let ix = x0; ix <= x1; ix++) {
      const dx = space.minX + (ix + 0.5) * space.cellSize - cx;
      const dz = space.minZ + (iz + 0.5) * space.cellSize - cz;
      // ローカル +z が前方 (sin yaw, cos yaw)
      const lx = dx * c - dz * s;
      const lz = dx * s + dz * c;
      if (Math.abs(lx) <= hx && Math.abs(lz) <= hz) visit(iz * space.cols + ix);
    }
  }
}

function rasterBox(
  space: CellSpace,
  box: PlacedBox,
  ground: Float32Array,
  height: Float32Array,
  solid: Uint8Array,
  stepHeight: number,
): void {
  const top = box.y + box.hy;
  const walkableTop = box.style === 'stairs';
  // 壁は半セルぶん広げて塗る（薄い柵がセルの中心の間をすり抜けないように）。階段は表面の高さだけなので広げない
  const grow = walkableTop ? 0 : space.cellSize / 2;
  forEachCellInRect(space, box.x, box.z, box.hx + grow, box.hz + grow, box.yawDeg ?? 0, (i) => {
    const g = ground[i] ?? 0;
    if (!walkableTop && top - g > stepHeight) {
      solid[i] = 1;
    } else if (top > (height[i] ?? 0)) {
      height[i] = top;
    }
  });
}

function rasterCylinder(
  space: CellSpace,
  cylinder: PlacedCylinder,
  ground: Float32Array,
  solid: Uint8Array,
): void {
  const r = cylinder.radius;
  const x0 = Math.max(0, Math.floor((cylinder.x - r - space.minX) / space.cellSize));
  const x1 = Math.min(space.cols - 1, Math.floor((cylinder.x + r - space.minX) / space.cellSize));
  const z0 = Math.max(0, Math.floor((cylinder.z - r - space.minZ) / space.cellSize));
  const z1 = Math.min(space.rows - 1, Math.floor((cylinder.z + r - space.minZ) / space.cellSize));
  for (let iz = z0; iz <= z1; iz++) {
    for (let ix = x0; ix <= x1; ix++) {
      const dx = space.minX + (ix + 0.5) * space.cellSize - cylinder.x;
      const dz = space.minZ + (iz + 0.5) * space.cellSize - cylinder.z;
      if (dx * dx + dz * dz > r * r) continue;
      const i = iz * space.cols + ix;
      if (cylinder.y + cylinder.height - (ground[i] ?? 0) > MOVEMENT.stepHeight) solid[i] = 1;
    }
  }
}

/** 門のコライダ（薄い板）の周囲のセル。板は 1 セルより薄いので、前後 1 セルずつ厚くして確実に塞ぐ。 */
function rasterGate(
  space: CellSpace,
  def: { readonly yawDeg: number },
  box: { readonly x: number; readonly z: number; readonly hx: number; readonly hz: number },
): Int32Array {
  const cells: number[] = [];
  forEachCellInRect(space, box.x, box.z, box.hx, box.hz + space.cellSize, def.yawDeg, (i) =>
    cells.push(i),
  );
  return Int32Array.from(cells);
}
