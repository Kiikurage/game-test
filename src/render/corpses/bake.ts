import {
  BufferAttribute,
  BufferGeometry,
  Matrix4,
  Vector3,
  type Material,
  type Object3D,
  type SkinnedMesh,
} from 'three/webgpu';

/** 焼き込んだ頂点データ（ワールド空間）。 */
export interface BakedPart {
  readonly name: string;
  readonly material: Material | Material[];
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array | undefined;
  readonly indices: Uint32Array;
}

const _p = new Vector3();
const _q = new Vector3();
const _n = new Vector3();

/**
 * スキンメッシュの現在のポーズを頂点に焼き込み、ワールド空間（`transform` を追加で適用）の静的な頂点データにする。
 * 法線はスキニングの回転成分を、頂点を法線方向へ少しずらした 2 点の差分で求める。
 * 呼び出し前に `skinned` を含む階層で `updateMatrixWorld(true)` を済ませておくこと。
 */
export function bakeSkinnedMesh(
  skinned: SkinnedMesh,
  transform: Matrix4 = new Matrix4(),
): BakedPart {
  const geometry = skinned.geometry;
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.hasAttribute('uv') ? geometry.getAttribute('uv') : undefined;
  const count = position.count;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const uvs = uv ? new Float32Array(count * 2) : undefined;
  const toWorld = new Matrix4().multiplyMatrices(transform, skinned.matrixWorld);
  const eps = 0.01;
  for (let i = 0; i < count; i++) {
    _p.fromBufferAttribute(position, i);
    _n.fromBufferAttribute(normal, i);
    _q.copy(_p).addScaledVector(_n, eps);
    skinned.applyBoneTransform(i, _p);
    skinned.applyBoneTransform(i, _q);
    _q.sub(_p); // スキニング後の法線方向
    _p.applyMatrix4(toWorld);
    _q.transformDirection(toWorld);
    positions.set([_p.x, _p.y, _p.z], i * 3);
    normals.set([_q.x, _q.y, _q.z], i * 3);
    if (uvs && uv) uvs.set([uv.getX(i), uv.getY(i)], i * 2);
  }
  const index = geometry.getIndex();
  if (!index) throw new Error(`skinned mesh has no index: ${skinned.name}`);
  const indices = new Uint32Array(index.count);
  for (let i = 0; i < index.count; i++) indices[i] = index.getX(i);
  return { name: skinned.name, material: skinned.material, positions, normals, uvs, indices };
}

/** 複数の焼き込み結果を 1 つのジオメトリにまとめる（同じマテリアルのパーツ用）。 */
export function mergeBakedParts(parts: readonly BakedPart[]): BufferGeometry {
  let vertexCount = 0;
  let indexCount = 0;
  for (const p of parts) {
    vertexCount += p.positions.length / 3;
    indexCount += p.indices.length;
  }
  const hasUv = parts.every((p) => p.uvs !== undefined);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = hasUv ? new Float32Array(vertexCount * 2) : undefined;
  const indices = new Uint32Array(indexCount);
  let vo = 0;
  let io = 0;
  for (const p of parts) {
    positions.set(p.positions, vo * 3);
    normals.set(p.normals, vo * 3);
    if (uvs && p.uvs) uvs.set(p.uvs, vo * 2);
    for (let i = 0; i < p.indices.length; i++) indices[io + i] = (p.indices[i] ?? 0) + vo;
    vo += p.positions.length / 3;
    io += p.indices.length;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(normals, 3));
  if (uvs) geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
}

/** 階層の中のスキンメッシュを集める。 */
export function collectSkinnedMeshes(root: Object3D): SkinnedMesh[] {
  const result: SkinnedMesh[] = [];
  root.traverse((obj) => {
    if ((obj as { isSkinnedMesh?: boolean }).isSkinnedMesh) result.push(obj as SkinnedMesh);
  });
  return result;
}

/**
 * 静止物にする: 行列を一度だけ計算して自動更新を止める（以降は親が動かない限り再計算されない）。
 * 既に `matrixAutoUpdate` が false のオブジェクト（行列を直接設定した物）の行列は触らない。
 */
export function freezeStatic(object: Object3D): void {
  if (object.matrixAutoUpdate) object.updateMatrix();
  object.matrixAutoUpdate = false;
  for (const child of object.children) freezeStatic(child);
}
