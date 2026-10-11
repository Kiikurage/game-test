import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicNodeMaterial,
  DoubleSide,
  Uint32BufferAttribute,
} from 'three/webgpu';
import {
  Fn,
  Loop,
  abs,
  cameraPosition,
  clamp,
  float,
  int,
  length,
  max,
  min,
  mix,
  pow,
  positionWorld,
  select,
  smoothstep,
  texture,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { RectDef } from '../../game/world/level';
import { HATCH } from '../../game/world/waterway';
import { bakedNoise } from '../bakedNoise';
import { BurstLayer, type BurstSpec } from '../particles/layer';
import { buildWaterSurface } from './waterLayout';
import { SHAFT_DIRECTION, lightAt, shaftVisibility, type WaterLightRig } from './waterLighting';
import type { F, V3, WaterFields } from './waterNodes';

/**
 * 地下水路の水の演出（#270）: しぶき・天井の雫・水面の上の薄い霧・床板の穴から差す光の筋。
 * 時間はすべてシミュレーション時間（`fields.time`。一時停止で止まる）。
 */

const GRAVITY = -9.8;

/** しぶきの種類。 */
export type SplashKind = 'step' | 'roll' | 'land' | 'drip';

interface SplashParams {
  x: number;
  y: number;
  z: number;
  speed: number;
  up: number;
  spread: number;
}

export interface WaterFx {
  readonly root: Group;
  /** 水面の (x, z) でしぶきを上げる。`now` はシミュレーション時間（秒）、`strength` は 0..3。 */
  splash(now: number, kind: SplashKind, x: number, z: number, strength: number): void;
  /** 天井 (x, ceilingY, z) から雫を落とす（`fallTime` 秒で水面に着く）。 */
  drip(now: number, x: number, ceilingY: number, z: number, fallTime: number): void;
  update(now: number): void;
  /** 床板の穴の光の筋を出すか（床板が割れる前も、隙間から漏れる弱い光として出す）。 */
  setShaftVisible(visible: boolean): void;
}

function splashSpec(rig: WaterLightRig, surfaceY: number): BurstSpec {
  return {
    slotSize: 56,
    blend: 'normal',
    shape: 'soft',
    gravity: GRAVITY,
    drag: 1.1,
    seed: 0x2701,
    shade: (c) => {
      const lit = lightAt(rig, c.pos, null);
      const speed = length(c.velNow);
      // 水面より下に落ちた粒は消える
      const above = smoothstep(surfaceY - 0.015, surfaceY + 0.01, c.pos.y);
      return {
        position: c.pos,
        size: mix(float(0.03), float(0.012), c.age01).mul(c.rnd.x.mul(0.8).add(0.6)),
        color: lit.mul(0.85).add(vec3(0.05, 0.06, 0.068)),
        alpha: pow(float(1).sub(c.age01), 1.4).mul(0.8).mul(above),
        rotation: c.streakAngle,
        stretch: min(speed.mul(1.4).add(1), 4),
      };
    },
  };
}

function dripSpec(rig: WaterLightRig, surfaceY: number): BurstSpec {
  return {
    slotSize: 1,
    blend: 'normal',
    shape: 'soft',
    gravity: GRAVITY,
    drag: 0.001,
    seed: 0x2702,
    shade: (c) => {
      const lit = lightAt(rig, c.pos, null);
      const above = smoothstep(surfaceY - 0.01, surfaceY + 0.02, c.pos.y);
      return {
        position: c.pos,
        size: float(0.011),
        color: lit.mul(1.1).add(vec3(0.07, 0.08, 0.09)),
        alpha: above.mul(0.85).mul(smoothstep(0, 0.05, c.age)),
        rotation: c.streakAngle,
        stretch: min(length(c.velNow).mul(1.6).add(1), 9),
      };
    },
  };
}

/** 水面の上の薄い霧（粗い格子の板）。視線が水平に近いほど濃い。 */
function mistMesh(
  fields: WaterFields,
  rig: WaterLightRig,
  rects: readonly RectDef[],
  y: number,
  index: number,
): Mesh {
  const surface = buildWaterSurface(rects, y, 1.0);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(surface.positions, 3));
  geometry.setIndex(new Uint32BufferAttribute(surface.indices, 1));
  geometry.computeBoundingSphere();
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const wp = positionWorld;
  const t = fields.time;
  const swell = fields.textures.swell;
  const a = texture(swell, wp.xz.div(5.3).add(vec2(t.mul(0.013), t.mul(0.004)).add(index * 0.31)));
  const b = texture(swell, wp.xz.div(3.1).add(vec2(t.mul(-0.008), t.mul(0.011)).add(index * 0.57)));
  const density = smoothstep(0.3, 0.75, a.x.mul(0.6).add(b.y.mul(0.6)).sub(0.1));
  const toCam = cameraPosition.sub(wp);
  const dist = length(toCam);
  const grazing = float(1).sub(abs(toCam.y).div(max(dist, 0.001)));
  const near = smoothstep(0.4, 2.2, dist);
  const lit = lightAt(rig, wp, null);
  material.colorNode = vec4(lit.mul(0.3).add(vec3(0.03, 0.036, 0.042)), 1);
  material.opacityNode = density
    .mul(grazing.mul(grazing).mul(0.75).add(0.25))
    .mul(near)
    .mul(index === 0 ? 0.16 : 0.1);
  const mesh = new Mesh(geometry, material);
  mesh.name = `waterway-mist-${index}`;
  mesh.renderOrder = 4 + index;
  return mesh;
}

/** 床板の穴から差す光の筋（斜めの角柱を裏面で描き、視線と角柱の交わる区間を解析的に求めて数点で積分する）。 */
function shaftMesh(rig: WaterLightRig, surfaceY: number): Mesh {
  const d = SHAFT_DIRECTION;
  const top = rig.holeY;
  const len = (top - surfaceY) / -d.y;
  const half = HATCH.half + 0.3;
  const corners: number[] = [];
  for (const yLevel of [0, 1]) {
    const y = yLevel === 0 ? top : surfaceY;
    const sx = yLevel === 0 ? 0 : d.x * len;
    const sz = yLevel === 0 ? 0 : d.z * len;
    for (const [cx, cz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      corners.push(HATCH.x + cx * half + sx, y, HATCH.z + cz * half + sz);
    }
  }
  // 6 面（裏面で描く）
  const faces = [
    [0, 1, 2, 3],
    [7, 6, 5, 4],
    [0, 4, 5, 1],
    [1, 5, 6, 2],
    [2, 6, 7, 3],
    [3, 7, 4, 0],
  ];
  const indices: number[] = [];
  for (const [a, b, c, e] of faces) indices.push(a ?? 0, b ?? 0, c ?? 0, a ?? 0, c ?? 0, e ?? 0);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(corners, 3));
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    side: BackSide,
    blending: AdditiveBlending,
  });
  material.fog = false;
  const color = Fn(() => {
    const c = cameraPosition;
    const ray = positionWorld.sub(c);
    // 斜めの座標（穴の面へ光の向きに沿って戻した点）は位置の 1 次式 → 区間を解析的に切り出せる
    const shear = (p: V3): V3 => {
      const back = float(top).sub(p.y).div(-d.y);
      return vec3(p.x.sub(back.mul(d.x)).sub(HATCH.x), p.y, p.z.sub(back.mul(d.z)).sub(HATCH.z));
    };
    const q0 = shear(c);
    const q1 = shear(positionWorld);
    const dq = q1.sub(q0);
    const slab = (a: F, da: F, lo: number, hi: number): [F, F] => {
      const inv = float(1).div(select(abs(da).lessThan(1e-5), float(1e-5), da));
      const t0 = float(lo).sub(a).mul(inv);
      const t1 = float(hi).sub(a).mul(inv);
      return [min(t0, t1), max(t0, t1)];
    };
    const [ax0, ax1] = slab(q0.x, dq.x, -half, half);
    const [az0, az1] = slab(q0.z, dq.z, -half, half);
    const [ay0, ay1] = slab(q0.y, dq.y, surfaceY, top);
    const tIn = clamp(max(max(ax0, az0), ay0), 0, 1);
    const tOut = clamp(min(min(ax1, az1), ay1), 0, 1);
    const span = max(tOut.sub(tIn), 0);
    const sum = float(0).toVar();
    const steps = 8;
    Loop({ start: int(0), end: int(steps), type: 'int', condition: '<' }, ({ i }) => {
      const s = tIn.add(span.mul(float(i).add(0.5).div(steps)));
      const p = c.add(ray.mul(s));
      const vis = shaftVisibility(rig, p);
      const dust = bakedNoise(
        p.mul(2.2).add(vec3(rig.time.mul(0.03), rig.time.mul(-0.07), rig.time.mul(0.02))),
      );
      const fade = smoothstep(surfaceY, surfaceY + 0.5, p.y);
      sum.addAssign(vis.mul(dust.mul(0.9).add(0.35)).mul(fade));
    });
    const thickness = span.mul(length(ray));
    return vec3(0.55, 0.68, 0.85).mul(sum.div(steps).mul(thickness).mul(0.11)).mul(rig.shaft);
  })();
  material.colorNode = vec4(color, 1);
  const mesh = new Mesh(geometry, material);
  mesh.name = 'waterway-shaft';
  mesh.renderOrder = 6;
  mesh.frustumCulled = true;
  return mesh;
}

export function createWaterFx(
  fields: WaterFields,
  rig: WaterLightRig,
  waterRects: readonly RectDef[],
  splashSlots: number,
  mistLayers: number,
): WaterFx {
  const surfaceY = fields.grid.surfaceY;
  const root = new Group();
  root.name = 'waterway-fx';
  const splashes = new BurstLayer(splashSpec(rig, surfaceY), splashSlots, fields.time);
  splashes.mesh.name = 'waterway-splash';
  root.add(splashes.mesh);
  const drips = new BurstLayer(dripSpec(rig, surfaceY), 12, fields.time);
  drips.mesh.name = 'waterway-drip';
  root.add(drips.mesh);
  for (let i = 0; i < mistLayers; i++) {
    root.add(mistMesh(fields, rig, waterRects, surfaceY + 0.1 + i * 0.26, i));
  }
  const shaft = shaftMesh(rig, surfaceY);
  root.add(shaft);

  const params: SplashParams = { x: 0, y: 0, z: 0, speed: 0, up: 0, spread: 0 };
  return {
    root,
    splash: (now, kind, x, z, strength) => {
      const s = Math.min(3, Math.max(0.2, strength));
      const count =
        kind === 'step'
          ? Math.round(9 + 6 * s)
          : kind === 'roll'
            ? Math.round(30 + 8 * s)
            : kind === 'land'
              ? Math.round(30 + 9 * s)
              : 7;
      params.x = x;
      params.y = surfaceY + 0.005;
      params.z = z;
      params.speed = kind === 'drip' ? 0.25 : kind === 'step' ? 0.55 : 1.0;
      params.up = kind === 'drip' ? 0.9 : kind === 'step' ? 1.1 + 0.3 * s : 1.5 + 0.35 * s;
      params.spread = kind === 'drip' ? 0.01 : kind === 'step' ? 0.12 : 0.3;
      splashes.emit(now, count, params, (out, i, n, p, rng) => {
        const a = ((i + rng() * 0.8) / n) * Math.PI * 2;
        const r = p.spread * (0.4 + rng() * 0.6);
        const sp = p.speed * (0.4 + rng() * 0.9);
        out.x = p.x + Math.cos(a) * r;
        out.y = p.y;
        out.z = p.z + Math.sin(a) * r;
        out.vx = Math.cos(a) * sp;
        out.vz = Math.sin(a) * sp;
        out.vy = p.up * (0.45 + rng() * 0.75);
        out.life = 0.35 + rng() * 0.5;
      });
    },
    drip: (now, x, ceilingY, z, fallTime) => {
      drips.emit(now, 1, null, (out) => {
        out.x = x;
        out.y = ceilingY - 0.02;
        out.z = z;
        out.vx = 0;
        out.vy = 0;
        out.vz = 0;
        out.life = fallTime + 0.02;
      });
    },
    update: (now) => {
      splashes.update(now);
      drips.update(now);
    },
    setShaftVisible: (visible) => {
      shaft.visible = visible;
    },
  };
}
