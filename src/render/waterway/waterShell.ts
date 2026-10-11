import {
  Group,
  Mesh,
  type BufferGeometry,
  type Material,
  type MeshStandardNodeMaterial,
} from 'three/webgpu';
import {
  abs,
  attribute,
  cameraPosition,
  clamp,
  distance,
  float,
  max,
  mix,
  normalize,
  normalWorld,
  positionWorld,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { Level, WaterwayDef, WaterwayRect } from '../../game/world/level';
import { bakedNoise } from '../bakedNoise';
import { createMetalMaterial } from '../levelMaterials';
import { createFlameMaterial, FxBuilder } from '../masonry/glowMaterials';
import { MasonryBuilder, hashSeed, type Vec3 } from '../masonry/masonryGeometry';
import { createMasonryMaterial } from '../masonry/masonryMaterial';
import { PropBuilder } from '../masonry/propBuilder';
import { LIGHT_KIND, MOSS_PATCHES, torchFlame, waterwayTorches } from './waterwayLevel';
import { lightAt, specularAt, type WaterLightRig } from './waterLighting';
import { causticsAt, layoutAt, simAt, type F, type V3, type WaterFields } from './waterNodes';

/**
 * 地下水路の殻（#270）: 壁・床・天井・石棺を石積みで、壁のたいまつを小物 + 炎で描く（`LevelView` は style `waterway` の箱を描かない）。
 *
 * 石積みマテリアルに次を足す。
 *  - 水際の濡れ: 水面から上の帯（高さはノイズで揺れる）を暗く、つやを上げる（粗さ 0.2）。帯の上端に薄い水垢の線。
 *    濡れた所だけ、たいまつ・穴の光の GGX を足す（暗く光る濡れた石）。
 *  - 偽のライト（`waterLighting`）の拡散光。
 *  - コースティクス: 水中の床・壁は水面を通った光の模様で明暗が付く（波の勾配で歪む）。
 *    水面の上の壁の下部と天井には、水面で反射した光の揺らめき（弱い）。
 *  - 光る苔: 壁の水際の数か所に、青白く光る苔の塊。
 */

/** 石積みの色（水路は地下墓所より冷たく暗い石）。 */
const TINT: Vec3 = [0.42, 0.43, 0.45];
const IRON: Vec3 = [0.045, 0.042, 0.04];
const WOOD: Vec3 = [0.07, 0.045, 0.03];
const COAL: Vec3 = [0.03, 0.025, 0.022];

export interface WaterShell {
  readonly root: Group;
  readonly triangles: number;
  readonly meshes: readonly Mesh[];
}

/** 点 (x, z) に最も近い区画（中なら距離 0）。 */
function nearestRect(rects: readonly WaterwayRect[], x: number, z: number): WaterwayRect | null {
  let best: WaterwayRect | null = null;
  let bestD = Infinity;
  for (const r of rects) {
    const dx = Math.max(r.minX - x, 0, x - r.maxX);
    const dz = Math.max(r.minZ - z, 0, z - r.maxZ);
    const d = Math.hypot(dx, dz);
    if (d < bestD - 1e-6 || (Math.abs(d - bestD) < 1e-6 && best && r.floorY < best.floorY)) {
      best = r;
      bestD = d;
    }
  }
  return best;
}

function wrapMaterial(
  material: MeshStandardNodeMaterial,
  fields: WaterFields,
  rig: WaterLightRig,
): void {
  const mx = attribute('mx', 'vec3');
  const mu = attribute('mu', 'vec2');
  const baseColor = material.colorNode as unknown as { xyz: V3 };
  const albedo0 = baseColor.xyz;
  const baseRough = (material.roughnessNode ?? float(0.92)) as F;
  const wp = positionWorld;
  const nw = normalWorld;
  // mx.z = 水面（水の区画）/ 床（段・出口）からの高さ
  const h = mx.z;
  const n1 = bakedNoise(vec3(mu.x.mul(1.9), mu.y.mul(1.9), float(4.2)));
  const n2 = bakedNoise(vec3(mu.x.mul(7.3), mu.y.mul(7.3), float(6.6)));
  const line = n1.mul(0.24).add(0.32);
  const wet = smoothstep(line, line.sub(0.22), h);
  const submerged = smoothstep(0.02, -0.03, h);
  const tide = smoothstep(0.03, 0.0, abs(h.sub(line).sub(0.05)))
    .mul(smoothstep(0.35, 0.65, n2))
    .mul(0.5);
  // 水中は藻で緑がかる
  const algae = submerged.mul(smoothstep(0.3, 0.7, n2.add(n1.mul(0.4))));

  // --- 光る苔（壁の水際の塊）---
  let moss: F = float(0);
  for (const m of MOSS_PATCHES) {
    const d = distance(wp, vec3(m.x, m.y, m.z));
    moss = max(moss, smoothstep(m.r, m.r * 0.25, d.add(n2.mul(0.25))));
  }
  const mossMask = moss.mul(smoothstep(0.42, 0.62, n1.add(n2.mul(0.35))));

  let albedo: V3 = albedo0.mul(mix(float(1), float(0.48), wet)).mul(tide.mul(0.45).add(1));
  albedo = mix(albedo, vec3(0.035, 0.05, 0.035), algae.mul(0.55));
  albedo = mix(albedo, vec3(0.03, 0.07, 0.06), mossMask.mul(0.8));
  material.colorNode = vec4(albedo, 1);
  material.roughnessNode = mix(baseRough, float(0.2), wet.mul(float(1).sub(submerged.mul(0.4))));

  // --- 偽のライト + コースティクス ---
  const lit = lightAt(rig, wp, nw);
  const sim = simAt(fields, wp.xz);
  const distort = sim.yz.mul(0.35);
  // 面の座標（m）で引く（床は xz、壁は 面に沿った距離 × 高さ）
  const caus = causticsAt(fields, mu, distort);
  // 水中: 水面を通った光の模様（明暗）
  const under = albedo.mul(lit).mul(mix(float(1), caus, submerged.mul(0.9)));
  // 水面の上: 反射した光の揺らめき（壁の下部・天井）。壁の法線の先（水路側）が水か
  const probe = layoutAt(fields, wp.xz.add(vec2(nw.x, nw.z).mul(0.3))).w;
  const ceiling = smoothstep(-0.5, -0.8, nw.y);
  const wallNear = smoothstep(1.3, 0.05, h).mul(float(1).sub(submerged)).mul(probe);
  const ceilNear = ceiling.mul(layoutAt(fields, wp.xz).w).mul(0.55);
  const causUp = causticsAt(fields, mu.mul(0.8).add(vec2(3.1, 1.7)), distort.mul(2));
  const bounce = albedo
    .mul(lit.add(vec3(0.05, 0.06, 0.07)))
    .mul(clamp(causUp.sub(0.55), 0, 3))
    .mul(max(wallNear, ceilNear).mul(0.55));
  // 濡れた石のハイライト
  const view: V3 = normalize(cameraPosition.sub(wp));
  const glossy = specularAt(rig, wp, nw, view, 0.32, [LIGHT_KIND.torch, LIGHT_KIND.shaft]).mul(
    wet.mul(float(1).sub(submerged)).mul(0.05),
  );
  const mossGlow = vec3(0.05, 0.3, 0.34).mul(mossMask.mul(1.6));
  material.emissiveNode = under.add(bounce).add(glossy).add(mossGlow);
}

/** 壁のたいまつ（金具・柄・炭 + 炎の板）。地下墓所のものより短い（天井が低い）。 */
function addTorches(props: PropBuilder, flames: FxBuilder, floorY: number): void {
  waterwayTorches(floorY).forEach((t, i) => {
    const tx = -t.nz;
    const tz = t.nx;
    const yaw = Math.atan2(t.nx, t.nz);
    const at = (n: number, s: number, up: number): [number, number, number] => [
      t.x + t.nx * n + tx * s,
      t.y + up,
      t.z + t.nz * n + tz * s,
    ];
    const rot = { yaw };
    props.box(at(0.03, 0, 0), [0.07, 0.15, 0.03], IRON, rot);
    props.box(at(0.15, 0, -0.02), [0.022, 0.022, 0.13], IRON, rot);
    props.cylinder(at(0.27, 0, 0.02), 0.075, 0.05, 0.13, IRON, rot, 10);
    props.cylinder(at(0.31, 0, 0.22), 0.036, 0.03, 0.42, WOOD, { yaw, tiltX: 0.16 }, 7);
    props.cylinder(at(0.34, 0, 0.44), 0.075, 0.045, 0.12, COAL, { yaw, tiltX: 0.16 }, 8);
    const phase = hashSeed(i * 5.3 + 1);
    const head = torchFlame(t);
    const w = 0.34;
    const hgt = 0.56;
    const y0 = head[1] - 0.06;
    flames.quad(
      [head[0] - tx * (w / 2), y0, head[2] - tz * (w / 2)],
      [head[0] + tx * (w / 2), y0, head[2] + tz * (w / 2)],
      [head[0] - tx * (w / 2), y0 + hgt, head[2] - tz * (w / 2)],
      0,
      phase,
      1,
    );
    flames.quad(
      [head[0] - t.nx * (w / 2), y0, head[2] - t.nz * (w / 2)],
      [head[0] + t.nx * (w / 2), y0, head[2] + t.nz * (w / 2)],
      [head[0] - t.nx * (w / 2), y0 + hgt, head[2] - t.nz * (w / 2)],
      0,
      phase,
      1,
    );
  });
}

export function buildWaterShell(
  level: Level,
  way: WaterwayDef,
  fields: WaterFields,
  rig: WaterLightRig,
  detail: 0 | 1 | 2,
): WaterShell {
  const surfaceY = fields.grid.surfaceY;
  const groundAt = (x: number, z: number): number => {
    const r = nearestRect(way.rects, x, z);
    if (!r) return surfaceY;
    return r.water ? r.floorY + way.depth : r.floorY;
  };
  const masonry = new MasonryBuilder(groundAt);
  const lidBuilder = new MasonryBuilder(groundAt);
  for (const b of level.boxes) {
    if (b.style !== 'waterway') continue;
    if (b.id === 'ww-sarcophagus') {
      // 石棺: 胴（少し沈める）+ 一回り大きい蓋
      const top = b.y + b.hy;
      masonry.addBox({
        x: b.x,
        y: b.y - 0.05,
        z: b.z,
        hx: b.hx - 0.04,
        hy: b.hy - 0.05,
        hz: b.hz - 0.04,
        tint: [0.46, 0.46, 0.45],
        cell: 0.3,
        ruin: 0.02,
      });
      lidBuilder.addBox({
        x: b.x + 0.02,
        y: top - 0.06,
        z: b.z - 0.03,
        hx: b.hx + 0.02,
        hy: 0.07,
        hz: b.hz + 0.02,
        yaw: 0.025,
        tint: [0.52, 0.51, 0.49],
      });
      continue;
    }
    masonry.addBox({
      x: b.x,
      y: b.y,
      z: b.z,
      hx: b.hx,
      hy: b.hy,
      hz: b.hz,
      yaw: ((b.yawDeg ?? 0) * Math.PI) / 180,
      tint: TINT,
    });
  }

  const material = createMasonryMaterial({ detail, torches: [] });
  wrapMaterial(material, fields, rig);

  const props = new PropBuilder();
  const flames = new FxBuilder();
  addTorches(props, flames, fields.grid.floorY);

  const root = new Group();
  root.name = 'waterway-shell';
  const meshes: Mesh[] = [];
  let triangles = 0;
  const add = (
    geometry: BufferGeometry | null,
    mat: Material,
    name: string,
    cast: boolean,
  ): void => {
    if (!geometry) return;
    const mesh = new Mesh(geometry, mat);
    mesh.name = name;
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    root.add(mesh);
    meshes.push(mesh);
    triangles += (geometry.index ? geometry.index.count : 0) / 3;
  };
  const merged = masonry.build();
  add(merged, material, 'env:waterway-masonry', false);
  add(lidBuilder.build(), material, 'env:waterway-lid', false);
  add(props.build(), createMetalMaterial(), 'env:waterway-torches', false);
  const flameMesh = flames.build();
  if (flameMesh) {
    add(flameMesh, createFlameMaterial(), 'env:waterway-flames', false);
    const last = meshes[meshes.length - 1];
    if (last) {
      last.receiveShadow = false;
      last.renderOrder = 2;
    }
  }
  return { root, triangles, meshes };
}
