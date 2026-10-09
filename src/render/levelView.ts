import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  SphereGeometry,
  Uint32BufferAttribute,
  ConeGeometry,
  InstancedMesh,
  type Object3D,
} from 'three/webgpu';
import {
  type BlockStyle,
  type Level,
  type PlacedBox,
  type PlacedCylinder,
  type SurfaceKind,
} from '../game/world/level';
import type { EnvironmentAssets } from './assets/environment';
import { StaticBatcher } from './assets/environment';
import { layoutEnvironment } from './environmentLayout';
import { layoutClutter, layoutGrass, stoneAmount, valueNoise } from './levelSurface';
import {
  createEnvironmentMaterials,
  createGrassMaterial,
  createGroundMaterial,
} from './levelMaterials';
import type { Bonfire, ParticleSystem } from './particles';

const DEG = Math.PI / 180;

/** 地表の素材ごとの色（リニア）。黄昏の墓地: 彩度を抑えた枯れ草・乾いた土・冷たい石。 */
const SURFACE_COLOR: Record<SurfaceKind, readonly [number, number, number]> = {
  grass: [0.15, 0.14, 0.078],
  stone: [0.2, 0.19, 0.17],
  wood: [0.2, 0.15, 0.1],
  underground: [0.1, 0.1, 0.11],
};
const PATH_COLOR: readonly [number, number, number] = [0.2, 0.155, 0.105];
const ROCK_COLOR: readonly [number, number, number] = [0.17, 0.155, 0.14];
const MOSS_COLOR: readonly [number, number, number] = [0.085, 0.115, 0.05];
const MUD_COLOR: readonly [number, number, number] = [0.085, 0.065, 0.048];
const ASH_COLOR: readonly [number, number, number] = [0.12, 0.115, 0.11];

const BLOCK_COLOR: Record<BlockStyle, number> = {
  wall: 0x8a8378,
  rubble: 0x756f66,
  tower: 0x7b756c,
  altar: 0xa09a8e,
  pew: 0x6d5238,
  grave: 0x9a968c,
  fence: 0x5a4632,
  mausoleum: 0x8d887d,
  stairs: 0x948e82,
  bonfire: 0x55504a,
  stone: 0x9a968c,
  sarcophagus: 0x7c776d,
};

/** 地形メッシュ（物理と同じ頂点）。頂点色は地表素材・道・勾配から決める。 */
export function createLevelTerrainGeometry(level: Level): BufferGeometry {
  const { vertices, indices } = level.terrain;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  const normals = geometry.getAttribute('normal');
  const count = vertices.length / 3;
  const colors = new Float32Array(count * 3);
  const stone = new Float32Array(count);
  const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
  for (let i = 0; i < count; i++) {
    const x = vertices[i * 3] ?? 0;
    const z = vertices[i * 3 + 2] ?? 0;
    const base = SURFACE_COLOR[level.surfaceAt(x, z)];
    const path = level.pathWeight(x, z);
    const stoneAmt = stoneAmount(level, x, z);
    stone[i] = stoneAmt;
    // 低周波の色むら + 苔・泥の斑
    const broad = valueNoise(x * 0.09 + 4, z * 0.09 - 2);
    const patch = valueNoise(x * 0.31 - 8, z * 0.31 + 3);
    const n = 0.8 + 0.4 * (0.6 * broad + 0.4 * patch);
    const mossAmt = Math.max(0, patch - 0.52) * 2.2 * (1 - path) * (1 - stoneAmt * 0.6);
    const mudAmt = Math.max(0, 0.42 - broad) * 1.6 * (1 - stoneAmt);
    const steep = Math.min(1, Math.max(0, (0.9 - normals.getY(i)) / 0.2));
    // 篝火の周りは灰で白っぽく、石畳は縁ほど土・草に侵される
    const ashAmt = Math.max(0, 1 - Math.hypot(x, z) / 3.2) * 0.8;
    for (let c = 0; c < 3; c++) {
      let v = (base[c] ?? 0) * (1 - path) + (PATH_COLOR[c] ?? 0) * path;
      v = mix(v, MOSS_COLOR[c] ?? 0, Math.min(0.7, mossAmt));
      v = mix(v, MUD_COLOR[c] ?? 0, Math.min(0.6, mudAmt));
      v = mix(v, ASH_COLOR[c] ?? 0, ashAmt);
      v = v * (1 - steep) + (ROCK_COLOR[c] ?? 0) * steep;
      colors[i * 3 + c] = v * n;
    }
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setAttribute('stone', new Float32BufferAttribute(stone, 1));
  return geometry;
}

function boxMesh(spec: PlacedBox, materials: Map<number, MeshStandardNodeMaterial>): Mesh {
  const color = BLOCK_COLOR[spec.style];
  let material = materials.get(color);
  if (!material) {
    material = new MeshStandardNodeMaterial({ color, roughness: 0.92, metalness: 0 });
    materials.set(color, material);
  }
  const mesh = new Mesh(new BoxGeometry(spec.hx * 2, spec.hy * 2, spec.hz * 2), material);
  mesh.position.set(spec.x, spec.y, spec.z);
  mesh.rotation.y = (spec.yawDeg ?? 0) * DEG;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const BARK = new MeshStandardNodeMaterial({ color: 0x3f352c, roughness: 1, metalness: 0 });
const COLUMN = new MeshStandardNodeMaterial({ color: 0x8a8378, roughness: 0.9, metalness: 0 });
const WATER = new MeshStandardNodeMaterial({ color: 0x2a3a4a, roughness: 0.2, metalness: 0 });
const IRON = new MeshStandardNodeMaterial({ color: 0x2c2b2a, roughness: 0.6, metalness: 0.5 });

function cylinderObject(c: PlacedCylinder): Group {
  const group = new Group();
  group.position.set(c.x, c.y, c.z);
  if (c.style === 'tree') {
    const trunk = new Mesh(new CylinderGeometry(c.radius * 0.7, c.radius * 1.2, c.height, 8), BARK);
    trunk.position.y = c.height / 2;
    group.add(trunk);
    // 枯れ枝（見た目だけ。衝突は幹のみ）
    for (let i = 0; i < 3; i++) {
      const branch = new Mesh(new BoxGeometry(0.08, 1.6, 0.08), BARK);
      const a = i * 2.1 + c.x;
      branch.position.set(Math.cos(a) * 0.5, c.height * (0.62 + i * 0.12), Math.sin(a) * 0.5);
      branch.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
      group.add(branch);
    }
    for (const m of group.children) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  } else if (c.style === 'fountain') {
    // 崩れた噴水: 低い水盤の縁と、折れた中央の柱
    const basin = new Mesh(
      new CylinderGeometry(c.radius, c.radius * 1.05, c.height * 0.8, 20),
      COLUMN,
    );
    basin.position.y = c.height * 0.4;
    const water = new Mesh(new CylinderGeometry(c.radius * 0.82, c.radius * 0.82, 0.05, 20), WATER);
    water.position.y = c.height * 0.8 + 0.02;
    const stump = new Mesh(new CylinderGeometry(0.32, 0.4, c.height * 1.5, 10), COLUMN);
    stump.position.y = c.height * 0.75;
    for (const m of [basin, stump]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    group.add(basin, water, stump);
  } else if (c.style === 'pedestal') {
    const lower = new Mesh(
      new CylinderGeometry(c.radius, c.radius * 1.12, c.height * 0.55, 16),
      COLUMN,
    );
    lower.position.y = c.height * 0.275;
    const upper = new Mesh(
      new CylinderGeometry(c.radius * 0.7, c.radius * 0.78, c.height * 0.45, 16),
      COLUMN,
    );
    upper.position.y = c.height * 0.775;
    for (const m of [lower, upper]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    group.add(lower, upper);
  } else {
    const column = new Mesh(new CylinderGeometry(c.radius, c.radius * 1.1, c.height, 12), COLUMN);
    column.position.y = c.height / 2;
    column.castShadow = true;
    column.receiveShadow = true;
    group.add(column);
  }
  return group;
}

/**
 * レベル（`game/world/level.ts`）の描画: 地形・静的物・篝火・塔の灯り、敵やアイテムの配置マーカー。
 * 形は `Level` のデータそのものなので、物理と見た目が一致する。
 */
export class LevelView {
  readonly root = new Group();
  /** 環境メッシュへ置き換えるとき消すグレーボックス（コライダの id → 表示物）。 */
  private readonly grayboxById = new Map<string, Object3D>();
  private readonly grayboxBonfire: Object3D[] = [];
  private towerLamp: Object3D | null = null;
  private environmentRoot: Group | null = null;
  private bonfireEmitter: Bonfire | null = null;
  /** 環境メッシュの統計（置いた数・結合後の三角形数・ドローコール数）。 */
  environmentStats: { placements: number; triangles: number; meshes: number } | null = null;

  constructor(readonly level: Level) {
    const ground = new Mesh(createLevelTerrainGeometry(level), createGroundMaterial());
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.root.add(ground);

    const materials = new Map<number, MeshStandardNodeMaterial>();
    for (const box of level.boxes) {
      const mesh = boxMesh(box, materials);
      this.grayboxById.set(box.id, mesh);
      this.root.add(mesh);
    }
    for (const cyl of level.cylinders) {
      const object = cylinderObject(cyl);
      this.grayboxById.set(cyl.id, object);
      this.root.add(object);
    }

    this.addGates();
    this.addBonfire();
    this.addTowerLight();
    this.addSpawnMarkers();
  }

  /**
   * 環境メッシュ（墓石・枯れ木・柵・石壁・塔・篝火の土台・ランタンなど。エリア A〜C）と地面の枯れ草を置き、
   * 置き換えたグレーボックスを消す。`particles` があれば篝火の炎・火の粉・灯りをパーティクルで出す。
   */
  attachEnvironment(assets: EnvironmentAssets, particles?: ParticleSystem): void {
    if (this.environmentRoot) return;
    const layout = layoutEnvironment(this.level);
    const batcher = new StaticBatcher(assets);
    for (const p of [...layout.placements, ...layoutClutter(this.level)]) {
      batcher.add(p.id, p.matrix, p.bucket);
    }
    const env = batcher.build(createEnvironmentMaterials());
    env.name = 'environment';

    // 枯れ草（InstancedMesh。品種ごとに 1 ドローコール。影は落とさない）
    const grass = layoutGrass(this.level);
    const grassMaterial = createGrassMaterial();
    let grassTris = 0;
    for (const [id, matrices] of [
      ['GrassTuftA', grass.a],
      ['GrassTuftB', grass.b],
      ['GrassTuftC', grass.c],
    ] as const) {
      if (matrices.length === 0) continue;
      const part = assets.parts(id)[0];
      if (!part) continue;
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(part.positions, 3));
      geometry.setAttribute('normal', new Float32BufferAttribute(part.normals, 3));
      geometry.setIndex(new Uint32BufferAttribute(part.indices, 1));
      const mesh = new InstancedMesh(geometry, grassMaterial, matrices.length);
      matrices.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.name = `grass:${id}`;
      env.add(mesh);
      grassTris += (part.indices.length / 3) * matrices.length;
    }

    this.root.add(env);
    this.environmentRoot = env;
    for (const id of layout.coveredIds) {
      const object = this.grayboxById.get(id);
      if (object) {
        object.removeFromParent();
        this.grayboxById.delete(id);
      }
    }
    // 篝火: グレーボックスの炎・剣と、塔の仮のランプを消す（環境メッシュに含まれる）
    for (const object of this.grayboxBonfire) object.removeFromParent();
    this.grayboxBonfire.length = 0;
    this.towerLamp?.removeFromParent();
    this.towerLamp = null;

    if (particles) {
      const { x, z } = this.level.data.bonfire;
      this.bonfireEmitter = particles.acquireBonfire(x, this.level.heightAt(x, z) + 0.25, z);
    }
    this.environmentStats = {
      placements: batcher.stats.placements,
      triangles: batcher.stats.triangles + grassTris,
      meshes: env.children.length,
    };
  }

  /** 篝火のパーティクル（点火 / 消火の操作用）。環境メッシュを置いたあとに取得できる。 */
  get bonfire(): Bonfire | null {
    return this.bonfireEmitter;
  }

  private addBonfire(): void {
    const { x, z } = this.level.data.bonfire;
    const y = this.level.heightAt(x, z);
    const flame = new Mesh(
      new ConeGeometry(0.4, 1.3, 10),
      new MeshBasicNodeMaterial({ color: 0xff8a2a }),
    );
    flame.position.set(x, y + 0.5 + 0.65, z);
    this.root.add(flame);
    this.grayboxBonfire.push(flame);
    const sword = new Mesh(
      new BoxGeometry(0.08, 1.4, 0.08),
      new MeshStandardNodeMaterial({ color: 0x6a645c, roughness: 0.8 }),
    );
    sword.position.set(x, y + 0.5 + 0.7, z);
    this.root.add(sword);
    this.grayboxBonfire.push(sword);
  }

  /** 門とレバー（グレーボックス。開閉の演出は別チケット）。鉄門は鉄格子、霧の門は青白い半透明の板。 */
  private addGates(): void {
    for (const g of this.level.gates) {
      const { def } = g;
      const gate = new Group();
      gate.name = `gate:${def.id}`;
      gate.position.set(def.x, g.y, def.z);
      gate.rotation.y = def.yawDeg * DEG;
      if (def.kind === 'iron') {
        const bars = Math.round(def.width / 0.45);
        for (let i = 0; i <= bars; i++) {
          const bar = new Mesh(new BoxGeometry(0.07, def.height, 0.07), IRON);
          bar.position.set(-def.width / 2 + (i * def.width) / bars, def.height / 2, 0);
          bar.castShadow = true;
          gate.add(bar);
        }
        for (const y of [0.4, def.height - 0.3]) {
          const rail = new Mesh(new BoxGeometry(def.width, 0.1, 0.1), IRON);
          rail.position.y = y;
          gate.add(rail);
        }
      } else {
        const fog = new Mesh(
          new BoxGeometry(def.width, def.height, 0.1),
          new MeshBasicNodeMaterial({ color: 0xa8c8ff, transparent: true, opacity: 0.18 }),
        );
        fog.position.y = def.height / 2;
        gate.add(fog);
      }
      this.root.add(gate);
    }
    for (const lever of this.level.data.interactables.filter((i) => i.kind === 'lever')) {
      const y = this.level.heightAt(lever.x, lever.z);
      const post = new Mesh(new BoxGeometry(0.3, 1, 0.3), COLUMN);
      post.position.set(lever.x, y + 0.5, lever.z);
      const handle = new Mesh(new BoxGeometry(0.06, 0.6, 0.06), IRON);
      handle.position.set(lever.x, y + 1.15, lever.z);
      handle.rotation.z = -0.6;
      post.castShadow = true;
      this.root.add(post, handle);
    }
  }

  /** 礼拝堂の塔のてっぺんの橙の灯り（開始地点から見えるランドマーク）。 */
  private addTowerLight(): void {
    const tower = this.level.boxes.find((b) => b.style === 'tower');
    if (!tower) return;
    const top = tower.y + tower.hy;
    const lamp = new Mesh(
      new SphereGeometry(0.9, 12, 8),
      new MeshBasicNodeMaterial({ color: 0xffa040 }),
    );
    lamp.position.set(tower.x, top + 0.9, tower.z);
    this.root.add(lamp);
    this.towerLamp = lamp;
  }

  /** 敵・アイテムの配置の目印（グレーボックス用。実体は後続チケットで差し替える）。 */
  private addSpawnMarkers(): void {
    const { enemies, items } = this.level.data;
    const enemyMat = new MeshStandardNodeMaterial({
      color: 0x8a3a3a,
      roughness: 0.8,
      transparent: true,
      opacity: 0.55,
    });
    const shieldMat = new MeshStandardNodeMaterial({
      color: 0x3a5a8a,
      roughness: 0.8,
      transparent: true,
      opacity: 0.55,
    });
    for (const e of enemies) {
      const marker = new Mesh(
        new CapsuleGeometry(0.35, 1.1, 4, 10),
        e.type === 'undead_shield' ? shieldMat : enemyMat,
      );
      marker.position.set(e.x, this.level.heightAt(e.x, e.z) + 0.9, e.z);
      marker.name = `spawn:${e.id}`;
      this.root.add(marker);
    }
    const itemMat = new MeshBasicNodeMaterial({ color: 0xf0c050 });
    for (const item of items) {
      const marker = new Mesh(new SphereGeometry(0.2, 10, 8), itemMat);
      marker.position.set(item.x, this.level.heightAt(item.x, item.z) + 0.6, item.z);
      marker.name = `item:${item.id}`;
      this.root.add(marker);
    }
  }
}
