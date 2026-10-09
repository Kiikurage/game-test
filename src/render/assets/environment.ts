import type { Matrix4 } from 'three/webgpu';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Matrix3,
  Mesh,
  Uint32BufferAttribute,
  Vector3,
  type BufferAttribute,
  type Material,
  type Object3D,
} from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/**
 * 環境メッシュ（自作、`public/assets/environment.glb`。生成は scripts/assets/environment.mjs）。
 * ノード名 = ID。アイテム空間は足元が原点・+Y が上・正面 +Z。色は頂点カラー。
 * ランタイムは `StaticBatcher` で配置ごとの行列を掛けて、空間バケット × マテリアルごとに 1 メッシュへ結合する。
 */
export const ENVIRONMENT_IDS = [
  'GraveRound',
  'GraveCross',
  'GraveBroken',
  'GraveMound',
  'DeadTreeA',
  'DeadTreeB',
  'DeadTreeC',
  'FenceSection',
  'FenceBroken',
  'FenceFallen',
  'WallFullA',
  'WallFullB',
  'WallFullWindow',
  'WallMid',
  'WallLow',
  'WallRubble',
  'RubblePile',
  'StoneScatter',
  'Altar',
  'PewA',
  'PewBroken',
  'ColumnTall',
  'ColumnBroken',
  'Stele',
  'Bonfire',
  'LanternPost',
  'Mausoleum',
  'Tower',
  'GrassTuftA',
  'GrassTuftB',
  'GrassTuftC',
] as const;

export type EnvironmentId = (typeof ENVIRONMENT_IDS)[number];

/** マテリアル群: soft（石・木・土）/ metal（錆びた鉄）/ glow（発光。炎・刻印）。 */
export type EnvironmentGroup = 'soft' | 'metal' | 'glow';
export const ENVIRONMENT_GROUPS: readonly EnvironmentGroup[] = ['soft', 'metal', 'glow'];

/** アイテム空間へ焼き込んだ 1 グループ分の頂点データ。 */
export interface BakedPart {
  readonly group: EnvironmentGroup;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly colors: Float32Array;
  readonly indices: Uint32Array;
}

function groupOf(material: Material | Material[]): EnvironmentGroup {
  const name = (Array.isArray(material) ? material[0]?.name : material.name) ?? '';
  if (name === 'EnvMetal') return 'metal';
  if (name === 'EnvGlow') return 'glow';
  return 'soft';
}

/** glb のメッシュを、ノードの行列（量子化の平行移動・スケール）を掛けたアイテム空間の Float32 配列にする。 */
function bakeMesh(mesh: Mesh): BakedPart {
  mesh.updateWorldMatrix(true, false);
  const geometry = mesh.geometry;
  const pos = geometry.getAttribute('position') as BufferAttribute;
  const nor = geometry.getAttribute('normal') as BufferAttribute;
  const col = geometry.getAttribute('color') as BufferAttribute | undefined;
  const count = pos.count;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const normalMatrix = new Matrix3().getNormalMatrix(mesh.matrixWorld);
  const v = new Vector3();
  for (let i = 0; i < count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld);
    positions.set([v.x, v.y, v.z], i * 3);
    v.set(nor.getX(i), nor.getY(i), nor.getZ(i)).applyMatrix3(normalMatrix).normalize();
    normals.set([v.x, v.y, v.z], i * 3);
    if (col) colors.set([col.getX(i), col.getY(i), col.getZ(i)], i * 3);
    else colors.set([1, 1, 1], i * 3);
  }
  const index = geometry.getIndex();
  const indices = new Uint32Array(index?.count ?? count);
  for (let i = 0; i < indices.length; i++) indices[i] = index ? index.getX(i) : i;
  return { group: groupOf(mesh.material), positions, normals, colors, indices };
}

export class EnvironmentAssets {
  private constructor(private readonly items: ReadonlyMap<EnvironmentId, readonly BakedPart[]>) {}

  /** environment.glb を読み込む。baseUrl は public/assets/ の URL（既定は Vite の BASE_URL 配下）。 */
  static async load(baseUrl = `${import.meta.env.BASE_URL}assets/`): Promise<EnvironmentAssets> {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(`${baseUrl}environment.glb`);
    return EnvironmentAssets.fromScene(gltf.scene);
  }

  /** 読み込み済みの glTF シーンから作る（テスト・プレビュー用）。 */
  static fromScene(scene: Object3D): EnvironmentAssets {
    const items = new Map<EnvironmentId, BakedPart[]>();
    scene.updateMatrixWorld(true);
    for (const id of ENVIRONMENT_IDS) {
      const object = scene.getObjectByName(id);
      if (!object) throw new Error(`environment.glb is missing item: ${id}`);
      const parts: BakedPart[] = [];
      object.traverse((obj) => {
        if ((obj as { isMesh?: boolean }).isMesh) parts.push(bakeMesh(obj as Mesh));
      });
      items.set(id, parts);
    }
    return new EnvironmentAssets(items);
  }

  parts(id: EnvironmentId): readonly BakedPart[] {
    const parts = this.items.get(id);
    if (!parts) throw new Error(`unknown environment item: ${id}`);
    return parts;
  }

  /** アイテムの三角形数（全グループ）。 */
  triangles(id: EnvironmentId): number {
    return this.parts(id).reduce((s, p) => s + p.indices.length / 3, 0);
  }
}

interface Accumulator {
  positions: number[];
  normals: number[];
  colors: number[];
  indices: number[];
  vertexCount: number;
}

/**
 * 静的な配置を溜めて、バケット（空間セル）× グループごとに 1 つの Mesh に結合する。
 * 結合後は 1 メッシュ = 1 ドローコール（影の描画を含めても 2）で、視錐台カリングはバケット単位。
 */
export class StaticBatcher {
  private readonly buckets = new Map<string, Map<EnvironmentGroup, Accumulator>>();
  private placements = 0;
  private triangles = 0;
  private readonly v = new Vector3();
  private readonly normalMatrix = new Matrix3();

  constructor(private readonly assets: EnvironmentAssets) {}

  get stats(): { readonly placements: number; readonly triangles: number } {
    return { placements: this.placements, triangles: this.triangles };
  }

  /** `id` を `matrix`（アイテム空間 → ワールド）で `bucket` に置く。 */
  add(id: EnvironmentId, matrix: Matrix4, bucket: string): void {
    let groups = this.buckets.get(bucket);
    if (!groups) {
      groups = new Map();
      this.buckets.set(bucket, groups);
    }
    this.normalMatrix.getNormalMatrix(matrix);
    for (const part of this.assets.parts(id)) {
      let acc = groups.get(part.group);
      if (!acc) {
        acc = { positions: [], normals: [], colors: [], indices: [], vertexCount: 0 };
        groups.set(part.group, acc);
      }
      const n = part.positions.length / 3;
      for (let i = 0; i < n; i++) {
        this.v.set(
          part.positions[i * 3] ?? 0,
          part.positions[i * 3 + 1] ?? 0,
          part.positions[i * 3 + 2] ?? 0,
        );
        this.v.applyMatrix4(matrix);
        acc.positions.push(this.v.x, this.v.y, this.v.z);
        this.v.set(
          part.normals[i * 3] ?? 0,
          part.normals[i * 3 + 1] ?? 0,
          part.normals[i * 3 + 2] ?? 0,
        );
        this.v.applyMatrix3(this.normalMatrix).normalize();
        acc.normals.push(this.v.x, this.v.y, this.v.z);
        acc.colors.push(
          part.colors[i * 3] ?? 1,
          part.colors[i * 3 + 1] ?? 1,
          part.colors[i * 3 + 2] ?? 1,
        );
      }
      for (const idx of part.indices) acc.indices.push(idx + acc.vertexCount);
      acc.vertexCount += n;
      this.triangles += part.indices.length / 3;
    }
    this.placements++;
  }

  /** 溜めた配置を Mesh 群にする。materials はグループごとのマテリアル。 */
  build(materials: Readonly<Record<EnvironmentGroup, Material>>, castShadow = true): Group {
    const root = new Group();
    root.name = 'environment';
    for (const [bucket, groups] of this.buckets) {
      for (const [group, acc] of groups) {
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(acc.positions, 3));
        geometry.setAttribute('normal', new Float32BufferAttribute(acc.normals, 3));
        geometry.setAttribute('color', new Float32BufferAttribute(acc.colors, 3));
        geometry.setIndex(new Uint32BufferAttribute(acc.indices, 1));
        geometry.computeBoundingSphere();
        const mesh = new Mesh(geometry, materials[group]);
        mesh.name = `env:${bucket}:${group}`;
        mesh.castShadow = castShadow && group !== 'glow';
        mesh.receiveShadow = group !== 'glow';
        root.add(mesh);
      }
    }
    return root;
  }
}
