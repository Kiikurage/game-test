import {
  DoubleSide,
  FrontSide,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
} from 'three/webgpu';
import type { Node } from 'three/webgpu';
import {
  cos,
  float,
  hash,
  instanceIndex,
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
import { bakedNoise, getMaterialDetail } from './bakedNoise';
import { tagMaterial, type MaterialGroup } from './materialGroups';

/**
 * ウーバーマテリアル（tech-direction §3.4、#325）。
 *
 * すべての不透明マテリアルを 1 つの TSL グラフの組み合わせで作る土台。
 * - **機能フラグ**（{@link UberFlags}）はコンパイル時に解決する: 立っていない機能のノードはグラフに入らない。
 *   シェーダの種類（= パイプライン数）はフラグの組み合わせの数で決まる。
 * - **パラメータ**（{@link UberParams}）は uniform で持つ: 値が違ってもシェーダのコードは同じなので、
 *   three はプログラムとパイプラインを共有する（レンダーステート（`side` など）が同じ場合）。
 *   「錆びた鉄」と「石・木」は以前は別シェーダだったが、いまは `detail` の量が違うだけの同じシェーダ。
 * - 系統固有の模様（地面の敷石・道など）は `surface` で色・法線のノードを差し込む。差し込んだ系統は
 *   その系統だけのシェーダになるので、汎用の機能（detail・wind など）に寄せられるものは寄せる。
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
  /** 系統固有の色（RGB の係数。頂点カラーに掛かる）と法線。 */
  surface?: () => UberSurface;
  /** `?flatmat` の切り分け用グループ（`materialGroups`）。 */
  group?: MaterialGroup;
}

export interface UberSurface {
  /** RGB の係数（vec3）。`detail` と併用したら掛け合わせる。 */
  color?: Node<'vec3'>;
  normal?: Node;
}

export interface UberParams {
  roughness?: number;
  metalness?: number;
  /** `detail` のむらの強さ（0 でむらなし = 係数 1。1 で従来の石・木と同じ）。 */
  detail?: number;
  /** `unlit` の明るさ（HDR の倍率）。 */
  intensity?: number;
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
    flags.surface ? 'surface' : '',
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
  const phase = hash(instanceIndex).mul(6.28);
  const amp = h.mul(h).mul(3.5);
  const sway = sin(time.mul(1.4).add(phase)).mul(0.045).mul(amp);
  const sway2 = cos(time.mul(1.1).add(phase.mul(1.7)))
    .mul(0.03)
    .mul(amp);
  return vec3(sway, 0, sway2);
}

export function createUberMaterial(flags: UberFlags, params: UberParams = {}): UberMaterial {
  const side = flags.doubleSided ? DoubleSide : FrontSide;
  const vertexColors = flags.vertexColors ?? false;
  const surface = flags.surface?.();

  let rgb: Node<'vec3'> | null = surface?.color ?? null;
  if (flags.detail) {
    const d = detailFactor(uniform(params.detail ?? 1));
    rgb = rgb ? rgb.mul(d) : vec3(d);
  }

  let material: UberMaterial;
  if (flags.shading === 'unlit') {
    material = new MeshBasicNodeMaterial({ vertexColors, side });
    const intensity = uniform(params.intensity ?? 1);
    const base = rgb ? rgb.mul(intensity) : vec3(intensity);
    material.colorNode = vec4(base, 1);
  } else {
    const std = new MeshStandardNodeMaterial({
      vertexColors,
      side,
      roughness: params.roughness ?? 1,
      metalness: params.metalness ?? 0,
    });
    if (rgb) std.colorNode = vec4(rgb, 1);
    if (surface?.normal) std.normalNode = surface.normal;
    material = std;
  }
  if (flags.wind) material.positionNode = positionLocal.add(windOffset());
  material.userData.uberVariant = uberVariantKey(flags);
  return flags.group ? tagMaterial(material, flags.group) : material;
}
