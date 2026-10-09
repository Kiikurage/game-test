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
} from 'three/webgpu';
import {
  type BlockStyle,
  type Level,
  type PlacedBox,
  type PlacedCylinder,
  type SurfaceKind,
} from '../game/world/level';

const DEG = Math.PI / 180;

/** 地表の素材ごとの色（グレーボックス。雰囲気付けは #7）。 */
const SURFACE_COLOR: Record<SurfaceKind, readonly [number, number, number]> = {
  grass: [0.3, 0.31, 0.19],
  stone: [0.42, 0.4, 0.37],
  wood: [0.4, 0.3, 0.2],
  underground: [0.24, 0.23, 0.24],
};
const PATH_COLOR: readonly [number, number, number] = [0.4, 0.34, 0.25];
const ROCK_COLOR: readonly [number, number, number] = [0.33, 0.31, 0.29];

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
  for (let i = 0; i < count; i++) {
    const x = vertices[i * 3] ?? 0;
    const z = vertices[i * 3 + 2] ?? 0;
    const base = SURFACE_COLOR[level.surfaceAt(x, z)];
    const path = level.pathWeight(x, z);
    // 低周波の色むら（頂点ごとの固定ノイズ）
    const n =
      0.88 + 0.24 * (0.5 + 0.5 * Math.sin(x * 0.37 + Math.cos(z * 0.23) * 2) * Math.cos(z * 0.41));
    const steep = Math.min(1, Math.max(0, (0.9 - normals.getY(i)) / 0.2));
    for (let c = 0; c < 3; c++) {
      let v = (base[c] ?? 0) * (1 - path) + (PATH_COLOR[c] ?? 0) * path;
      v = v * (1 - steep) + (ROCK_COLOR[c] ?? 0) * steep;
      colors[i * 3 + c] = v * n;
    }
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
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

  constructor(readonly level: Level) {
    const ground = new Mesh(
      createLevelTerrainGeometry(level),
      new MeshStandardNodeMaterial({ vertexColors: true, roughness: 1, metalness: 0 }),
    );
    ground.receiveShadow = true;
    this.root.add(ground);

    const materials = new Map<number, MeshStandardNodeMaterial>();
    for (const box of level.boxes) this.root.add(boxMesh(box, materials));
    for (const cyl of level.cylinders) this.root.add(cylinderObject(cyl));

    this.addBonfire();
    this.addTowerLight();
    this.addSpawnMarkers();
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
    const sword = new Mesh(
      new BoxGeometry(0.08, 1.4, 0.08),
      new MeshStandardNodeMaterial({ color: 0x6a645c, roughness: 0.8 }),
    );
    sword.position.set(x, y + 0.5 + 0.7, z);
    this.root.add(sword);
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
