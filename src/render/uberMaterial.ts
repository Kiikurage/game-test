import {
  AdditiveBlending,
  DoubleSide,
  FrontSide,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
} from 'three/webgpu';
import type { ColorRepresentation, Node, Texture, Vector2 } from 'three/webgpu';
import {
  cos,
  float,
  instanceIndex,
  materialColor,
  mix,
  positionGeometry,
  positionLocal,
  positionWorld,
  sin,
  time,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import { bakedHash, bakedNoise, getMaterialDetail } from './bakedNoise';
import { tagMaterial, type MaterialGroup } from './materialGroups';

/**
 * ウーバーマテリアル（tech-direction §3.4、#325・#326）。
 *
 * メッシュのマテリアルはすべてここで作る（`new Mesh*NodeMaterial` を各所で書かない）。
 * - **機能フラグ**（{@link UberFlags}）はコンパイル時に解決する: 立っていない機能のノードはグラフに入らない。
 *   シェーダの種類（= パイプライン数）はフラグの組み合わせの数で決まる。
 * - **パラメータ**（{@link UberParams}）は uniform（またはマテリアルの uniform プロパティ）で持つ: 値が違っても
 *   シェーダのコードは同じなので、three はプログラムとパイプラインを共有する（レンダーステートが同じ場合）。
 *   「錆びた鉄」と「石・木」、色だけ違う単色の小物は、それぞれ同じシェーダ。
 * - 系統固有の模様（地面の敷石・石積み・霧など）は `surface` で色・法線・不透明度などのノードを差し込む。
 *   差し込んだ系統はその系統だけのシェーダになるので、汎用の機能（detail・wind・color）に寄せられるものは寄せる。
 * - ノイズは焼いたテクスチャ（`bakedNoise` / `bakedHash` / `bakedCellEdge`。#326）だけを使う。
 */
export interface UberFlags {
  /** `lit`: PBR（MeshStandardNodeMaterial）。`unlit`: 発光・HDR（MeshBasicNodeMaterial。ブルームに乗る）。 */
  shading: 'lit' | 'unlit';
  /** 頂点カラーを掛ける（環境・地形のメッシュは素材色を頂点カラーで持つ）。 */
  vertexColors?: boolean;
  /** ワールド座標の焼きノイズで明暗のむらを足す（量は `UberParams.detail`。品質 detail で周波数の数が変わる）。 */
  detail?: boolean;
  /** 風の揺れ（インスタンスごとの位相。ジオメトリ空間の高さ y の 2 乗で揺れ幅が増える。草など）。 */
  wind?: boolean;
  /** 両面描画。 */
  doubleSided?: boolean;
  /** 半透明（不透明度は `surface.opacity` か `UberParams.opacity`）。深度は書かない（`depthWrite` で上書き）。 */
  transparent?: boolean;
  /** 加算合成（半透明を含む）。 */
  additive?: boolean;
  /** 半透明でも深度を書く（既定は `!transparent`）。 */
  depthWrite?: boolean;
  /** シーンの霧を掛けない（空・遠景・霧の門など、自前で距離の減衰を持つもの）。 */
  noFog?: boolean;
  /** 面ごとの法線（ローポリの塊）。 */
  flatShading?: boolean;
  /** 系統固有のノード（色の係数・法線・不透明度・発光・頂点位置）。 */
  surface?: () => UberSurface;
  /**
   * `surface` の系統名（バリアントキー・パイプラインの集計用）。同じ系統はシェーダコードが一致するように、
   * 材質ごとの差はノードの定数ではなくユニフォーム・テクスチャ（パラメータ）で持たせる（#326）。
   */
  surfaceId?: string;
  /** `?flatmat` の切り分け用グループ（`materialGroups`）。 */
  group?: MaterialGroup;
}

export interface UberSurface {
  /** RGB の係数（vec3）。`detail` と併用したら掛け合わせる。`UberParams.color` を渡したらそれにも掛かる。 */
  color?: Node<'vec3'>;
  normal?: Node;
  /** 不透明度（`transparent` と併用）。 */
  opacity?: Node<'float'>;
  /** 発光（lit のみ。HDR）。 */
  emissive?: Node<'vec3'>;
  /** 粗さ（lit のみ）。 */
  roughness?: Node<'float'>;
  /** 頂点位置（ローカル）。`wind` はこれに揺れを足す。 */
  position?: Node<'vec3'>;
}

export interface UberParams {
  roughness?: number;
  metalness?: number;
  /** `detail` のむらの強さ（0 でむらなし = 係数 1。1 で従来の石・木と同じ）。 */
  detail?: number;
  /** `unlit` の明るさ（HDR の倍率）。 */
  intensity?: number;
  /** 基本色（マテリアルの uniform。既定は白）。 */
  color?: ColorRepresentation;
  /** 不透明度（`transparent` と併用）。 */
  opacity?: number;
  /** 発光色（lit のみ。マテリアルの uniform）。 */
  emissive?: ColorRepresentation;
  /**
   * 法線マップ・粗さ/金属度マップ（lit のみ。three 標準の読み方: 法線は `normalScale`、粗さは `.g`、金属度は `.b` を係数に掛ける）。
   * マップの有無でシェーダが変わるので、使う系統は常に渡す（無いときは白 / 平らな法線のダミーを渡して同じシェーダにする）。
   */
  normalMap?: Texture;
  normalScale?: Vector2;
  roughnessMap?: Texture;
  metalnessMap?: Texture;
}

export type UberMaterial = MeshStandardNodeMaterial | MeshBasicNodeMaterial;

/** フラグの組み合わせを表す文字列（ログ・テスト用。`surface` は有無だけ）。 */
export function uberVariantKey(flags: UberFlags): string {
  return [
    flags.shading,
    flags.vertexColors ? 'vc' : '',
    flags.detail ? 'detail' : '',
    flags.wind ? 'wind' : '',
    flags.doubleSided ? 'ds' : '',
    flags.additive ? 'add' : flags.transparent ? 'blend' : '',
    flags.noFog ? 'nofog' : '',
    flags.flatShading ? 'flat' : '',
    flags.surface ? (flags.surfaceId ? `surface:${flags.surfaceId}` : 'surface') : '',
  ]
    .filter((s) => s !== '')
    .join('+');
}

/** 石・木・土のむら（係数。中心 ~0.86）。`amount` 0 で 1。 */
function detailFactor(amount: Node<'float'>): Node<'float'> {
  const p = positionWorld;
  const coarse = bakedNoise(p.mul(2.3));
  const fine = getMaterialDetail() >= 1 ? bakedNoise(p.mul(9.1)) : float(0);
  const factor = float(0.86).add(coarse.mul(0.2)).add(fine.mul(0.12));
  return mix(float(1), factor, amount);
}

function windOffset(): Node<'vec3'> {
  // 高さは房のジオメトリ空間（根元 0）で測る。`positionLocal` は InstancedMesh ではインスタンス行列を
  // 掛けた後（= ワールド高さ）なので、それで揺れ幅を決めると高所の房ほど何 m も伸びる（#266）
  const h = positionGeometry.y;
  const phase = bakedHash(instanceIndex).mul(6.28);
  const amp = h.mul(h).mul(3.5);
  const sway = sin(time.mul(1.4).add(phase)).mul(0.045).mul(amp);
  const sway2 = cos(time.mul(1.1).add(phase.mul(1.7)))
    .mul(0.03)
    .mul(amp);
  return vec3(sway, 0, sway2);
}

export function createUberMaterial(
  flags: UberFlags & { shading: 'unlit' },
  params?: UberParams,
): MeshBasicNodeMaterial;
export function createUberMaterial(
  flags: UberFlags & { shading: 'lit' },
  params?: UberParams,
): MeshStandardNodeMaterial;
export function createUberMaterial(flags: UberFlags, params?: UberParams): UberMaterial;
export function createUberMaterial(flags: UberFlags, params: UberParams = {}): UberMaterial {
  const side = flags.doubleSided ? DoubleSide : FrontSide;
  const vertexColors = flags.vertexColors ?? false;
  const transparent = (flags.transparent ?? false) || (flags.additive ?? false);
  const surface = flags.surface?.();

  let rgb: Node<'vec3'> | null = surface?.color ?? null;
  if (flags.detail) {
    const d = detailFactor(uniform(params.detail ?? 1));
    rgb = rgb ? rgb.mul(d) : vec3(d);
  }
  // 係数のノードを使うときも基本色（uniform）を掛ける（単色 + 模様の系統）
  if (rgb && params.color !== undefined) rgb = rgb.mul(materialColor);

  const common = {
    vertexColors,
    side,
    transparent,
    depthWrite: flags.depthWrite ?? !transparent,
    fog: !(flags.noFog ?? false),
    ...(flags.additive && { blending: AdditiveBlending }),
    ...(params.color !== undefined && { color: params.color }),
    ...(params.opacity !== undefined && { opacity: params.opacity }),
  };

  let material: UberMaterial;
  if (flags.shading === 'unlit') {
    material = new MeshBasicNodeMaterial(common);
    if (params.intensity !== undefined || rgb) {
      const intensity = uniform(params.intensity ?? 1);
      const base = rgb ? rgb.mul(intensity) : materialColor.mul(intensity);
      material.colorNode = vec4(base, 1);
    }
  } else {
    const std = new MeshStandardNodeMaterial({
      ...common,
      roughness: params.roughness ?? 1,
      metalness: params.metalness ?? 0,
      flatShading: flags.flatShading ?? false,
      ...(params.emissive !== undefined && { emissive: params.emissive }),
    });
    if (params.normalMap) {
      std.normalMap = params.normalMap;
      if (params.normalScale) std.normalScale.copy(params.normalScale);
    }
    if (params.roughnessMap) std.roughnessMap = params.roughnessMap;
    if (params.metalnessMap) std.metalnessMap = params.metalnessMap;
    if (rgb) std.colorNode = vec4(rgb, 1);
    if (surface?.normal) std.normalNode = surface.normal;
    if (surface?.emissive) std.emissiveNode = surface.emissive;
    if (surface?.roughness) std.roughnessNode = surface.roughness;
    material = std;
  }
  if (surface?.opacity) material.opacityNode = surface.opacity;
  // 半透明の両面は、three の既定だと裏面 → 表面の 2 パスで描き、パイプラインも 2 本になる。
  // 霧・炎・蜘蛛の巣・予告など薄い板ばかりなので 1 パスで描く（#326）
  if (transparent && flags.doubleSided) material.forceSinglePass = true;
  const position = surface?.position ?? null;
  if (flags.wind) material.positionNode = (position ?? positionLocal).add(windOffset());
  else if (position) material.positionNode = position;
  material.userData.uberVariant = uberVariantKey(flags);
  return flags.group ? tagMaterial(material, flags.group) : material;
}
