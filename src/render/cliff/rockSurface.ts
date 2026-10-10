import {
  abs,
  dFdx,
  dFdy,
  float,
  floor,
  fwidth,
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
  uniform,
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

/**
 * 割れ目（暗線）が消える距離（m）。クアッドの手前で薄れ始め、この距離で 0 になる。
 * 品質プリセットで `cliff.view.ts` が設定する（low は 25m。遠くでチラつかないように）。
 */
export const rockCrackFar = uniform(45);

export interface RockSurfaceInputs {
  /** 崖の足元の湿り 0..1（足元ほど 1。冷たく暗くなる）。 */
  readonly damp: Node<'float'>;
  /** 面の上向き度（`normalWorld.y`）。苔・地衣が上向きの棚に付く。 */
  readonly up: Node<'float'>;
}

export function rockSurface(p: Node<'vec3'>, inputs: RockSurfaceInputs): RockSurface {
  // 地形のむらに沿って層をうねらせる
  const warp = mx_noise_float(p.mul(0.3));
  const yy = p.y.mul(0.85).add(warp.mul(0.7)).add(p.x.mul(0.05)).sub(p.z.mul(0.04));
  const layer = floor(yy);
  const lf = fract(yy);
  const layerRand = hash(layer.add(17));
  const layerRand2 = hash(layer.add(91));
  // 画面上の 1 ピクセルあたりの層座標の変化量。しきい値の幅をこれ以上に広げて、解析的にアンチエイリアスする
  // （境が 1 ピクセルより細いとギザギザになる。遠いほど境がぼけて平均色に寄る）
  const fwY = fwidth(yy);
  const edgeW = min(max(fwY.mul(1.5), float(0.16)), float(0.5));
  // 層ごとの張り出し量。層の境で段差になると微分が跳ねるので、境で前の層の値から滑らかにつなぐ
  const offset = mix(hash(layer.add(16)), layerRand, smoothstep(0.0, edgeW, lf));

  // 層の張り出し: 層の中ほどが膨らみ、境が溝になる
  const bulge = smoothstep(0.0, 0.3, lf).mul(smoothstep(1.0, 0.7, lf));
  const grooveW = max(float(0.1), fwY.mul(1.5));
  const groove = float(1).sub(
    smoothstep(0.0, grooveW, lf).mul(smoothstep(1.0, float(1).sub(grooveW), lf)),
  );

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
  // 目地の線幅（m）もピクセル幅に合わせて広げる
  const fwA = fwidth(along);
  const jointW = max(float(0.12), fwA.mul(1.5));
  const jointOn = smoothstep(0.3, 0.55, layerRand);
  // 層の境では値が不連続になる（along が層ごとに変わる）ので、境でフェードして微分の跳ねを避ける
  const layerFade = smoothstep(0.0, edgeW, lf).mul(smoothstep(1.0, float(1).sub(edgeW), lf));
  const joint = float(1)
    .sub(smoothstep(0.02, jointW, edge))
    .mul(jointOn)
    .mul(layerFade);
  const round = smoothstep(0.0, 0.45, edge).mul(layerFade);
  // ブロック・層の乱数は境で段差になるので、境に向けて中間値へ寄せて滑らかにつなぐ
  const blockRand = mix(
    float(0.5),
    hash(floor(u).add(layer.mul(31)).add(1000)),
    smoothstep(0.0, jointW, edge).mul(layerFade),
  );

  // 縦に長い細い割れ目（遠くで消える）と雨だれ、粒
  const crackNoise = mx_noise_float(
    vec3(p.x.mul(0.8).add(p.z.mul(0.6)).add(warp.mul(1.4)).mul(0.55), p.y.mul(0.1), float(3.7)),
  );
  const crackW = max(float(0.02), fwidth(crackNoise).mul(1.5));
  const crackFade = float(1).sub(
    smoothstep(rockCrackFar.mul(0.5), rockCrackFar, positionView.length()),
  );
  const crack = smoothstep(crackW, 0.0, abs(crackNoise)).mul(crackFade);
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
    .sub(crack.mul(0.02))
    .add(ridgeSharp.mul(0.12))
    .add(grain.mul(0.025));

  // 層ごとの色味（冷たい灰 ↔ 黄土）と、ブロックごとの明暗
  const cool = vec3(0.88, 0.94, 1.04);
  const ochre = vec3(1.04, 1.0, 0.92);
  const tintRand = mix(hash(layer.add(90)), layerRand2, smoothstep(0.0, edgeW, lf));
  const tint = mix(cool, ochre, tintRand);
  const brightness = float(0.7)
    .add(blockRand.mul(0.45))
    .add(offset.mul(0.2))
    .add(warp.mul(0.18))
    .add(grain.mul(0.1))
    .sub(float(1).sub(ridgeSharp).mul(0.08))
    .sub(smoothstep(0.1, 0.7, streak).mul(0.2));
  // 溝・目地・割れ目は黒く塗らず、基調色を最大でそれぞれ約 35% / 40% / 45% 暗くする
  const shade = float(1)
    .sub(groove.mul(0.35))
    .mul(float(1).sub(joint.mul(0.4)))
    .mul(float(1).sub(crack.mul(0.45)));
  let tone = tint.mul(max(brightness, float(0.12))).mul(shade);

  // 足元は湿って冷たく暗い
  tone = mix(tone, tone.mul(vec3(0.82, 0.9, 1.0)).mul(0.82), inputs.damp.mul(0.7));
  // 上向きの棚に、まばらな地衣・苔（くすんだオリーブ灰。弱く）
  const ledgeTop = smoothstep(0.45, 0.75, lf).mul(smoothstep(1.0, 0.9, lf));
  const patch = smoothstep(0.2, 0.55, warp.add(grain.mul(0.5)));
  const upward = float(0.35).add(smoothstep(0.0, 0.5, inputs.up));
  const lichen = ledgeTop
    .mul(patch)
    .mul(upward)
    .mul(layerFade)
    .mul(0.4)
    .add(inputs.damp.mul(patch).mul(0.12));
  tone = mix(tone, vec3(0.82, 0.88, 0.72).mul(0.8), min(lichen, float(0.45)));
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
