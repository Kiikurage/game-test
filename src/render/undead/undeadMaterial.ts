import {
  Color,
  MeshStandardNodeMaterial,
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
  float,
  luminance,
  mix,
  normalLocal,
  normalWorld,
  positionLocal,
  positionWorld,
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
  RIM,
  characterLightNode,
  createRimControls,
  isShieldObject,
  isWeaponObject,
  type RimControls,
  type WeaponTelegraphStyle,
} from '../characterLight';
import { OUTFIT_MESHES, clampProgress, type UndeadVariant } from './variants';
import { bakedNoise } from '../bakedNoise';
import { tagMaterial } from '../materialGroups';

/** 材質の役割。同じ元マテリアル（MI_Ranger）でもメッシュ名で金属パーツを分ける。 */
export type UndeadRole = 'skin' | 'cloth' | 'metal';

/** 眼の発光色（青白）と熾火色（ボスのフェーズ 2 / ディゾルブの縁）。 */
const EYE_COLOR = new Color(0x9fd8ff);
const EMBER_COLOR = new Color(0xff5a14);
const ASH_COLOR = new Color(0x15110f);

/** 顔テクスチャ（Head_Skin の MI_Head）上の両眼の UV 座標。 */
const EYE_UVS = [
  [0.139, 0.252],
  [0.231, 0.252],
] as const;
const EYE_RADIUS = 0.0125;
/** ディゾルブの縁の幅（ノイズ値の範囲）。 */
const DISSOLVE_EDGE = 0.1;

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
  readonly rim: RimControls;
  readonly dissolve: UniformNode<'float', number>;
  readonly ember: UniformNode<'float', number>;
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
  const controls: Controls = { dissolve: uniform(0), ember: uniform(0), rim: createRimControls() };
  // 盾の予兆の発光は武器と別のユニフォーム（盾打ちで光るのは盾だけ）
  const shieldControls: Controls = { ...controls, rim: createRimControls() };
  const created: Material[] = [];
  const cache = new Map<string, Material>();

  root.traverse((obj) => {
    if (!(obj as { isMesh?: boolean }).isMesh) return;
    const mesh = obj as Mesh;
    const role = roleOf(mesh);
    const weapon = isWeaponObject(mesh);
    const shield = options.shieldGlow === true && isShieldObject(mesh);
    const hasEdge = mesh.geometry.hasAttribute('_edge');
    const sources = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const converted = sources.map((src) => {
      const baked = hasBakedColor(mesh, src as MeshStandardMaterial);
      const key = `${src.uuid}:${role}:${weapon}:${baked}:${shield}:${hasEdge}`;
      let m = cache.get(key);
      if (!m) {
        m = createUndeadMaterial(
          src as MeshStandardMaterial,
          role,
          variant,
          shield ? shieldControls : controls,
          weapon,
          baked,
          { shield, hasEdge },
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
    rim: RimControls,
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

function createUndeadMaterial(
  src: MeshStandardMaterial,
  role: UndeadRole,
  variant: UndeadVariant,
  controls: Controls,
  isWeapon: boolean,
  baked: boolean,
  glow: { readonly shield: boolean; readonly hasEdge: boolean },
): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial();
  material.name = `Undead_${role}_${src.name}`;
  if (src.normalMap) {
    material.normalMap = src.normalMap;
    material.normalScale.copy(src.normalScale);
  }

  const srcColor = vec3(src.color.r, src.color.g, src.color.b);
  const base = src.map ? texture(src.map).rgb.mul(srcColor) : srcColor;
  const lum = luminance(base);
  // 小物（UV 無し）はローカル座標でノイズを引く
  const noiseCoord = (k: number): Node<'vec3'> =>
    src.map ? vec3(uv().mul(k), 0.37) : positionLocal.mul(k * 1.2);
  const uv0 = uv();

  let albedo: Node<'vec3'>;
  let emissive: Node<'vec3'>;
  // 熾火の亀裂: ノイズの等値線（谷）が光る。フェーズ 2 で ember を上げると現れる。
  const crack = float(1).sub(smoothstep(0.0, 0.035, abs(bakedNoise(noiseCoord(30)))));
  const emberGlow = vec3(EMBER_COLOR.r, EMBER_COLOR.g, EMBER_COLOR.b).mul(controls.ember);

  if (role === 'skin') {
    const skin = new Color(variant.skin);
    const bruise = new Color(variant.bruise);
    // 暗い灰褐色。元テクスチャは明度だけ借りる（髭・陰影を残す）。
    const tone = vec3(skin.r, skin.g, skin.b).mul(lum.mul(1.6).add(0.45)).mul(3.4);
    // 痣・腐敗の斑
    const isFace = src.name === 'MI_Head';
    const blotch = smoothstep(-0.35, 0.6, bakedNoise(vec3(uv0.mul(isFace ? 22 : 9), 0.37)));
    albedo = mix(
      tone,
      vec3(bruise.r, bruise.g, bruise.b).mul(lum.add(0.4)).mul(3.4),
      blotch.mul(0.5),
    );
    // 落ち窪んだ眼窩: 眼の周りを暗くする
    if (isFace) albedo = albedo.mul(float(1).sub(eyeMaskNode(uv0, EYE_RADIUS * 3.2).mul(0.7)));
    material.roughness = 0.88;
    material.metalness = 0;
    // 眼の発光（顔テクスチャ上の 2 点）。ボスのフェーズ 2 で橙へ寄る。
    const eyeMask = eyeMaskNode(uv0);
    const eyeColor = mix(
      vec3(EYE_COLOR.r, EYE_COLOR.g, EYE_COLOR.b),
      vec3(EMBER_COLOR.r, EMBER_COLOR.g, EMBER_COLOR.b),
      controls.ember,
    );
    const faceOnly = isFace ? float(1) : float(0);
    emissive = eyeColor
      .mul(eyeMask)
      .mul(faceOnly)
      .mul(1.6 * variant.eyeGlow);
    emissive = emissive.add(emberGlow.mul(crack).mul(0.6));
  } else if (role === 'cloth') {
    const tint = new Color(variant.cloth);
    // 色を落としてから布の色を乗せる。足元ほど泥で暗くなる。
    const desat = mix(vec3(lum), base, 0.35);
    const dirt = smoothstep(0.0, 1.1, positionWorld.y).mul(0.45).add(0.55);
    const stain = smoothstep(-0.2, 0.5, bakedNoise(vec3(uv0.mul(14), 0.37)))
      .mul(0.35)
      .add(0.65);
    albedo = desat
      .mul(vec3(tint.r, tint.g, tint.b))
      .mul(7.0)
      .mul(dirt)
      .mul(stain);
    material.metalness = src.metalness;
    material.roughness = 1;
    if (src.metalnessMap) material.metalnessMap = src.metalnessMap;
    if (src.roughnessMap) material.roughnessMap = src.roughnessMap;
    emissive = emberGlow.mul(crack).mul(0.9);
  } else {
    const rust = new Color(variant.rust);
    // 装備メッシュ: 錆は #154 の頂点カラー（エッジ・下面・雨垂れに集まる低コントラストの色）に焼き込み済みなので、
    // ノイズで混ぜ直さず（迷彩状のまだらになる）そのまま使う。亡者らしく少しだけ変種の錆色へ寄せる。
    // UV の無い元素材の小物・肩当て（頂点カラー無し）は従来どおりノイズで鉄と錆を混ぜる。
    // 錆: ノイズで鉄の暗色と赤茶の錆を混ぜる。ボスは錆の縁が熾火で光る。
    const rustMask = smoothstep(-0.25, 0.35, bakedNoise(noiseCoord(11).add(3.7)));
    const iron = vec3(0.17, 0.16, 0.15).mul(lum.mul(0.8).add(0.5));
    const rusty = vec3(rust.r, rust.g, rust.b).mul(lum.mul(0.9).add(0.35));
    const steel = variant.steel ?? 0;
    const bakedColor = vertexColor().rgb;
    // 冷たい鋼寄せ（ボス）: 錆の茶を彩度を落として青灰へ。上向きの面には灰が薄く積もる
    const coolSteel = vec3(luminance(bakedColor))
      .mul(vec3(0.9, 1.0, 1.16))
      .mul(1.35);
    const dust = smoothstep(0.55, 1.0, normalWorld.y).mul(0.05 * steel);
    albedo = baked
      ? mix(mix(bakedColor, coolSteel, steel), vec3(rust.r, rust.g, rust.b).mul(0.35), 0.08)
          .mul(1.25)
          .add(vec3(0.5, 0.48, 0.45).mul(dust))
      : mix(iron, rusty, rustMask);
    material.metalness = 0.45;
    material.roughness = 0.72;
    // 熾火: 鎧の継ぎ目に沿った太めの亀裂（約 4 周期/m。細かいノイズだと全面がキラキラして見える）。
    // 武器は刃（+X 側）が熾火色に焼ける（大斧の刃。ローカル +X が刃、+Y が柄の先）。
    const seamCoord = positionLocal.mul(src.map ? 14 : 5.5);
    const seamLine = float(1).sub(smoothstep(0.0, 0.032, abs(bakedNoise(seamCoord))));
    // 全面に網目が出ないよう、低周波のむらで「よく焼けた所」だけに絞る
    const seamHeat = smoothstep(0.05, 0.5, bakedNoise(seamCoord.mul(0.23).add(7.3)));
    const seam = seamLine.mul(seamHeat);
    // 刃は縁だけ強く、面は薄く（面全体を強く光らせると白ピンクに飛んで、肌色の塊に見える）
    const blade = isWeapon
      ? smoothstep(0.3, 0.43, positionLocal.x)
          .mul(smoothstep(0.5, 0.64, positionLocal.y))
          .mul(0.95)
          .add(
            smoothstep(0.1, 0.3, positionLocal.x)
              .mul(smoothstep(0.45, 0.62, positionLocal.y))
              .mul(0.12),
          )
      : float(0);
    emissive = emberGlow.mul(seam.mul(1.1).add(blade).add(rustMask.oneMinus().mul(0.03)));
  }

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

  // 逆光・影でも輪郭が読めるリムライトと暗部の持ち上げ（#144）。ディゾルブで消える所は灰色に合わせて弱まる
  emissive = emissive.add(
    characterLightNode(
      albedo,
      controls.rim,
      isWeapon || glow.shield,
      glow.hasEdge ? attribute('_edge', 'vec2').x : undefined,
    ).mul(float(1).sub(charred)),
  );

  material.colorNode = albedo;
  material.emissiveNode = emissive;
  // テレグラフ中は刃を少し太らせる（追加の描画なし。頂点位置のオフセットだけ）
  if (isWeapon || glow.shield) {
    material.positionNode = positionLocal.add(
      normalLocal.mul(controls.rim.weapon.mul(RIM.telegraphInflate)),
    );
  }
  // 完全に消えた画素を捨てる（ブレンド無し、半透明パスにならない）
  material.opacityNode = n.greaterThan(threshold).select(float(1), float(0));
  material.alphaTest = 0.5;
  return tagMaterial(material, 'undead');
}

function eyeMaskNode(uvNode: ReturnType<typeof uv>, radius = EYE_RADIUS) {
  let mask: Node<'float'> = float(0);
  for (const [u, v] of EYE_UVS) {
    const d = uvNode.sub(vec2(u, v)).length();
    mask = mask.add(float(1).sub(smoothstep(radius * 0.35, radius, d)));
  }
  return saturate(mask);
}
