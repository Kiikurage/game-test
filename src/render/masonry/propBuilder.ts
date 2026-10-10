import type { BufferGeometry } from 'three/webgpu';
import {
  BoxGeometry,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * 小物（鉄の金具・木・格子）を頂点カラー付きの 1 ジオメトリへまとめる。
 * 材質は `levelMaterials` の soft / metal（頂点カラー × ノイズ）を使う。
 */
export class PropBuilder {
  private readonly parts: BufferGeometry[] = [];

  private add(
    geometry: BufferGeometry,
    m: Matrix4,
    color: readonly [number, number, number],
  ): void {
    geometry.applyMatrix4(m);
    geometry.deleteAttribute('uv');
    const count = geometry.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) colors.set(color, i * 3);
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    this.parts.push(geometry);
  }

  /** 箱。(cx, cy, cz) は中心。回転は yaw → tiltX → tiltZ（three の YXZ）。 */
  box(
    c: readonly [number, number, number],
    half: readonly [number, number, number],
    color: readonly [number, number, number],
    rot: { yaw?: number; tiltX?: number; tiltZ?: number } = {},
  ): void {
    const q = new Quaternion().setFromEuler(
      new Euler(rot.tiltX ?? 0, rot.yaw ?? 0, rot.tiltZ ?? 0, 'YXZ'),
    );
    const m = new Matrix4().compose(new Vector3(...c), q, new Vector3(1, 1, 1));
    this.add(new BoxGeometry(half[0] * 2, half[1] * 2, half[2] * 2), m, color);
  }

  /** 円柱（軸は y。傾けられる）。 */
  cylinder(
    c: readonly [number, number, number],
    rTop: number,
    rBottom: number,
    height: number,
    color: readonly [number, number, number],
    rot: { yaw?: number; tiltX?: number; tiltZ?: number } = {},
    radial = 8,
  ): void {
    const q = new Quaternion().setFromEuler(
      new Euler(rot.tiltX ?? 0, rot.yaw ?? 0, rot.tiltZ ?? 0, 'YXZ'),
    );
    const m = new Matrix4().compose(new Vector3(...c), q, new Vector3(1, 1, 1));
    this.add(new CylinderGeometry(rTop, rBottom, height, radial), m, color);
  }

  get isEmpty(): boolean {
    return this.parts.length === 0;
  }

  get triangles(): number {
    return this.parts.reduce((s, g) => s + (g.index ? g.index.count : 0) / 3, 0);
  }

  build(): BufferGeometry | null {
    if (this.parts.length === 0) return null;
    const merged = mergeGeometries(this.parts, false);
    for (const g of this.parts) g.dispose();
    this.parts.length = 0;
    merged.computeBoundingSphere();
    return merged;
  }
}
