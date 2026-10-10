import { MeshStandardNodeMaterial, Vector4, type Node } from 'three/webgpu';
import {
  attribute,
  clamp,
  cross,
  dFdx,
  dFdy,
  dot,
  float,
  floor,
  fract,
  fwidth,
  hash,
  max,
  min,
  mix,
  mod,
  mx_noise_float,
  normalView,
  normalWorld,
  positionView,
  positionWorld,
  sign,
  smoothstep,
  step,
  time,
  uniformArray,
  vec3,
  vec4,
} from 'three/tsl';

/**
 * 石積みマテリアル（TSL。1 マテリアルで地下墓所・中庭の壁・柱・噴水・石棺・門柱をまかなう）。
 *
 * - 座標は頂点属性 `mu`（m 単位の石積み座標。`masonryGeometry.ts`）。互い違いの積み（段の高さ・石の長さが段ごとに違う）。
 * - 目地は `fwidth` で画素の大きさに合わせて解析的にアンチエイリアスし、遠くでは平均的な暗さへ溶かす（ちらつかない）。
 * - 石ごとの明度のばらつき・面取りのハイライト・角の欠け・粒状ノイズ・縦の汚れ・地面付近の湿り（暗く、苔）。
 * - 目地と欠けは高さ場として法線を揺らす（`detail` ≥ 1。low はなし）。
 * - 壁のたいまつの光は、ライトを増やさず `torches`（位置 + 強度）を距離減衰で足す（`emissive`。影は付かない）。
 *
 * `detail`: 0 = low（法線・細かいノイズなし）、1 = medium、2 = high（ノイズを 1 つ増やす）。
 */
export interface MasonryMaterialOptions {
  readonly detail: 0 | 1 | 2;
  /** たいまつ（x, y, z, 強度）。最大 8 つ。 */
  readonly torches: readonly (readonly [number, number, number, number])[];
}

export const MAX_TORCHES = 8;

const JOINT_WIDTH = 0.024;
/** 目地の平均的な面積率（遠景で目地を溶かすときの暗さ）。 */
const JOINT_AVERAGE = 0.17;

export function createMasonryMaterial(options: MasonryMaterialOptions): MeshStandardNodeMaterial {
  const { detail } = options;
  const material = new MeshStandardNodeMaterial({ roughness: 0.92, metalness: 0 });

  const mu = attribute('mu', 'vec2');
  const mx = attribute('mx', 'vec3');
  const rd = attribute('rd', 'vec2');
  const tint = attribute('color', 'vec3');
  const round = step(0.5, rd.y);

  // --- 段（2 段を 1 組にして、下の段の高さを組ごとに変える）---
  const pairH = float(0.72);
  const pair = floor(mu.y.div(pairH));
  const inPair = mu.y.sub(pair.mul(pairH));
  const split = hash(pair.add(2.3)).mul(0.2).add(0.28);
  const upper = step(split, inPair);
  const rowH = mix(split, pairH.sub(split), upper);
  const fr = inPair.sub(upper.mul(split)).div(rowH);
  const row = pair.mul(2).add(upper);

  // --- 石の長さ・位置（円筒面は 1 周を偶数個に割る）---
  const planarLen = hash(row.add(11.3)).mul(0.75).add(0.62);
  const len = mix(planarLen, rd.x, round);
  const stagger = mod(row, 2)
    .mul(0.5)
    .add(floor(hash(row.add(5.1)).mul(8)));
  const q = mu.x.div(len).add(stagger);
  const col = floor(q);
  const fc = fract(q);
  const colId = mix(col, mod(col, max(rd.y, 1)), round);
  const blockSeed = colId.add(row.mul(57.3));

  // --- 目地までの距離（m）。目地の縁は低周波のノイズで揺らす（定規で引いた線にしない）---
  const dx = min(fc, float(1).sub(fc)).mul(len);
  const dy = min(fr, float(1).sub(fr)).mul(rowH);
  const wobble = mx_noise_float(vec3(mu.x.mul(7.1), mu.y.mul(7.1), float(1.7))).mul(0.011);
  const e = min(dx, dy).add(wobble);
  // 画素の大きさ（m）。目地の線は fwidth で解析的にアンチエイリアスし、遠くでは平均の暗さへ溶かす
  const footprint = max(fwidth(mu.x), fwidth(mu.y));
  const aa = footprint.mul(0.75).add(0.0015);
  const jointSharp = float(1).sub(
    smoothstep(float(JOINT_WIDTH).sub(aa), float(JOINT_WIDTH).add(aa), e),
  );
  const far = smoothstep(0.1, 0.34, footprint);
  const joint = mix(jointSharp, float(JOINT_AVERAGE), far);

  // --- 石ごとのばらつき ---
  const tone = hash(blockSeed).mul(0.62).add(0.66);
  const warm = hash(blockSeed.add(19.1)).sub(0.5);
  const base = vec3(
    float(1).add(warm.mul(0.12)),
    float(1).sub(warm.mul(0.02)),
    float(1).sub(warm.mul(0.14)),
  );

  // --- 粒・欠け・汚れ ---
  const gp = vec3(mu.x.mul(6.3), mu.y.mul(6.3), blockSeed.mul(0.37));
  const n1 = mx_noise_float(gp);
  const grain = detail > 0 ? n1.mul(0.11) : float(0);
  const chipN = detail > 0 ? mx_noise_float(gp.mul(2.6)) : float(0);
  const chip = smoothstep(0.4, 0.7, chipN);
  const streak = mx_noise_float(vec3(mu.x.mul(0.85), mu.y.mul(0.16), float(3.3)));
  const patch = mx_noise_float(vec3(mu.x.mul(0.5), mu.y.mul(0.45), float(8.2)));
  const fineN =
    detail > 1 ? mx_noise_float(vec3(mu.x.mul(21), mu.y.mul(21), blockSeed)).mul(0.07) : float(0);

  // --- 角の欠け（面の端 0.3m 以内を不規則に明るく荒く）---
  const cornerD = min(mx.x, mx.y).add(n1.mul(0.08));
  const corner = smoothstep(0.32, 0.0, cornerD);

  // --- 地面付近の湿り（暗く、苔）---
  const g = mx.z;
  const damp = smoothstep(1.7, 0.0, g.add(n1.mul(0.35)).add(patch.mul(0.4)));
  const mossN = mx_noise_float(vec3(mu.x.mul(2.4), mu.y.mul(2.4), float(9.1)));
  const moss = damp
    .mul(smoothstep(0.0, 0.55, mossN.add(0.15)))
    .mul(smoothstep(1.1, 0.0, g))
    .mul(float(1).sub(joint));

  // --- 色 ---
  const centre = smoothstep(0.0, 0.2, e);
  const edgeLight = smoothstep(0.08, 0.035, e).mul(float(1).sub(joint));
  let shade = tone
    .add(grain)
    .add(fineN)
    .add(chip.mul(0.07))
    .add(streak.mul(0.1))
    .add(patch.mul(0.12))
    .add(corner.mul(0.16))
    .add(edgeLight.mul(0.1));
  shade = shade.mul(centre.mul(0.16).add(0.84));
  shade = shade.mul(float(1).sub(damp.mul(0.4)));
  shade = shade.mul(float(1).sub(joint.mul(0.65)));
  const albedo = mix(
    tint.mul(base).mul(max(shade, 0)),
    vec3(0.07, 0.09, 0.03).mul(tone),
    moss.mul(0.6),
  );

  material.colorNode = vec4(albedo, 1);
  material.roughnessNode = mix(float(0.93), float(0.5), damp.mul(0.75));

  // --- 目地と欠けを高さ場にして法線を揺らす（Mikkelsen。高さは m）---
  if (detail > 0) {
    const fade = float(1).sub(smoothstep(0.05, 0.22, footprint));
    const relief = smoothstep(0.0, 0.07, e)
      .mul(0.014)
      .add(smoothstep(0.0, 0.02, e).mul(0.006));
    const pits = mx_noise_float(vec3(mu.x.mul(13), mu.y.mul(13), row)).mul(0.006);
    const height = relief.add(pits).add(chip.mul(-0.004)).mul(fade);
    const dhx = dFdx(height);
    const dhy = dFdy(height);
    const sx = dFdx(positionView);
    const sy = dFdy(positionView);
    const r1 = cross(sy, normalView);
    const r2 = cross(normalView, sx);
    const det = dot(sx, r1);
    const grad = sign(det).mul(dhx.mul(r1).add(dhy.mul(r2)));
    material.normalNode = det.abs().mul(normalView).sub(grad).normalize();
  }

  // --- たいまつの光（偽のライト。法線は幾何法線）---
  const torches = options.torches.slice(0, MAX_TORCHES);
  if (torches.length > 0) {
    const lights = uniformArray(
      torches.map((t) => new Vector4(t[0], t[1], t[2], t[3])),
      'vec4',
    );
    let sum: Node<'vec3'> = vec3(0, 0, 0);
    for (let i = 0; i < torches.length; i++) {
      const l = lights.element(i) as unknown as Node<'vec4'>;
      const d = l.xyz.sub(positionWorld);
      const dist2 = dot(d, d);
      const ndl = clamp(dot(normalWorld, d.normalize()), 0, 1).mul(0.8).add(0.2);
      const reach = smoothstep(float(1), float(0.12), dist2.div(float(8 * 8)));
      const falloff = float(1).div(float(1).add(dist2.mul(0.55)));
      const phase = float(i * 2.13);
      const flicker = float(0.88)
        .add(time.mul(11).add(phase).sin().mul(0.07))
        .add(time.mul(5.3).add(phase.mul(1.9)).sin().mul(0.05));
      sum = sum.add(vec3(1.0, 0.5, 0.17).mul(l.w.mul(falloff).mul(ndl).mul(reach).mul(flicker)));
    }
    material.emissiveNode = albedo.mul(sum);
  }
  return material;
}
