import {
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardNodeMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three/webgpu';
import { mix, normalWorld, positionWorld, smoothstep, vec3, vec4 } from 'three/tsl';
import { registerViewPlugin } from '../viewPlugins';
import { createGrassMaterial } from '../levelMaterials';
import { createDryGrassGeometry, createRockPileGeometry } from './cliffGeometry';
import { layoutCliff, type CliffItem } from './cliffLayout';
import { rockSurface } from './rockSurface';

/**
 * 外周の崖（#176）の岩塊・枯れ草（#190）。崖の基部の瓦礫、斜面の張り出し、上端の岩と枯れ草のシルエットを
 * InstancedMesh で置いて、高さ場の滑らかな稜線を崩す。見た目だけで、当たり判定・ナビは変えない。
 *
 * ドローコール: 空間バケット（32m）ごとに岩 1 + 枯れ草 1（視錐台カリングが効く）。影は落とさない。
 * 密度は品質プリセット（`cliffDetail`）で間引く（low は 4 割）。
 */

/** 岩塊のマテリアル: 崖と同じ地層・節理の色（`rockSurface`）に、上面の砂埃と凹凸を足す。 */
function createRockPileMaterial(): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ roughness: 0.97, metalness: 0 });
  const rock = rockSurface(positionWorld);
  const base = vec3(0.19, 0.18, 0.17);
  const dust = vec3(0.24, 0.215, 0.18);
  const top = smoothstep(0.55, 0.95, normalWorld.y);
  material.colorNode = vec4(mix(base.mul(rock.tone), dust, top.mul(0.35)), 1);
  return material;
}

function buildInstanced(
  items: readonly CliffItem[],
  geometry: BufferGeometry,
  material: Material,
  name: string,
): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, items.length);
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const position = new Vector3();
  const scale = new Vector3();
  const up = new Vector3(0, 1, 0);
  items.forEach((item, i) => {
    quaternion.setFromAxisAngle(up, item.yaw);
    position.set(item.x, item.y, item.z);
    scale.set(item.scale, item.scale * item.stretch, item.scale);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.name = name;
  // バケット全体を囲む球はインスタンス行列から three が計算する（視錐台カリング・距離カリング用）
  mesh.computeBoundingSphere();
  return mesh;
}

/** この距離（m）より遠いバケットは描かない（ドローコール・三角形の節約。遠景の岩は崖の色で足りる）。 */
const ROCK_FAR = 30;
const GRASS_FAR = 26;

registerViewPlugin('cliff', ({ view, gameRenderer, level }) => {
  const root = new Group();
  root.name = 'cliff';
  const buckets: { mesh: InstancedMesh; far: number }[] = [];
  // `?cliff=0`: 岩塊・枯れ草を出さない（変更前との負荷・見た目の比較用）
  const enabled = new URLSearchParams(globalThis.location.search).get('cliff') !== '0';
  if (level && enabled) {
    const placements = layoutCliff(level, gameRenderer.quality.preset.cliffDetail);
    const rockGeometry = createRockPileGeometry();
    const grassGeometry = createDryGrassGeometry();
    const rockMaterial = createRockPileMaterial();
    const grassMaterial = createGrassMaterial();
    const byBucket = (items: readonly CliffItem[]): Map<string, CliffItem[]> => {
      const map = new Map<string, CliffItem[]>();
      for (const item of items) {
        const list = map.get(item.bucket);
        if (list) list.push(item);
        else map.set(item.bucket, [item]);
      }
      return map;
    };
    for (const [bucket, items] of byBucket(placements.rocks)) {
      const mesh = buildInstanced(items, rockGeometry, rockMaterial, `env:cliff-rock:${bucket}`);
      buckets.push({ mesh, far: ROCK_FAR });
      root.add(mesh);
    }
    for (const [bucket, items] of byBucket(placements.grass)) {
      const mesh = buildInstanced(items, grassGeometry, grassMaterial, `grass:cliff:${bucket}`);
      buckets.push({ mesh, far: GRASS_FAR });
      root.add(mesh);
    }
    view.scene.add(root);
  }
  return {
    update: () => {
      const camera = view.camera.position;
      for (const { mesh, far } of buckets) {
        const sphere = mesh.boundingSphere;
        if (!sphere) continue;
        mesh.visible = sphere.center.distanceTo(camera) - sphere.radius < far;
      }
    },
  };
});
