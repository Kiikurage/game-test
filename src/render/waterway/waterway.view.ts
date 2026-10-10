import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardNodeMaterial,
  PlaneGeometry,
  type BufferGeometry,
  type Object3D,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { waterwayOf } from '../../game/world/waterway.system';
import { registerViewPlugin } from '../viewPlugins';

const DEG = Math.PI / 180;

// 地下水路（#111）の描画。地形・壁・床・天井は `levelView` の箱（style `waterway`）。ここでは
//  - 浅い水面（床の上 `depth`。足音は SurfaceKind 'water'）
//  - 腐った床板（割れたら消える）と鉄格子（開いたら消える）。コライダは `Game.setBoxEnabled`
// を足す。見た目の作り込み（苔の青白い発光・水の質感）は E11-4。
registerViewPlugin('waterway', ({ game, view, level }) => {
  const root = new Group();
  root.name = 'waterway';
  view.scene.add(root);
  if (!level) return {};

  // 水面: 青黒い面に弱い自己発光（暗い水路で水面だけ青白く見える）
  const waterMaterial = new MeshStandardNodeMaterial({
    color: 0x1d3a4c,
    roughness: 0.12,
    metalness: 0,
    emissive: 0x0b2a3a,
    emissiveIntensity: 1.2,
  });
  // ドローコールを増やさないよう、水面・鉄格子はそれぞれ 1 メッシュに結合する
  const waterParts: BufferGeometry[] = [];
  for (const way of level.data.waterways ?? []) {
    for (const r of way.rects) {
      if (!r.water) continue;
      const plane = new PlaneGeometry(r.maxX - r.minX, r.maxZ - r.minZ);
      plane.rotateX(-Math.PI / 2);
      plane.translate((r.minX + r.maxX) / 2, r.floorY + way.depth, (r.minZ + r.maxZ) / 2);
      waterParts.push(plane);
    }
  }
  const waterGeometry = waterParts.length > 0 ? mergeGeometries(waterParts) : null;
  if (waterGeometry) {
    const water = new Mesh(waterGeometry, waterMaterial);
    water.name = 'water';
    water.receiveShadow = true;
    root.add(water);
  }

  const wood = new MeshStandardNodeMaterial({ color: 0x5a4430, roughness: 0.95, metalness: 0 });
  const iron = new MeshStandardNodeMaterial({ color: 0x35302c, roughness: 0.6, metalness: 0.5 });

  const hatchBox = level.boxes.find((b) => b.style === 'hatch');
  let hatch: Object3D | null = null;
  if (hatchBox) {
    // 床板（割れたら消える）。板の継ぎ目・隙間の見た目は E11-4
    const mesh = new Mesh(new BoxGeometry(hatchBox.hx * 2, hatchBox.hy * 2, hatchBox.hz * 2), wood);
    mesh.position.set(hatchBox.x, hatchBox.y, hatchBox.z);
    mesh.rotation.y = (hatchBox.yawDeg ?? 0) * DEG;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    hatch = mesh;
  }

  const grateBox = level.boxes.find((b) => b.style === 'grate');
  let grate: Object3D | null = null;
  if (grateBox) {
    // 鉄格子: 縦の鉄棒と上下の枠
    const parts: BufferGeometry[] = [];
    const bars = 8;
    for (let i = 0; i < bars; i++) {
      const bar = new BoxGeometry(0.06, grateBox.hy * 2, 0.06);
      bar.translate(-grateBox.hx + 0.1 + ((grateBox.hx * 2 - 0.2) * i) / (bars - 1), 0, 0);
      parts.push(bar);
    }
    for (const dy of [-1, 1]) {
      const rail = new BoxGeometry(grateBox.hx * 2, 0.1, 0.1);
      rail.translate(0, dy * (grateBox.hy - 0.05), 0);
      parts.push(rail);
    }
    const mesh = new Mesh(mergeGeometries(parts), iron);
    mesh.position.set(grateBox.x, grateBox.y, grateBox.z);
    mesh.rotation.y = (grateBox.yawDeg ?? 0) * DEG;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    grate = mesh;
  }

  const state = waterwayOf(game);
  return {
    update: () => {
      if (hatch) hatch.visible = !state.hatchBroken;
      if (grate) grate.visible = !state.grateOpen;
    },
  };
});
