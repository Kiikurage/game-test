import { DoubleSide, MeshBasicNodeMaterial } from 'three/webgpu';
import type { Node, UniformNode } from 'three/webgpu';
import {
  abs,
  atan,
  cameraPosition,
  dot,
  float,
  length,
  mix,
  mx_noise_float,
  normalize,
  normalWorld,
  positionWorld,
  pow,
  sin,
  smoothstep,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

type F = Node<'float'>;

/**
 * 霧の見た目のコスト上限（モバイルのオーバードロー対策）。シーンに足すメッシュはこの数まで。
 * すべて透明の 1 枚物で、パーティクルは使わない（個数 0）。品質 low は壁 1 枚・柱 1 層・地表の霧なし。
 */
export const FOG_BUDGET = {
  /** 門の霧の壁（門の中に重ねる枚数）。 */
  wallLayers: { low: 1, medium: 2, high: 2 },
  /** 霧の柱の層数（外側の薄いハロを足す）。 */
  pillarLayers: { low: 1, medium: 2, high: 2 },
  /** 地表の霧の円盤。 */
  groundMist: { low: 0, medium: 1, high: 1 },
  /** 個別の粒（パーティクル）は使わない。 */
  particles: 0,
} as const;

/** 霧の色（青白い）。柱と壁が共有する。 */
const DEEP = vec3(0.34, 0.5, 0.86);
const MID = vec3(0.62, 0.76, 1.0);
const PALE = vec3(0.9, 0.95, 1.12);

export interface FogUniforms {
  /** 0..1: 霧の濃さ（出現・消失）。 */
  readonly density: UniformNode<'float', number>;
  /** 0..1: 入場演出の揺らぎ・明るさの高まり。 */
  readonly surge: UniformNode<'float', number>;
}

export function createFogUniforms(): FogUniforms {
  return { density: uniform(0), surge: uniform(0) };
}

/** カメラに近い断片を薄くする（近づいて画面を覆わない・平面を横切るときにぱっと出ない）。 */
function nearFade(near: number, far: number): F {
  const d = length(positionWorld.sub(cameraPosition));
  return smoothstep(near, far, d);
}

/**
 * 門の霧の壁（縦長の板。青白い霧が下から上へ流れて揺らぐ）。
 * `seed` / `flow` で層ごとに模様と流れる向きを変える。
 */
export function createFogWallMaterial(
  u: FogUniforms,
  options: { seed: number; flow: number; width: number; height: number; strength: number },
): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({
    fog: false,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const { seed, flow, width, height, strength } = options;
  const uvn = uv();
  const speed: F = float(0.5).add(u.surge.mul(1.1)).mul(flow);
  const t: F = time.mul(speed);
  // 世界の大きさで模様を作る（幅・高さが違っても粒が揃う）
  const p = vec3(uvn.x.mul(width), uvn.y.mul(height).sub(t), time.mul(0.11).mul(flow).add(seed));
  const lowN: F = mx_noise_float(p.mul(vec3(0.7, 0.42, 0.7)));
  const midN: F = mx_noise_float(p.mul(vec3(1.7, 1.05, 1.7)).add(vec3(3.1, 0.0, 8.7)));
  const hiN: F = mx_noise_float(p.mul(vec3(4.2, 2.6, 4.2)).add(vec3(9.4, 1.3, 2.2)));
  const fbm: F = lowN.mul(0.55).add(midN.mul(0.3)).add(hiN.mul(0.15)).mul(0.5).add(0.5);
  // 揺らぎ: 縦の帯が横に流れる
  const sway: F = sin(uvn.y.mul(5.5).add(time.mul(1.3).mul(flow)).add(lowN.mul(3.0)))
    .mul(0.5)
    .add(0.5);

  const edge: F = smoothstep(0.0, 0.05, uvn.x).mul(smoothstep(1.0, 0.95, uvn.x));
  const foot: F = smoothstep(0.0, 0.07, uvn.y);
  // 上端はノイズで崩して霧がちぎれる（柱へ続く）
  const ragged: F = uvn.y.add(fbm.sub(0.5).mul(0.7));
  const head: F = smoothstep(1.02, 0.55, ragged);
  const body: F = smoothstep(0.22, 0.85, fbm).mul(0.7).add(sway.mul(0.14)).add(0.1);
  const alpha: F = body
    .mul(edge)
    .mul(foot)
    .mul(head)
    .mul(float(0.55).add(u.surge.mul(0.55)))
    .mul(strength)
    .mul(u.density)
    .mul(nearFade(0.5, 2.6))
    .clamp(0, 0.95);

  const tone: F = fbm.mul(0.8).add(sway.mul(0.2));
  const rgb = mix(mix(DEEP, MID, tone), PALE, smoothstep(0.55, 1.0, tone).add(u.surge.mul(0.45)));
  material.colorNode = vec4(rgb.mul(float(1.0).add(u.surge.mul(0.25))), 1);
  material.opacityNode = alpha;
  return material;
}

/**
 * 霧の柱（高さ 25m のランドマーク。遠景からも見える）。縦に流れる筋と、中央が濃く縁が薄い断面（フレネル）で、
 * 発光する霧の柱に見せる。近づくと薄れて画面を覆わない。
 */
export function createFogPillarMaterial(
  u: FogUniforms,
  options: { baseY: number; height: number; seed: number; flow: number; strength: number },
): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({
    fog: false,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const { baseY, height, seed, flow, strength } = options;
  const h: F = positionWorld.y.sub(baseY).div(height).clamp(0, 1);
  const ang: F = uv().x;
  const speed: F = float(0.32).add(u.surge.mul(0.5)).mul(flow);
  // 縦に長い筋（角度方向は細かく、高さ方向はゆっくり）。上へ流れる
  const q = vec3(ang.mul(9.0), h.mul(height).mul(0.075).sub(time.mul(speed)), seed);
  const streak: F = mx_noise_float(q)
    .mul(0.6)
    .add(mx_noise_float(q.mul(2.3).add(5.7)).mul(0.4));
  const wisp: F = mx_noise_float(
    vec3(ang.mul(3.0).add(time.mul(0.05)), h.mul(2.6).sub(time.mul(0.18).mul(flow)), seed + 4.2),
  );
  const n: F = streak.mul(0.5).add(wisp.mul(0.5)).mul(0.5).add(0.5);

  // 断面: 視線に正対する面ほど濃い（円柱の縁は薄くぼける）
  const toCam = normalize(cameraPosition.sub(positionWorld));
  const facing: F = abs(dot(normalWorld, toCam));
  const core: F = pow(facing, 2.2);

  // 高さ: 足元で立ち上がり、上へ薄れる（最上部はちぎれる）
  const foot: F = smoothstep(0.0, 0.025, h);
  const taper: F = float(1.0).sub(h.mul(0.4));
  const top: F = smoothstep(1.0, 0.8, h.add(n.sub(0.5).mul(0.25)));
  const alpha: F = core
    .mul(smoothstep(0.2, 0.8, n).mul(0.85).add(0.15))
    .mul(foot)
    .mul(taper)
    .mul(top)
    .mul(float(1.15).add(u.surge.mul(0.4)))
    .mul(strength)
    .mul(u.density)
    .mul(nearFade(5.0, 17.0))
    .clamp(0, 0.95);

  // 筋の濃いところは深い青、芯（正対する面）と上端は白く発光（ブルームが乗る程度）
  const tone: F = n.mul(0.65).add(core.mul(0.35)).add(h.mul(0.15));
  const rgb = mix(mix(DEEP, MID, smoothstep(0.2, 0.7, tone)), PALE, smoothstep(0.7, 1.0, tone));
  material.colorNode = vec4(rgb.mul(float(0.9).add(h.mul(0.3)).add(u.surge.mul(0.3))), 1);
  material.opacityNode = alpha;
  return material;
}

/** 地表の霧（門の足元から広がる低い霧の円盤。ゆっくり渦を巻く）。 */
export function createGroundMistMaterial(u: FogUniforms, radius: number): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({
    fog: false,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const c = uv().sub(0.5).mul(2);
  const r: F = length(c);
  const a: F = atan(c.y, c.x);
  const swirl = vec2(r.mul(3.2).add(time.mul(0.12)), a.mul(1.6).add(time.mul(0.1)).add(r.mul(2.0)));
  const n1: F = mx_noise_float(vec3(swirl.x.mul(radius * 0.18), swirl.y, time.mul(0.07)));
  const n2: F = mx_noise_float(
    vec3(c.x.mul(radius * 0.4).add(time.mul(0.2)), c.y.mul(radius * 0.4), 5.3),
  );
  const n: F = n1.mul(0.6).add(n2.mul(0.4)).mul(0.5).add(0.5);
  const falloff: F = pow(smoothstep(1.0, 0.0, r), float(1.6));
  const alpha: F = n
    .mul(n)
    .mul(falloff)
    .mul(float(0.5).add(u.surge.mul(0.3)))
    .mul(u.density)
    .mul(nearFade(0.4, 2.2))
    .clamp(0, 0.55);
  material.colorNode = vec4(mix(MID, PALE, n), 1);
  material.opacityNode = alpha;
  return material;
}
