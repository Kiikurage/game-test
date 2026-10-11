import { LOD, type Object3D } from 'three/webgpu';

/**
 * Blender パイプライン（`npm run assets:blender`、docs/assets.md 7.14）の glb から `THREE.LOD` を作る。
 *
 * glb の形: `<name>` ノード（`extras.lodDistances: number[]` → GLTFLoader で `userData.lodDistances`）の
 * 子に `<name>_LOD0..n` のメッシュノード。LOD0 が最も詳細。全レベルが TEXCOORD_1（ライトマップ UV）を持ち、
 * 同じライトマップ（#323）を共有できる。
 *
 * `root` 以下の該当ノードをすべて `LOD` に置き換え（同じ親・同じローカル変換）、名前 → `LOD` の表を返す。
 */
export function buildBlenderLods(root: Object3D): Map<string, LOD> {
  const targets: Object3D[] = [];
  root.traverse((node) => {
    if (Array.isArray(node.userData.lodDistances)) targets.push(node);
  });
  const result = new Map<string, LOD>();
  for (const node of targets) {
    const distances = node.userData.lodDistances as number[];
    const lod = new LOD();
    lod.name = node.name;
    lod.position.copy(node.position);
    lod.quaternion.copy(node.quaternion);
    lod.scale.copy(node.scale);
    lod.userData = { ...node.userData };
    distances.forEach((distance, level) => {
      const child = node.getObjectByName(`${node.name}_LOD${level}`);
      if (!child) throw new Error(`${node.name}: missing ${node.name}_LOD${level}`);
      lod.addLevel(child, distance);
    });
    const parent = node.parent;
    if (parent) {
      parent.add(lod);
      parent.remove(node);
    }
    result.set(node.name, lod);
  }
  return result;
}
