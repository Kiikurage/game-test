import { MeshBasicNodeMaterial, type UniformNode } from 'three/webgpu';
import type ReflectorNode from 'three/src/nodes/utils/ReflectorNode.js';
import {
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  clamp,
  dot,
  exp,
  float,
  length,
  max,
  min,
  mix,
  normalize,
  positionLocal,
  positionWorld,
  pow,
  refract,
  smoothstep,
  texture,
  vec2,
  vec3,
  vec4,
  viewportSharedTexture,
} from 'three/tsl';
import { FLOW_SPEED } from './waterLayout';
import { LIGHT_KIND } from './waterwayLevel';
import { lightAt, specularAt, type WaterLightRig } from './waterLighting';
import {
  flowPhases,
  flowSlope,
  layoutAt,
  simAt,
  type F,
  type V2,
  type V3,
  type WaterFields,
} from './waterNodes';
import { RIPPLE_TILE, SWELL_TILE } from './waterTextures';

/**
 * 地下水路の水面のマテリアル（#270）。ライティングは自前（MeshBasic + 偽のライト）で、次を 1 パスで合成する。
 *
 *  1. 法線: 流れでスクロールする 2 枚のタイル法線（さざ波・うねり。フローマップの 2 位相）+ 波のシミュレーションの勾配。
 *     流れの遅い所（墓室）はさざ波を弱め、ほぼ鏡面にする。頂点は波の高さで上下させる（近くの波紋が立体的に見える）。
 *  2. 反射: 平面反射（`reflector`。半解像度）を法線で歪ませる。Schlick のフレネル（F0 = 0.02）。
 *  3. 屈折: 屈折した視線が水底に当たる点を画面へ投影して、描画済みの画面（`viewportSharedTexture`）を引く。
 *     屈折の経路長で Beer–Lambert の吸収（赤から減る）と濁りの散乱光（偽のライトで照らす）。
 *  4. 泡: 壁際（壁までの距離 + 泡の模様）と、波のシミュレーションの泡（足・ローリング・雫）。
 *  5. ハイライト: たいまつ・床板の穴の光の GGX（反射テクスチャを使わない low でも水面が光る）。
 */

export interface WaterMaterialOptions {
  readonly fields: WaterFields;
  readonly rig: WaterLightRig;
  /** 平面反射（low は null）。 */
  readonly reflection: ReflectorNode | null;
  /** 反射テクスチャの重み（水路の外では反射を描かないので 0）。 */
  readonly reflectionWeight: UniformNode<'float', number>;
}

/** 水の吸収係数（1/m。赤 > 緑 > 青）。 */
const SIGMA = [2.6, 1.1, 0.9] as const;
/** 濁り（懸濁物の色）。 */
const TURBID = [0.32, 0.42, 0.36] as const;
/** 水面の屈折率の逆数。 */
const ETA = 1 / 1.33;

export function createWaterMaterial(options: WaterMaterialOptions): MeshBasicNodeMaterial {
  const { fields, rig, reflection, reflectionWeight } = options;
  const { grid } = fields;
  const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: true });
  material.name = 'waterway-water';

  // --- 頂点: 波の高さで上下させる ---
  const simV = simAt(fields, positionLocal.xz);
  material.positionNode = positionLocal.add(vec3(0, simV.x, 0));

  // --- 法線 ---
  const wp = positionWorld;
  const xz = wp.xz;
  const lay = layoutAt(fields, xz);
  const flow = lay.yz;
  const speed = clamp(length(flow).div(FLOW_SPEED), 0, 1.5);
  const calm = mix(float(0.16), float(1), smoothstep(0.05, 0.9, speed));
  const phases = flowPhases(fields.time, 1.6);
  const ripple = flowSlope(fields.textures.ripple, xz, flow, phases, RIPPLE_TILE);
  // うねりは流れ + ゆっくりした一定の漂い（墓室でもわずかに揺れる）
  const drift = vec2(fields.time.mul(0.011), fields.time.mul(-0.007));
  const swell = flowSlope(fields.textures.swell, xz.add(drift), flow, phases, SWELL_TILE);
  const sim = simAt(fields, xz);
  const slope: V2 = ripple
    .mul(calm.mul(0.07))
    .add(swell.mul(calm.mul(0.5).add(0.5).mul(0.05)))
    .add(sim.yz.mul(1.4));
  const n: V3 = normalize(vec3(slope.x.negate(), 1, slope.y.negate()));

  const toCam = cameraPosition.sub(wp);
  const dist = length(toCam);
  const v: V3 = toCam.div(dist);
  const ndv = clamp(dot(n, v), 0, 1);
  const fresnel: F = float(0.02).add(pow(float(1).sub(ndv), 5).mul(0.98));

  // --- 反射 ---
  const fallback = vec3(0.012, 0.015, 0.019);
  let reflected: V3 = fallback;
  if (reflection) {
    // 法線の傾きで反射像を歪ませる（遠いほど画面上のずれは小さい）
    const k = min(float(1.5).div(max(dist, 1.5)), 0.6);
    const off = clamp(vec2(n.x.negate(), n.z).mul(k), -0.06, 0.06);
    reflection.uvNode = (reflection.uvNode as V2).add(off);
    reflected = mix(fallback, reflection.rgb as V3, reflectionWeight);
  }

  // --- 屈折 + 吸収 ---
  const r = refract(v.negate(), n, ETA);
  const depth = max(wp.y.sub(grid.floorY), 0.004);
  const path = depth.div(max(r.y.negate(), 0.3));
  const hit = wp.add(r.mul(path));
  const clip = cameraProjectionMatrix.mul(cameraViewMatrix.mul(vec4(hit, 1)));
  const ndc = clip.xy.div(clip.w);
  const refrUv = vec2(ndc.x.mul(0.5).add(0.5), ndc.y.mul(-0.5).add(0.5));
  const floorColor = viewportSharedTexture(refrUv).rgb as V3;
  const transmittance = exp(vec3(SIGMA[0], SIGMA[1], SIGMA[2]).mul(path.add(0.03)).negate());
  const lit = lightAt(rig, wp, null);
  const ambient = vec3(0.01, 0.013, 0.015);
  const inscatter = lit
    .mul(0.32)
    .add(ambient)
    .mul(vec3(TURBID[0], TURBID[1], TURBID[2]))
    .mul(float(1).sub(transmittance));
  const transmitted = floorColor.mul(transmittance).add(inscatter);

  // --- ハイライト ---
  const spec = specularAt(rig, wp, n, v, 0.1, [LIGHT_KIND.torch, LIGHT_KIND.shaft]).mul(
    max(fresnel, 0.035).mul(reflection ? 0.6 : 1),
  );

  let color: V3 = mix(transmitted, reflected, fresnel).add(spec);

  // --- 泡 ---
  const foamUv = xz.sub(flow.mul(phases.t0)).div(0.8);
  const foamUv1 = xz.sub(flow.mul(phases.t1)).div(0.8).add(vec2(0.5, 0.25));
  const pattern = mix(
    texture(fields.textures.caustics, foamUv).z,
    texture(fields.textures.caustics, foamUv1).z,
    phases.weight,
  );
  const wall = lay.x;
  const edge = smoothstep(0.07, 0.0, wall.sub(pattern.mul(0.05))).mul(speed.mul(0.3).add(0.25));
  const simFoam = sim.w.mul(smoothstep(0.4, 0.9, pattern.add(sim.w.mul(0.3)))).mul(0.7);
  const foam = clamp(edge.mul(smoothstep(0.35, 0.8, pattern)).add(simFoam), 0, 1);
  const foamColor = lit.mul(0.5).add(vec3(0.03, 0.034, 0.036));
  color = mix(color, foamColor, foam.mul(0.85));

  material.colorNode = vec4(color, 1);
  return material;
}
