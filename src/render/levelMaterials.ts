import type { Material } from 'three/webgpu';
import {
  attribute,
  float,
  floor,
  fract,
  instanceIndex,
  min,
  mix,
  positionGeometry,
  positionWorld,
  normalWorld,
  smoothstep,
  vec3,
  color,
} from 'three/tsl';
import type { EnvironmentGroup } from './assets/environment';
import { bumpedNormal, rockSurface } from './cliff/rockSurface';
import { bakedHash, bakedNoise, getMaterialDetail } from './bakedNoise';
import { createUberMaterial, type UberMaterial, type UberSurface } from './uberMaterial';

/**
 * 環境・地面のマテリアル（TSL）。すべて {@link createUberMaterial}（§3.4、#325）で作る。
 * 頂点カラーに、ワールド座標のノイズで細かな明暗のむらを足す（焼いたノイズテクスチャの参照。#236）。
 */

/** 石・木・土: 頂点カラー × ワールド座標の低コストなむら。 */
export function createSoftMaterial(): UberMaterial {
  return createUberMaterial(
    { shading: 'lit', vertexColors: true, detail: true, group: 'env' },
    { roughness: 0.96, metalness: 0, detail: 1 },
  );
}

/** 錆びた鉄。石・木と同じシェーダ（むらの量 0。パイプラインを共有する）。 */
export function createMetalMaterial(): UberMaterial {
  return createUberMaterial(
    { shading: 'lit', vertexColors: true, detail: true, group: 'env' },
    { roughness: 0.68, metalness: 0.45, detail: 0 },
  );
}

/** 発光（ランタン・たいまつの炎・刻印）。HDR（ブルームに乗る）。 */
export function createGlowMaterial(intensity = 3.2): UberMaterial {
  return createUberMaterial(
    { shading: 'unlit', vertexColors: true, doubleSided: true },
    { intensity },
  );
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
export function createGroundMaterial(): UberMaterial {
  return createUberMaterial(
    { shading: 'lit', vertexColors: true, surface: groundSurface, group: 'terrain' },
    { roughness: 1, metalness: 0 },
  );
}

function groundSurface(): UberSurface {
  const stone = attribute('stone', 'float');
  const path = attribute('path', 'float');
  const p = positionWorld.xz;

  // 敷石（running bond）: 1.15m × 0.68m
  const cellW = float(1.15);
  const rowH = float(0.68);
  const row = floor(p.y.div(rowH));
  const x = p.x.add(bakedHash(row).mul(cellW));
  const fx = fract(x.div(cellW));
  const fz = fract(p.y.div(rowH));
  const edge = min(min(fx, float(1).sub(fx)).mul(cellW), min(fz, float(1).sub(fz)).mul(rowH));
  const mortar = smoothstep(0.012, 0.06, edge);
  const cell = floor(x.div(cellW)).add(row.mul(57));
  const tone = bakedHash(cell).mul(0.55).add(0.7);
  // 石の縁は少し暗く（丸み）、目地は深く
  const flag = mix(float(0.55), float(1), mortar)
    .mul(tone)
    .mul(smoothstep(0.0, 0.2, edge).mul(0.18).add(0.82));

  // 敷石は途中で欠け、土が覗く（斑に抜ける）。medium 以下は土の低周波ノイズと共有する
  const detail = getMaterialDetail();
  const coarse = bakedNoise(positionWorld.mul(0.55));
  const patch = smoothstep(-0.5, 0.2, detail >= 2 ? bakedNoise(positionWorld.mul(0.7)) : coarse);

  const mid = bakedNoise(positionWorld.mul(2.6));
  const fine = detail >= 2 ? bakedNoise(positionWorld.mul(11)) : float(0);
  const dirt = float(0.84)
    .add(coarse.mul(0.26))
    .add(mid.mul(0.16))
    .add(fine.mul(detail >= 2 ? 0.1 : 0));

  // 踏み固められた道: 縁は湿って暗い轍、中は砂利の粒が明るく光る。道の外は草の根が張って暗い斑が出る
  const pebble = smoothstep(0.35, 0.6, bakedNoise(positionWorld.mul(23)));
  const rut = smoothstep(0.25, 0.6, path).mul(float(1).sub(smoothstep(0.6, 0.95, path)));
  const treadNoise = detail >= 2 ? bakedNoise(positionWorld.mul(5.5)) : mid;
  const tread = float(1)
    .sub(rut.mul(0.22))
    .add(pebble.mul(path).mul(0.45))
    .sub(treadNoise.mul(path).mul(0.12));
  const verge = float(1).sub(
    smoothstep(0.0, 0.3, path)
      .mul(float(1).sub(smoothstep(0.3, 0.6, path)))
      .mul(0.12),
  );

  // 急斜面の岩肌（崖。#176 #190）: 地層・節理・割れ目の色と、法線の凹凸（岩塊メッシュと同じ関数）。
  // medium 以下は法線の凹凸（微分 4 回 + 高さ場）を省き、岩肌のノイズも減らす（`rockSurface` の detail）
  const rockMask = smoothstep(0.93, 0.74, normalWorld.y);
  const rock = rockSurface(positionWorld, {
    damp: attribute('damp', 'float'),
    up: normalWorld.y,
    normal: normalWorld,
  });
  const rocky = mix(vec3(1), rock.tone, rockMask);
  const normal = detail >= 2 ? bumpedNormal(rock, rockMask.mul(0.6)) : undefined;

  const factor = mix(
    dirt.mul(tread).mul(verge).mul(rocky),
    flag.mul(dirt.mul(0.5).add(0.5)).mul(vec3(1)),
    // 敷石は XZ 平面への投影なので、急斜面では縦に引き伸ばされる。岩肌の所には出さない（#267）
    stone.mul(patch).mul(float(1).sub(rockMask)),
  );
  return { color: factor, normal };
}

/** 枯れ草: 根元が暗く、先が明るい。風でゆっくり揺れる（インスタンスごとの位相）。 */
export function createGrassMaterial(): UberMaterial {
  return createUberMaterial(
    { shading: 'lit', wind: true, doubleSided: true, surface: grassSurface },
    { roughness: 1, metalness: 0 },
  );
}

function grassSurface(): UberSurface {
  // 地面の房は高さ 0.28〜0.58m なので、根元から 0.3m で明るい色に届くようにする（以前はワールド高さで
  // 計算していて実質すべて明るかった。根元だけ暗くして、近景で黒い棘に見えないようにする）
  const tip = smoothstep(0.0, 0.3, positionGeometry.y);
  const base = color(0x14110a);
  const lit = color(0x5c5233);
  const tone = bakedHash(instanceIndex.add(7)).mul(0.7).add(0.6);
  return { color: mix(base, lit, tip).mul(tone) };
}
