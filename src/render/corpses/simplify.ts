import { BufferAttribute, BufferGeometry } from 'three/webgpu';

/** meshoptimizer の `MeshoptSimplifier` のうち使う部分（テストで差し替えられるようにインターフェースにしておく）。 */
export interface IndexSimplifier {
  simplifyWithAttributes(
    indices: Uint32Array,
    positions: Float32Array,
    positionStride: number,
    attributes: Float32Array,
    attributeStride: number,
    attributeWeights: number[],
    lock: Uint8Array | null,
    targetIndexCount: number,
    targetError: number,
    flags?: string[],
  ): [Uint32Array, number];
}

/** meshoptimizer のシンプリファイアを読み込む（初回のみ。使うときだけ動的 import するのでメインのバンドルに入らない）。 */
export async function loadIndexSimplifier(): Promise<IndexSimplifier> {
  const { MeshoptSimplifier } = await import('meshoptimizer/simplifier');
  await MeshoptSimplifier.ready;
  return MeshoptSimplifier;
}

export interface SimplifyOptions {
  /** 目標の三角形数の比率（0〜1）。 */
  readonly ratio: number;
  /** 許容誤差（メッシュの大きさに対する比）。 */
  readonly error?: number;
}

/**
 * ジオメトリ（position / normal / uv / index）の三角形を減らし、使われなくなった頂点を詰めた新しいジオメトリを返す。
 * 法線と UV を属性として重みづけ、肌テクスチャの継ぎ目（UV）と陰影が崩れにくいようにする。
 */
export function simplifyGeometry(
  geometry: BufferGeometry,
  simplifier: IndexSimplifier,
  { ratio, error = 0.02 }: SimplifyOptions,
): BufferGeometry {
  const index = geometry.getIndex();
  if (!index) throw new Error('simplifyGeometry needs an indexed geometry');
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.hasAttribute('uv') ? geometry.getAttribute('uv') : undefined;
  const count = position.count;
  const positions = new Float32Array(position.array);
  const stride = uv ? 5 : 3;
  const attributes = new Float32Array(count * stride);
  for (let i = 0; i < count; i++) {
    attributes[i * stride] = normal.getX(i);
    attributes[i * stride + 1] = normal.getY(i);
    attributes[i * stride + 2] = normal.getZ(i);
    if (uv) {
      attributes[i * stride + 3] = uv.getX(i);
      attributes[i * stride + 4] = uv.getY(i);
    }
  }
  const indices = new Uint32Array(index.array);
  const target = Math.max(3, Math.floor((indices.length * ratio) / 3) * 3);
  const [simplified] = simplifier.simplifyWithAttributes(
    indices,
    positions,
    3,
    attributes,
    stride,
    uv ? [0.5, 0.5, 0.5, 1, 1] : [0.5, 0.5, 0.5],
    null,
    target,
    error,
  );

  // 使われている頂点だけを詰め直す
  const remap = new Int32Array(count).fill(-1);
  let used = 0;
  for (const i of simplified) if (remap[i] === -1) remap[i] = used++;
  const outPositions = new Float32Array(used * 3);
  const outNormals = new Float32Array(used * 3);
  const outUvs = uv ? new Float32Array(used * 2) : undefined;
  for (let i = 0; i < count; i++) {
    const j = remap[i] ?? -1;
    if (j < 0) continue;
    outPositions.set(
      [positions[i * 3] ?? 0, positions[i * 3 + 1] ?? 0, positions[i * 3 + 2] ?? 0],
      j * 3,
    );
    outNormals.set([normal.getX(i), normal.getY(i), normal.getZ(i)], j * 3);
    if (outUvs && uv) outUvs.set([uv.getX(i), uv.getY(i)], j * 2);
  }
  const outIndices = new Uint32Array(simplified.length);
  for (let i = 0; i < simplified.length; i++) outIndices[i] = remap[simplified[i] ?? 0] ?? 0;

  const out = new BufferGeometry();
  out.setAttribute('position', new BufferAttribute(outPositions, 3));
  out.setAttribute('normal', new BufferAttribute(outNormals, 3));
  if (outUvs) out.setAttribute('uv', new BufferAttribute(outUvs, 2));
  out.setIndex(new BufferAttribute(outIndices, 1));
  out.computeBoundingSphere();
  out.computeBoundingBox();
  return out;
}
