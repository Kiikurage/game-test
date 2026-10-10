import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  Uint32BufferAttribute,
  type Node,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Fn,
  cameraPosition,
  clamp,
  dot,
  mix,
  normalize,
  positionWorld,
  pow,
  smoothstep,
  uniform,
  vec3,
  vertexColor,
} from 'three/tsl';
import { ATMOSPHERE, sunDirection } from './environment';
import { valueNoise } from './terrain';

/** 遠景の山並みの 1 層。半径が大きいほど遠く、霞に溶ける。 */
export interface RidgeLayer {
  /** カメラからの距離（m）。 */
  readonly radius: number;
  /** 稜線の基準の高さと起伏の振れ幅（m）。 */
  readonly base: number;
  readonly amplitude: number;
  /** 稜線ノイズの周波数（円周上）。大きいほど細かい。 */
  readonly frequency: number;
  /** 0 = 手前の暗い青灰、1 = 霞の色に完全に溶ける。 */
  readonly haze: number;
  readonly seed: number;
}

/** 遠景のランドマーク（闘技場の方角にそびえる城）の方位（rad, 太陽の方位と同じ定義）。 */
export const LANDMARK_AZIMUTH = 0.64;
const LANDMARK_RADIUS = 330;

export const RIDGE_LAYERS: readonly RidgeLayer[] = [
  { radius: 240, base: 16, amplitude: 30, frequency: 7, haze: 0.3, seed: 3 },
  { radius: 300, base: 24, amplitude: 46, frequency: 5, haze: 0.52, seed: 11 },
  { radius: 380, base: 32, amplitude: 58, frequency: 3.4, haze: 0.76, seed: 29 },
];

/** 稜線の高さ（m）。方位 `theta`（rad）について 2π 周期（継ぎ目なし）。 */
export function ridgeHeight(layer: RidgeLayer, theta: number): number {
  const cx = Math.cos(theta) * layer.frequency + layer.seed * 17.3;
  const cz = Math.sin(theta) * layer.frequency + layer.seed * 5.7;
  const n =
    0.62 * valueNoise(cx, cz) +
    0.28 * valueNoise(cx * 2.3, cz * 2.3) +
    0.1 * valueNoise(cx * 5.1, cz * 5.1);
  // ランドマークの足元は台地にする（城が山の上に建つ）
  const d = Math.atan2(Math.sin(theta - LANDMARK_AZIMUTH), Math.cos(theta - LANDMARK_AZIMUTH));
  const plateau = layer.radius === 300 ? 16 * Math.exp(-((d / 0.32) ** 2)) : 0;
  // 峰を尖らせる（ピークを強調するべき乗）
  return layer.base + layer.amplitude * Math.pow(n, 1.35) + plateau;
}

/** 稜線の帯メッシュ（下端は地平線よりずっと下）。 */
export function createRidgeGeometry(layer: RidgeLayer, segments = 320): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const bottom = -160;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * layer.radius;
    const z = Math.sin(theta) * layer.radius;
    positions.push(x, bottom, z, x, ridgeHeight(layer, theta), z);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  return geometry;
}

/** 霞・太陽側の金色・天頂側の灰青を、視線と太陽の向きで混ぜた色（フォグ色と同じ式）。 */
function createHazeColor(sunDirNode: Node<'vec3'>): Node<'vec3'> {
  const hazeFar = uniform(new Color(ATMOSPHERE.hazeFar));
  const hazeSun = uniform(new Color(ATMOSPHERE.hazeSun));
  return Fn(() => {
    const viewDir = normalize(positionWorld.sub(cameraPosition));
    const mu = clamp(dot(viewDir, sunDirNode), 0, 1);
    return mix(hazeFar, hazeSun, pow(mu, 2.5));
  })();
}

function createRidgeMaterial(layer: RidgeLayer, sunDirNode: Node<'vec3'>): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({ fog: false });
  const haze = createHazeColor(sunDirNode);
  const near = uniform(new Color(0x2e333c));
  const sunTint = uniform(new Color(ATMOSPHERE.sunColor));
  const top = layer.base + layer.amplitude;
  material.colorNode = Fn(() => {
    const viewDir = normalize(positionWorld.sub(cameraPosition));
    const mu = clamp(dot(viewDir, sunDirNode), 0, 1);
    // 谷間ほど霞に沈み、峰ほど手前の暗い青灰が残る
    const valley = smoothstep(top * 0.95, -20, positionWorld.y);
    let col = mix(near, haze, layer.haze);
    col = mix(col, haze, valley.mul(0.75));
    // 太陽側は稜線が金色に染まる（逆光の空気感）
    col = col.add(sunTint.mul(pow(mu, 6).mul(0.16 * layer.haze)));
    return col;
  })();
  return material;
}

/** 城のシルエット（ローカル座標: +x が接線方向、+z が中心側、+y が上）。頂点色は窓の灯りだけ HDR。 */
function createCastleGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const body = [0.5, 0.5, 0.52];
  const add = (g: BufferGeometry, x: number, y: number, z: number, color = body): void => {
    const geo = g.index ? g.toNonIndexed() : g;
    geo.translate(x, y, z);
    const n = geo.getAttribute('position').count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) colors.set(color, i * 3);
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.deleteAttribute('normal');
    geo.deleteAttribute('uv');
    parts.push(geo);
  };
  const box = (w: number, h: number, d: number, x: number, y: number, z = 0): void => {
    add(new BoxGeometry(w, h, d), x, y + h / 2, z);
  };
  const tower = (r: number, h: number, roof: number, x: number, y: number, z = 0): void => {
    add(new CylinderGeometry(r * 0.92, r, h, 10), x, y + h / 2, z);
    add(new CylinderGeometry(r * 1.12, r * 0.92, 2.2, 10), x, y + h + 1.1, z); // 張り出し
    add(new ConeGeometry(r * 1.18, roof, 10), x, y + h + 2.2 + roof / 2, z);
  };
  const glow = [6, 3.4, 1.2];
  const window = (x: number, y: number, z: number, w = 1.3, h = 2.8): void => {
    add(new PlaneGeometry(w, h), x, y, z, glow);
  };

  // 城の下の岩山（足元が宙に浮かないように、手前の稜線の下まで延ばす）
  box(300, 70, 40, 0, -70, 0);
  // 中央の主塔（天守）
  box(30, 46, 20, 0, 0);
  box(20, 18, 14, 0, 46);
  add(new ConeGeometry(11, 30, 4), 0, 64 + 15, 0);
  // 城壁
  box(120, 18, 7, 0, 0, 3);
  for (let i = -28; i <= 28; i++) box(1.8, 2.4, 7, i * 2, 18, 3);
  // 脇の塔
  tower(6, 58, 22, -32, 0, 2);
  tower(6.5, 50, 20, 34, 0, 2);
  tower(5, 34, 14, -58, 0, 4);
  tower(5, 38, 16, 60, 0, 4);
  // 細い尖塔と離れた見張り塔
  tower(2.6, 78, 20, -14, 10, -4);
  tower(2.2, 66, 16, 15, 10, -4);
  tower(4, 24, 10, -92, -6, 6);
  tower(4.5, 28, 11, 96, -6, 6);
  // 窓（中心側の面だけに灯りを置く）
  for (const [x, y] of [
    [-6, 18],
    [6, 18],
    [-6, 30],
    [6, 30],
    [0, 52],
    [-32, 40],
    [-32, 28],
    [34, 36],
    [34, 22],
    [-14, 66],
    [15, 58],
    [-58, 26],
    [60, 28],
  ] as const) {
    window(x, y, 11);
  }
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  return merged;
}

/**
 * 地平線の遠景: 霞む山並み（3 層）と、闘技場の方角にそびえる城のシルエット。
 * 全体はカメラに追従して「無限遠」として振る舞う（`update` を毎フレーム呼ぶ）。
 * 影は落とさず、フォグは自前の霞色で表現する（3 層 + 城で 4 ドローコール・約 3k 三角形）。
 */
export class Skyline {
  readonly root = new Group();

  constructor() {
    const sunDirNode = uniform(sunDirection()) as unknown as Node<'vec3'>;
    for (const layer of RIDGE_LAYERS) {
      const mesh = new Mesh(createRidgeGeometry(layer), createRidgeMaterial(layer, sunDirNode));
      mesh.frustumCulled = false;
      mesh.name = `ridge:${layer.radius}`;
      this.root.add(mesh);
    }

    // 城の足元は手前の稜線（半径 300）の陰に隠れるよう、稜線の最低の高さより少し下に据える
    const front = RIDGE_LAYERS.find((l) => l.radius === 300) as RidgeLayer;
    let ridgeMin = Infinity;
    for (let d = -0.3; d <= 0.3; d += 0.02) {
      ridgeMin = Math.min(ridgeMin, ridgeHeight(front, LANDMARK_AZIMUTH + d));
    }
    const baseY = (ridgeMin * LANDMARK_RADIUS) / front.radius - 8;
    const castleMaterial = new MeshBasicNodeMaterial({ fog: false });
    const haze = createHazeColor(sunDirNode);
    castleMaterial.colorNode = Fn(() => {
      const base = vertexColor().mul(vec3(0.06, 0.065, 0.085));
      // 窓の灯り（HDR）は霞に埋もれさせない。壁は霞色に 55% 溶ける
      const lit = smoothstep(0.5, 0.9, base.r.mul(2));
      // 足元（岩山）は霞に溶ける
      const foot = smoothstep(baseY + 35, baseY - 5, positionWorld.y).mul(0.85);
      return mix(mix(mix(base, haze, 0.14), haze, foot), base, lit);
    })();
    const castle = new Mesh(createCastleGeometry(), castleMaterial);
    const phi = Math.atan2(-Math.cos(LANDMARK_AZIMUTH), -Math.sin(LANDMARK_AZIMUTH));
    castle.position.set(
      Math.cos(LANDMARK_AZIMUTH) * LANDMARK_RADIUS,
      baseY,
      Math.sin(LANDMARK_AZIMUTH) * LANDMARK_RADIUS,
    );
    castle.rotation.y = phi;
    castle.frustumCulled = false;
    castle.name = 'landmark-castle';
    this.root.add(castle);
  }

  /** カメラの水平位置へ追従する（遠景はパララックスを持たない）。 */
  update(cameraX: number, cameraZ: number): void {
    this.root.position.set(cameraX, 0, cameraZ);
  }
}
