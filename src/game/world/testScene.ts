/**
 * テストシーン（`?scene=test|combat|boss`）の当たりのデータ。地形の衝突メッシュと遺跡の柱。
 * 物理（Game）と描画（render/testScene）が同じデータから作るので、見た目と当たりがずれない。
 */
import type { StaticCylinderSpec } from '../game';
import { terrainHeight } from './terrain';

/** 地形の一辺（m）と分割数。 */
export const TEST_TERRAIN_SIZE = 360;
export const TEST_TERRAIN_SEGMENTS = 200;

/**
 * 地形の衝突メッシュ。three の `PlaneGeometry(size, size, seg, seg)` を `rotateX(-π/2)` して
 * 高さを `terrainHeight` にしたものと同じ頂点順・三角形（描画の地形と一致する）。
 */
export function createTestTerrainCollisionMesh(): { vertices: Float32Array; indices: Uint32Array } {
  const seg = TEST_TERRAIN_SEGMENTS;
  const n = seg + 1;
  const half = TEST_TERRAIN_SIZE / 2;
  const step = TEST_TERRAIN_SIZE / seg;
  const vertices = new Float32Array(n * n * 3);
  for (let iz = 0; iz < n; iz++) {
    const z = iz * step - half;
    for (let ix = 0; ix < n; ix++) {
      const x = ix * step - half;
      const i = (iz * n + ix) * 3;
      vertices[i] = x;
      vertices[i + 1] = terrainHeight(x, z);
      vertices[i + 2] = z;
    }
  }
  const indices = new Uint32Array(seg * seg * 6);
  let k = 0;
  for (let iz = 0; iz < seg; iz++) {
    for (let ix = 0; ix < seg; ix++) {
      const a = ix + n * iz;
      const b = ix + n * (iz + 1);
      const c = ix + 1 + n * (iz + 1);
      const d = ix + 1 + n * iz;
      indices.set([a, b, d, b, c, d], k);
      k += 6;
    }
  }
  return { vertices, indices };
}

/** 立っている柱。`height` は柱身の見た目の高さ（m）、`lean` は傾き（ラジアン）。 */
export interface TestScenePillar {
  readonly x: number;
  readonly z: number;
  readonly height: number;
  readonly capped: boolean;
  readonly lean?: number;
}

/** 倒れた柱。`lift` は地面から中心までの高さ（m）、`euler` は XYZ オイラー角（ラジアン）。 */
export interface TestSceneFallenPillar {
  readonly x: number;
  readonly z: number;
  readonly lift: number;
  readonly radius: number;
  readonly length: number;
  readonly euler: readonly [number, number, number];
}

/** 広場の奥の柱列（ボス部屋の入口のような構図。中央はアーチ）と手前の独立した柱。 */
export const TEST_SCENE_PILLARS: readonly TestScenePillar[] = [
  { x: -13.2, z: -12.2135, height: 4.9705, capped: false },
  { x: -8.8, z: -11.8319, height: 3.7133, capped: false },
  { x: -4.4, z: -11.8348, height: 7.5, capped: true },
  { x: 4.4, z: -11.9166, height: 7.5, capped: true },
  { x: 8.8, z: -12.2914, height: 7.5, capped: true },
  { x: 13.2, z: -11.7799, height: 4.9263, capped: false },
  { x: 9, z: 3, height: 5.5, capped: false, lean: 0.04 },
  { x: -10, z: 6, height: 6.5, capped: true },
];

export const TEST_SCENE_FALLEN_PILLARS: readonly TestSceneFallenPillar[] = [
  { x: 5.5, z: -3, lift: 0.65, radius: 0.66, length: 5.2, euler: [0, 0.4, Math.PI / 2] },
  { x: 8.2, z: -4.2, lift: 0.5, radius: 0.6, length: 2.2, euler: [0, 1.2, Math.PI / 2 + 0.2] },
];

/** 柱の衝突用円柱（`Game.addStaticCylinders` に渡す）。 */
export function testSceneColliders(): StaticCylinderSpec[] {
  return [
    ...TEST_SCENE_PILLARS.map((p) => ({
      x: p.x,
      y: terrainHeight(p.x, p.z),
      z: p.z,
      radius: 0.72,
      height: p.height + 0.4,
    })),
    ...TEST_SCENE_FALLEN_PILLARS.map((p) => ({
      x: p.x,
      y: terrainHeight(p.x, p.z) + p.lift,
      z: p.z,
      radius: p.radius,
      height: p.length,
      euler: p.euler,
    })),
  ];
}
