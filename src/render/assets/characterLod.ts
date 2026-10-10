import {
  type BufferAttribute,
  type Bone,
  BufferGeometry,
  Float32BufferAttribute,
  Matrix3,
  Matrix4,
  Skeleton,
  type Material,
  type Mesh,
  type Object3D,
  SkinnedMesh,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Vector3,
} from 'three/webgpu';
import { SHADOW_PROXY_LAYER } from '../layers';
import { loadIndexSimplifier, type IndexSimplifier } from '../corpses/simplify';

/**
 * キャラクターの簡略メッシュ（LOD）。
 *
 * スキンメッシュのパーツ（体・衣装。約 21k 三角形・10 ドローコール前後）を、
 * meshoptimizer で間引いて 1 つの `SkinnedMesh`（約 2〜3k 三角形・1 ドローコール）に結合する。
 * 頂点・スケルトンは元のものと同じなので、アニメーションはそのまま効く。用途は 2 つ:
 *
 * - **遠景**: 離れた敵は詳細メッシュの代わりにこれを描く（頂点色で色を焼く）。
 * - **影**: 詳細メッシュは影を落とさず、これだけが影のレイヤー（`SHADOW_PROXY_LAYER`）で影を落とす。
 *   影のドローコールとポリゴン数を大きく減らせる。
 */

/** 簡略化したパーツ 1 つ分の頂点データ（親ノード空間。元メッシュのローカル行列は焼き込み済み）。 */
export interface SimplifiedPart {
  readonly count: number;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly skinIndex: Uint16Array;
  readonly skinWeight: Float32Array;
  readonly indices: Uint32Array;
  /** 元ジオメトリの頂点カラー（RGB。装備メッシュの焼き込み色）。無ければ空。 */
  readonly colors: Float32Array;
}

/** パーツごとの頂点色を `colors`（RGB、頂点 `offset` から `part.count` 個）へ書く関数。 */
export type PartColorizer = (
  mesh: Mesh,
  part: SimplifiedPart,
  colors: Float32Array,
  offset: number,
  /** 結合後の全頂点の高さ（バインドポーズの root ローカル Y、m）。 */
  heights: Float32Array,
) => void;

export interface LodBuildOptions {
  /** 指定すると頂点色（`color` 属性）を焼く。 */
  readonly colorize?: PartColorizer;
  /** 結合に含める条件（既定: `mesh.visible`）。 */
  readonly include?: (mesh: SkinnedMesh) => boolean;
}

export interface LodSettings {
  /** 元の三角形数に対する残す割合（0..1）。 */
  readonly ratio: number;
  /** パーツごとの下限三角形数。 */
  readonly minTriangles: number;
}

export const DEFAULT_LOD_SETTINGS: LodSettings = { ratio: 0.09, minTriangles: 60 };

function attr(geometry: BufferGeometry, name: string): BufferAttribute | undefined {
  return geometry.getAttribute(name) as BufferAttribute | undefined;
}

/** パーツを間引いて、使う頂点だけに詰め直す。形が作れないメッシュ（インデックス無し等）は null。 */
export function simplifyPart(
  mesh: SkinnedMesh,
  settings: LodSettings,
  simplifier: IndexSimplifier,
): SimplifiedPart | null {
  const geometry = mesh.geometry;
  const position = attr(geometry, 'position');
  const normal = attr(geometry, 'normal');
  const skinIndex = attr(geometry, 'skinIndex');
  const skinWeight = attr(geometry, 'skinWeight');
  const uv = attr(geometry, 'uv');
  const index = geometry.getIndex();
  if (!position || !normal || !skinIndex || !skinWeight || !index) return null;

  const n = position.count;
  // スキニングは bindMatrix 空間で行われるので、頂点を bindMatrix で変換して持つ（元メッシュの親子関係に依存しない）
  const local = mesh.bindMatrix;
  const normalMatrix = new Matrix3().getNormalMatrix(local);
  const v = new Vector3();
  const positions = new Float32Array(n * 3);
  const attributes = new Float32Array(n * 7);
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(position, i).applyMatrix4(local);
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
    v.fromBufferAttribute(normal, i).applyMatrix3(normalMatrix).normalize();
    attributes[i * 7] = v.x;
    attributes[i * 7 + 1] = v.y;
    attributes[i * 7 + 2] = v.z;
    attributes[i * 7 + 3] = skinWeight.getX(i);
    attributes[i * 7 + 4] = skinWeight.getY(i);
    attributes[i * 7 + 5] = skinWeight.getZ(i);
    attributes[i * 7 + 6] = skinWeight.getW(i);
  }

  const full = new Uint32Array(index.count);
  for (let i = 0; i < full.length; i++) full[i] = index.getX(i);
  const targetTriangles = Math.max(
    settings.minTriangles,
    Math.floor((full.length / 3) * settings.ratio),
  );
  const target = Math.min(full.length, targetTriangles * 3);
  // 法線とスキンウェイトを属性として渡し、関節の曲がりと陰影が崩れにくい頂点を残す
  const [simplified] = simplifier.simplifyWithAttributes(
    full,
    positions,
    3,
    attributes,
    7,
    [0.4, 0.4, 0.4, 1, 1, 1, 1],
    null,
    target,
    0.8,
    ['Permissive', 'Prune'],
  );

  const remap = new Int32Array(n).fill(-1);
  let count = 0;
  const indices = new Uint32Array(simplified.length);
  for (let i = 0; i < simplified.length; i++) {
    const old = simplified[i] ?? 0;
    let next = remap[old] ?? -1;
    if (next < 0) {
      next = count++;
      remap[old] = next;
    }
    indices[i] = next;
  }
  const out: SimplifiedPart = {
    count,
    positions: new Float32Array(count * 3),
    normals: new Float32Array(count * 3),
    uvs: new Float32Array(count * 2),
    skinIndex: new Uint16Array(count * 4),
    skinWeight: new Float32Array(count * 4),
    indices,
    colors: new Float32Array(0),
  };
  for (let old = 0; old < n; old++) {
    const i = remap[old] ?? -1;
    if (i < 0) continue;
    out.positions.set(positions.subarray(old * 3, old * 3 + 3), i * 3);
    out.normals.set(attributes.subarray(old * 7, old * 7 + 3), i * 3);
    if (uv) out.uvs.set([uv.getX(old), uv.getY(old)], i * 2);
    out.skinIndex.set(
      [skinIndex.getX(old), skinIndex.getY(old), skinIndex.getZ(old), skinIndex.getW(old)],
      i * 4,
    );
    out.skinWeight.set(attributes.subarray(old * 7 + 3, old * 7 + 7), i * 4);
  }
  return out;
}

/** ボーンに固定された剛体メッシュ（装備）を、そのボーン 1 本に重み 1 でスキニングされる頂点データにする。位置・法線はメッシュのローカル空間のまま。 */
function rigidPart(mesh: Mesh): SimplifiedPart | null {
  const g = mesh.geometry;
  const position = attr(g, 'position');
  const normal = attr(g, 'normal');
  const uv = attr(g, 'uv');
  const color = attr(g, 'color');
  const index = g.getIndex();
  if (!position || !normal) return null;
  const count = position.count;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const colors = new Float32Array(color ? count * 3 : 0);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.getX(i);
    positions[i * 3 + 1] = position.getY(i);
    positions[i * 3 + 2] = position.getZ(i);
    normals[i * 3] = normal.getX(i);
    normals[i * 3 + 1] = normal.getY(i);
    normals[i * 3 + 2] = normal.getZ(i);
    if (color) {
      colors[i * 3] = color.getX(i);
      colors[i * 3 + 1] = color.getY(i);
      colors[i * 3 + 2] = color.getZ(i);
    }
  }
  const indices = new Uint32Array(index ? index.count : count);
  for (let i = 0; i < indices.length; i++) indices[i] = index ? index.getX(i) : i;
  const skinWeight = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) skinWeight[i * 4] = 1;
  return {
    count,
    positions,
    normals,
    uvs: new Float32Array(uv ? count * 2 : 0),
    skinIndex: new Uint16Array(count * 4),
    skinWeight,
    indices,
    colors,
  };
}

function visibleInTree(obj: Object3D, root: Object3D): boolean {
  for (let o: Object3D | null = obj; o; o = o.parent) {
    if (!o.visible) return false;
    if (o === root) break;
  }
  return true;
}

/** 詳細メッシュ（`hi`）と簡略メッシュ（`proxy`）の表示を切り替える。 */
export type LodMain = 'near' | 'far' | 'none';

export class CharacterLod {
  private readonly hidden: { mesh: Object3D; visible: boolean }[] = [];
  private main: LodMain = 'near';
  private shadow = true;
  private applied = false;

  constructor(
    private readonly hi: readonly Mesh[],
    readonly proxy: SkinnedMesh,
  ) {
    for (const mesh of hi) mesh.castShadow = false;
    proxy.castShadow = true;
    proxy.receiveShadow = false;
    proxy.frustumCulled = false;
    this.apply('near', true);
  }

  /** 簡略メッシュの三角形数。 */
  get proxyTriangles(): number {
    return (this.proxy.geometry.getIndex()?.count ?? 0) / 3;
  }

  /** 画面にも影にも描かれない状態か（アニメーション更新を省いてよい）。 */
  get isIdle(): boolean {
    return this.main === 'none' && !this.shadow;
  }

  /** main: メインパスで描くもの / shadow: シャドウパスに簡略メッシュを出すか。 */
  apply(main: LodMain, shadow: boolean): void {
    if (this.applied && main === this.main && shadow === this.shadow) return;
    const wasNear = !this.applied || this.main === 'near';
    this.main = main;
    this.shadow = shadow;
    this.applied = true;
    const nearNow = main === 'near';
    if (wasNear && !nearNow) {
      // 詳細メッシュを隠す（元の表示状態を覚えておく。フード等を隠している場合を壊さない）
      this.hidden.length = 0;
      for (const mesh of this.hi) {
        this.hidden.push({ mesh, visible: mesh.visible });
        mesh.visible = false;
      }
    } else if (!wasNear && nearNow) {
      for (const h of this.hidden) h.mesh.visible = h.visible;
      this.hidden.length = 0;
    }
    const { proxy } = this;
    if (main === 'far') {
      proxy.visible = true;
      proxy.layers.set(0);
      if (shadow) proxy.layers.enable(SHADOW_PROXY_LAYER);
    } else {
      proxy.visible = shadow;
      proxy.layers.set(SHADOW_PROXY_LAYER);
    }
  }
}

/** 簡略メッシュを作る。パーツの間引き結果は元ジオメトリごとにキャッシュする（敵の複製で共有）。 */
export class CharacterLodBuilder {
  private readonly cache = new WeakMap<BufferGeometry, SimplifiedPart | null>();

  private constructor(
    private readonly settings: LodSettings,
    private readonly simplifier: IndexSimplifier,
  ) {}

  static async create(settings: LodSettings = DEFAULT_LOD_SETTINGS): Promise<CharacterLodBuilder> {
    return new CharacterLodBuilder(settings, await loadIndexSimplifier());
  }

  private part(mesh: SkinnedMesh): SimplifiedPart | null {
    let part = this.cache.get(mesh.geometry);
    if (part === undefined) {
      part = simplifyPart(mesh, this.settings, this.simplifier);
      this.cache.set(mesh.geometry, part);
    }
    return part;
  }

  /**
   * `root` 配下のスキンメッシュを結合した簡略メッシュを作り、`root` の下（元メッシュと同じ親）へ置く。
   * 詳細メッシュ（`root` 配下の全メッシュ）は影を落とさなくなり、簡略メッシュが影を担当する。
   * 作れない場合（スキンメッシュが無い・スケルトンが一致しない）は null で、何も変更しない。
   */
  create(root: Object3D, material: Material, options: LodBuildOptions = {}): CharacterLod | null {
    const include = options.include ?? ((mesh: SkinnedMesh) => mesh.visible);
    const skinned: SkinnedMesh[] = [];
    const all: Mesh[] = [];
    root.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh !== true) return;
      all.push(obj as Mesh);
      if (
        (obj as { isSkinnedMesh?: boolean }).isSkinnedMesh === true &&
        include(obj as SkinnedMesh)
      ) {
        skinned.push(obj as SkinnedMesh);
      }
    });
    const first = skinned[0];
    if (!first) return null;
    // パーツごとにスキン（関節の並び）が違うことがあるので、関節の和集合で 1 つのスケルトンを作り、skinIndex を振り直す
    const bones: Bone[] = [];
    const boneInverses: Matrix4[] = [];
    const unified = new Map<Bone, number>();
    const remaps = new Map<SkinnedMesh, Uint16Array>();
    for (const mesh of skinned) {
      const remap = new Uint16Array(mesh.skeleton.bones.length);
      mesh.skeleton.bones.forEach((bone, i) => {
        let u = unified.get(bone);
        if (u === undefined) {
          u = bones.length;
          unified.set(bone, u);
          bones.push(bone);
          boneInverses.push(mesh.skeleton.boneInverses[i]?.clone() ?? new Matrix4());
        }
        remap[i] = u;
      });
      remaps.set(mesh, remap);
    }
    // パーツごとに頂点の量子化スケールが違い、その分が boneInverses に畳み込まれている。
    // 基準（先に現れたパーツの boneInverses）へ揃えるため、各パーツの頂点を X（基準 · X = そのパーツの boneInverse）で移す
    const xforms = new Map<SkinnedMesh, Matrix4>();
    for (const mesh of skinned) {
      const own = mesh.skeleton.boneInverses[0];
      const base = boneInverses[remaps.get(mesh)?.[0] ?? 0];
      xforms.set(mesh, base && own ? base.clone().invert().multiply(own) : new Matrix4());
    }
    const parts: {
      mesh: Mesh;
      part: SimplifiedPart;
      x: Matrix4;
      /** 剛体（装備）なら、スケルトンの関節番号。 */
      rigidBone?: number;
    }[] = [];
    for (const mesh of skinned) {
      const part = this.part(mesh);
      if (part) parts.push({ mesh, part, x: xforms.get(mesh) ?? new Matrix4() });
    }
    // 剛体の装備（胸当て・肩当て・兜・武器など）も 1 本の関節に重み 1 で結合する
    root.updateMatrixWorld(true);
    for (const mesh of all) {
      if ((mesh as { isSkinnedMesh?: boolean }).isSkinnedMesh === true) continue;
      if (!visibleInTree(mesh, root)) continue;
      let bone: Bone | null = null;
      for (let o: Object3D | null = mesh.parent; o; o = o.parent) {
        if ((o as { isBone?: boolean }).isBone === true) {
          bone = o as Bone;
          break;
        }
      }
      const u = bone ? unified.get(bone) : undefined;
      const base = u === undefined ? undefined : boneInverses[u];
      if (!bone || u === undefined || !base) continue;
      const part = rigidPart(mesh);
      if (!part) continue;
      // 結合後のスキニング: 関節のワールド · base · x · p = メッシュのワールド · p となるよう x = base⁻¹ · (関節ワールド⁻¹ · メッシュワールド)
      const x = base
        .clone()
        .invert()
        .multiply(bone.matrixWorld.clone().invert().multiply(mesh.matrixWorld));
      parts.push({ mesh, part, x, rigidBone: u });
    }
    if (parts.length === 0) return null;

    let vertices = 0;
    let indexCount = 0;
    for (const { part } of parts) {
      vertices += part.count;
      indexCount += part.indices.length;
    }
    const positions = new Float32Array(vertices * 3);
    const normals = new Float32Array(vertices * 3);
    const skinIndex = new Uint16Array(vertices * 4);
    const skinWeight = new Float32Array(vertices * 4);
    const indices = new Uint32Array(indexCount);
    const v = new Vector3();
    let vOffset = 0;
    let iOffset = 0;
    for (const { mesh, part, x, rigidBone } of parts) {
      const normalMatrix = new Matrix3().getNormalMatrix(x);
      for (let i = 0; i < part.count; i++) {
        v.fromArray(part.positions, i * 3).applyMatrix4(x);
        v.toArray(positions, (vOffset + i) * 3);
        v.fromArray(part.normals, i * 3)
          .applyMatrix3(normalMatrix)
          .normalize();
        v.toArray(normals, (vOffset + i) * 3);
      }
      const remap = rigidBone === undefined ? remaps.get(mesh as SkinnedMesh) : undefined;
      for (let i = 0; i < part.skinIndex.length; i++) {
        skinIndex[vOffset * 4 + i] =
          rigidBone !== undefined
            ? i % 4 === 0
              ? rigidBone
              : 0
            : (remap?.[part.skinIndex[i] ?? 0] ?? 0);
      }
      skinWeight.set(part.skinWeight, vOffset * 4);
      for (let i = 0; i < part.indices.length; i++)
        indices[iOffset + i] = (part.indices[i] ?? 0) + vOffset;
      vOffset += part.count;
      iOffset += part.indices.length;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    geometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndex, 4));
    geometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeight, 4));
    geometry.setIndex(new Uint32BufferAttribute(indices, 1));

    const proxy = new SkinnedMesh(geometry, material);
    proxy.name = 'lod-proxy';
    // 頂点は bindMatrix 空間へ焼き込み済みなので、root 直下に単位変換で置き、バインド行列も単位にする
    root.add(proxy);
    proxy.bind(new Skeleton(bones, boneInverses), new Matrix4());

    if (options.colorize) {
      // 色を焼く。高さ（root ローカルの Y、バインドポーズ）は、生成直後のボーンの姿勢でスキニングして求める
      root.updateMatrixWorld(true);
      proxy.skeleton.update();
      const heights = new Float32Array(vertices);
      for (let i = 0; i < vertices; i++) {
        proxy.getVertexPosition(i, v);
        heights[i] = v.y;
      }
      const colors = new Float32Array(vertices * 3);
      let offset = 0;
      for (const { mesh, part } of parts) {
        options.colorize(mesh, part, colors, offset, heights);
        offset += part.count;
      }
      geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    }
    return new CharacterLod(all, proxy);
  }
}

/**
 * ブラウザ用: LOD ビルダーを作る。`?lod=0` のときは undefined（LOD を使わず詳細メッシュだけを描く。負荷・見た目の比較用）。
 */
export async function createLodBuilder(): Promise<CharacterLodBuilder | undefined> {
  if (new URLSearchParams(window.location.search).get('lod') === '0') return undefined;
  return CharacterLodBuilder.create();
}
