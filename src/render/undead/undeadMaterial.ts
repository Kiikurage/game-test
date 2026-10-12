import {
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  Vector3,
  type MeshStandardNodeMaterial,
  type ColorRepresentation,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Node,
  type Object3D,
  type UniformNode,
} from 'three/webgpu';
import {
  abs,
  attribute,
  cameraPosition,
  dot,
  float,
  luminance,
  mix,
  normalLocal,
  normalWorld,
  normalize,
  positionLocal,
  positionWorld,
  pow,
  saturate,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  TELEGRAPH,
  createTelegraphControls,
  isShieldObject,
  isWeaponObject,
  type TelegraphControls,
  type WeaponTelegraphStyle,
  weaponTelegraphNode,
} from '../weaponTelegraph';
import { OUTFIT_MESHES, UNDEAD_VARIANTS, clampProgress, type UndeadVariant } from './variants';
import { bakedNoise } from '../bakedNoise';
import { finiteColor } from '../finiteColor';
import { createUberMaterial } from '../uberMaterial';

/** 材質の役割。同じ元マテリアル（MI_Ranger）でもメッシュ名で金属パーツを分ける。 */
export type UndeadRole = 'skin' | 'cloth' | 'metal';

/** キャラクターのマテリアルの役割。`plain` は亡者化しない素のまま（騎士）。 */
type CharacterRole = UndeadRole | 'plain';

/** 眼の発光色（青白）と熾火色（ボスのフェーズ 2 / ディゾルブの縁）。 */
const EYE_COLOR = new Color(0x9fd8ff);
const EMBER_COLOR = new Color(0xff5a14);
const ASH_COLOR = new Color(0x15110f);
/** 撃破の閃光（輪郭の白〜橙。#281）と、燃え尽きた灰色。 */
const KILL_FLASH_CORE = new Color(1, 0.86, 0.62);
const BURNT_COLOR = new Color(0x4a4744);
/** 燃え尽きが命中点から全身へ届く半径（m。体格 × 1 の亡者で全身を覆う）。 */
const BURNOUT_REACH = 2.4;

/** 顔テクスチャ（Head_Skin の MI_Head）上の両眼の UV 座標。 */
const EYE_UVS = [
  [0.139, 0.252],
  [0.231, 0.252],
] as const;
const EYE_RADIUS = 0.0125;
/** ディゾルブの縁の幅（ノイズ値の範囲）。 */
const DISSOLVE_EDGE = 0.1;
/** 発光の上限（リニア）。ディゾルブの縁の熾火（3.2）に他の発光が重なっても収まる値。 */
const EMISSIVE_MAX = 6;

/** 亡者の見た目を外から操作するハンドル。 */
export interface UndeadLook {
  readonly variant: UndeadVariant;
  /**
   * 体型の倍率 [x, y, z]（幅, 高さ, 幅）。呼び出し側が `root.scale` に掛ける
   * （例: ボスなら 2.2 倍にこの値を乗せる）。骨格のスケールで表すとスキニングの結果が崩れるためここでは触らない。
   */
  readonly buildScale: readonly [number, number, number];
  /** ディゾルブ進行度（0 = 無傷、1 = 完全に消失）。範囲外は丸める。 */
  setDissolve(progress: number): void;
  readonly dissolve: number;
  /**
   * 撃破の演出（#281）。`flash`: 輪郭の閃光 0..1、`eyeGlow`: 眼の発光の倍率（1 = 生前、0 = 消灯）、
   * `burnout`: 燃え尽きた灰色と熾火のひびの広がり 0..1（`point`（ワールド。命中点）から全身へ）。
   * 追加の描画パス・マテリアルの切り替えは無い（ユニフォームの書き換えだけ）。
   */
  setKillFeedback(
    state: { readonly flash: number; readonly eyeGlow: number; readonly burnout: number },
    point?: { readonly x: number; readonly y: number; readonly z: number },
  ): void;
  /**
   * 熾火の強さ（0〜1）。ボスのフェーズ 2 用: 眼が橙になり、鎧の継ぎ目・肌の亀裂・武器が熾火色に光る。
   */
  setEmber(amount: number): void;
  readonly ember: number;
  /**
   * 武器の縁を光らせる（強さ 0..1、色は省略時は直前の色）。敵の攻撃予備動作（テレグラフ演出, #62）用。
   * 縁の加算の光だけで、世界のライティングには影響しない。このインスタンスの武器だけが光る。
   */
  setWeaponTelegraph(
    amount: number,
    color?: ColorRepresentation,
    style?: WeaponTelegraphStyle,
  ): void;
  readonly weaponTelegraph: number;
  /**
   * 盾の縁を光らせる（`applyUndeadLook` の `shieldGlow` のとき。ボスの盾打ち 1 段目の予兆。#225）。武器とは別のユニフォームなので、
   * 盾だけ・斧だけを独立に光らせられる。引数は `setWeaponTelegraph` と同じ。
   */
  setShieldTelegraph(
    amount: number,
    color?: ColorRepresentation,
    style?: WeaponTelegraphStyle,
  ): void;
  readonly shieldTelegraph: number;
  /** 生成したマテリアルを解放する。 */
  dispose(): void;
}

/** 1 つのキャラクターインスタンス内で共有するユニフォーム。 */
interface Controls {
  readonly rim: TelegraphControls;
  readonly dissolve: UniformNode<'float', number>;
  readonly ember: UniformNode<'float', number>;
  readonly kill: KillControls;
}

interface KillControls {
  readonly flash: UniformNode<'float', number>;
  readonly eyeGlow: UniformNode<'float', number>;
  readonly burnout: UniformNode<'float', number>;
  readonly point: UniformNode<'vec3', Vector3>;
}

export interface UndeadLookOptions {
  /** 盾（`equip:GreatShield`）も予兆の発光の対象にする（ボスの盾打ち。盾は雑魚と共有のメッシュだが、マテリアルはインスタンスごと）。 */
  readonly shieldGlow?: boolean;
}

/**
 * キャラクター（`Character.root` など）の全メッシュへ亡者マテリアルを適用する。
 * 追加テクスチャは無し: 元のベースカラー/法線/金属粗さテクスチャに、TSL の色演算と
 * 1〜2 回の Perlin ノイズ（斑・ひび・ディゾルブ）だけを加える。
 * インスタンスごとに新しいマテリアルを作るので、`root` は `SkeletonUtils.clone` 済みであること。
 */
export function applyUndeadLook(
  root: Object3D,
  variant: UndeadVariant,
  options: UndeadLookOptions = {},
): UndeadLook {
  const controls: Controls = {
    dissolve: uniform(0),
    ember: uniform(0),
    rim: createTelegraphControls(),
    kill: {
      flash: uniform(0),
      eyeGlow: uniform(1),
      burnout: uniform(0),
      point: uniform(new Vector3()),
    },
  };
  // 盾の予兆の発光は武器と別のユニフォーム（盾打ちで光るのは盾だけ）
  const shieldControls: Controls = { ...controls, rim: createTelegraphControls() };
  const created: Material[] = [];
  const cache = new Map<string, Material>();

  root.traverse((obj) => {
    if (!(obj as { isMesh?: boolean }).isMesh) return;
    const mesh = obj as Mesh;
    const role = roleOf(mesh);
    const weapon = isWeaponObject(mesh);
    const shield = options.shieldGlow === true && isShieldObject(mesh);
    const geo = geometryTraits(mesh);
    const sources = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const converted = sources.map((src) => {
      const baked = hasBakedColor(mesh, src as MeshStandardMaterial);
      const key = `${src.uuid}:${role}:${weapon}:${baked}:${shield}:${geo.hasUv}${geo.hasColor}${geo.hasEdge}`;
      let m = cache.get(key);
      if (!m) {
        m = createCharacterMaterial(
          src as MeshStandardMaterial,
          role,
          variant,
          shield ? shieldControls : controls,
          { weapon, shield, baked },
          geo,
        );
        cache.set(key, m);
        created.push(m);
      }
      return m;
    });
    mesh.material = Array.isArray(mesh.material) ? converted : (converted[0] as Material);
    if (isHiddenBy(mesh.name, variant)) mesh.visible = false;
  });

  let dissolve = 0;
  let ember = 0;
  let telegraph = 0;
  let shieldTelegraph = 0;
  const setTelegraph = (
    rim: TelegraphControls,
    amount: number,
    color?: ColorRepresentation,
    style?: WeaponTelegraphStyle,
  ): number => {
    rim.weapon.value = clampProgress(amount);
    if (color !== undefined) rim.weaponColor.value.set(color);
    rim.weaponFill.value = style?.fill ?? 1;
    rim.weaponRim.value = style?.rim ?? 1;
    rim.weaponSharp.value = style?.sharp ?? 0;
    rim.weaponEdge.value = style?.edge ?? 0;
    return rim.weapon.value;
  };
  return {
    variant,
    buildScale: [variant.build.width, variant.build.height, variant.build.width],
    get dissolve() {
      return dissolve;
    },
    setDissolve(progress) {
      dissolve = clampProgress(progress);
      controls.dissolve.value = dissolve;
    },
    setKillFeedback(state, point) {
      const k = controls.kill;
      k.flash.value = clampProgress(state.flash);
      k.eyeGlow.value = clampProgress(state.eyeGlow);
      k.burnout.value = clampProgress(state.burnout);
      if (point) k.point.value.set(point.x, point.y, point.z);
    },
    get ember() {
      return ember;
    },
    setEmber(amount) {
      ember = clampProgress(amount);
      controls.ember.value = ember;
    },
    get weaponTelegraph() {
      return telegraph;
    },
    setWeaponTelegraph(amount, color, style) {
      telegraph = setTelegraph(controls.rim, amount, color, style);
    },
    get shieldTelegraph() {
      return shieldTelegraph;
    },
    setShieldTelegraph(amount, color, style) {
      shieldTelegraph = setTelegraph(shieldControls.rim, amount, color, style);
    },
    dispose() {
      for (const m of created) m.dispose();
    },
  };
}

/** `applyPlainLook` が返すハンドル。 */
export interface WeaponTelegraph {
  /** 武器の縁を光らせる（強さ 0..1、色は省略時は直前の色）。溜め攻撃などの発光演出用。 */
  setWeaponTelegraph(
    amount: number,
    color?: ColorRepresentation,
    style?: WeaponTelegraphStyle,
  ): void;
  readonly weaponTelegraph: number;
  dispose(): void;
}

/**
 * 亡者化しないキャラクター（プレイヤーの騎士）の全メッシュへ、元の見た目のまま亡者と同じシェーダのマテリアルを適用する（#391）。
 * 武器の発光（溜め攻撃のフィードバック）を付ける。装備を取り付けた後にかければ装備の武器にも掛かる。
 * `root` は `SkeletonUtils.clone` 済みであること。
 */
export function applyPlainLook(root: Object3D): WeaponTelegraph {
  const controls: Controls = {
    dissolve: uniform(0),
    ember: uniform(0),
    rim: createTelegraphControls(),
    kill: {
      flash: uniform(0),
      eyeGlow: uniform(1),
      burnout: uniform(0),
      point: uniform(new Vector3()),
    },
  };
  const created: Material[] = [];
  const cache = new Map<string, Material>();
  root.traverse((obj) => {
    if (!(obj as { isMesh?: boolean }).isMesh) return;
    const mesh = obj as Mesh;
    const weapon = isWeaponObject(mesh);
    const geo = geometryTraits(mesh);
    const convert = (src: Material): Material => {
      const key = `${src.uuid}:${weapon}:${geo.hasUv}${geo.hasColor}${geo.hasEdge}`;
      let m = cache.get(key);
      if (!m) {
        // 色の変種は使わない（役割 plain は元の色・マップだけ）
        m = createCharacterMaterial(
          src as MeshStandardMaterial,
          'plain',
          UNDEAD_VARIANTS.gaunt,
          controls,
          { weapon, shield: false, baked: false },
          geo,
        );
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
    setWeaponTelegraph(a, color, style) {
      amount = clampProgress(a);
      controls.rim.weapon.value = amount;
      if (color !== undefined) controls.rim.weaponColor.value.set(color);
      controls.rim.weaponFill.value = style?.fill ?? 1;
      controls.rim.weaponRim.value = style?.rim ?? 1;
      controls.rim.weaponSharp.value = style?.sharp ?? 0;
      controls.rim.weaponEdge.value = style?.edge ?? 0;
    },
    get weaponTelegraph() {
      return amount;
    },
    dispose() {
      for (const m of created) m.dispose();
    },
  };
}

export function roleOf(mesh: Mesh): UndeadRole {
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const name = material?.name ?? '';
  if (name === 'MI_Regular_Male' || name === 'MI_Head') return 'skin';
  if (/Pauldron|Bracer/.test(mesh.name)) return 'metal';
  // 武器・盾などの小物（テクスチャ無しの単色マテリアル）は金属扱い
  if (name !== 'MI_Ranger') return 'metal';
  return 'cloth';
}

/** 頂点カラー（装備メッシュの錆・汚れ。#154）を持つか。持つ場合は頂点カラーをそのまま地の色に使う。 */
function hasBakedColor(mesh: Mesh, src: MeshStandardMaterial): boolean {
  return src.vertexColors && 'color' in mesh.geometry.attributes;
}

function isHiddenBy(meshName: string, variant: UndeadVariant): boolean {
  const hidden: string[] = [];
  if (!variant.hood) hidden.push(...OUTFIT_MESHES.hood);
  if (!variant.pauldron) hidden.push(...OUTFIT_MESHES.pauldron);
  if (!variant.belts) hidden.push(...OUTFIT_MESHES.belts);
  return hidden.includes(meshName);
}

/** メッシュのジオメトリの属性。シェーダはこの組み合わせごとに 1 本（属性の無いメッシュでノードが警告を出さないようにする）。 */
interface GeometryTraits {
  readonly hasUv: boolean;
  readonly hasColor: boolean;
  readonly hasEdge: boolean;
}

function geometryTraits(mesh: Mesh): GeometryTraits {
  const g = mesh.geometry;
  return {
    hasUv: g.hasAttribute('uv'),
    hasColor: g.hasAttribute('color'),
    hasEdge: g.hasAttribute('_edge'),
  };
}

/** マップが無いときのダミー（白 = 掛けても変わらない、平らな法線）。UV のあるメッシュは常に同じ読み方をして、シェーダを共有する。 */
let dummyWhite: DataTexture | null = null;
let dummyNormal: DataTexture | null = null;
function pixelTexture(r: number, g: number, b: number): DataTexture {
  const t = new DataTexture(new Uint8Array([r, g, b, 255]), 1, 1, RGBAFormat, UnsignedByteType);
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}
const whiteTexture = (): DataTexture => (dummyWhite ??= pixelTexture(255, 255, 255));
const flatNormalTexture = (): DataTexture => (dummyNormal ??= pixelTexture(128, 128, 255));

/** 武器・盾か（テレグラフの発光と刃の熾火の対象）と、頂点カラーを地の色にするか。 */
interface PartTraits {
  readonly weapon: boolean;
  readonly shield: boolean;
  readonly baked: boolean;
}

/**
 * キャラクターのマテリアル。肌・布・金属・素のまま（騎士）の違いはパラメータ（ユニフォーム）で表し、すべての役割を
 * 同じシェーダで評価する（役割の重みで混ぜる）。シェーダの種類はジオメトリの属性（UV・頂点カラー・`_edge`）の組み合わせだけで決まるので、
 * 同じ形のメッシュは役割やインスタンスが違っても同じパイプラインを共有する（#391）。
 */
function createCharacterMaterial(
  src: MeshStandardMaterial,
  role: CharacterRole,
  variant: UndeadVariant,
  controls: Controls,
  part: PartTraits,
  geo: GeometryTraits,
): MeshStandardNodeMaterial {
  const w = (r: CharacterRole): UniformNode<'float', number> => uniform(role === r ? 1 : 0);
  const wSkin = w('skin');
  const wCloth = w('cloth');
  const wMetal = w('metal');
  const wPlain = w('plain');
  const face = uniform(src.name === 'MI_Head' && role === 'skin' ? 1 : 0);
  const bakedW = uniform(part.baked ? 1 : 0);
  const vertexColorW = uniform(role === 'plain' && src.vertexColors ? 1 : 0);
  const weaponFlag = uniform(part.weapon || part.shield ? 1 : 0);
  const bladeFlag = uniform(part.weapon ? 1 : 0);

  // 色・係数はユニフォームで持つ（定数で埋め込むと変種・素材ごとにシェーダが分かれ、パイプラインが増える。#326）
  const srcColor = uniform(src.color.clone());
  const base: Node<'vec3'> = geo.hasUv
    ? texture(src.map ?? whiteTexture()).rgb.mul(srcColor)
    : srcColor.rgb;
  const lum = luminance(base);
  // 小物（UV 無し）はローカル座標でノイズを引く
  const noiseCoord = (k: number): Node<'vec3'> =>
    geo.hasUv ? vec3(uv().mul(k), 0.37) : positionLocal.mul(k * 1.2);
  const uv0: Node<'vec2'> = geo.hasUv ? uv() : vec2(0, 0);
  const bakedColor: Node<'vec3'> = geo.hasColor ? vertexColor().rgb : vec3(0.5, 0.5, 0.5);

  const emberGlow = vec3(EMBER_COLOR.r, EMBER_COLOR.g, EMBER_COLOR.b).mul(controls.ember);
  // 熾火の亀裂: ノイズの等値線（谷）が光る。フェーズ 2 で ember を上げると現れる。
  const crack = float(1).sub(smoothstep(0.0, 0.035, abs(bakedNoise(noiseCoord(30)))));

  // 肌: 暗い灰褐色。元テクスチャは明度だけ借りる（髭・陰影を残す）。
  const skin = uniform(new Color(variant.skin));
  const bruise = uniform(new Color(variant.bruise));
  const tone = skin.mul(lum.mul(1.6).add(0.45)).mul(3.4);
  // 痣・腐敗の斑
  const blotch = smoothstep(-0.35, 0.6, bakedNoise(vec3(uv0.mul(face.mul(13).add(9)), 0.37)));
  const skinMix = mix(tone, bruise.mul(lum.add(0.4)).mul(3.4), blotch.mul(0.5));
  // 落ち窪んだ眼窩: 眼の周りを暗くする（顔のみ）
  const skinAlbedo = skinMix.mul(
    float(1).sub(
      eyeMaskNode(uv0, EYE_RADIUS * 3.2)
        .mul(0.7)
        .mul(face),
    ),
  );
  // 眼の発光（顔テクスチャ上の 2 点）。ボスのフェーズ 2 で橙へ寄る。
  const eyeColor = mix(
    vec3(EYE_COLOR.r, EYE_COLOR.g, EYE_COLOR.b),
    vec3(EMBER_COLOR.r, EMBER_COLOR.g, EMBER_COLOR.b),
    controls.ember,
  );
  const skinEmissive = eyeColor
    .mul(eyeMaskNode(uv0))
    .mul(face)
    .mul(controls.kill.eyeGlow)
    .mul(uniform(1.6 * variant.eyeGlow))
    .add(emberGlow.mul(crack).mul(0.6));

  // 布: 色を落としてから布の色を乗せる。足元ほど泥で暗くなる。
  const tint = uniform(new Color(variant.cloth));
  const desat = mix(vec3(lum), base, 0.35);
  const dirt = smoothstep(0.0, 1.1, positionWorld.y).mul(0.45).add(0.55);
  const stain = smoothstep(-0.2, 0.5, bakedNoise(vec3(uv0.mul(14), 0.37)))
    .mul(0.35)
    .add(0.65);
  const clothAlbedo = desat.mul(tint).mul(7.0).mul(dirt).mul(stain);
  const clothEmissive = emberGlow.mul(crack).mul(0.9);

  // 金属: 装備メッシュの錆は #154 の頂点カラー（エッジ・下面・雨垂れに集まる低コントラストの色）に焼き込み済みなので、
  // ノイズで混ぜ直さず（迷彩状のまだらになる）そのまま使う。亡者らしく少しだけ変種の錆色へ寄せる。
  // UV の無い元素材の小物・肩当て（頂点カラー無し）は従来どおりノイズで鉄と錆を混ぜる。
  // 錆: ノイズで鉄の暗色と赤茶の錆を混ぜる。ボスは錆の縁が熾火で光る。
  const rust = uniform(new Color(variant.rust));
  const rustMask = smoothstep(-0.25, 0.35, bakedNoise(noiseCoord(11).add(3.7)));
  const iron = vec3(0.17, 0.16, 0.15).mul(lum.mul(0.8).add(0.5));
  const rusty = rust.mul(lum.mul(0.9).add(0.35));
  const steel = uniform(variant.steel ?? 0);
  // 冷たい鋼寄せ（ボス）: 錆の茶を彩度を落として青灰へ。上向きの面には灰が薄く積もる
  const coolSteel = vec3(luminance(bakedColor))
    .mul(vec3(0.9, 1.0, 1.16))
    .mul(1.35);
  const dust = smoothstep(0.55, 1.0, normalWorld.y).mul(steel.mul(0.05));
  const bakedAlbedo = mix(mix(bakedColor, coolSteel, steel), rust.mul(0.35), 0.08)
    .mul(1.25)
    .add(vec3(0.5, 0.48, 0.45).mul(dust));
  const metalAlbedo = mix(mix(iron, rusty, rustMask), bakedAlbedo, bakedW);
  // 熾火: 鎧の継ぎ目に沿った太めの亀裂（約 4 周期/m。細かいノイズだと全面がキラキラして見える）。
  // 武器は刃（+X 側）が熾火色に焼ける（大斧の刃。ローカル +X が刃、+Y が柄の先）。
  const seamCoord = positionLocal.mul(geo.hasUv ? 14 : 5.5);
  const seamLine = float(1).sub(smoothstep(0.0, 0.032, abs(bakedNoise(seamCoord))));
  // 全面に網目が出ないよう、低周波のむらで「よく焼けた所」だけに絞る
  const seamHeat = smoothstep(0.05, 0.5, bakedNoise(seamCoord.mul(0.23).add(7.3)));
  const seam = seamLine.mul(seamHeat);
  // 刃は縁だけ強く、面は薄く（面全体を強く光らせると白ピンクに飛んで、肌色の塊に見える）
  const blade = smoothstep(0.3, 0.43, positionLocal.x)
    .mul(smoothstep(0.5, 0.64, positionLocal.y))
    .mul(0.95)
    .add(
      smoothstep(0.1, 0.3, positionLocal.x)
        .mul(smoothstep(0.45, 0.62, positionLocal.y))
        .mul(0.12),
    )
    .mul(bladeFlag);
  const metalEmissive = emberGlow.mul(seam.mul(1.1).add(blade).add(rustMask.oneMinus().mul(0.03)));

  // 素のまま（騎士）: 元のベースカラー（頂点カラーがあれば掛ける）。発光は元の emissive だけ
  const plainAlbedo = geo.hasColor ? base.mul(bakedColor.sub(1).mul(vertexColorW).add(1)) : base;
  const plainEmissive = uniform(role === 'plain' ? src.emissive.clone() : new Color(0)).mul(
    uniform(role === 'plain' ? src.emissiveIntensity : 0),
  );

  let albedo: Node<'vec3'> = skinAlbedo
    .mul(wSkin)
    .add(clothAlbedo.mul(wCloth))
    .add(metalAlbedo.mul(wMetal))
    .add(plainAlbedo.mul(wPlain));
  let emissive: Node<'vec3'> = skinEmissive
    .mul(wSkin)
    .add(clothEmissive.mul(wCloth))
    .add(metalEmissive.mul(wMetal))
    .add(plainEmissive.mul(wPlain));

  // 撃破（#281）: 命中点から全身へ「燃え尽きた」灰色が広がり、熾火色のひびが走る。広がりの先端ほどひびが明るい
  const kill = controls.kill;
  const reach = kill.burnout.mul(BURNOUT_REACH);
  const fromHit = positionWorld.sub(kill.point).length();
  const burnt = float(1)
    .sub(smoothstep(reach.sub(0.35), reach, fromHit))
    .mul(kill.burnout.greaterThan(0).select(1, 0));
  const front = float(1)
    .sub(smoothstep(0, 0.6, reach.sub(fromHit)))
    .mul(burnt);
  const burnCrack = float(1).sub(smoothstep(0.0, 0.06, abs(bakedNoise(noiseCoord(12).add(5.1)))));
  albedo = mix(
    albedo,
    vec3(BURNT_COLOR.r, BURNT_COLOR.g, BURNT_COLOR.b).mul(lum.mul(0.8).add(0.6)),
    burnt.mul(0.85),
  );
  emissive = emissive.mul(float(1).sub(burnt.mul(0.8))).add(
    vec3(EMBER_COLOR.r, EMBER_COLOR.g, EMBER_COLOR.b)
      .mul(burnCrack.max(crack))
      .mul(burnt.mul(1.4).add(front.mul(2.6))),
  );
  // 撃破の閃光: 輪郭（フレネル）を白〜橙に強く光らせ、面全体もわずかに明るくする
  const flashN = normalize(normalWorld);
  const flashV = normalize(cameraPosition.sub(positionWorld));
  const flashRim = pow(float(1).sub(saturate(dot(flashN, flashV))), 1.6);
  emissive = emissive.add(
    mix(
      vec3(EMBER_COLOR.r, EMBER_COLOR.g, EMBER_COLOR.b).mul(1.3),
      vec3(KILL_FLASH_CORE.r, KILL_FLASH_CORE.g, KILL_FLASH_CORE.b).mul(3.2),
      flashRim,
    )
      .mul(flashRim.mul(1.6).add(0.12))
      .mul(kill.flash),
  );

  // ディゾルブ: ワールド座標のノイズがしきい値を下回った所から消える。縁は熾火色に光り、焦げた灰色になる。
  const n = saturate(bakedNoise(positionWorld.mul(4.2)).mul(0.9).add(0.5));
  const threshold = mix(float(-DISSOLVE_EDGE - 0.01), float(1.01), controls.dissolve);
  const edge = float(1).sub(smoothstep(threshold, threshold.add(DISSOLVE_EDGE), n));
  const charred = edge.mul(edge);
  albedo = mix(albedo, vec3(ASH_COLOR.r, ASH_COLOR.g, ASH_COLOR.b), charred.mul(0.9));
  emissive = emissive.add(
    vec3(EMBER_COLOR.r, EMBER_COLOR.g, EMBER_COLOR.b)
      .mul(smoothstep(0.35, 1.0, edge))
      .mul(controls.dissolve.greaterThan(0).select(3.2, 0)),
  );

  // 武器・盾のテレグラフの発光（それ以外のメッシュでは 0 倍）。ディゾルブで消える所は灰色に合わせて弱まる
  emissive = emissive.add(
    weaponTelegraphNode(controls.rim, geo.hasEdge ? attribute('_edge', 'vec2').x : undefined)
      .mul(float(1).sub(charred))
      .mul(weaponFlag),
  );

  // uber の例外: glTF の法線マップ・粗さ/金属度マップを引き継ぐ。UV のあるメッシュは、無ければダミーを渡して同じシェーダにする。
  // 肌・金属は元の粗さ/金属度を使わない（定数）ので白のダミー
  const useMaps = role === 'cloth' || role === 'plain';
  const roughness =
    role === 'skin' ? 0.88 : role === 'cloth' ? 1 : role === 'metal' ? 0.72 : src.roughness;
  const metalness = role === 'skin' ? 0 : role === 'metal' ? 0.45 : src.metalness;
  const material = createUberMaterial(
    {
      shading: 'lit',
      doubleSided: role === 'plain' && src.side === DoubleSide,
      group: 'undead',
      surfaceId: 'character',
      surface: () => ({
        // NaN / Inf・極端な値を出さない（ブルームのぼかしで画面へ広がる。#258）。通常の値（縁の熾火は最大 3.2 × 熾火色）は変わらない
        color: finiteColor(albedo, 8),
        emissive: finiteColor(emissive, EMISSIVE_MAX),
        // 完全に消えた画素を捨てる（ブレンド無し、半透明パスにならない）
        opacity: n.greaterThan(threshold).select(float(1), float(0)),
        // テレグラフ中は刃を少し太らせる（追加の描画なし。頂点位置のオフセットだけ）
        position: positionLocal.add(
          normalLocal.mul(controls.rim.weapon.mul(TELEGRAPH.inflate).mul(weaponFlag)),
        ),
      }),
    },
    {
      roughness,
      metalness,
      ...(geo.hasUv && {
        normalMap: src.normalMap ?? flatNormalTexture(),
        ...(src.normalMap && { normalScale: src.normalScale }),
        roughnessMap: (useMaps ? src.roughnessMap : null) ?? whiteTexture(),
        metalnessMap: (useMaps ? src.metalnessMap : null) ?? whiteTexture(),
      }),
    },
  );
  material.name = `Character_${role}_${src.name}`;
  material.alphaTest = 0.5;
  return material;
}

function eyeMaskNode(uvNode: Node<'vec2'>, radius = EYE_RADIUS) {
  let mask: Node<'float'> = float(0);
  for (const [u, v] of EYE_UVS) {
    const d = uvNode.sub(vec2(u, v)).length();
    mask = mask.add(float(1).sub(smoothstep(radius * 0.35, radius, d)));
  }
  return saturate(mask);
}
