import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardNodeMaterial,
  PlaneGeometry,
  type Object3D,
} from 'three/webgpu';
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
  for (const way of level.data.waterways ?? []) {
    for (const r of way.rects) {
      if (!r.water) continue;
      const plane = new Mesh(new PlaneGeometry(r.maxX - r.minX, r.maxZ - r.minZ), waterMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set((r.minX + r.maxX) / 2, r.floorY + way.depth, (r.minZ + r.maxZ) / 2);
      plane.name = `water:${r.id}`;
      plane.receiveShadow = true;
      root.add(plane);
    }
  }

  const wood = new MeshStandardNodeMaterial({ color: 0x5a4430, roughness: 0.95, metalness: 0 });
  const iron = new MeshStandardNodeMaterial({ color: 0x35302c, roughness: 0.6, metalness: 0.5 });

  const hatchBox = level.boxes.find((b) => b.style === 'hatch');
  let hatch: Object3D | null = null;
  if (hatchBox) {
    // 床板: 板を 4 枚並べた箱（隙間から水の反射が見える想定。隙間は E11-4）
    const group = new Group();
    const planks = 4;
    const w = (hatchBox.hx * 2) / planks;
    for (let i = 0; i < planks; i++) {
      const plank = new Mesh(new BoxGeometry(w * 0.94, hatchBox.hy * 2, hatchBox.hz * 2), wood);
      plank.position.x = -hatchBox.hx + w * (i + 0.5);
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);
    }
    group.position.set(hatchBox.x, hatchBox.y, hatchBox.z);
    group.rotation.y = (hatchBox.yawDeg ?? 0) * DEG;
    root.add(group);
    hatch = group;
  }

  const grateBox = level.boxes.find((b) => b.style === 'grate');
  let grate: Object3D | null = null;
  if (grateBox) {
    // 鉄格子: 縦の鉄棒と上下の枠
    const group = new Group();
    const bars = 8;
    for (let i = 0; i < bars; i++) {
      const bar = new Mesh(new BoxGeometry(0.06, grateBox.hy * 2, 0.06), iron);
      bar.position.x = -grateBox.hx + 0.1 + ((grateBox.hx * 2 - 0.2) * i) / (bars - 1);
      group.add(bar);
    }
    for (const dy of [-1, 1]) {
      const rail = new Mesh(new BoxGeometry(grateBox.hx * 2, 0.1, 0.1), iron);
      rail.position.y = dy * (grateBox.hy - 0.05);
      group.add(rail);
    }
    for (const m of group.children) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    group.position.set(grateBox.x, grateBox.y, grateBox.z);
    group.rotation.y = (grateBox.yawDeg ?? 0) * DEG;
    root.add(group);
    grate = group;
  }

  const state = waterwayOf(game);
  return {
    update: () => {
      if (hatch) hatch.visible = !state.hatchBroken;
      if (grate) grate.visible = !state.grateOpen;
    },
  };
});
