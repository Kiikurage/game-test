import {
  BufferGeometry,
  Float32BufferAttribute,
  MeshBasicNodeMaterial,
  Uint32BufferAttribute,
} from 'three/webgpu';
import type { Node } from 'three/webgpu';
import {
  cameraPosition,
  float,
  mix,
  normalize,
  positionWorld,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';

/**
 * 闘技場の背景の幕と、壁の向こうの岩場のシルエット。
 *
 * 外周の崖（地形）は壁のすぐ外から立ち上がり、闘技場の中からは視界の上半分を覆って「岩の天井」に見える。
 * 当たり判定・ナビ格子は地形のままにして、見た目だけを差し替える:
 *  - 幕: 壁の外側に立てた円筒（内向き）。視線方向から空の色を求める（背景と同じ式・同じ uniform）ので、
 *    幕に覆われた範囲は本物の空とつながって見え、地平線の残光 → 天頂の濃紺 + 星が壁の上端から始まる。
 *  - シルエット: 壁の向こうの低い位置に、ぎざぎざの暗い岩場の稜線（幕の手前）。空を覆わない高さ。
 * 霧の門の通路の口（壁の切れ目）は幕・シルエットとも開けてあり、通路は見える。
 */

function hash1(n: number): number {
  let h = Math.imul(Math.floor(n) | 0, 374761393) + 668265263;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 1 次元の値ノイズ（0..1）。 */
function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = smooth(x - i);
  return hash1(i * 7.31 + seed) * (1 - f) + hash1((i + 1) * 7.31 + seed) * f;
}

export interface BackdropSpec {
  readonly cx: number;
  readonly cz: number;
  /** 床の高さ。 */
  readonly floorY: number;
  /** 円筒の半径（壁の外面より外）。 */
  readonly radius: number;
  /** 壁のある角度の範囲（rad、反時計回り。`start` → `end`）。 */
  readonly start: number;
  readonly end: number;
}

/** 内向きの円筒（高さ `height`、床から）。 */
export function createBackdropGeometry(spec: BackdropSpec, height = 90, segs = 72): BufferGeometry {
  const { cx, cz, floorY, radius, start, end } = spec;
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = start + ((end - start) * i) / segs;
    const c = Math.cos(t);
    const s = Math.sin(t);
    for (const y of [floorY - 1, floorY + height]) {
      pos.push(cx + c * radius, y, cz + s * radius);
      nor.push(-c, 0, -s);
    }
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    // 内側から見て反時計回り
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setIndex(new Uint32BufferAttribute(idx, 1));
  return g;
}

/**
 * 壁の向こうの岩場の稜線（内向きの帯）。下端は床より下、上端は床から約 `base`〜`base + amplitude` m のぎざぎざ。
 * 幕より少し内側（`radius - 0.15`）に置く。
 */
export function createRimGeometry(
  spec: BackdropSpec,
  base = 4.6,
  amplitude = 5.2,
  segs = 144,
): BufferGeometry {
  const { cx, cz, floorY, radius, start, end } = spec;
  const r = radius - 0.15;
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const t = start + (end - start) * u;
    const arc = u * (end - start) * r;
    // 大きな起伏 + 細かいぎざぎざ（尖った峰）
    const big = noise1(arc * 0.12, 3);
    const mid = noise1(arc * 0.45, 11);
    const fine = noise1(arc * 1.7, 29);
    const h = base + amplitude * (0.55 * Math.pow(big, 1.4) + 0.3 * mid + 0.15 * fine);
    const c = Math.cos(t);
    const s = Math.sin(t);
    pos.push(cx + c * r, floorY - 1, cz + s * r);
    nor.push(-c, 0, -s);
    pos.push(cx + c * r, floorY + h, cz + s * r);
    nor.push(-c, 0, -s);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setIndex(new Uint32BufferAttribute(idx, 1));
  return g;
}

/** 幕と稜線が共有する不透明度（0 = 見えない。闘技場の外から近づくときに滑らかに現れる）。 */
export const backdropFade = uniform(0);

/** 幕: 視線方向の空の色（`Environment.skyAt`）。 */
export function createBackdropMaterial(
  skyAt: (dir: Node<'vec3'>) => Node<'vec3'>,
): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({ fog: false, transparent: true, depthWrite: false });
  const dir = normalize(positionWorld.sub(cameraPosition));
  material.colorNode = vec4(skyAt(dir), 1);
  material.opacityNode = backdropFade;
  return material;
}

/** 稜線: ごく暗い青のシルエット（上端にわずかに空の残光が回り込む）。 */
export function createRimMaterial(floorY: number): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({ fog: false, transparent: true, depthWrite: false });
  const dark = vec3(0.012, 0.012, 0.03);
  const glow = vec3(0.05, 0.03, 0.06);
  // 高いほどわずかに明るい（空気遠近）
  const t = positionWorld.y.sub(floorY).div(10).clamp(0, 1);
  material.colorNode = vec4(mix(dark, glow, t.mul(t)), 1);
  material.opacityNode = float(1).mul(backdropFade);
  return material;
}
