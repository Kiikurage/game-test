import {
  BufferGeometry,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Uint32BufferAttribute,
} from 'three/webgpu';

/**
 * 石積みマテリアル（`masonryMaterial.ts`）用のジオメトリ生成（純粋ロジック。GPU に依存しない）。
 *
 * 頂点属性:
 *  - `position` / `normal`
 *  - `color`   : 石の色の倍率（リニア）
 *  - `mu`      : 石積みの座標（m）。壁面は「面に沿った水平距離, ワールド高さ」、上面は (x, z)、円筒は (周方向の弧長, 高さ)。
 *                ワールド座標から作るので、同一平面の隣り合う箱で目地が連続し、回転した箱でも目地が水平になる
 *  - `mx`      : (面の左端からの距離, 右端からの距離, 地面からの高さ)（m）。角の欠け・湿り気に使う
 *  - `rd`      : 円筒面のとき (石 1 個の弧長, 1 周の石の数)。平面は (0, 0)
 */

export type Vec3 = readonly [number, number, number];

/** 決定的な 0..1 のハッシュ（文字列・数値）。 */
export function hashSeed(s: string | number): number {
  const str = String(s);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967295;
}

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** 値ノイズ 0..1。 */
export function noise2(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const sm = (t: number): number => t * t * (3 - 2 * t);
  const fx = sm(x - ix);
  const fz = sm(z - iz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

export interface BoxOptions {
  readonly x: number;
  /** 中心の高さ。 */
  readonly y: number;
  readonly z: number;
  readonly hx: number;
  readonly hy: number;
  readonly hz: number;
  readonly yaw?: number;
  /** x / z 軸まわりの傾き（rad。瓦礫用）。 */
  readonly tiltX?: number;
  readonly tiltZ?: number;
  readonly tint?: Vec3;
  /** 上辺を不規則に欠けさせる量（m）。0 なら平ら。 */
  readonly ruin?: number;
  /** 面に沿った分割の目安（m）。欠けの細かさ。 */
  readonly cell?: number;
  /** 石積み座標へ箱ごとの位置ずれを足す（瓦礫の石がそろわないように）。 */
  readonly scatter?: boolean;
  /** 側面を作らない面（'bottom' など）。 */
  readonly skipBottom?: boolean;
}

/** 長さのそろった頂点配列へ溜めて、最後に 1 つの BufferGeometry にする。 */
export class MasonryBuilder {
  private readonly positions: number[] = [];
  private readonly normals: number[] = [];
  private readonly colors: number[] = [];
  private readonly mu: number[] = [];
  private readonly mx: number[] = [];
  private readonly rd: number[] = [];
  private readonly indices: number[] = [];
  private vertexCount = 0;

  /** @param groundAt 地面の高さ（湿り気の高さ計算用）。 */
  constructor(private readonly groundAt: (x: number, z: number) => number) {}

  get triangles(): number {
    return this.indices.length / 3;
  }

  private push(
    p: Vec3,
    n: Vec3,
    tint: Vec3,
    mu: readonly [number, number],
    edge: readonly [number, number],
    rd: readonly [number, number] = [0, 0],
  ): number {
    this.positions.push(p[0], p[1], p[2]);
    this.normals.push(n[0], n[1], n[2]);
    this.colors.push(tint[0], tint[1], tint[2]);
    this.mu.push(mu[0], mu[1]);
    this.mx.push(edge[0], edge[1], p[1] - this.groundAt(p[0], p[2]));
    this.rd.push(rd[0], rd[1]);
    return this.vertexCount++;
  }

  /** 傾き・回転つきの箱（面ごとに分割。上辺を欠けさせられる）。 */
  addBox(o: BoxOptions): void {
    const tint = o.tint ?? [1, 1, 1];
    const m = new Matrix4().makeRotationFromEuler(
      new Euler(o.tiltX ?? 0, o.yaw ?? 0, o.tiltZ ?? 0, 'YXZ'),
    );
    m.setPosition(o.x, o.y, o.z);
    const e = m.elements;
    const toWorld = (lx: number, ly: number, lz: number): Vec3 => [
      e[0] * lx + e[4] * ly + e[8] * lz + e[12],
      e[1] * lx + e[5] * ly + e[9] * lz + e[13],
      e[2] * lx + e[6] * ly + e[10] * lz + e[14],
    ];
    const rotate = (lx: number, ly: number, lz: number): Vec3 => [
      e[0] * lx + e[4] * ly + e[8] * lz,
      e[1] * lx + e[5] * ly + e[9] * lz,
      e[2] * lx + e[6] * ly + e[10] * lz,
    ];
    const ruin = o.ruin ?? 0;
    // 欠けさせない箱は面を細かく割る必要がない（三角形の節約）
    const cell = ruin > 0 ? (o.cell ?? 0.45) : Math.max(o.cell ?? 0.45, 3);
    const off = o.scatter ? hashSeed(`${o.x},${o.y},${o.z}`) * 19 : 0;
    const dims = [o.hx, o.hy, o.hz] as const;

    // 上辺の欠け量（ローカル xz の関数。上面と側面の最上段で共通 = 隙間ができない）
    const drop = (lx: number, lz: number, ly: number): number => {
      if (ruin <= 0 || ly < o.hy - 1e-6) return 0;
      const wx = o.x + lx * Math.cos(o.yaw ?? 0) + lz * Math.sin(o.yaw ?? 0);
      const wz = o.z - lx * Math.sin(o.yaw ?? 0) + lz * Math.cos(o.yaw ?? 0);
      const n = noise2(wx * 1.7 + 11, wz * 1.7 - 5) * 0.7 + noise2(wx * 5.3, wz * 5.3) * 0.3;
      return Math.max(0, n - 0.25) * ruin * 1.35;
    };

    // 6 面: [法線軸, 符号]。面内の 2 軸 (a, b) をローカル座標で走査する
    const faces: readonly (readonly [0 | 1 | 2, 1 | -1])[] = [
      [0, 1],
      [0, -1],
      [2, 1],
      [2, -1],
      [1, 1],
      [1, -1],
    ];
    for (const [axis, sign] of faces) {
      if (axis === 1 && sign < 0 && o.skipBottom) continue;
      const aAxis = axis === 0 ? 2 : 0;
      const bAxis = axis === 1 ? 2 : 1;
      const aHalf = dims[aAxis];
      const bHalf = dims[bAxis];
      const na = Math.max(1, Math.round((aHalf * 2) / cell));
      const nb = ruin > 0 && axis === 1 ? Math.max(1, Math.round((bHalf * 2) / cell)) : 1;
      const nLocal: [number, number, number] = [0, 0, 0];
      nLocal[axis] = sign;
      const nw = rotate(nLocal[0], nLocal[1], nLocal[2]);
      const top = Math.abs(nw[1]) >= 0.5;
      // 側面の水平方向 t = up × n
      const tl = Math.hypot(nw[2], nw[0]) || 1;
      const tx = nw[2] / tl;
      const tz = -nw[0] / tl;
      const base = this.vertexCount;
      for (let ib = 0; ib <= nb; ib++) {
        for (let ia = 0; ia <= na; ia++) {
          const la = -aHalf + (2 * aHalf * ia) / na;
          const lb = -bHalf + (2 * bHalf * ib) / nb;
          const l: [number, number, number] = [0, 0, 0];
          l[axis] = sign * dims[axis];
          l[aAxis] = la;
          l[bAxis] = lb;
          const d = drop(l[0], l[2], l[1]);
          l[1] -= d;
          const p = toWorld(l[0], l[1], l[2]);
          const mu: [number, number] = top
            ? [p[0] + off, p[2] + off * 0.7]
            : [p[0] * tx + p[2] * tz + off, p[1] + off * 0.3];
          const edge: [number, number] = top
            ? [9, 9]
            : ([la + aHalf, aHalf - la].map((v) => Math.max(0, v)) as [number, number]);
          this.push(p, nw, tint, mu, edge);
        }
      }
      for (let ib = 0; ib < nb; ib++) {
        for (let ia = 0; ia < na; ia++) {
          const i0 = base + ib * (na + 1) + ia;
          const i1 = i0 + 1;
          const i2 = i0 + na + 1;
          const i3 = i2 + 1;
          this.orientedQuad(i0, i1, i2, i3, nw);
        }
      }
    }
  }

  /** 頂点が作る面の向きを法線に合わせて三角形を追加する。 */
  private orientedQuad(i0: number, i1: number, i2: number, i3: number, n: Vec3): void {
    const p = (i: number): Vec3 => [
      this.positions[i * 3] ?? 0,
      this.positions[i * 3 + 1] ?? 0,
      this.positions[i * 3 + 2] ?? 0,
    ];
    const a = p(i0);
    const b = p(i1);
    const c = p(i2);
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    const front = cx * n[0] + cy * n[1] + cz * n[2] >= 0;
    if (front) this.indices.push(i0, i1, i2, i1, i3, i2);
    else this.indices.push(i0, i2, i1, i1, i2, i3);
  }

  /**
   * 円筒（柱の軸・太鼓）。`topJitter` > 0 なら上端を不規則に欠けさせる。
   * 石の数は偶数にそろえ、継ぎ目で石積みがずれないようにする。
   */
  addDrum(o: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly rBottom: number;
    readonly rTop: number;
    readonly height: number;
    readonly tint?: Vec3;
    readonly topJitter?: number;
    readonly segments?: number;
    readonly capTop?: boolean;
  }): void {
    const tint = o.tint ?? [1, 1, 1];
    const seg = o.segments ?? 16;
    const rMid = (o.rBottom + o.rTop) / 2;
    const circ = 2 * Math.PI * rMid;
    const count = Math.max(4, 2 * Math.round(circ / 0.9 / 2));
    const blockLen = circ / count;
    const slope = (o.rBottom - o.rTop) / o.height;
    const rowsN = 1;
    const base = this.vertexCount;
    const topY = (a: number): number => {
      const j = o.topJitter ?? 0;
      if (j <= 0) return o.y + o.height;
      const wx = o.x + Math.cos(a) * rMid;
      const wz = o.z + Math.sin(a) * rMid;
      return o.y + o.height - noise2(wx * 3.1, wz * 3.1) * j - noise2(wx * 9.7, wz * 9.7) * j * 0.3;
    };
    for (let r = 0; r <= rowsN; r++) {
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const y = r === 0 ? o.y : topY(a);
        const t = (y - o.y) / o.height;
        const rad = o.rBottom + (o.rTop - o.rBottom) * t;
        const n: Vec3 = [Math.cos(a), slope, Math.sin(a)];
        const nl = Math.hypot(n[0], n[1], n[2]);
        this.push(
          [o.x + Math.cos(a) * rad, y, o.z + Math.sin(a) * rad],
          [n[0] / nl, n[1] / nl, n[2] / nl],
          tint,
          [(i / seg) * circ, y],
          [9, 9],
          [blockLen, count],
        );
      }
    }
    for (let i = 0; i < seg; i++) {
      const i0 = base + i;
      const i1 = i0 + 1;
      const i2 = i0 + seg + 1;
      const i3 = i2 + 1;
      // 外向き（反時計回りで見たとき）
      this.indices.push(i0, i2, i1, i1, i2, i3);
    }
    if (o.capTop ?? true) {
      const centerY = o.y + o.height - (o.topJitter ?? 0) * 0.5;
      const c = this.push([o.x, centerY, o.z], [0, 1, 0], tint, [o.x, o.z], [9, 9]);
      const ring: number[] = [];
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const y = topY(a);
        ring.push(
          this.push(
            [o.x + Math.cos(a) * o.rTop, y, o.z + Math.sin(a) * o.rTop],
            [0, 1, 0],
            tint,
            [o.x + Math.cos(a) * o.rTop, o.z + Math.sin(a) * o.rTop],
            [9, 9],
          ),
        );
      }
      for (let i = 0; i < seg; i++) this.indices.push(c, ring[i + 1] ?? c, ring[i] ?? c);
    }
  }

  /**
   * 回転体（噴水の水盤）。`profile` は (半径, 高さ) の折れ線（外側の下 → 縁 → 内側 → 底の中心）。
   * `gap` で縁が崩れた扇形（角度 rad、中心角、崩れ後の高さ）を指定できる。
   */
  addLathe(o: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly profile: readonly (readonly [number, number])[];
    readonly tint?: Vec3;
    readonly segments?: number;
    readonly gap?: { readonly angle: number; readonly width: number; readonly height: number };
  }): void {
    const tint = o.tint ?? [1, 1, 1];
    const seg = o.segments ?? 28;
    const rMax = Math.max(...o.profile.map((p) => p[0]));
    const circ = 2 * Math.PI * rMax;
    const count = Math.max(6, 2 * Math.round(circ / 1.1 / 2));
    const heightAt = (phi: number, y: number): number => {
      const g = o.gap;
      if (!g) return y;
      let d = Math.abs(((phi - g.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      d = Math.abs(d);
      // 扇の中心 = 最も低い。縁へ向かって滑らかに戻る
      const w = Math.max(0, 1 - d / (g.width / 2));
      const smooth = w * w * (3 - 2 * w);
      const cap = y + (Math.min(y, g.height) - y) * smooth;
      // 不規則な欠け口
      return cap + (noise2(phi * 6, y * 3) - 0.5) * 0.18 * smooth;
    };
    for (let s = 0; s + 1 < o.profile.length; s++) {
      const [r0, h0] = o.profile[s] ?? [0, 0];
      const [r1, h1] = o.profile[s + 1] ?? [0, 0];
      const dr = r1 - r0;
      const dh = h1 - h0;
      const nl = Math.hypot(dr, dh) || 1;
      const base = this.vertexCount;
      const flat = Math.abs(dh) < 1e-6;
      const rAvg = (r0 + r1) / 2;
      for (let k = 0; k < 2; k++) {
        const r = k === 0 ? r0 : r1;
        const h = k === 0 ? h0 : h1;
        for (let i = 0; i <= seg; i++) {
          const phi = (i / seg) * Math.PI * 2;
          const y = o.y + heightAt(phi, h);
          // 輪郭の法線（dh, -dr）を軸まわりに回す。向きは外/上向き
          const nx = (dh / nl) * Math.cos(phi);
          const ny = -dr / nl;
          const nz = (dh / nl) * Math.sin(phi);
          const px = o.x + Math.cos(phi) * r;
          const pz = o.z + Math.sin(phi) * r;
          this.push(
            [px, y, pz],
            [nx, ny, nz],
            tint,
            flat ? [px, pz] : [(i / seg) * circ * (rAvg / rMax), y],
            [9, 9],
            flat ? [0, 0] : [circ / count, count],
          );
        }
      }
      for (let i = 0; i < seg; i++) {
        const i0 = base + i;
        const i1 = i0 + 1;
        const i2 = i0 + seg + 1;
        const i3 = i2 + 1;
        const n: Vec3 = [dh / nl, -dr / nl, 0];
        // 面の向き: 輪郭法線 (dh, -dr) を向くように
        const pphi = ((i + 0.5) / seg) * Math.PI * 2;
        const nn: Vec3 = [n[0] * Math.cos(pphi), n[1], n[0] * Math.sin(pphi)];
        this.orientedQuad(i0, i1, i2, i3, nn);
      }
    }
  }

  /** 溜めた頂点を 1 つのジオメトリにする。 */
  build(): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.normals, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.colors, 3));
    g.setAttribute('mu', new Float32BufferAttribute(this.mu, 2));
    g.setAttribute('mx', new Float32BufferAttribute(this.mx, 3));
    g.setAttribute('rd', new Float32BufferAttribute(this.rd, 2));
    g.setIndex(new Uint32BufferAttribute(this.indices, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}
