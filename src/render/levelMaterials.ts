import {
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  DoubleSide,
  type Material,
} from 'three/webgpu';
import {
  attribute,
  float,
  floor,
  fract,
  hash,
  instanceIndex,
  min,
  mix,
  mx_noise_float,
  positionLocal,
  positionWorld,
  normalWorld,
  sin,
  cos,
  smoothstep,
  time,
  vec3,
  vec4,
  color,
} from 'three/tsl';
import type { EnvironmentGroup } from './assets/environment';

/**
 * 環境・地面のマテリアル（TSL）。頂点カラーに、ワールド座標のノイズで細かな明暗のむらを足す
 * （テクスチャなし。1 ピクセルあたりノイズ 1〜2 回）。
 */

/** 石・木・土: 頂点カラー × ワールド座標の低コストなむら。 */
export function createSoftMaterial(): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0,
  });
  const p = positionWorld;
  const coarse = mx_noise_float(p.mul(2.3));
  const fine = mx_noise_float(p.mul(9.1));
  const factor = float(0.86).add(coarse.mul(0.2)).add(fine.mul(0.12));
  material.colorNode = vec4(vec3(factor), 1);
  return material;
}

/** 錆びた鉄。 */
export function createMetalMaterial(): MeshStandardNodeMaterial {
  return new MeshStandardNodeMaterial({ vertexColors: true, roughness: 0.68, metalness: 0.45 });
}

/** 発光（ランタン・たいまつの炎・刻印）。HDR（ブルームに乗る）。 */
export function createGlowMaterial(intensity = 3.2): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({ vertexColors: true, side: DoubleSide });
  material.colorNode = vec4(vec3(float(intensity)), 1);
  return material;
}

export function createEnvironmentMaterials(): Record<EnvironmentGroup, Material> {
  return { soft: createSoftMaterial(), metal: createMetalMaterial(), glow: createGlowMaterial() };
}

/**
 * 地面: 頂点カラー（地表素材・道・勾配）に、
 *  - 細かな土のむら（2 周波のノイズ）
 *  - 石畳エリア（頂点属性 `stone` 0..1）: 互い違いに並ぶ敷石、目地の暗い線、石ごとの明暗
 * を掛ける。
 */
export function createGroundMaterial(): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  const stone = attribute('stone', 'float');
  const path = attribute('path', 'float');
  const p = positionWorld.xz;

  // 敷石（running bond）: 1.15m × 0.68m
  const cellW = float(1.15);
  const rowH = float(0.68);
  const row = floor(p.y.div(rowH));
  const x = p.x.add(hash(row).mul(cellW));
  const fx = fract(x.div(cellW));
  const fz = fract(p.y.div(rowH));
  const edge = min(min(fx, float(1).sub(fx)).mul(cellW), min(fz, float(1).sub(fz)).mul(rowH));
  const mortar = smoothstep(0.012, 0.06, edge);
  const cell = floor(x.div(cellW)).add(row.mul(57));
  const tone = hash(cell).mul(0.55).add(0.7);
  // 石の縁は少し暗く（丸み）、目地は深く
  const flag = mix(float(0.55), float(1), mortar)
    .mul(tone)
    .mul(smoothstep(0.0, 0.2, edge).mul(0.18).add(0.82));

  // 敷石は途中で欠け、土が覗く（斑に抜ける）
  const patch = smoothstep(-0.5, 0.2, mx_noise_float(positionWorld.mul(0.7)));

  const coarse = mx_noise_float(positionWorld.mul(0.55));
  const mid = mx_noise_float(positionWorld.mul(2.6));
  const fine = mx_noise_float(positionWorld.mul(11));
  const dirt = float(0.84).add(coarse.mul(0.26)).add(mid.mul(0.16)).add(fine.mul(0.1));

  // 踏み固められた道: 縁は湿って暗い轍、中は砂利の粒が明るく光る。道の外は草の根が張って暗い斑が出る
  const pebble = smoothstep(0.35, 0.6, mx_noise_float(positionWorld.mul(23)));
  const rut = smoothstep(0.25, 0.6, path).mul(float(1).sub(smoothstep(0.6, 0.95, path)));
  const tread = float(1)
    .sub(rut.mul(0.22))
    .add(pebble.mul(path).mul(0.45))
    .sub(mx_noise_float(positionWorld.mul(5.5)).mul(path).mul(0.12));
  const verge = float(1).sub(
    smoothstep(0.0, 0.3, path)
      .mul(float(1).sub(smoothstep(0.3, 0.6, path)))
      .mul(0.12),
  );

  // 急斜面の岩肌: 縦に走る地層の縞と割れ目、粒状の凹凸（のっぺりした崖を避ける）
  const rockMask = smoothstep(0.93, 0.74, normalWorld.y);
  const strata = mx_noise_float(
    vec3(positionWorld.x.mul(0.35), positionWorld.y.mul(2.4), positionWorld.z.mul(0.35)),
  );
  const grain = mx_noise_float(positionWorld.mul(4.3));
  const rockTone = float(0.78).add(strata.mul(0.34)).add(grain.mul(0.14));
  const rocky = mix(float(1), rockTone, rockMask);

  const factor = mix(
    dirt.mul(tread).mul(verge).mul(rocky),
    flag.mul(dirt.mul(0.5).add(0.5)),
    stone.mul(patch),
  );
  material.colorNode = vec4(vec3(factor), 1);
  return material;
}

/** 枯れ草: 根元が暗く、先が明るい。風でゆっくり揺れる（インスタンスごとの位相）。 */
export function createGrassMaterial(): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ roughness: 1, metalness: 0, side: DoubleSide });
  const h = positionLocal.y;
  const phase = hash(instanceIndex).mul(6.28);
  const sway = sin(time.mul(1.4).add(phase)).mul(0.045).mul(h.mul(h).mul(3.5));
  const sway2 = cos(time.mul(1.1).add(phase.mul(1.7)))
    .mul(0.03)
    .mul(h.mul(h).mul(3.5));
  material.positionNode = positionLocal.add(vec3(sway, 0, sway2));
  const tip = smoothstep(0.0, 0.5, h);
  const base = color(0x14110a);
  const lit = color(0x5c5233);
  const tone = hash(instanceIndex.add(7)).mul(0.7).add(0.6);
  material.colorNode = vec4(mix(base, lit, tip).mul(tone), 1);
  return material;
}
