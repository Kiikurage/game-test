import {
  BoxGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  SphereGeometry,
} from 'three/webgpu';
import type { Node, BufferGeometry } from 'three/webgpu';
import { attribute, cos, mix, positionLocal, sin, time, vec3 } from 'three/tsl';
import { createUberMaterial, type UberMaterial } from '../uberMaterial';
import type { ArenaDef } from '../../game/world/arena';
import { mergeAll } from './arenaGeometry';

/**
 * 闘技場の壁のたいまつ（主光源の 1 つ。仕様書 7.2 節: 篝火・熾火・たいまつが主光源）。
 *
 * 光は実ライト（`lighting/localLights.ts`。クラスタードライティング、#322）で、床・壁・キャラクターを照らす。
 */
export interface Torch {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** ゆらぎの位相。 */
  readonly phase: number;
  /** 壁から中心へ向かう水平な単位ベクトル。 */
  readonly dirX: number;
  readonly dirZ: number;
}

/** 壁の内側に等間隔で並べる（霧の門側の切れ目と、柱の真後ろを避ける）。 */
export function layoutTorches(def: ArenaDef, count = 8): Torch[] {
  const out: Torch[] = [];
  const entry = Math.atan2(def.entry.z - def.center.z, def.entry.x - def.center.x);
  for (let i = 0; i < count; i++) {
    const a = entry + ((i + 0.5) / count) * Math.PI * 2;
    const r = def.circle.radius - 0.02;
    out.push({
      x: def.center.x + Math.cos(a) * r,
      y: def.floorY + 2.25,
      z: def.center.z + Math.sin(a) * r,
      phase: i * 2.399,
      dirX: -Math.cos(a),
      dirZ: -Math.sin(a),
    });
  }
  return out;
}

type F = Node<'float'>;

/** たいまつの光源の位置（炎の中ほど。`localLights` に実ライトとして登録する）。 */
export function torchLightPosition(t: Torch): [number, number, number] {
  return [t.x + t.dirX * 0.55, t.y + 0.3, t.z + t.dirZ * 0.55];
}

/** 燭台（壁から張り出す腕と皿）。 */
export function createSconceGeometry(torches: readonly Torch[]): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const t of torches) {
    const angle = Math.atan2(t.dirX, t.dirZ);
    const arm = new BoxGeometry(0.1, 0.1, 0.5);
    arm.translate(0, -0.12, 0.2);
    const cup = new CylinderGeometry(0.15, 0.09, 0.2, 8, 1);
    cup.translate(0, 0.02, 0.4);
    const stem = new BoxGeometry(0.07, 0.5, 0.07);
    stem.translate(0, -0.35, 0.0);
    for (const g of [arm, cup, stem]) {
      g.rotateY(angle);
      g.translate(t.x - t.dirX * 0.1, t.y - 0.1, t.z - t.dirZ * 0.1);
      const ni = g.toNonIndexed();
      ni.deleteAttribute('uv');
      parts.push(ni);
      g.dispose();
    }
  }
  return mergeAll(parts);
}

/** 炎の形（細長い雫）。頂点属性 `flameT`（0 = 根元、1 = 先端）と `phase`。 */
export function createFlameGeometry(torches: readonly Torch[]): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const t of torches) {
    const g = new SphereGeometry(1, 8, 5);
    const pos = g.getAttribute('position');
    const flameT: number[] = [];
    const phase: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const tt = (y + 1) / 2;
      // 先端を細く尖らせる
      const taper = 1 - 0.85 * Math.pow(tt, 2.2);
      pos.setXYZ(i, pos.getX(i) * 0.13 * taper, (y * 0.5 + 0.5) * 0.52, pos.getZ(i) * 0.13 * taper);
      flameT.push(tt);
      phase.push(t.phase);
    }
    g.setAttribute('flameT', new Float32BufferAttribute(flameT, 1));
    g.setAttribute('phase', new Float32BufferAttribute(phase, 1));
    g.translate(t.x + t.dirX * 0.4, t.y + 0.08, t.z + t.dirZ * 0.4);
    const ni = g.toNonIndexed();
    ni.deleteAttribute('uv');
    ni.deleteAttribute('normal');
    parts.push(ni);
    g.dispose();
  }
  return mergeAll(parts);
}

/** 炎のマテリアル（HDR。根元は黄白、先端は橙。ゆらぎは頂点シェーダ）。 */
export function createFlameMaterial(): UberMaterial {
  const t: F = attribute('flameT', 'float');
  const phase: F = attribute('phase', 'float');
  const sway = vec3(
    sin(time.mul(8.7).add(phase)).mul(0.03),
    sin(time.mul(14.0).add(phase.mul(2.0))).mul(0.05),
    cos(time.mul(10.3).add(phase.mul(1.3))).mul(0.03),
  ).mul(t.mul(t));
  const hot = vec3(4.2, 2.2, 0.7);
  const cool = vec3(2.4, 0.62, 0.1);
  return createUberMaterial({
    shading: 'unlit',
    noFog: true,
    surface: () => ({ color: mix(hot, cool, t.pow(0.8)), position: positionLocal.add(sway) }),
    surfaceId: 'arenaFlame',
  });
}

export function createSconceMaterial(): UberMaterial {
  return createUberMaterial(
    { shading: 'lit' },
    { color: 0x2a2826, roughness: 0.7, metalness: 0.5 },
  );
}
