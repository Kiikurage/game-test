import {
  abs,
  dFdx,
  dFdy,
  float,
  floor,
  fract,
  hash,
  max,
  min,
  mix,
  mx_noise_float,
  normalize,
  normalView,
  positionView,
  sign,
  smoothstep,
  vec3,
} from 'three/tsl';
import type { Node } from 'three/webgpu';

/**
 * 岩肌の表面（TSL。ワールド座標ベース。テクスチャなし。#190）。
 * 崖の急斜面（地形マテリアル）と岩塊メッシュで同じ関数を使うので、岩塊が崖の地層・色になじむ。
 *
 *  - 地層: ワールド y を地形のむらで歪めた層に区切る。層ごとに色味・張り出しが違い、境の溝が暗い
 *  - 節理: 層ごとにずれた縦の目地で岩を大きなブロックに割る。ブロックごとに明暗と丸みが違う
 *  - 割れ目: 縦に長いノイズの細い暗線。雨だれの縦縞と粒状の凹凸を重ねる
 *
 * `tone` は頂点色（岩の基調色）に掛ける係数、`height` は凹凸（m。法線の摂動に使う）。
 * ノイズは 4 回（歪み・割れ目・雨だれ・粒）。
 */
export interface RockSurface {
  readonly tone: Node<'vec3'>;
  readonly height: Node<'float'>;
}

export function rockSurface(p: Node<'vec3'>): RockSurface {
  // 地形のむらに沿って層をうねらせる
  const warp = mx_noise_float(p.mul(0.3));
  const yy = p.y.mul(0.85).add(warp.mul(0.7)).add(p.x.mul(0.05)).sub(p.z.mul(0.04));
  const layer = floor(yy);
  const lf = fract(yy);
  const layerRand = hash(layer.add(17));
  const layerRand2 = hash(layer.add(91));
  // 層ごとの張り出し量。層の境で段差になると微分が跳ねる（画面にギザギザが出る）ので、境で前の層の値から滑らかにつなぐ
  const offset = mix(hash(layer.add(16)), layerRand, smoothstep(0.0, 0.16, lf));

  // 層の張り出し: 層の中ほどが膨らみ、境が溝になる
  const bulge = smoothstep(0.0, 0.3, lf).mul(smoothstep(1.0, 0.7, lf));
  const groove = float(1).sub(smoothstep(0.0, 0.1, lf).mul(smoothstep(1.0, 0.9, lf)));

  // 縦の節理（層ごとに位置・幅がずれる）。崖の向きによらず変化するよう x と z を斜めに混ぜる
  // 層の中で斜めに傾く（layerRand で向きが変わる）ので、目地が縦の直線にならない
  const along = p.x
    .mul(0.8)
    .add(p.z.mul(0.6))
    .add(warp.mul(1.4))
    .add(layerRand.mul(9))
    .add(lf.mul(layerRand2.sub(0.5)).mul(2.4));
  const blockW = layerRand2.mul(2.6).add(2.2);
  const u = along.div(blockW);
  const fu = fract(u);
  const edge = min(fu, float(1).sub(fu)).mul(blockW);
  // 節理は一部の層だけ（全層に目地があると煉瓦積みに見える）
  const jointOn = smoothstep(0.3, 0.55, layerRand);
  // 層の境では値が不連続になる（along が層ごとに変わる）ので、境でフェードして微分の跳ねを避ける
  const layerFade = smoothstep(0.0, 0.14, lf).mul(smoothstep(1.0, 0.86, lf));
  const joint = float(1)
    .sub(smoothstep(0.02, 0.14, edge))
    .mul(jointOn)
    .mul(layerFade);
  const round = smoothstep(0.0, 0.45, edge).mul(layerFade);
  // ブロック・層の乱数は境で段差になる（画面にギザギザの縁が出る）ので、境に向けて中間値へ寄せて滑らかにつなぐ
  const blockRand = mix(
    float(0.5),
    hash(floor(u).add(layer.mul(31)).add(1000)),
    smoothstep(0.0, 0.16, edge).mul(layerFade),
  );

  // 縦に長い割れ目と雨だれ、粒
  const crackNoise = mx_noise_float(vec3(along.mul(0.55), p.y.mul(0.1), float(3.7)));
  const crack = smoothstep(0.05, 0.0, abs(crackNoise));
  const streak = mx_noise_float(vec3(p.x.mul(1.6), p.y.mul(0.22), p.z.mul(1.6)));
  const grain = mx_noise_float(p.mul(5.3));
  // 稜線の立った尾根と谷（丸いうねりだけだと粘土のように見えるので、角ばった凹凸を足す）
  const ridge = float(1).sub(
    abs(mx_noise_float(p.mul(vec3(1.7, 1.0, 1.7)).add(vec3(7.1, 0, 3.3)))),
  );
  const ridgeSharp = smoothstep(0.5, 1.0, ridge);

  const height = bulge
    .mul(0.13)
    .add(offset.mul(0.2))
    .add(round.mul(blockRand.mul(0.14).add(0.06)))
    .sub(joint.mul(0.09))
    .sub(crack.mul(0.07))
    .add(ridgeSharp.mul(0.12))
    .add(grain.mul(0.025));

  // 層ごとの色味（冷たい灰 ↔ 黄土）と、ブロックごとの明暗
  const cool = vec3(0.88, 0.94, 1.04);
  const ochre = vec3(1.04, 1.0, 0.92);
  const tintRand = mix(hash(layer.add(90)), layerRand2, smoothstep(0.0, 0.16, lf));
  const tint = mix(cool, ochre, tintRand);
  const brightness = float(0.7)
    .add(blockRand.mul(0.45))
    .add(offset.mul(0.2))
    .add(warp.mul(0.18))
    .add(grain.mul(0.1))
    .sub(groove.mul(0.3))
    .sub(joint.mul(0.28))
    .sub(crack.mul(0.3))
    .sub(float(1).sub(ridgeSharp).mul(0.08))
    .sub(smoothstep(0.1, 0.7, streak).mul(0.2));
  const tone = tint.mul(max(brightness, float(0.12)));
  return { tone, height };
}

/**
 * 凹凸（`height` の画面空間微分）から視点空間の法線を作る（Mikkelsen の bump mapping。
 * three の `bumpMap` はテクスチャ専用なので手書き）。`amount` は 0..1 の強さ（岩でない所は 0）。
 */
export function bumpedNormal(height: Node<'float'>, amount: Node<'float'>): Node<'vec3'> {
  const h = height.mul(amount);
  const dpdx = dFdx(positionView);
  const dpdy = dFdy(positionView);
  const n = normalView;
  const r1 = dpdy.cross(n);
  const r2 = n.cross(dpdx);
  const det = dpdx.dot(r1);
  const grad = sign(det).mul(dFdx(h).mul(r1).add(dFdy(h).mul(r2)));
  return normalize(abs(det).mul(n).sub(grad));
}
