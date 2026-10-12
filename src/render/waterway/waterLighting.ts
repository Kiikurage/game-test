import { Vector3, type Node, type UniformNode } from 'three/webgpu';
import { abs, clamp, dot, float, max, min, normalize, smoothstep, uniform, vec3 } from 'three/tsl';
import { HATCH } from '../../game/world/waterway';
import { LIGHT_KIND, type WaterLight } from './waterwayLevel';

/**
 * 地下水路のシェーダ側の光（#270）。たいまつは実ライト（`lighting/localLights.ts`、#322）でもあり、
 * 光を受けるマテリアル（殻の石）はそちらで照らされるので、ここでは床板の穴の光・苔だけを足す。
 * 光を受けないマテリアル（水面・しぶき・霧・光の筋）は、たいまつも含めて同じ式でここから照らす。
 *
 * - たいまつ: 暖色の点光源。距離減衰 + 届く距離で 0。シミュレーション時間でゆらぐ（一時停止で止まる）。
 * - 床板の穴の光: 斜め上からの平行光を、穴（2m 四方）の形で切り抜く（壁・床・水面に穴の形の光だまりができる）。
 * - 苔: 青白い弱い点光源。
 */

export type V3 = Node<'vec3'>;
export type F = Node<'float'>;

/** 床板の穴から差す光の向き（光の進む向き。斜め上から）。 */
export const SHAFT_DIRECTION = new Vector3(0.22, -1, 0.12).normalize();
/** 穴の縁のぼかし（m）。 */
const SHAFT_SOFT = 0.22;

export interface WaterLightRig {
  readonly lights: readonly WaterLight[];
  /** シミュレーション時間（秒）。 */
  readonly time: UniformNode<'float', number>;
  /** 床板の穴の光の強さ（割れる前は板の隙間から漏れる程度）。 */
  readonly shaft: UniformNode<'float', number>;
  /** 床板の穴の高さ（光を切り抜く面）。 */
  readonly holeY: number;
}

export function createLightRig(lights: readonly WaterLight[], holeY: number): WaterLightRig {
  return { lights, time: uniform(0), shaft: uniform(1), holeY };
}

/** たいまつのゆらぎ（0.75..1.0 付近）。`i` はたいまつの番号。 */
export function torchFlicker(rig: WaterLightRig, i: number): F {
  const t = rig.time;
  const ph = float(i * 2.13);
  return float(0.88)
    .add(t.mul(11).add(ph).sin().mul(0.07))
    .add(t.mul(5.3).add(ph.mul(1.9)).sin().mul(0.05))
    .add(t.mul(23.7).add(ph.mul(0.7)).sin().mul(0.025));
}

/** 床板の穴の光が点 `p` に届く割合（穴の形の切り抜き）。 */
export function shaftVisibility(rig: WaterLightRig, p: V3): F {
  const d = SHAFT_DIRECTION;
  // p から光の来る向きへ穴の面まで戻った点
  const back = float(rig.holeY).sub(p.y).div(-d.y);
  const qx = p.x.sub(back.mul(d.x)).sub(HATCH.x);
  const qz = p.z.sub(back.mul(d.z)).sub(HATCH.z);
  const half = HATCH.half;
  const vx = smoothstep(half + SHAFT_SOFT, half - SHAFT_SOFT, abs(qx));
  const vz = smoothstep(half + SHAFT_SOFT, half - SHAFT_SOFT, abs(qz));
  // 穴より上には光らない
  return vx.mul(vz).mul(smoothstep(rig.holeY + 0.1, rig.holeY - 0.2, p.y));
}

/** 光の種類の絞り込み（省略時はすべて）。 */
export type LightFilter = readonly number[] | undefined;

const accepts = (filter: LightFilter, kind: number): boolean => !filter || filter.includes(kind);

/** 点 `p`（法線 `n`。null なら向きを無視する: 霧・しぶき）に届く偽のライトの照度の合計。 */
export function lightAt(rig: WaterLightRig, p: V3, n: V3 | null, filter?: LightFilter): V3 {
  let sum: V3 = vec3(0, 0, 0);
  rig.lights.forEach((l, i) => {
    if (!accepts(filter, l.kind)) return;
    const color = vec3(l.color[0], l.color[1], l.color[2]);
    if (l.kind === LIGHT_KIND.shaft) {
      const ndl = n
        ? clamp(dot(n, vec3(-SHAFT_DIRECTION.x, -SHAFT_DIRECTION.y, -SHAFT_DIRECTION.z)), 0, 1)
        : float(1);
      sum = sum.add(color.mul(shaftVisibility(rig, p)).mul(ndl).mul(rig.shaft));
      return;
    }
    const d = vec3(l.x, l.y, l.z).sub(p);
    const dist2 = dot(d, d);
    const ndl = n
      ? clamp(dot(n, normalize(d)), 0, 1)
          .mul(0.85)
          .add(0.15)
      : float(1);
    const reach = smoothstep(float(l.range * l.range), float(0), dist2);
    const falloff = float(1).div(float(1).add(dist2.mul(l.kind === LIGHT_KIND.moss ? 2.2 : 1.3)));
    const flick = l.kind === LIGHT_KIND.torch ? torchFlicker(rig, i) : float(1);
    sum = sum.add(color.mul(falloff.mul(reach).mul(ndl).mul(flick)));
  });
  return sum;
}

/**
 * 水面の鏡面反射（GGX。粗さ `roughness`）。偽のライトそれぞれの、法線 `n`・視線 `v` に対するハイライト。
 * フレネルは呼び出し側が掛ける（ここは D·G の近似 × 照度）。
 */
export function specularAt(
  rig: WaterLightRig,
  p: V3,
  n: V3,
  v: V3,
  roughness: number,
  filter?: LightFilter,
): V3 {
  const a2 = float(roughness ** 4);
  const ndv = max(dot(n, v), 0.05);
  const ggx = (h: V3): F => {
    const ndh = clamp(dot(n, h), 0, 1);
    const den = ndh.mul(ndh).mul(a2.sub(1)).add(1);
    return a2.div(den.mul(den).mul(Math.PI));
  };
  let sum: V3 = vec3(0, 0, 0);
  rig.lights.forEach((l, i) => {
    if (!accepts(filter, l.kind)) return;
    const color = vec3(l.color[0], l.color[1], l.color[2]);
    if (l.kind === LIGHT_KIND.shaft) {
      const ld = vec3(-SHAFT_DIRECTION.x, -SHAFT_DIRECTION.y, -SHAFT_DIRECTION.z);
      const h = normalize(ld.add(v));
      const ndl = clamp(dot(n, ld), 0, 1);
      sum = sum.add(
        color
          .mul(ggx(h).mul(ndl).div(ndv.mul(4)))
          .mul(shaftVisibility(rig, p))
          .mul(rig.shaft),
      );
      return;
    }
    const d = vec3(l.x, l.y, l.z).sub(p);
    const dist2 = dot(d, d);
    const ld = normalize(d);
    const h = normalize(ld.add(v));
    const ndl = clamp(dot(n, ld), 0, 1);
    const reach = smoothstep(float(l.range * l.range * 1.6), float(0), dist2);
    const falloff = float(1).div(float(1).add(dist2.mul(0.3)));
    const flick = l.kind === LIGHT_KIND.torch ? torchFlicker(rig, i) : float(1);
    sum = sum.add(color.mul(ggx(h).mul(ndl).div(ndv.mul(4)).mul(falloff).mul(reach).mul(flick)));
  });
  // HDR の上限（ブルームが破綻しない程度）
  return min(sum, vec3(24, 24, 24));
}
