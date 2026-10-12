import {
  abs,
  dFdx,
  dFdy,
  float,
  floor,
  fwidth,
  fract,
  max,
  min,
  mix,
  normalize,
  normalView,
  positionView,
  sign,
  smoothstep,
  step,
  uniform,
  vec3,
} from 'three/tsl';
import type { Node } from 'three/webgpu';
import { bakedHash, bakedNoise, getMaterialDetail, type MaterialDetail } from '../bakedNoise';

/**
 * 岩肌の表面（TSL。ワールド座標ベース。テクスチャなし。#190）。
 * 崖の急斜面（地形マテリアル）と岩塊メッシュで同じ関数を使うので、岩塊が崖の地層・色になじむ。
 *
 *  - 地層: ワールド y を 2 周波のノイズで歪めた層に区切る。層の厚みが揃わず、境の溝は一部の境にだけ出る。
 *    層の色味・溝は急な面（`up` が小さい）だけに出す。中くらいの斜面で水平な層を出すと等高線に見える（#267）
 *  - 節理: 層ごとにずれた縦の目地で岩を大きなブロックに割る。ブロックごとに明暗と丸みが違う
 *  - 割れ目: ほぼ垂直な細い暗線。節理・割れ目は面の向きで 2 方向の投影（x / z）を鋭くブレンドする。
 *    固定の 1 方向（x と z の斜めの和）に投影すると、その方向に直交する面で模様が引き伸ばされる（#267）
 *
 * `tone` は頂点色（岩の基調色）に掛ける係数、`height` は凹凸（m。法線の摂動に使う）。
 * ノイズは焼いたテクスチャの参照（`bakedNoise`。3D なので投影による引き伸ばしはない）。
 * detail 2（high）は 4 回（歪み 2・粒・尾根）、detail 1 は 3 回（歪み・粒・尾根）、detail 0 は 1 回（歪み）。
 * 節理・割れ目の 2 方向投影はノイズを共有するので ALU だけが増える（サンプル数は変わらない）。
 */
export interface RockSurface {
  readonly tone: Node<'vec3'>;
  /** 凹凸（m）。= `heightCommon` + mix(`heightX`, `heightZ`, `facingX`)。 */
  readonly height: Node<'float'>;
  readonly heightCommon: Node<'float'>;
  /** x 方向の投影（z を向く面）の節理の凹凸。 */
  readonly heightX: Node<'float'>;
  /** z 方向の投影（x を向く面）の節理の凹凸。 */
  readonly heightZ: Node<'float'>;
  /** 投影のブレンド係数（1 = x を向く面）。 */
  readonly facingX: Node<'float'>;
}

/**
 * 割れ目（暗線）が消える距離（m）。クアッドの手前で薄れ始め、この距離で 0 になる。
 * 品質プリセットで `cliff.view.ts` が設定する（low は 25m。遠くでチラつかないように）。
 */
export const rockCrackFar = uniform(45);

export interface RockSurfaceInputs {
  /** 崖の足元の湿り 0..1（足元ほど 1。冷たく暗くなる）。 */
  readonly damp: Node<'float'>;
  /** 面の上向き度（`normalWorld.y`）。苔・地衣が上向きの棚に付く。急な面ほど地層がはっきり出る。 */
  readonly up: Node<'float'>;
  /** 面のワールド法線（`normalWorld`）。節理・割れ目の投影方向を選ぶ。 */
  readonly normal: Node<'vec3'>;
}

interface Joints {
  readonly joint: Node<'float'>;
  readonly round: Node<'float'>;
  readonly blockRand: Node<'float'>;
  readonly crack: Node<'float'>;
}

export function rockSurface(
  p: Node<'vec3'>,
  inputs: RockSurfaceInputs,
  detail: MaterialDetail = getMaterialDetail(),
): RockSurface {
  const full = detail >= 2;
  // 層のうねり（3m 程度）と、high は層の厚みのむら（横に長い 9m × 2m 程度）。
  // 振幅は層座標の y 微分が負にならない範囲に抑える（層が折り返すと閉じた輪＝等高線になる）
  const warp = bakedNoise(p.mul(0.3));
  const thick = full
    ? bakedNoise(vec3(p.x.mul(0.11), p.y.mul(0.45), p.z.mul(0.11)).add(vec3(3.7, 1.3, 5.9)))
    : warp.mul(0.6);
  const yy = p.y
    .mul(0.85)
    .add(warp.mul(0.75))
    .add(thick.mul(0.3))
    .add(p.x.mul(0.05))
    .sub(p.z.mul(0.04));
  const layer = floor(yy);
  const lf = fract(yy);
  const layerRand = bakedHash(layer.add(17));
  const layerRand2 = bakedHash(layer.add(91));
  // 急な面ほど層がはっきり出る（中くらいの斜面・上面では層の色味・溝を弱める）
  const vertical = smoothstep(0.85, 0.4, inputs.up);
  // 画面上の 1 ピクセルあたりの層座標の変化量。しきい値の幅をこれ以上に広げて、解析的にアンチエイリアスする
  // （境が 1 ピクセルより細いとギザギザになる。遠いほど境がぼけて平均色に寄る）
  const fwY = fwidth(yy);
  const edgeW = min(max(fwY.mul(1.5), float(0.16)), float(0.5));
  // 層ごとの張り出し量。層の境で段差になると微分が跳ねるので、境で前の層の値から滑らかにつなぐ
  const offset = mix(bakedHash(layer.add(16)), layerRand, smoothstep(0.0, edgeW, lf));

  // 層の張り出し: 層の中ほどが膨らみ、境（溝のある境だけ）がくぼむ
  const bulge = smoothstep(0.0, 0.3, lf).mul(smoothstep(1.0, 0.7, lf));
  const grooveW = max(float(0.1), fwY.mul(1.5));
  // 溝の強さは境ごとの乱数（境 b の強さ = bakedHash(b + 5)）。半分ほどの境は溝にならず、見える溝の間隔が揃わない
  const grooveRand = mix(bakedHash(layer.add(5)), bakedHash(layer.add(6)), step(0.5, lf));
  const grooveOn = smoothstep(0.3, 0.85, grooveRand);
  // 色の溝は急な面だけ。凹凸（height）には法線由来の係数を入れない（三角形ごとに線形な値が微分で
  // 三角形の辺の線として浮く。地形の急斜面は 1m 格子の縦長の三角形なので縦の筋になる）
  const groove = float(1)
    .sub(smoothstep(0.0, grooveW, lf).mul(smoothstep(1.0, float(1).sub(grooveW), lf)))
    .mul(grooveOn)
    .mul(vertical);

  // 層の境では値が不連続になる（along が層ごとに変わる）ので、境でフェードして微分の跳ねを避ける
  const layerFade = smoothstep(0.0, edgeW, lf).mul(smoothstep(1.0, float(1).sub(edgeW), lf));
  const crackFade = float(1).sub(
    smoothstep(rockCrackFar.mul(0.5), rockCrackFar, positionView.length()),
  );

  /** 水平座標 `h`（面に沿った横方向）に沿った節理・割れ目。 */
  const jointsAlong = (h: Node<'float'>, seed: number): Joints => {
    // 縦の節理（層ごとに位置・幅がずれる）。層の中で斜めに傾く（layerRand で向きが変わる）ので、目地が縦の直線にならない
    const along = h
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
    const joint = float(1)
      .sub(smoothstep(0.02, jointW, edge))
      .mul(jointOn)
      .mul(layerFade);
    const round = smoothstep(0.0, 0.45, edge).mul(layerFade);
    // ブロック・層の乱数は境で段差になるので、境に向けて中間値へ寄せて滑らかにつなぐ
    const blockRand = mix(
      float(0.5),
      bakedHash(
        floor(u)
          .add(layer.mul(31))
          .add(1000 + seed),
      ),
      smoothstep(0.0, jointW, edge).mul(layerFade),
    );
    if (!full) return { joint, round, blockRand, crack: float(0) };

    // 割れ目: 層ごとの、ほぼ垂直な直線の節理（傾きは ±15° 以内、層の境で止まる。層ごとに位置・間隔がずれる）。遠くで消える
    const crackSpacing = bakedHash(layer.add(33)).mul(2.0).add(1.3);
    const crackTilt = bakedHash(layer.add(44))
      .sub(0.5)
      .mul(2 * 0.27 * 1.18);
    const crackAlong = h
      .add(warp.mul(0.35))
      .add(bakedHash(layer.add(55 + seed)).mul(13))
      .add(lf.mul(crackTilt));
    const cu = crackAlong.div(crackSpacing);
    const cDist = min(fract(cu), float(1).sub(fract(cu))).mul(crackSpacing);
    // 画面上の 1 ピクセルあたりの距離（m）。幅は 1.5px 以上にして smoothstep(w - fw, w + fw) で解析的にアンチエイリアスする。
    // 線の太さ（0.05m）より 1 ピクセルが大きい（遠い・低解像度）ときは、幅を広げた分コントラストを落とす（途切れさせない）
    const crackPx = fwidth(crackAlong);
    const crackHalf = max(float(0.025), crackPx.mul(0.75));
    const crackContrast = min(float(1), float(0.05).div(crackPx.mul(1.5)));
    // 全ての層・全ての線に割れ目があるわけではない
    const crackHere = smoothstep(0.35, 0.55, bakedHash(layer.add(66))).mul(
      smoothstep(
        0.4,
        0.5,
        bakedHash(
          floor(cu)
            .add(layer.mul(13))
            .add(2000 + seed),
        ),
      ),
    );
    const crack = float(1)
      .sub(smoothstep(crackHalf.sub(crackPx), crackHalf.add(crackPx), cDist))
      .mul(crackContrast)
      .mul(crackHere)
      .mul(layerFade)
      .mul(crackFade);
    return { joint, round, blockRand, crack };
  };

  // 2 方向の投影: x を向く面は z に沿って、z を向く面は x に沿って割る。ブレンドは鋭め（斜めの面の狭い帯だけ重なる）
  const n = inputs.normal;
  const facingX = smoothstep(-0.2, 0.2, abs(n.x).sub(abs(n.z)));
  const onZ = jointsAlong(p.z, 0);
  const onX = jointsAlong(p.x, 7);
  const joint = mix(onX.joint, onZ.joint, facingX);
  const blockRand = mix(onX.blockRand, onZ.blockRand, facingX);
  const crack = mix(onX.crack, onZ.crack, facingX);

  const grain = detail >= 1 ? bakedNoise(p.mul(5.3)) : float(0);
  // 稜線の立った尾根と谷（丸いうねりだけだと粘土のように見えるので、角ばった凹凸を足す）。
  // ほぼ等方にする（縦に長くすると模様が縦に引き伸ばされて見える。#267）
  const ridge =
    detail >= 1
      ? float(1).sub(abs(bakedNoise(p.mul(vec3(1.7, 1.5, 1.7)).add(vec3(7.1, 0, 3.3)))))
      : float(0.6);
  const ridgeSharp = smoothstep(0.5, 1.0, ridge);

  // 凹凸。投影に依らない部分と、投影ごとの部分（節理のくぼみ・ブロックの丸み）に分ける。
  // 層の境のくぼみは溝のある境だけ（全ての境をくぼませると等間隔の横線が陰影で浮く）
  const heightCommon = float(1)
    .sub(float(1).sub(bulge).mul(grooveOn))
    .mul(0.13)
    .add(offset.mul(0.2))
    .add(ridgeSharp.mul(0.12))
    .add(grain.mul(0.025));
  const jointHeight = (j: Joints): Node<'float'> =>
    j.round.mul(j.blockRand.mul(0.14).add(0.06)).sub(j.joint.mul(0.09));
  const heightX = jointHeight(onX);
  const heightZ = jointHeight(onZ);
  const height = heightCommon.add(mix(heightX, heightZ, facingX));

  // 層ごとの色味（冷たい灰 ↔ 黄土）と、ブロックごとの明暗。層の差は急な面だけ（等高線の縞にしない）
  const cool = vec3(0.88, 0.94, 1.04);
  const ochre = vec3(1.04, 1.0, 0.92);
  const tintRand = mix(bakedHash(layer.add(90)), layerRand2, smoothstep(0.0, edgeW, lf));
  const tint = mix(cool, ochre, mix(float(0.5), tintRand, vertical.mul(0.8).add(0.2)));
  const brightness = float(0.8)
    .add(blockRand.mul(0.45))
    .add(offset.sub(0.5).mul(vertical).mul(0.2))
    .add(warp.mul(0.18))
    .add(thick.mul(0.08))
    .add(grain.mul(0.1))
    .sub(float(1).sub(ridgeSharp).mul(0.08));
  // 溝・目地・割れ目は黒く塗らず、基調色を最大でそれぞれ約 30% / 40% / 45% 暗くする
  const shade = float(1)
    .sub(groove.mul(0.3))
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
  return { tone, height, heightCommon, heightX, heightZ, facingX };
}

/**
 * 凹凸（`height` の画面空間微分）から視点空間の法線を作る（Mikkelsen の bump mapping。
 * three の `bumpMap` はテクスチャ専用なので手書き）。`amount` は 0..1 の強さ（岩でない所は 0）。
 *
 * 法線由来の係数（`amount`・投影のブレンド係数）は微分の後に掛ける。法線は三角形ごとに線形なので、
 * 先に掛けるとその微分が三角形の辺で跳ね、地形の 1m 格子の縦長の三角形が縦の筋として見える（#267）。
 */
export function bumpedNormal(rock: RockSurface, amount: Node<'float'>): Node<'vec3'> {
  const dpdx = dFdx(positionView);
  const dpdy = dFdy(positionView);
  const n = normalView;
  const r1 = dpdy.cross(n);
  const r2 = n.cross(dpdx);
  const det = dpdx.dot(r1);
  const dhdx = dFdx(rock.heightCommon).add(
    mix(dFdx(rock.heightX), dFdx(rock.heightZ), rock.facingX),
  );
  const dhdy = dFdy(rock.heightCommon).add(
    mix(dFdy(rock.heightX), dFdy(rock.heightZ), rock.facingX),
  );
  const grad = sign(det)
    .mul(dhdx.mul(r1).add(dhdy.mul(r2)))
    .mul(amount);
  return normalize(abs(det).mul(n).sub(grad));
}
