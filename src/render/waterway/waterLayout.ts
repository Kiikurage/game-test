/**
 * 地下水路の水（#270）の配置データ（純粋ロジック。three / DOM に依存しない）。
 *
 * - 格子 `WaterGrid`: 水面の矩形の和を覆う一様な格子（セル = 波のシミュレーションの 1 マス）。
 *   - `mask`: 水のセルか（区画の中で、障害物（石棺）の外）。外側を `PAD` マスの陸で囲むので、水のセルの 4 近傍は必ず格子内。
 *   - `wallDistance`: いちばん近い陸（壁・段・石棺）までの距離（m。`MAX_WALL_DISTANCE` で打ち切り）。水際の泡・濡れ帯に使う。
 *   - `flow`: 水の流れ（m/s。セルごとに vx, vz）。上り階段の下（水が流れ込む口）からいちばん遠い水の端（床板の真下の排水口）へ
 *     流れるポテンシャル流（ラプラス方程式）。行き止まり（墓室）はほぼ止まる。
 * - 水面のメッシュ `buildWaterSurface`: 区画の境界を含む共通の格子線で割るので、区画の継ぎ目に T 字の頂点（ひび）ができない。
 */
import type { RectDef, WaterwayRect } from '../../game/world/level';

/** 格子の外周の陸のマス数。 */
export const PAD = 2;
/** 壁までの距離の打ち切り（m）。 */
export const MAX_WALL_DISTANCE = 1.5;
/** 流れの代表的な速さ（m/s。水路の中ほど）。 */
export const FLOW_SPEED = 0.16;
/** 流れのポテンシャルを解く粗い格子（m）。 */
const FLOW_CELL = 0.25;

export interface WaterLayoutInput {
  /** 水路の全区画（段・出口を含む。水の区画は `water`）。 */
  readonly rects: readonly WaterwayRect[];
  /** 水深（m）。 */
  readonly depth: number;
  /** 水を張らない矩形（石棺など）。 */
  readonly obstacles: readonly RectDef[];
}

export interface WaterGrid {
  readonly originX: number;
  readonly originZ: number;
  /** セルの一辺（m）。 */
  readonly cell: number;
  readonly nx: number;
  readonly nz: number;
  /** 1 = 水。 */
  readonly mask: Uint8Array;
  readonly wallDistance: Float32Array;
  /** セルごとに (vx, vz)。 */
  readonly flow: Float32Array;
  /** 水底の高さ。 */
  readonly floorY: number;
  /** 水面の高さ。 */
  readonly surfaceY: number;
}

const inside = (r: RectDef, x: number, z: number): boolean =>
  x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ;

/** 水の区画の外接矩形。 */
export function waterBounds(rects: readonly WaterwayRect[]): RectDef {
  const water = rects.filter((r) => r.water);
  if (water.length === 0) throw new Error('no water rects');
  return {
    minX: Math.min(...water.map((r) => r.minX)),
    maxX: Math.max(...water.map((r) => r.maxX)),
    minZ: Math.min(...water.map((r) => r.minZ)),
    maxZ: Math.max(...water.map((r) => r.maxZ)),
  };
}

interface Lattice {
  readonly originX: number;
  readonly originZ: number;
  readonly cell: number;
  readonly nx: number;
  readonly nz: number;
}

function lattice(bounds: RectDef, cell: number): Lattice {
  return {
    originX: bounds.minX - PAD * cell,
    originZ: bounds.minZ - PAD * cell,
    cell,
    nx: Math.ceil((bounds.maxX - bounds.minX) / cell) + PAD * 2,
    nz: Math.ceil((bounds.maxZ - bounds.minZ) / cell) + PAD * 2,
  };
}

function rasterMask(l: Lattice, input: WaterLayoutInput): Uint8Array {
  const water = input.rects.filter((r) => r.water);
  const mask = new Uint8Array(l.nx * l.nz);
  for (let j = PAD; j < l.nz - PAD; j++) {
    const z = l.originZ + (j + 0.5) * l.cell;
    for (let i = PAD; i < l.nx - PAD; i++) {
      const x = l.originX + (i + 0.5) * l.cell;
      if (!water.some((r) => inside(r, x, z))) continue;
      if (input.obstacles.some((o) => inside(o, x, z))) continue;
      mask[j * l.nx + i] = 1;
    }
  }
  return mask;
}

/** 陸までの距離（8 近傍のチャンファー距離 1 / √2。2 パス）。 */
function distanceToLand(l: Lattice, mask: Uint8Array): Float32Array {
  const { nx, nz } = l;
  const inf = 1e9;
  const d = new Float32Array(nx * nz);
  for (let k = 0; k < d.length; k++) d[k] = mask[k] ? inf : 0;
  const D = Math.SQRT2;
  const relax = (k: number, n: number, w: number): void => {
    const v = (d[n] ?? 0) + w;
    if (v < (d[k] ?? 0)) d[k] = v;
  };
  for (let j = 1; j < nz - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const k = j * nx + i;
      if (!mask[k]) continue;
      relax(k, k - 1, 1);
      relax(k, k - nx, 1);
      relax(k, k - nx - 1, D);
      relax(k, k - nx + 1, D);
    }
  }
  for (let j = nz - 2; j >= 1; j--) {
    for (let i = nx - 2; i >= 1; i--) {
      const k = j * nx + i;
      if (!mask[k]) continue;
      relax(k, k + 1, 1);
      relax(k, k + nx, 1);
      relax(k, k + nx + 1, D);
      relax(k, k + nx - 1, D);
    }
  }
  // 陸のセルの中心から水のセルの中心までの距離 → 壁の面までの距離（半セル引く）
  for (let k = 0; k < d.length; k++) {
    d[k] = mask[k] ? Math.min(MAX_WALL_DISTANCE, Math.max(0, ((d[k] ?? 0) - 0.5) * l.cell)) : 0;
  }
  return d;
}

/**
 * 粗い格子でポテンシャル流を解く。流入口 = 水の区画が水のない区画（上り階段）に接する辺、
 * 排水口 = 流入口から（水の中を通って）いちばん遠い水のセルの周り。
 */
function solveFlow(input: WaterLayoutInput, bounds: RectDef): { l: Lattice; v: Float32Array } {
  const l = lattice(bounds, FLOW_CELL);
  const { nx, nz } = l;
  const mask = rasterMask(l, input);
  const n = nx * nz;
  const water = input.rects.filter((r) => r.water);
  const dry = input.rects.filter((r) => !r.water);
  // 流入口: 水のセルのうち、隣（半セル外）が水のない区画の中にあるもの
  const inlet = new Uint8Array(n);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (!mask[k]) continue;
      const x = l.originX + (i + 0.5) * l.cell;
      const z = l.originZ + (j + 0.5) * l.cell;
      const h = l.cell;
      const probes: [number, number][] = [
        [x + h, z],
        [x - h, z],
        [x, z + h],
        [x, z - h],
      ];
      if (
        probes.some(
          ([px, pz]) => dry.some((r) => inside(r, px, pz)) && !water.some((r) => inside(r, px, pz)),
        )
      ) {
        inlet[k] = 1;
      }
    }
  }
  // 流入口からの水の中の距離（BFS）
  const dist = new Float32Array(n).fill(-1);
  const queue: number[] = [];
  for (let k = 0; k < n; k++) {
    if (inlet[k]) {
      dist[k] = 0;
      queue.push(k);
    }
  }
  if (queue.length === 0) {
    // 流入口がない（閉じた池）: 流れなし
    return { l, v: new Float32Array(n * 2) };
  }
  for (let q = 0; q < queue.length; q++) {
    const k = queue[q] ?? 0;
    for (const nb of [k + 1, k - 1, k + nx, k - nx]) {
      if (mask[nb] && (dist[nb] ?? 0) < 0) {
        dist[nb] = (dist[k] ?? 0) + 1;
        queue.push(nb);
      }
    }
  }
  let maxDist = 0;
  for (let k = 0; k < n; k++) maxDist = Math.max(maxDist, dist[k] ?? 0);
  // 排水口: いちばん遠い所から 1m 以内
  const drainBand = 1 / l.cell;
  const fixed = new Uint8Array(n);
  const phi = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    if (!mask[k]) continue;
    const dk = dist[k] ?? 0;
    phi[k] = dk < 0 ? 0 : 1 - dk / Math.max(1, maxDist);
    if (inlet[k]) {
      fixed[k] = 1;
      phi[k] = 1;
    } else if (dk >= maxDist - drainBand) {
      fixed[k] = 1;
      phi[k] = 0;
    }
  }
  // SOR（壁はノイマン条件: 陸の隣は自分の値）。初期値が BFS 距離なので角をならす程度で収束する
  const omega = 1.85;
  for (let it = 0; it < 600; it++) {
    for (let j = 1; j < nz - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const k = j * nx + i;
        if (!mask[k] || fixed[k]) continue;
        const c = phi[k] ?? 0;
        let s = 0;
        for (const nb of [k + 1, k - 1, k + nx, k - nx]) s += mask[nb] ? (phi[nb] ?? 0) : c;
        phi[k] = c + omega * (s / 4 - c);
      }
    }
  }
  // 速度 = -∇φ（陸の隣は片側差分）
  const v = new Float32Array(n * 2);
  const speeds: number[] = [];
  const at = (k: number, nb: number): number => (mask[nb] ? (phi[nb] ?? 0) : (phi[k] ?? 0));
  for (let j = 1; j < nz - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const k = j * nx + i;
      if (!mask[k]) continue;
      const gx = (at(k, k + 1) - at(k, k - 1)) / (2 * l.cell);
      const gz = (at(k, k + nx) - at(k, k - nx)) / (2 * l.cell);
      v[k * 2] = -gx;
      v[k * 2 + 1] = -gz;
      speeds.push(Math.hypot(gx, gz));
    }
  }
  speeds.sort((a, b) => a - b);
  // 中央値より上（= 本流）の代表値を FLOW_SPEED に合わせる
  const ref = speeds[Math.floor(speeds.length * 0.7)] ?? 1;
  const scale = ref > 0 ? FLOW_SPEED / ref : 0;
  for (let k = 0; k < v.length; k++) {
    // 排水口・流入口付近で速くなりすぎないよう 2 倍で頭打ち
    v[k] = Math.max(-FLOW_SPEED * 2, Math.min(FLOW_SPEED * 2, (v[k] ?? 0) * scale));
  }
  return { l, v };
}

/** 粗い格子の流れを細かい格子へ双線形で写す（陸のセルは寄与させない）。 */
function resampleFlow(
  coarse: { l: Lattice; v: Float32Array },
  fine: Lattice,
  mask: Uint8Array,
  coarseMask: Uint8Array,
): Float32Array {
  const out = new Float32Array(fine.nx * fine.nz * 2);
  const c = coarse.l;
  for (let j = 0; j < fine.nz; j++) {
    for (let i = 0; i < fine.nx; i++) {
      const k = j * fine.nx + i;
      if (!mask[k]) continue;
      const x = fine.originX + (i + 0.5) * fine.cell;
      const z = fine.originZ + (j + 0.5) * fine.cell;
      const u = (x - c.originX) / c.cell - 0.5;
      const w = (z - c.originZ) / c.cell - 0.5;
      const i0 = Math.floor(u);
      const j0 = Math.floor(w);
      const fu = u - i0;
      const fw = w - j0;
      let sx = 0;
      let sz = 0;
      let sw = 0;
      for (let dj = 0; dj <= 1; dj++) {
        for (let di = 0; di <= 1; di++) {
          const ci = Math.min(c.nx - 1, Math.max(0, i0 + di));
          const cj = Math.min(c.nz - 1, Math.max(0, j0 + dj));
          const ck = cj * c.nx + ci;
          if (!coarseMask[ck]) continue;
          const wgt = (di ? fu : 1 - fu) * (dj ? fw : 1 - fw);
          sx += (coarse.v[ck * 2] ?? 0) * wgt;
          sz += (coarse.v[ck * 2 + 1] ?? 0) * wgt;
          sw += wgt;
        }
      }
      if (sw > 1e-6) {
        out[k * 2] = sx / sw;
        out[k * 2 + 1] = sz / sw;
      }
    }
  }
  return out;
}

/** 水の格子を作る。`cell` はシミュレーションのセルの一辺（m）。 */
export function buildWaterGrid(input: WaterLayoutInput, cell: number): WaterGrid {
  const water = input.rects.filter((r) => r.water);
  const bounds = waterBounds(input.rects);
  const l = lattice(bounds, cell);
  const mask = rasterMask(l, input);
  const wallDistance = distanceToLand(l, mask);
  const coarse = solveFlow(input, bounds);
  const flow = resampleFlow(coarse, l, mask, rasterMask(coarse.l, input));
  const floorY = Math.min(...water.map((r) => r.floorY));
  return { ...l, mask, wallDistance, flow, floorY, surfaceY: floorY + input.depth };
}

/** (x, z) を含むセルの番号。格子の外なら -1。 */
export function cellIndex(grid: Lattice, x: number, z: number): number {
  const i = Math.floor((x - grid.originX) / grid.cell);
  const j = Math.floor((z - grid.originZ) / grid.cell);
  if (i < 0 || j < 0 || i >= grid.nx || j >= grid.nz) return -1;
  return j * grid.nx + i;
}

/** (x, z) が水の上か。 */
export function isWater(grid: WaterGrid, x: number, z: number): boolean {
  const k = cellIndex(grid, x, z);
  return k >= 0 && grid.mask[k] === 1;
}

export interface WaterSurfaceMesh {
  /** xyz。 */
  readonly positions: Float32Array;
  readonly indices: Uint32Array;
}

/**
 * 水面のメッシュ（高さ `y` の水平な格子）。x / z の格子線は「`step` ごとの線 + 全区画の境界」の共通の線で、
 * 区画の中の四角だけを張る。隣り合う区画は同じ頂点を共有する（波で上下に動かしても継ぎ目が割れない）。
 */
export function buildWaterSurface(
  rects: readonly RectDef[],
  y: number,
  step: number,
): WaterSurfaceMesh {
  const bounds = {
    minX: Math.min(...rects.map((r) => r.minX)),
    maxX: Math.max(...rects.map((r) => r.maxX)),
    minZ: Math.min(...rects.map((r) => r.minZ)),
    maxZ: Math.max(...rects.map((r) => r.maxZ)),
  };
  const lines = (lo: number, hi: number, edges: number[]): number[] => {
    const set = new Set<number>();
    const round = (v: number): number => Math.round(v * 1e5) / 1e5;
    for (let v = lo; v < hi - 1e-6; v += step) set.add(round(v));
    for (const e of edges) set.add(round(e));
    set.add(round(hi));
    const sorted = [...set].sort((a, b) => a - b);
    // 境界のすぐ近くの線（細すぎる四角）を間引く。境界の線は残す
    const edgeSet = new Set(edges.map(round));
    const out: number[] = [];
    for (const v of sorted) {
      const prev = out[out.length - 1];
      if (prev !== undefined && v - prev < step * 0.35) {
        if (edgeSet.has(v) && !edgeSet.has(prev)) out[out.length - 1] = v;
        continue;
      }
      out.push(v);
    }
    return out;
  };
  const xs = lines(
    bounds.minX,
    bounds.maxX,
    rects.flatMap((r) => [r.minX, r.maxX]),
  );
  const zs = lines(
    bounds.minZ,
    bounds.maxZ,
    rects.flatMap((r) => [r.minZ, r.maxZ]),
  );
  const vertexOf = new Int32Array(xs.length * zs.length).fill(-1);
  const positions: number[] = [];
  const indices: number[] = [];
  const vertex = (i: number, j: number): number => {
    const key = j * xs.length + i;
    let v = vertexOf[key] ?? -1;
    if (v < 0) {
      v = positions.length / 3;
      positions.push(xs[i] ?? 0, y, zs[j] ?? 0);
      vertexOf[key] = v;
    }
    return v;
  };
  for (let j = 0; j + 1 < zs.length; j++) {
    const cz = ((zs[j] ?? 0) + (zs[j + 1] ?? 0)) / 2;
    for (let i = 0; i + 1 < xs.length; i++) {
      const cx = ((xs[i] ?? 0) + (xs[i + 1] ?? 0)) / 2;
      if (!rects.some((r) => inside(r, cx, cz))) continue;
      const a = vertex(i, j);
      const b = vertex(i + 1, j);
      const c = vertex(i, j + 1);
      const d = vertex(i + 1, j + 1);
      // 上向き（+y）の面: a → c → b, b → c → d
      indices.push(a, c, b, b, c, d);
    }
  }
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}
