import {
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  DoubleSide,
  Object3D,
  IcosahedronGeometry,
  Matrix4,
  Mesh,
  MeshStandardNodeMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector3,
  BoxGeometry,
  Euler,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Fn,
  clamp,
  color,
  float,
  instanceIndex,
  mix,
  mx_fractal_noise_float,
  mx_noise_float,
  normalWorld,
  positionWorld,
  smoothstep,
  sin,
  time,
  positionLocal,
  vec3,
} from 'three/tsl';
import type { QualityPreset } from './quality';
import { FLAT_RADIUS, terrainHeight, valueNoise } from './terrain';

/** 再現性のある乱数（mulberry32）。 */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TERRAIN_SIZE = 360;
const TERRAIN_SEGMENTS = 200;

export function createTerrainGeometry(): BufferGeometry {
  const geometry = new PlaneGeometry(
    TERRAIN_SIZE,
    TERRAIN_SIZE,
    TERRAIN_SEGMENTS,
    TERRAIN_SEGMENTS,
  );
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  if (!pos) throw new Error('terrain geometry has no position attribute');
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createTerrainMaterial(preset: QualityPreset): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ roughness: 1, metalness: 0 });
  const octaves = preset.detailOctaves;

  material.colorNode = Fn(() => {
    const p = positionWorld;
    // 低周波の地色むら + 高周波のディテール
    const broad = mx_fractal_noise_float(vec3(p.x.mul(0.035), 0.0, p.z.mul(0.035)), 3, 2, 0.5)
      .mul(0.5)
      .add(0.5);
    const fine = mx_fractal_noise_float(vec3(p.x.mul(0.9), 0.0, p.z.mul(0.9)), octaves, 2.1, 0.5)
      .mul(0.5)
      .add(0.5);

    const dryGrass = color(0x7d7440); // くすんだ黄緑
    const mossy = color(0x4f5a34); // 湿った苔色
    const earth = color(0x8c7650); // 踏み固められた土
    const rock = color(0x6f6a62); // 灰褐色の岩肌

    let col = mix(mossy, dryGrass, smoothstep(0.35, 0.7, broad));
    col = mix(col, col.mul(0.7), smoothstep(0.45, 0.75, fine).mul(0.6)); // 暗い斑
    col = mix(col, col.mul(1.25), smoothstep(0.55, 0.85, float(1).sub(fine)).mul(0.4));

    // 中心部は土の広場（拠点の雰囲気）
    const r = p.xz.length();
    const plaza = smoothstep(FLAT_RADIUS + 2, FLAT_RADIUS - 8, r);
    col = mix(col, earth.mul(mix(0.85, 1.15, fine)), plaza.mul(0.85));

    // 急斜面は岩肌
    const steep = smoothstep(0.82, 0.62, normalWorld.y);
    col = mix(col, rock.mul(mix(0.8, 1.2, fine)), steep);
    return col;
  })();
  return material;
}

function createRockMaterial(): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ roughness: 0.92, metalness: 0 });
  material.colorNode = Fn(() => {
    const p = positionWorld;
    const n = mx_noise_float(p.mul(1.7)).mul(0.5).add(0.5);
    const grain = mx_noise_float(p.mul(7.0)).mul(0.5).add(0.5);
    const stone = mix(color(0x544f49), color(0x8a8378), n);
    let col = stone.mul(mix(0.85, 1.1, grain));
    // 上向きの面に苔
    const moss = smoothstep(0.55, 0.85, normalWorld.y.add(n.mul(0.25)));
    col = mix(col, color(0x56612f).mul(mix(0.8, 1.15, grain)), moss.mul(0.7));
    return col;
  })();
  return material;
}

function createStoneMaterial(): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ roughness: 0.85, metalness: 0 });
  material.colorNode = Fn(() => {
    const p = positionWorld;
    const streak = mx_noise_float(vec3(p.x.mul(2.5), p.y.mul(0.5), p.z.mul(2.5)))
      .mul(0.5)
      .add(0.5);
    const grain = mx_noise_float(p.mul(9.0)).mul(0.5).add(0.5);
    const warm = color(0xc2ae8c); // 風化した砂岩
    const cool = color(0x84796c);
    let col = mix(cool, warm, smoothstep(0.25, 0.75, streak));
    col = col.mul(mix(0.82, 1.08, grain));
    // 下部ほど湿って暗く、苔が付く
    const damp = smoothstep(2.5, 0.0, p.y);
    col = mix(col, color(0x4a5230), clamp(damp.mul(0.35), 0, 1));
    return col;
  })();
  return material;
}

function createBarkMaterial(): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ roughness: 0.95, metalness: 0 });
  material.colorNode = Fn(() => {
    const p = positionWorld;
    const n = mx_noise_float(vec3(p.x.mul(6), p.y.mul(1.2), p.z.mul(6)))
      .mul(0.5)
      .add(0.5);
    return mix(color(0x2c241d), color(0x5a4a3a), n);
  })();
  return material;
}

/** 世界のアイテム。位置・回転・スケールを適用した非インデックスジオメトリを返す。 */
function place(
  base: BufferGeometry,
  position: Vector3,
  rotation: Euler,
  scale: Vector3,
): BufferGeometry {
  const g = base.index ? base.toNonIndexed() : base.clone();
  const m = new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), scale);
  g.applyMatrix4(m);
  return g;
}

function mergeToMesh(
  geometries: BufferGeometry[],
  material: MeshStandardNodeMaterial,
  castShadow = true,
): Mesh {
  const merged = mergeGeometries(geometries, false);
  for (const g of geometries) g.dispose();
  const mesh = new Mesh(merged, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

/** 頂点位置の関数で岩っぽく変形した二十面体（継ぎ目が割れないよう位置のみの関数で変位）。 */
function createRockGeometry(): BufferGeometry {
  const g = new IcosahedronGeometry(1, 2);
  const pos = g.attributes.position;
  if (!pos) throw new Error('rock geometry has no position attribute');
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n =
      valueNoise(v.x * 1.6 + 7, v.y * 1.6 + v.z * 1.1) * 0.55 + valueNoise(v.x * 4, v.z * 4) * 0.2;
    v.multiplyScalar(0.72 + n);
    pos.setXYZ(i, v.x, v.y * 0.8, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function createRocks(rng: () => number, avoid: (x: number, z: number) => boolean): Mesh {
  const base = createRockGeometry();
  const geoms: BufferGeometry[] = [];
  const add = (x: number, z: number, size: number): void => {
    const y = terrainHeight(x, z) + size * 0.18;
    geoms.push(
      place(
        base,
        new Vector3(x, y, z),
        new Euler(rng() * 0.4, rng() * Math.PI * 2, rng() * 0.4),
        new Vector3(
          size * (0.9 + rng() * 0.6),
          size * (0.7 + rng() * 0.5),
          size * (0.9 + rng() * 0.6),
        ),
      ),
    );
  };

  // 大岩（ランドマーク）と、広場の周囲に散らばる中小の岩
  add(-14, -9, 3.6);
  add(16, -14, 4.4);
  add(-22, 10, 3.0);
  add(24, 6, 2.6);
  for (let i = 0; i < 70; i++) {
    const a = rng() * Math.PI * 2;
    const d = 11 + Math.pow(rng(), 0.8) * 70;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (avoid(x, z)) continue;
    add(x, z, 0.35 + Math.pow(rng(), 2.2) * 1.8);
  }
  base.dispose();
  return mergeToMesh(geoms, createRockMaterial());
}

/** 衝突用の円柱（柱・倒れた柱）。`y` は底面の高さ。`euler` を指定した場合（倒れた柱）は `y` が中心の高さ。 */
export interface ColliderCylinder {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
  /** XYZ オイラー角（ラジアン）。 */
  readonly euler?: readonly [number, number, number];
}

/** 欠けた柱・倒れた柱・アーチからなる遺跡。立っている柱は衝突用に `pillars` へ記録する。 */
function createRuins(rng: () => number, pillars: ColliderCylinder[]): Mesh {
  const shaft = new CylinderGeometry(0.62, 0.7, 1, 14, 1);
  const cap = new BoxGeometry(1.7, 0.35, 1.7);
  const block = new BoxGeometry(1, 1, 1);
  const geoms: BufferGeometry[] = [];
  const zero = new Euler();
  const one = new Vector3(1, 1, 1);

  const pillar = (x: number, z: number, height: number, withCap: boolean, lean = 0): void => {
    const y = terrainHeight(x, z);
    const rot = new Euler(lean * 0.4, rng() * Math.PI, lean);
    geoms.push(
      place(shaft, new Vector3(x, y + height / 2 - 0.2, z), rot, new Vector3(1, height + 0.4, 1)),
    );
    pillars.push({ x, y, z, radius: 0.72, height: height + 0.4 });
    geoms.push(place(cap, new Vector3(x, y + 0.1, z), zero, one)); // 柱礎
    if (withCap) geoms.push(place(cap, new Vector3(x, y + height + 0.1, z), rot, one));
  };

  // 広場の奥に並ぶ柱列（ボス部屋の入口のような構図）
  const rowZ = -12;
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const intact = Math.abs(i) === 1 || i === 2;
    const h = intact ? 7.5 : 3 + rng() * 2.5;
    pillar(i * 4.4, rowZ + (rng() - 0.5) * 0.6, h, intact);
  }
  // 中央のアーチ（梁を渡す）
  const archY = terrainHeight(0, rowZ);
  geoms.push(
    place(block, new Vector3(0, archY + 8.2, rowZ), zero, new Vector3(10.2, 1.0, 1.8)),
    place(
      block,
      new Vector3(-4.4, archY + 8.95, rowZ),
      new Euler(0, 0, 0.05),
      new Vector3(2.2, 0.5, 1.9),
    ),
  );
  // 手前の側の独立した柱と倒れた柱
  pillar(9, 3, 5.5, false, 0.04);
  pillar(-10, 6, 6.5, true);
  pillars.push(
    {
      x: 5.5,
      y: terrainHeight(5.5, -3) + 0.65,
      z: -3,
      radius: 0.66,
      height: 5.2,
      euler: [0, 0.4, Math.PI / 2],
    },
    {
      x: 8.2,
      y: terrainHeight(8.2, -4.2) + 0.5,
      z: -4.2,
      radius: 0.6,
      height: 2.2,
      euler: [0, 1.2, Math.PI / 2 + 0.2],
    },
  );
  geoms.push(
    place(
      shaft,
      new Vector3(5.5, terrainHeight(5.5, -3) + 0.65, -3),
      new Euler(0, 0.4, Math.PI / 2),
      new Vector3(1, 5.2, 1),
    ),
    place(
      shaft,
      new Vector3(8.2, terrainHeight(8.2, -4.2) + 0.5, -4.2),
      new Euler(0, 1.2, Math.PI / 2 + 0.2),
      new Vector3(0.9, 2.2, 0.9),
    ),
  );
  // 崩れた石材
  for (let i = 0; i < 14; i++) {
    const a = rng() * Math.PI * 2;
    const d = 3 + rng() * 14;
    const x = Math.cos(a) * d;
    const z = -6 + Math.sin(a) * d;
    const s = 0.4 + rng() * 0.8;
    geoms.push(
      place(
        block,
        new Vector3(x, terrainHeight(x, z) + s * 0.3, z),
        new Euler(rng() * 0.5, rng() * 3, rng() * 0.5),
        new Vector3(s * 1.3, s * 0.7, s),
      ),
    );
  }
  shaft.dispose();
  cap.dispose();
  block.dispose();
  return mergeToMesh(geoms, createStoneMaterial());
}

/** 枯れ木（幹 + 数本の枝）。 */
function createDeadTrees(rng: () => number): Mesh {
  const trunk = new CylinderGeometry(0.12, 0.3, 1, 7, 1);
  trunk.translate(0, 0.5, 0);
  const geoms: BufferGeometry[] = [];

  const tree = (x: number, z: number, height: number): void => {
    const y = terrainHeight(x, z);
    const yaw = rng() * Math.PI * 2;
    const lean = (rng() - 0.5) * 0.2;
    geoms.push(
      place(
        trunk,
        new Vector3(x, y - 0.1, z),
        new Euler(lean, yaw, lean),
        new Vector3(1, height, 1),
      ),
    );
    const branches = 4 + Math.floor(rng() * 3);
    for (let i = 0; i < branches; i++) {
      const t = 0.45 + rng() * 0.5;
      const len = height * (0.3 + rng() * 0.3) * (1.1 - t * 0.5);
      const by = y + height * t;
      const a = rng() * Math.PI * 2;
      const tilt = 0.7 + rng() * 0.6;
      geoms.push(
        place(
          trunk,
          new Vector3(x, by, z),
          new Euler(Math.sin(a) * tilt, a, Math.cos(a) * tilt),
          new Vector3(0.45, len, 0.45),
        ),
      );
    }
  };

  tree(-8, -4, 6.5);
  tree(14, -6, 8.5);
  tree(-19, -14, 9.5);
  tree(21, 14, 7);
  tree(-26, 2, 8);
  tree(4, -30, 11);
  for (let i = 0; i < 10; i++) {
    const a = rng() * Math.PI * 2;
    const d = 28 + rng() * 40;
    tree(Math.cos(a) * d, Math.sin(a) * d, 5 + rng() * 6);
  }
  trunk.dispose();
  return mergeToMesh(geoms, createBarkMaterial());
}

/**
 * 黄金色に光る目印（拠点の祝福のような光）。ブルームの見た目確認用の高輝度エミッシブ。
 */
function createGoldenMarker(): Group {
  const group = new Group();
  const material = new MeshStandardNodeMaterial({ color: 0xffb54a, roughness: 0.4, metalness: 0 });
  material.emissiveNode = color(0xffa62e).mul(3.2);
  const orb = new Mesh(new SphereGeometry(0.14, 20, 14), material);
  orb.position.y = 1.2;
  const ring = new Mesh(new CylinderGeometry(0.55, 0.62, 0.06, 28, 1, true), material);
  ring.position.y = 0.05;
  group.add(orb, ring);
  return group;
}

/** 草の房: 数枚の細い三角ブレードを束ねたジオメトリ。法線は上向きに揃えて柔らかく陰影を付ける。 */
function createGrassTuftGeometry(rng: () => number): BufferGeometry {
  const positions: number[] = [];
  const blades = 5;
  for (let i = 0; i < blades; i++) {
    const yaw = rng() * Math.PI * 2;
    const h = 0.35 + rng() * 0.4;
    const w = 0.035 + rng() * 0.02;
    const lean = 0.12 + rng() * 0.2;
    const ox = (rng() - 0.5) * 0.18;
    const oz = (rng() - 0.5) * 0.18;
    const cx = Math.cos(yaw);
    const cz = Math.sin(yaw);
    // 底辺 2 頂点 + 先端 1 頂点（先端は lean 分だけ倒れる）
    positions.push(
      ox - cz * w,
      0,
      oz + cx * w,
      ox + cz * w,
      0,
      oz - cx * w,
      ox + cx * lean * h,
      h,
      oz + cz * lean * h,
    );
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const normals: number[] = [];
  for (let i = 0; i < positions.length / 3; i++) normals.push(0, 1, 0);
  g.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  return g;
}

function createGrass(count: number, rng: () => number): InstancedMesh | null {
  if (count <= 0) return null;
  const material = new MeshStandardNodeMaterial({ roughness: 1, metalness: 0, side: DoubleSide });
  material.colorNode = Fn(() => {
    const t = clamp(positionLocal.y.div(0.6), 0, 1);
    const tint = mx_noise_float(positionWorld.mul(0.25)).mul(0.5).add(0.5);
    const base = mix(color(0x34401f), color(0x4f5a2a), tint);
    const tip = mix(color(0x9a8a45), color(0xc4a85a), tint);
    return mix(base, tip, t.mul(t));
  })();
  // 風にそよぐ（インスタンスごとに位相をずらし、先端ほど大きく揺らす）
  material.positionNode = Fn(() => {
    const phase = instanceIndex.toFloat().mul(0.37).add(time.mul(1.7));
    const sway = sin(phase).mul(0.07).mul(positionLocal.y.div(0.6));
    return positionLocal.add(vec3(sway, 0, sway.mul(0.6)));
  })();

  const mesh = new InstancedMesh(createGrassTuftGeometry(rng), material, count);
  const dummy = new Object3D();
  let placed = 0;
  while (placed < count) {
    const a = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * 60;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    // 広場（土）の中心には生やさず、周辺ほど濃く、ノイズで群生させる
    const plaza = smoothstepJs(FLAT_RADIUS - 3, FLAT_RADIUS + 6, Math.hypot(x, z));
    const cluster = valueNoise(x * 0.18 + 40, z * 0.18);
    if (rng() > plaza * (0.25 + cluster)) continue;
    dummy.position.set(x, terrainHeight(x, z) - 0.02, z);
    dummy.rotation.set(0, rng() * Math.PI * 2, 0);
    const s = 0.8 + rng() * 0.9;
    dummy.scale.set(s, s * (0.8 + cluster * 0.8), s);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed++, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

function smoothstepJs(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export interface TestScene {
  readonly root: Group;
  /** 立っている柱の衝突用円柱（物理側へ渡す）。 */
  readonly pillars: readonly ColliderCylinder[];
}

/**
 * 地形の衝突メッシュ（描画と同じ頂点・三角形）。物理（Game）へ渡して、見た目と当たりを一致させる。
 */
export function createTerrainCollisionMesh(): { vertices: Float32Array; indices: Uint32Array } {
  const geometry = createTerrainGeometry();
  const position = geometry.attributes.position;
  const index = geometry.index;
  if (!position || !index) throw new Error('terrain geometry is missing position/index');
  const vertices = new Float32Array(position.array);
  const indices = Uint32Array.from(index.array);
  geometry.dispose();
  return { vertices, indices };
}

/**
 * 見た目確認用のテストシーン。起伏のある地面、岩、遺跡の柱、枯れ木、黄金の光。
 * 実際のフィールドが入るまでの足場であり、後続チケットで差し替える想定。
 */
export function createTestScene(preset: QualityPreset): TestScene {
  const root = new Group();
  const rng = createRng(20261009);

  const ground = new Mesh(createTerrainGeometry(), createTerrainMaterial(preset));
  ground.receiveShadow = true;
  root.add(ground);

  const nearRuins = (x: number, z: number): boolean => Math.hypot(x, z) < 11;
  root.add(createRocks(rng, nearRuins));
  const pillars: ColliderCylinder[] = [];
  root.add(createRuins(rng, pillars));
  root.add(createDeadTrees(rng));

  const grass = createGrass(preset.grassCount, rng);
  if (grass) root.add(grass);

  const marker = createGoldenMarker();
  marker.position.set(-3.2, 0, -2.4);
  root.add(marker);

  return { root, pillars };
}
