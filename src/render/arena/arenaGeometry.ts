import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * 闘技場（F）の幾何（純粋な頂点生成。GPU に依存しない）。
 * すべて頂点属性 `wallS`（面に沿った座標 m）と `wallV`（面に沿った高さ方向の座標 m）を持つ。
 * 石積みのマテリアル（`arenaMaterials.ts`）が、この 2 つで石の段と目地を決める。
 */

const TAU = Math.PI * 2;

function hash1(n: number): number {
  let h = Math.imul(Math.floor(n) | 0, 374761393) + 668265263;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** 位置（x, y, z）・法線・石積み座標（s, v）を貯めて BufferGeometry にする小さなビルダ。 */
class MeshBuilder {
  private readonly pos: number[] = [];
  private readonly nor: number[] = [];
  private readonly ws: number[] = [];
  private readonly wv: number[] = [];
  private readonly idx: number[] = [];

  get vertexCount(): number {
    return this.pos.length / 3;
  }

  vertex(
    x: number,
    y: number,
    z: number,
    nx: number,
    ny: number,
    nz: number,
    s: number,
    v: number,
  ) {
    this.pos.push(x, y, z);
    this.nor.push(nx, ny, nz);
    this.ws.push(s);
    this.wv.push(v);
    return this.vertexCount - 1;
  }

  quad(a: number, b: number, c: number, d: number, flip = false): void {
    if (flip) this.idx.push(a, c, b, a, d, c);
    else this.idx.push(a, b, c, a, c, d);
  }

  build(): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.nor, 3));
    g.setAttribute('wallS', new Float32BufferAttribute(this.ws, 1));
    g.setAttribute('wallV', new Float32BufferAttribute(this.wv, 1));
    g.setIndex(new Uint32BufferAttribute(this.idx, 1));
    return g;
  }
}

/** 回転体の 1 区間: 断面 `rows`（下から上。r は基準半径、y は高さ）を `segs` 分割で回す。フルートの溝つき。 */
interface Band {
  readonly rows: readonly { readonly y: number; readonly r: number }[];
  /** 溝の本数（0 = 円筒）。 */
  readonly flutes?: number;
  /** 溝の深さ（半径の割合）。 */
  readonly fluteDepth?: number;
  /** 円盤で蓋をする（上面 / 下面）。 */
  readonly capTop?: boolean;
  readonly capBottom?: boolean;
}

/** 法線の求め方: 回転体の面法線を解析的に出す（段の境目は区間ごとに頂点を分けるので硬い縁になる）。 */
function addBand(
  b: MeshBuilder,
  cx: number,
  baseY: number,
  cz: number,
  band: Band,
  segs: number,
  sPerRad: number,
): void {
  const { rows } = band;
  const flutes = band.flutes ?? 0;
  const depth = band.fluteDepth ?? 0;
  /** 角度 θ での半径係数（溝の円弧: 稜線は尖り、溝は丸い）。 */
  const radial = (theta: number): number => {
    if (flutes === 0) return 1;
    const phi = (theta / TAU) * flutes;
    const u = (phi - Math.floor(phi)) * 2 - 1;
    return 1 - depth * (1 - u * u);
  };
  const first = b.vertexCount;
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    if (!row) continue;
    const prev = rows[Math.max(0, ri - 1)] ?? row;
    const next = rows[Math.min(rows.length - 1, ri + 1)] ?? row;
    // 断面の傾き → 法線の上下成分
    const dr = next.r - prev.r;
    const dy = next.y - prev.y || 1e-6;
    const ny = -dr / Math.hypot(dr, dy);
    const nr = dy / Math.hypot(dr, dy);
    for (let si = 0; si <= segs; si++) {
      const theta = (si / segs) * TAU;
      const f = radial(theta);
      const r = row.r * f;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      // 溝の斜面の分だけ外向きの法線を傾ける（数値微分）
      let nx = c;
      let nz = s;
      if (flutes > 0) {
        const e = 1e-3;
        const dfdt = (radial(theta + e) - radial(theta - e)) / (2 * e);
        const tr = row.r * dfdt; // d r / d theta
        // 接線 = (-r sin + tr cos, r cos + tr sin)。外向き法線 = 接線を 90° 回したもの
        const tx = -r * s + tr * c;
        const tz = r * c + tr * s;
        const len = Math.hypot(tx, tz) || 1;
        nx = tz / len;
        nz = -tx / len;
      }
      b.vertex(cx + c * r, baseY + row.y, cz + s * r, nx * nr, ny, nz * nr, theta * sPerRad, row.y);
    }
  }
  const stride = segs + 1;
  for (let ri = 0; ri < rows.length - 1; ri++) {
    for (let si = 0; si < segs; si++) {
      const a = first + ri * stride + si;
      b.quad(a, a + 1, a + 1 + stride, a + stride, true);
    }
  }
  const cap = (top: boolean): void => {
    const row = top ? rows[rows.length - 1] : rows[0];
    if (!row) return;
    const ny = top ? 1 : -1;
    const centre = b.vertex(cx, baseY + row.y, cz, 0, ny, 0, 0, 0);
    const ring: number[] = [];
    for (let si = 0; si <= segs; si++) {
      const theta = (si / segs) * TAU;
      const f = radial(theta);
      ring.push(
        b.vertex(
          cx + Math.cos(theta) * row.r * f,
          baseY + row.y,
          cz + Math.sin(theta) * row.r * f,
          0,
          ny,
          0,
          Math.cos(theta) * row.r,
          Math.sin(theta) * row.r,
        ),
      );
    }
    for (let si = 0; si < segs; si++) {
      const a = ring[si] ?? 0;
      const c = ring[si + 1] ?? 0;
      if (top) b.quad(centre, c, c, a);
      else b.quad(centre, a, a, c);
    }
  };
  if (band.capTop) cap(true);
  if (band.capBottom) cap(false);
}

/** 三角形（縮退四角形）のキャップを素直に三角形で出すため、quad(a,b,b,d) を三角形に直す。 */
function dropDegenerate(g: BufferGeometry): BufferGeometry {
  const index = g.getIndex();
  if (!index) return g;
  const out: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    if (a !== b && b !== c && a !== c) out.push(a, b, c);
  }
  g.setIndex(new Uint32BufferAttribute(out, 1));
  return g;
}

export interface ColumnSpec {
  readonly x: number;
  /** 床の高さ。 */
  readonly y: number;
  readonly z: number;
  /** 衝突半径（m）。柱の軸の半径と同じ。 */
  readonly radius: number;
  /** 床から頭までの高さ（m）。 */
  readonly height: number;
}

/**
 * 古い石柱: 張り出した礎盤 → 段 → フルート（縦溝）つきの軸（ゆるい膨らみ）→ 首 → 柱頭。
 * 軸の半径が衝突半径と一致する（礎盤・柱頭は少し張り出す）。
 */
export function createColumnGeometry(spec: ColumnSpec, segs = 56): BufferGeometry {
  const { x, y, z, radius: R, height: H } = spec;
  const k = H / 4;
  const b = new MeshBuilder();
  const sPer = R;
  // 礎盤（2 段）
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: 0, r: 1.22 * R },
        { y: 0.16 * k, r: 1.22 * R },
      ],
      capBottom: true,
    },
    segs,
    sPer,
  );
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: 0.16 * k, r: 1.22 * R },
        { y: 0.2 * k, r: 1.12 * R },
      ],
      capTop: false,
    },
    segs,
    sPer,
  );
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: 0.2 * k, r: 1.12 * R },
        { y: 0.36 * k, r: 1.12 * R },
      ],
      capTop: true,
    },
    segs,
    sPer,
  );
  // 軸（フルート 14 本、下ほど太い緩やかな膨らみ）
  const shaftRows: { y: number; r: number }[] = [];
  const shaftBottom = 0.36 * k;
  const shaftTop = 3.5 * k;
  const rowsN = 7;
  for (let i = 0; i <= rowsN; i++) {
    const t = i / rowsN;
    const entasis = 1 + 0.045 * Math.sin(Math.PI * Math.min(1, t * 1.15)) - 0.1 * t;
    shaftRows.push({ y: shaftBottom + (shaftTop - shaftBottom) * t, r: R * entasis });
  }
  addBand(b, x, y, z, { rows: shaftRows, flutes: 12, fluteDepth: 0.12 }, segs, sPer);
  // 首環 → 柱頭（皿形に広がる）
  const top = shaftRows[shaftRows.length - 1]?.r ?? R;
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: shaftTop, r: top * 1.08 },
        { y: 3.58 * k, r: top * 1.08 },
      ],
    },
    segs,
    sPer,
  );
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: 3.58 * k, r: top * 0.98 },
        { y: 3.66 * k, r: top * 1.0 },
        { y: 3.8 * k, r: top * 1.22 },
        { y: 3.9 * k, r: top * 1.36 },
      ],
    },
    segs,
    sPer,
  );
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: 3.9 * k, r: top * 1.36 },
        { y: 4.0 * k, r: top * 1.36 },
      ],
      capTop: true,
    },
    segs,
    sPer,
  );
  return dropDegenerate(b.build());
}

export interface PedestalSpec {
  readonly x: number;
  readonly z: number;
  /** 床の高さ。 */
  readonly y: number;
  readonly radius: number;
  readonly height: number;
}

/**
 * 中央の古い台座: 3 段の基壇と、上面に浅い皿（篝火の差し込み口）。上面（縁の高さ）が `bonfireSlot.y`。
 * 皿の底は縁より 0.06m 低く、篝火の土台が納まる。
 */
export function createPedestalGeometry(spec: PedestalSpec, segs = 40): BufferGeometry {
  const { x, y, z, radius: R, height: H } = spec;
  const k = H / 0.9;
  const b = new MeshBuilder();
  const sPer = R;
  addBand(
    b,
    x,
    y - 0.05,
    z,
    {
      rows: [
        { y: 0, r: R * 1.0 },
        { y: 0.35 * k + 0.05, r: R * 1.0 },
      ],
      capBottom: true,
    },
    segs,
    sPer,
  );
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: 0.35 * k, r: R * 1.0 },
        { y: 0.38 * k, r: R * 0.95 },
      ],
      capTop: false,
    },
    segs,
    sPer,
  );
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: 0.38 * k, r: R * 0.9 },
        { y: 0.66 * k, r: R * 0.9 },
      ],
      capTop: true,
    },
    segs,
    sPer,
  );
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: 0.66 * k, r: R * 0.8 },
        { y: 0.8 * k, r: R * 0.78 },
      ],
    },
    segs,
    sPer,
  );
  // 縁（張り出し）
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: 0.8 * k, r: R * 0.78 },
        { y: 0.8 * k, r: R * 0.86 },
        { y: 0.9 * k, r: R * 0.86 },
      ],
    },
    segs,
    sPer,
  );
  // 上面: 縁のリング（平ら）→ 皿（内側へ下る）
  const ring = (rOuter: number, rInner: number, yOuter: number, yInner: number): void => {
    const first = b.vertexCount;
    for (const [r, yy] of [
      [rOuter, yOuter],
      [rInner, yInner],
    ] as const) {
      for (let si = 0; si <= segs; si++) {
        const theta = (si / segs) * TAU;
        b.vertex(
          x + Math.cos(theta) * r,
          y + yy,
          z + Math.sin(theta) * r,
          0,
          1,
          0,
          Math.cos(theta) * r,
          Math.sin(theta) * r,
        );
      }
    }
    const stride = segs + 1;
    for (let si = 0; si < segs; si++) {
      const a = first + si;
      b.quad(a, a + stride, a + stride + 1, a + 1, false);
    }
  };
  ring(R * 0.86, R * 0.58, H, H);
  // 皿の側面と底
  addBand(
    b,
    x,
    y,
    z,
    {
      rows: [
        { y: H, r: R * 0.58 },
        { y: H - 0.06, r: R * 0.52 },
      ],
    },
    segs,
    sPer,
  );
  const disc = (): void => {
    const centre = b.vertex(x, y + H - 0.06, z, 0, 1, 0, 0, 0);
    const ringIdx: number[] = [];
    for (let si = 0; si <= segs; si++) {
      const theta = (si / segs) * TAU;
      ringIdx.push(
        b.vertex(
          x + Math.cos(theta) * R * 0.52,
          y + H - 0.06,
          z + Math.sin(theta) * R * 0.52,
          0,
          1,
          0,
          Math.cos(theta) * R * 0.52,
          Math.sin(theta) * R * 0.52,
        ),
      );
    }
    for (let si = 0; si < segs; si++) {
      const a = ringIdx[si] ?? 0;
      const c = ringIdx[si + 1] ?? 0;
      b.quad(centre, c, c, a);
    }
  };
  disc();
  return dropDegenerate(b.build());
}

export interface WallRingSpec {
  readonly cx: number;
  readonly cz: number;
  readonly floorY: number;
  /** 壁の内側の半径（m）。 */
  readonly inner: number;
  /** 壁の外側の半径（m）。 */
  readonly outer: number;
  /** 壁の最大の高さ（床から。当たり判定の高さ以下にすること）。 */
  readonly height: number;
  /** 壁のある角度の範囲（rad、反時計回り。`start` から `end` へ。`end > start`）。 */
  readonly start: number;
  readonly end: number;
}

/**
 * 外周の壁（円弧）。天端は崩れて高さが不規則（最大 = `height`）。両端は平らな小口。
 * 側面の石積み座標は (円弧の長さ, 高さ)、天端は (円弧の長さ, 半径)。
 */
export function createWallRingGeometry(
  spec: WallRingSpec,
  columnAngle = (Math.PI * 2) / 160,
): BufferGeometry {
  const { cx, cz, floorY, inner, outer, height, start, end } = spec;
  const n = Math.max(1, Math.ceil((end - start) / columnAngle));
  const mid = (inner + outer) / 2;
  const b = new MeshBuilder();
  const heights: number[] = [];
  for (let i = 0; i < n; i++) {
    // 天端の崩れ: 低周波のうねり + 数列おきの欠け（最大高さは当たり判定の高さ以下）
    const wave = 0.5 + 0.5 * Math.sin(i * 0.21 + 1.3) * Math.sin(i * 0.071 + 0.4);
    const chip = hash1(i * 7 + 3) > 0.86 ? 0.28 + 0.3 * hash1(i * 13 + 5) : 0;
    const stepNoise = hash1(Math.floor(i / 3) * 5 + 11) * 0.22;
    heights.push(Math.max(height - 0.62, height - wave * 0.2 - chip - stepNoise));
  }
  const at = (theta: number, r: number, h: number) => ({
    x: cx + Math.cos(theta) * r,
    y: floorY + h,
    z: cz + Math.sin(theta) * r,
  });
  for (let i = 0; i < n; i++) {
    const t0 = start + ((end - start) * i) / n;
    const t1 = start + ((end - start) * (i + 1)) / n;
    const h = heights[i] ?? height;
    const s0 = t0 * mid;
    const s1 = t1 * mid;
    // 内面・外面
    for (const [r, dir] of [
      [inner, -1],
      [outer, 1],
    ] as const) {
      const sv0 = t0 * r;
      const sv1 = t1 * r;
      const a = at(t0, r, 0);
      const bb = at(t1, r, 0);
      const c = at(t1, r, h);
      const d = at(t0, r, h);
      const n0 = [Math.cos(t0) * dir, 0, Math.sin(t0) * dir] as const;
      const n1 = [Math.cos(t1) * dir, 0, Math.sin(t1) * dir] as const;
      const v0 = b.vertex(a.x, a.y, a.z, n0[0], 0, n0[2], sv0, 0);
      const v1 = b.vertex(bb.x, bb.y, bb.z, n1[0], 0, n1[2], sv1, 0);
      const v2 = b.vertex(c.x, c.y, c.z, n1[0], 0, n1[2], sv1, h);
      const v3 = b.vertex(d.x, d.y, d.z, n0[0], 0, n0[2], sv0, h);
      b.quad(v0, v1, v2, v3, dir > 0);
    }
    // 天端
    {
      const a = at(t0, inner, h);
      const bb = at(t1, inner, h);
      const c = at(t1, outer, h);
      const d = at(t0, outer, h);
      const v0 = b.vertex(a.x, a.y, a.z, 0, 1, 0, s0, inner);
      const v1 = b.vertex(bb.x, bb.y, bb.z, 0, 1, 0, s1, inner);
      const v2 = b.vertex(c.x, c.y, c.z, 0, 1, 0, s1, outer);
      const v3 = b.vertex(d.x, d.y, d.z, 0, 1, 0, s0, outer);
      b.quad(v0, v3, v2, v1, true);
    }
    // 隣の列との段差（高い方の列の側面のうち、低い隣より上の部分）
    const next = heights[i + 1];
    if (next !== undefined && Math.abs(next - h) > 1e-4) {
      const hi = Math.max(h, next);
      const lo = Math.min(h, next);
      const a = at(t1, inner, lo);
      const bb = at(t1, outer, lo);
      const c = at(t1, outer, hi);
      const d = at(t1, inner, hi);
      const tangent = [-Math.sin(t1), 0, Math.cos(t1)] as const;
      const sign = h > next ? 1 : -1;
      const nx = tangent[0] * sign;
      const nz = tangent[2] * sign;
      const v0 = b.vertex(a.x, a.y, a.z, nx, 0, nz, inner, lo);
      const v1 = b.vertex(bb.x, bb.y, bb.z, nx, 0, nz, outer, lo);
      const v2 = b.vertex(c.x, c.y, c.z, nx, 0, nz, outer, hi);
      const v3 = b.vertex(d.x, d.y, d.z, nx, 0, nz, inner, hi);
      b.quad(v0, v1, v2, v3, sign < 0);
    }
  }
  // 両端の小口
  for (const [theta, h, sign] of [
    [start, heights[0] ?? height, -1],
    [end, heights[n - 1] ?? height, 1],
  ] as const) {
    const a = at(theta, inner, 0);
    const bb = at(theta, outer, 0);
    const c = at(theta, outer, h);
    const d = at(theta, inner, h);
    const nx = -Math.sin(theta) * sign;
    const nz = Math.cos(theta) * sign;
    const v0 = b.vertex(a.x, a.y, a.z, nx, 0, nz, inner, 0);
    const v1 = b.vertex(bb.x, bb.y, bb.z, nx, 0, nz, outer, 0);
    const v2 = b.vertex(c.x, c.y, c.z, nx, 0, nz, outer, h);
    const v3 = b.vertex(d.x, d.y, d.z, nx, 0, nz, inner, h);
    b.quad(v0, v1, v2, v3, sign < 0);
  }
  return b.build();
}

/** 円形の床（y = 床の高さ + `lift`。地形との Z ファイティングを避けるわずかな浮き）。 */
export function createFloorDiscGeometry(
  cx: number,
  cz: number,
  y: number,
  radius: number,
  segs = 72,
): BufferGeometry {
  const positions: number[] = [cx, y, cz];
  const normals: number[] = [0, 1, 0];
  const indices: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * TAU;
    positions.push(cx + Math.cos(t) * radius, y, cz + Math.sin(t) * radius);
    normals.push(0, 1, 0);
  }
  for (let i = 0; i < segs; i++) indices.push(0, i + 2, i + 1);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  g.setIndex(new Uint32BufferAttribute(indices, 1));
  return g;
}

/** 複数のジオメトリ（属性が同じもの）を 1 つにまとめる。 */
export function mergeAll(geometries: readonly BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries([...geometries]);
  for (const g of geometries) g.dispose();
  return merged;
}

/** 三角形数（インデックスあり）。 */
export function triangleCount(g: BufferGeometry): number {
  return (g.getIndex()?.count ?? g.getAttribute('position').count) / 3;
}
