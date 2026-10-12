import { Color, type Node, type Object3D, type UniformNode } from 'three/webgpu';
import {
  abs,
  cameraPosition,
  dot,
  float,
  mix,
  normalWorld,
  normalize,
  positionWorld,
  pow,
  smoothstep,
  uniform,
} from 'three/tsl';

/**
 * 武器のテレグラフ（攻撃予備動作の発光、#144 から分離）。
 *
 * 刃の縁（フレネル）や縁マスク（`_edge`）を加算で光らせる演出で、世界のライトとは無関係。
 * 以前はここでキャラクター全体へリムライト・暗部の持ち上げ（偽のライト）も足していたが、
 * 篝火・たいまつを実ライトにした（#322、`lighting/`）ので撤去した。
 */

/** テレグラフの調整値。 */
export const TELEGRAPH = {
  /** 縁の鋭さ（大きいほど細い縁）。 */
  power: 3.0,
  /** テレグラフ最大時の縁の発光の強さ（太陽・影に関係なく出る加算の光）。 */
  gain: 6,
  /** テレグラフ最大時の、縁以外（刃の面）の淡い発光。刃全体がうっすら染まる程度。 */
  fill: 1.8,
  /** テレグラフ最大時に刃を法線方向へ太らせる量（ローカル座標 m）。細い刃が遠目でも線として読める。 */
  inflate: 0.035,
  /** 縁マスク（`_edge`）の発光: 帯の立ち上がり（0 = 面の中心、1 = 輪郭）。 */
  edgeBand: { from: 0.8, to: 0.96 },
  /** 縁マスクの帯の発光の強さ。 */
  edgeGain: 1.7,
  /** 縁マスクのにじみ（輪郭から面へ染みる淡い光）の、`fill` = 1 のときの強さ。 */
  bleed: 0.5,
} as const;

/** 1 キャラクターインスタンスで共有するユニフォーム。 */
export interface TelegraphControls {
  /** 武器の発光の強さ（0..1）。 */
  readonly weapon: UniformNode<'float', number>;
  /** 武器のテレグラフの発光色（攻撃種別で変える）。 */
  readonly weaponColor: UniformNode<'color', Color>;
  /** 刃の面の淡い発光の倍率（1 = 既定。0 で縁だけが光り、刃の暗い芯と形が読める）。ボスの予兆が使う。 */
  readonly weaponFill: UniformNode<'float', number>;
  /** 縁（フレネル）の発光の倍率（1 = 既定）。 */
  readonly weaponRim: UniformNode<'float', number>;
  /** 縁の鋭さへの加算（0 = 既定）。大きいほど正面を向いた面が暗くなり、斜めの面・丸い柄の縁だけが光る。 */
  readonly weaponSharp: UniformNode<'float', number>;
  /**
   * 縁マスク（頂点属性 `_edge`）で光らせる割合（0 = フレネル、1 = 輪郭だけ）。1 のとき刃の面は暗い金属のまま、
   * 輪郭に沿った細い帯だけが光る。`_edge` を持たないメッシュでは無効。
   */
  readonly weaponEdge: UniformNode<'float', number>;
}

/** `setWeaponTelegraph` の見た目の調整（省略 = 既定）。 */
export interface WeaponTelegraphStyle {
  /** 刃の面の淡い発光の倍率。 */
  readonly fill?: number;
  /** 縁の発光の倍率。 */
  readonly rim?: number;
  /** 縁の鋭さへの加算（フレネルの指数に足す）。 */
  readonly sharp?: number;
  /**
   * 縁マスクで光らせる割合（0..1、既定 0）。1 なら輪郭に沿った帯だけが光り、面は暗いまま（#225）。
   * このとき `fill` は輪郭からのにじみ（淡い光が面へ染みる量）の倍率になる。
   */
  readonly edge?: number;
}

export function createTelegraphControls(): TelegraphControls {
  return {
    weapon: uniform(0),
    weaponColor: uniform(new Color(0xffffff)),
    weaponFill: uniform(1),
    weaponRim: uniform(1),
    weaponSharp: uniform(0),
    weaponEdge: uniform(0),
  };
}

/** 武器の発光ノード（加算。emissive に足す）。強さ・色は `controls`。 */
export function weaponTelegraphNode(
  controls: TelegraphControls,
  /** 縁の近さ（頂点属性 `_edge`。0 = 面の中、1 = 輪郭）。あれば `controls.weaponEdge` で縁マスクの発光に切り替えられる。 */
  edgeMask?: Node<'float'>,
): Node<'vec3'> {
  const n = normalize(normalWorld);
  const v = normalize(cameraPosition.sub(positionWorld));
  // 刃は細いのでフレネル（縁）が刃に沿った輪郭になる。追加のメッシュ・パスは無く、emissive に数命令足すだけ
  const fresnelGlow = pow(float(1).sub(abs(dot(n, v))), controls.weaponSharp.add(TELEGRAPH.power))
    .mul(controls.weaponRim.mul(TELEGRAPH.gain))
    .add(controls.weaponFill.mul(TELEGRAPH.fill));
  let glow: Node<'float'> = fresnelGlow;
  if (edgeMask) {
    // 輪郭の帯（面の中では 0）と、そこから面へ染みる淡いにじみ。視線の向きに依らず、刃の面は暗い金属のまま
    const band = smoothstep(TELEGRAPH.edgeBand.from, TELEGRAPH.edgeBand.to, edgeMask);
    const bleed = smoothstep(0.35, 1.0, edgeMask).pow(2);
    const maskGlow = band
      .mul(controls.weaponRim.mul(TELEGRAPH.edgeGain))
      .add(bleed.mul(controls.weaponFill.mul(TELEGRAPH.bleed)));
    glow = mix(fresnelGlow, maskGlow, controls.weaponEdge);
  }
  return controls.weaponColor.mul(controls.weapon).mul(glow);
}

/** メッシュが武器（`attach:sword` / `equip:Sword|Axe|GreatAxe`）の一部か。 */
export function isWeaponObject(mesh: Object3D): boolean {
  for (let o: Object3D | null = mesh; o; o = o.parent) {
    if (o.name === 'attach:sword' || /^equip:(Sword_|Axe_|GreatAxe)/.test(o.name)) return true;
  }
  return false;
}

/** メッシュが盾（`equip:GreatShield`）の一部か。ボスは盾打ちの予兆で盾を光らせる（#225）。 */
export function isShieldObject(mesh: Object3D): boolean {
  for (let o: Object3D | null = mesh; o; o = o.parent) {
    if (o.name === 'equip:GreatShield') return true;
  }
  return false;
}
