import {
  Color,
  MeshStandardNodeMaterial,
  type ColorRepresentation,
  type Material,
  type Mesh,
  type Node,
  type Object3D,
  type UniformNode,
} from 'three/webgpu';
import {
  cameraPosition,
  dot,
  float,
  mix,
  normalWorld,
  normalize,
  positionWorld,
  pow,
  saturate,
  smoothstep,
  uniform,
  vec3,
} from 'three/tsl';
import { sunDirection } from './environment';

/**
 * キャラクターの視認性ライティング（#144）。
 *
 * 低い黄金の太陽に向かって撮ると、キャラクターは暗い塊になりポーズや武器が読めない。
 * 世界のライトは変えず（地形の雰囲気を保つ）、キャラクターのマテリアルにだけ次を足す:
 *  - リムライト: フレネル項の縁。カメラが太陽の方を向くほど（逆光）強い金色の縁取り。
 *    それ以外の向きでも弱い空色の縁が出るので、影の中でも輪郭が読める。
 *  - 暗部の持ち上げ: 反射色にごく弱い自己発光を足し、完全な黒潰れを防ぐ（影の中・逆光の面）。
 *  - テレグラフ: 武器のリムを一時的に強める `weapon` ユニフォーム（攻撃予備動作の演出用）。
 */

/** リムライトの調整値。 */
export const RIM = {
  /** 縁の鋭さ（大きいほど細い縁）。 */
  power: 3.0,
  /** 逆光時の金色の縁の強さ。 */
  backlitGain: 1.5,
  /** 逆光でない時の太陽色の縁の強さ。 */
  baseGain: 0.12,
  /** 空色（影・横向き）の縁の強さ。 */
  skyGain: 0.18,
  /** 暗部の持ち上げ（反射色に対する自己発光の割合）。 */
  lift: 0.07,
  /** 武器のテレグラフ最大時の縁の発光の強さ（太陽・影に関係なく出る加算の光）。 */
  telegraphGain: 6,
  /** テレグラフ最大時の、縁以外（刃の面）の淡い発光。刃全体がうっすら染まる程度。 */
  telegraphFill: 1.8,
  /** テレグラフ最大時に刃を法線方向へ太らせる量（ローカル座標 m）。細い刃が遠目でも線として読める。 */
  telegraphInflate: 0.035,
} as const;

const SKY_RIM = new Color(0x9fb4c8);
const SUN_RIM = new Color(0xffae5c);

const sunDirNode = uniform(sunDirection());
const sunRimColor = uniform(SUN_RIM);
const skyRimColor = uniform(SKY_RIM);
/** 全体のオン/オフ（比較撮影・デバッグ用）。 */
const rimEnabled: UniformNode<'float', number> = uniform(1);

/** キャラクター補助光を全体で切り替える（`?rim=0` の比較用）。 */
export function setCharacterLightEnabled(enabled: boolean): void {
  rimEnabled.value = enabled ? 1 : 0;
}

/** 1 キャラクターインスタンスで共有するユニフォーム。 */
export interface RimControls {
  /** 武器のリムの追加強度（0..1）。 */
  readonly weapon: UniformNode<'float', number>;
  /** 武器のテレグラフの発光色（攻撃種別で変える）。 */
  readonly weaponColor: UniformNode<'color', Color>;
}

export function createRimControls(): RimControls {
  return { weapon: uniform(0), weaponColor: uniform(new Color(0xffffff)) };
}

/**
 * 発光ノード（加算）を作る。albedo はそのマテリアルの反射色（暗部の持ち上げに使う）。
 * `isWeapon` が true のときは `controls.weapon`（強さ）と `controls.weaponColor`（色）の発光が足される。
 */
export function characterLightNode(
  albedo: Node<'vec3'>,
  controls: RimControls,
  isWeapon: boolean,
): Node<'vec3'> {
  const n = normalize(normalWorld);
  const v = normalize(cameraPosition.sub(positionWorld));
  const fresnel = pow(float(1).sub(saturate(dot(n, v))), RIM.power);
  // カメラが太陽の方を向いているほど 1（太陽が被写体の向こう側にある。v は表面→カメラなので sun 方向と逆向きなら逆光）
  const backlit = smoothstep(-0.15, 0.85, dot(v, sunDirNode).negate());
  // 太陽側を向いた縁だけ金色にする（反対側の縁に金色が回り込まない）
  const sunSide = smoothstep(-0.35, 0.55, dot(n, sunDirNode));
  const gold = sunRimColor
    .mul(fresnel)
    .mul(sunSide)
    .mul(backlit.mul(RIM.backlitGain - RIM.baseGain).add(RIM.baseGain));
  // 太陽側でない縁（影・横向き）は空色の弱い縁。逆光時は金色が優先なので弱める
  const sky = skyRimColor
    .mul(fresnel)
    .mul(float(1).sub(sunSide.mul(backlit)))
    .mul(RIM.skyGain);
  let rim: Node<'vec3'> = gold.add(sky);
  if (isWeapon) {
    // テレグラフ: 世界のライトとは無関係な加算の光。刃は細いのでフレネル（縁）が刃に沿った輪郭になる。
    // 追加のメッシュ・パスは無く、既存の emissive に数命令足すだけ。
    const edge = fresnel.mul(RIM.telegraphGain).add(RIM.telegraphFill);
    rim = rim.add(controls.weaponColor.mul(controls.weapon).mul(edge));
  }
  // 暗部の持ち上げ: 暗い色ほど効く（明るい面は十分明るいので元の色をほぼ保つ）
  const luma = dot(albedo, vec3(0.299, 0.587, 0.114));
  const dark = float(1).sub(smoothstep(0.0, 0.5, luma).mul(0.6));
  const lift = albedo
    .mul(RIM.lift)
    .mul(dark)
    .add(vec3(0.006, 0.0055, 0.005));
  return mix(vec3(0), rim.add(lift), rimEnabled);
}

/** `applyCharacterLight` が返すハンドル。 */
export interface CharacterLight {
  /** 武器の縁を光らせる（強さ 0..1、色は省略時は直前の色）。敵の攻撃予備動作（テレグラフ）演出用。 */
  setWeaponTelegraph(amount: number, color?: ColorRepresentation): void;
  readonly weaponTelegraph: number;
  dispose(): void;
}

/**
 * 亡者マテリアルを使わないキャラクター（プレイヤーなど）へ補助光を適用する。
 * `root` は `SkeletonUtils.clone` 済み。標準マテリアルはインスタンス専用のノードマテリアルへ置き換える
 * （テクスチャは共有）。亡者は `applyUndeadLook` が同じノードを内部で使うので呼ばない。
 */
export function applyCharacterLight(root: Object3D): CharacterLight {
  const controls = createRimControls();
  const created: Material[] = [];
  const cache = new Map<string, Material>();
  root.traverse((obj) => {
    if (!(obj as { isMesh?: boolean }).isMesh) return;
    const mesh = obj as Mesh;
    const weapon = isWeaponObject(mesh);
    const convert = (src: Material): Material => {
      const key = `${src.uuid}:${weapon ? 'w' : 'b'}`;
      let m = cache.get(key);
      if (!m) {
        m = withCharacterLight(src, controls, weapon);
        cache.set(key, m);
        created.push(m);
      }
      return m;
    };
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(convert)
      : convert(mesh.material);
  });
  let amount = 0;
  return {
    setWeaponTelegraph(a, color) {
      amount = Math.min(1, Math.max(0, a));
      controls.weapon.value = amount;
      if (color !== undefined) controls.weaponColor.value.set(color);
    },
    get weaponTelegraph() {
      return amount;
    },
    dispose() {
      for (const m of created) m.dispose();
    },
  };
}

function withCharacterLight(src: Material, controls: RimControls, isWeapon: boolean): Material {
  if ((src as { isNodeMaterial?: boolean }).isNodeMaterial) return src;
  const material = new MeshStandardNodeMaterial();
  const target = material as unknown as Record<string, unknown>;
  const source = src as unknown as Record<string, unknown>;
  for (const key in src) {
    if (key === 'uuid' || key === 'id') continue;
    target[key] = source[key];
  }
  const color = (src as { color?: Color }).color;
  const map = (src as { map?: unknown }).map;
  // 反射色の近似: テクスチャがあっても暗部の持ち上げは単色の平均で足りる
  const albedo = vec3(color?.r ?? 0.5, color?.g ?? 0.5, color?.b ?? 0.5).mul(map ? 0.35 : 0.8);
  material.emissiveNode = characterLightNode(albedo, controls, isWeapon);
  return material;
}

/** メッシュが武器（`attach:sword` / `equip:Sword|Axe|GreatAxe`）の一部か。 */
export function isWeaponObject(mesh: Object3D): boolean {
  for (let o: Object3D | null = mesh; o; o = o.parent) {
    if (o.name === 'attach:sword' || /^equip:(Sword_|Axe_|GreatAxe)/.test(o.name)) return true;
  }
  return false;
}
