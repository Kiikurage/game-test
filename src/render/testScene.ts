import {
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Object3D,
  IcosahedronGeometry,
  Matrix4,
  Mesh,
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
  normalWorld,
  positionWorld,
  smoothstep,
  sin,
  time,
  positionLocal,
  vec3,
} from 'three/tsl';
import type { QualityPreset } from './quality';
import { bakedFractal, bakedNoise } from './bakedNoise';
import { createUberMaterial, type UberMaterial } from './uberMaterial';
import { FLAT_RADIUS, terrainHeight, valueNoise } from '../game/world/terrain';
import {
  TEST_SCENE_FALLEN_PILLARS,
  TEST_SCENE_PILLARS,
  TEST_TERRAIN_SEGMENTS,
  TEST_TERRAIN_SIZE,
} from '../game/world/testScene';

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

export function createTerrainGeometry(): BufferGeometry {
  const geometry = new PlaneGeometry(
    TEST_TERRAIN_SIZE,
    TEST_TERRAIN_SIZE,
    TEST_TERRAIN_SEGMENTS,
    TEST_TERRAIN_SEGMENTS,
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

function createTerrainMaterial(preset: QualityPreset): UberMaterial {
  const octaves = preset.detailOctaves;

  const colorNode = Fn(() => {
    const p = positionWorld;
    // 低周波の地色むら + 高周波のディテール
    const broad = bakedFractal(vec3(p.x.mul(0.035), 0.0, p.z.mul(0.035)), 3)
      .mul(0.5)
      .add(0.5);
    const fine = bakedFractal(vec3(p.x.mul(0.9), 0.0, p.z.mul(0.9)), octaves)
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
  });
  return createUberMaterial(
    { shading: 'lit', surface: () => ({ color: colorNode() }) },
    { roughness: 1, metalness: 0 },
  );
}

function createRockMaterial(): UberMaterial {
  return createUberMaterial(
    {
      shading: 'lit',
      surface: () => ({
        color: Fn(() => {
          const p = positionWorld;
          const n = bakedNoise(p.mul(1.7)).mul(0.5).add(0.5);
          const grain = bakedNoise(p.mul(7.0)).mul(0.5).add(0.5);
          const stone = mix(color(0x544f49), color(0x8a8378), n);
          let col = stone.mul(mix(0.85, 1.1, grain));
          // 上向きの面に苔
          const moss = smoothstep(0.55, 0.85, normalWorld.y.add(n.mul(0.25)));
          col = mix(col, color(0x56612f).mul(mix(0.8, 1.15, grain)), moss.mul(0.7));
          return col;
        })(),
      }),
    },
    { roughness: 0.92, metalness: 0 },
  );
}

function createStoneMaterial(): UberMaterial {
  return createUberMaterial(
    {
      shading: 'lit',
      surface: () => ({
        color: Fn(() => {
          const p = positionWorld;
          const streak = bakedNoise(vec3(p.x.mul(2.5), p.y.mul(0.5), p.z.mul(2.5)))
            .mul(0.5)
            .add(0.5);
          const grain = bakedNoise(p.mul(9.0)).mul(0.5).add(0.5);
          const warm = color(0xc2ae8c); // 風化した砂岩
          const cool = color(0x84796c);
          let col = mix(cool, warm, smoothstep(0.25, 0.75, streak));
          col = col.mul(mix(0.82, 1.08, grain));
          // 下部ほど湿って暗く、苔が付く
          const damp = smoothstep(2.5, 0.0, p.y);
          col = mix(col, color(0x4a5230), clamp(damp.mul(0.35), 0, 1));
          return col;
        })(),
      }),
    },
    { roughness: 0.85, metalness: 0 },
  );
}

function createBarkMaterial(): UberMaterial {
  return createUberMaterial(
    {
      shading: 'lit',
      surface: () => ({
        color: Fn(() => {
          const p = positionWorld;
          const n = bakedNoise(vec3(p.x.mul(6), p.y.mul(1.2), p.z.mul(6)))
            .mul(0.5)
            .add(0.5);
          return mix(color(0x2c241d), color(0x5a4a3a), n);
        })(),
      }),
    },
    { roughness: 0.95, metalness: 0 },
  );
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
  material: UberMaterial,
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

/** 欠けた柱・倒れた柱・アーチからなる遺跡。柱の配置と当たりは game 側のデータ（`game/world/testScene`）。 */
function createRuins(rng: () => number): Mesh {
  const shaft = new CylinderGeometry(0.62, 0.7, 1, 14, 1);
  const cap = new BoxGeometry(1.7, 0.35, 1.7);
  const block = new BoxGeometry(1, 1, 1);
  const geoms: BufferGeometry[] = [];
  const zero = new Euler();
  const one = new Vector3(1, 1, 1);

  TEST_SCENE_PILLARS.forEach((p, i) => {
    // 柱列の位置・高さは以前この乱数列から作っていた。以降（石材・枯れ木）の配置を変えないよう読み捨てる
    if (i < 6) {
      rng();
      if (!p.capped) rng();
    }
    const lean = p.lean ?? 0;
    const y = terrainHeight(p.x, p.z);
    const rot = new Euler(lean * 0.4, rng() * Math.PI, lean);
    geoms.push(
      place(
        shaft,
        new Vector3(p.x, y + p.height / 2 - 0.2, p.z),
        rot,
        new Vector3(1, p.height + 0.4, 1),
      ),
    );
    geoms.push(place(cap, new Vector3(p.x, y + 0.1, p.z), zero, one)); // 柱礎
    if (p.capped) geoms.push(place(cap, new Vector3(p.x, y + p.height + 0.1, p.z), rot, one));
  });

  // 中央のアーチ（梁を渡す）
  const archY = terrainHeight(0, -12);
  geoms.push(
    place(block, new Vector3(0, archY + 8.2, -12), zero, new Vector3(10.2, 1.0, 1.8)),
    place(
      block,
      new Vector3(-4.4, archY + 8.95, -12),
      new Euler(0, 0, 0.05),
      new Vector3(2.2, 0.5, 1.9),
    ),
  );
  // 倒れた柱（見た目の太さは当たりの半径に合わせて柱身を縮める）
  for (const p of TEST_SCENE_FALLEN_PILLARS) {
    const w = p.radius < 0.66 ? 0.9 : 1;
    geoms.push(
      place(
        shaft,
        new Vector3(p.x, terrainHeight(p.x, p.z) + p.lift, p.z),
        new Euler(...p.euler),
        new Vector3(w, p.length, w),
      ),
    );
  }
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
  const material = createUberMaterial(
    { shading: 'lit', surface: () => ({ emissive: color(0xffa62e).mul(3.2) }) },
    { color: 0xffb54a, roughness: 0.4, metalness: 0 },
  );
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
  const material = createUberMaterial(
    {
      shading: 'lit',
      doubleSided: true,
      surface: () => ({
        color: Fn(() => {
          const t = clamp(positionLocal.y.div(0.6), 0, 1);
          const tint = bakedNoise(positionWorld.mul(0.25)).mul(0.5).add(0.5);
          const base = mix(color(0x34401f), color(0x4f5a2a), tint);
          const tip = mix(color(0x9a8a45), color(0xc4a85a), tint);
          return mix(base, tip, t.mul(t));
        })(),
        // 風にそよぐ（インスタンスごとに位相をずらし、先端ほど大きく揺らす）
        position: Fn(() => {
          const phase = instanceIndex.toFloat().mul(0.37).add(time.mul(1.7));
          const sway = sin(phase).mul(0.07).mul(positionLocal.y.div(0.6));
          return positionLocal.add(vec3(sway, 0, sway.mul(0.6)));
        })(),
      }),
    },
    { roughness: 1, metalness: 0 },
  );

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
  root.add(createRuins(rng));
  root.add(createDeadTrees(rng));

  const grass = createGrass(preset.grassCount, rng);
  if (grass) root.add(grass);

  const marker = createGoldenMarker();
  marker.position.set(-3.2, 0, -2.4);
  root.add(marker);

  return { root };
}
