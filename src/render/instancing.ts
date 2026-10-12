import { InstancedMesh, type BufferGeometry, type Material } from 'three/webgpu';

/**
 * パイプラインを共有できる InstancedMesh を作る（#326）。
 *
 * three r186 はインスタンス行列がユニフォームバッファに収まると `array<mat4x4f, N>` として読み、
 * N（確保数）がシェーダコードに入る。確保数がメッシュごとに違うと、同じマテリアルでもパイプラインが分かれ、
 * 収まる / 収まらない（頂点属性経由）でも分かれる。そこで確保数を常にユニフォーム上限を超える数にして
 * 全メッシュを頂点属性経由（コードが確保数に依存しない）に揃え、実際に描く数は `mesh.count` で絞る。
 * 余りの行列は描かれない（上限 64KB なら 1 メッシュあたり最大 64KB の余り）。
 */

/** 1 インスタンスの行列のバイト数（mat4 f32）。 */
const MATRIX_BYTES = 64;

let uniformBufferLimit = 65536;

/** レンダラー初期化後に一度だけ呼ぶ（デバイスのユニフォームバッファ上限）。 */
export function setUniformBufferLimit(bytes: number): void {
  uniformBufferLimit = bytes;
}

/** `count` 個を描くときの確保数。 */
export function instanceCapacity(count: number): number {
  return Math.max(count, Math.floor(uniformBufferLimit / MATRIX_BYTES) + 1);
}

export function createInstancedMesh(
  geometry: BufferGeometry,
  material: Material | Material[],
  count: number,
): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, instanceCapacity(count));
  mesh.count = count;
  return mesh;
}
