import { BufferAttribute, BufferGeometry } from 'three/webgpu';

/** 地面から浮かせる量（m）。地形メッシュの三角形分割との差でめり込まないよう少し持ち上げる。 */
export const GROUND_LIFT = 0.1;

export type HeightFn = (x: number, z: number) => number;

/** 固定トポロジのメッシュ。頂点位置はローカル xz（メートル）で、y は配置時に地形へ合わせて書き換える。 */
export interface TelegraphMesh {
  readonly geometry: BufferGeometry;
  /** ローカル座標（x, z）の組。y は書き換え対象。 */
  readonly local: Float32Array;
  readonly positions: Float32Array;
}

function finish(local: Float32Array, index: number[]): TelegraphMesh {
  const positions = new Float32Array((local.length / 2) * 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  // 模様用の単位ローカル座標（円盤: 半径 1 の円、帯: x ∈ [-0.5,0.5], z ∈ [0,1]）
  geometry.setAttribute('aLocal', new BufferAttribute(local, 2));
  geometry.setIndex(index);
  return { geometry, local, positions };
}

/** 円盤（中心 + 同心リング）。半径は `radius` 倍される。 */
export function createDiscMesh(rings: number, segments: number): TelegraphMesh {
  const count = 1 + rings * segments;
  const local = new Float32Array(count * 2);
  const index: number[] = [];
  // 頂点 0 は中心。リング r (1..rings) の頂点 s は 1 + (r-1)*segments + s
  for (let r = 1; r <= rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      const o = (1 + (r - 1) * segments + s) * 2;
      local[o] = Math.cos(a) * (r / rings);
      local[o + 1] = Math.sin(a) * (r / rings);
    }
  }
  const v = (r: number, s: number): number => 1 + (r - 1) * segments + (s % segments);
  for (let s = 0; s < segments; s++) index.push(0, v(1, s + 1), v(1, s));
  for (let r = 1; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      index.push(v(r, s), v(r, s + 1), v(r + 1, s));
      index.push(v(r, s + 1), v(r + 1, s + 1), v(r + 1, s));
    }
  }
  return finish(local, index);
}

/** 帯（幅方向 across 分割 × 長さ方向 along 分割）。x ∈ [-0.5, 0.5]、z ∈ [0, 1]（単位）。 */
export function createStripMesh(along: number, across: number): TelegraphMesh {
  const cols = across + 1;
  const rows = along + 1;
  const local = new Float32Array(cols * rows * 2);
  const index: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const o = (j * cols + i) * 2;
      local[o] = i / across - 0.5;
      local[o + 1] = j / along;
    }
  }
  for (let j = 0; j < along; j++) {
    for (let i = 0; i < across; i++) {
      const a = j * cols + i;
      index.push(a, a + cols, a + 1, a + 1, a + cols, a + cols + 1);
    }
  }
  return finish(local, index);
}

/**
 * ローカルの単位形状を (scaleX, scaleZ) 倍し、yaw 回転・平行移動してワールドへ置き、
 * y を地形の高さ + lift に合わせる。mesh の Object3D 変換は恒等のまま使う前提。
 * 返り値: 配置後の y の最小・最大（境界球の更新などに使える）。
 */
export function placeOnTerrain(
  mesh: TelegraphMesh,
  originX: number,
  originZ: number,
  yaw: number,
  scaleX: number,
  scaleZ: number,
  heightAt: HeightFn,
  lift: number = GROUND_LIFT,
): void {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const { local, positions } = mesh;
  const n = local.length / 2;
  for (let i = 0; i < n; i++) {
    const lx = (local[i * 2] ?? 0) * scaleX;
    const lz = (local[i * 2 + 1] ?? 0) * scaleZ;
    // yaw: ローカル +z がワールドで (sin yaw, cos yaw) を向く（Object3D.rotation.y と同じ向き）
    const wx = originX + lx * c + lz * s;
    const wz = originZ - lx * s + lz * c;
    positions[i * 3] = wx;
    positions[i * 3 + 1] = heightAt(wx, wz) + lift;
    positions[i * 3 + 2] = wz;
  }
  const attr = mesh.geometry.getAttribute('position');
  attr.needsUpdate = true;
  mesh.geometry.computeBoundingSphere();
}
