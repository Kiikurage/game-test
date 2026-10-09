import {
  Bone,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute,
  Vector3,
} from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { bakeSkinnedMesh, collectSkinnedMeshes, freezeStatic, mergeBakedParts } from './bake';

/** 2 本の骨（根元と先）で曲がる細い柱。先の骨を回すと上半分が曲がる。 */
function bendingPillar(): { root: Group; skinned: SkinnedMesh; tip: Bone } {
  const root = new Group();
  const base = new Bone();
  const tip = new Bone();
  tip.position.set(0, 1, 0);
  base.add(tip);
  root.add(base);
  const geometry = new BufferGeometry();
  // y = 0, 1, 2 の 3 段 × 2 点
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute([0, 0, 0, 0.1, 0, 0, 0, 1, 0, 0.1, 1, 0, 0, 2, 0, 0.1, 2, 0], 3),
  );
  geometry.setAttribute(
    'normal',
    new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3),
  );
  geometry.setAttribute(
    'uv',
    new Float32BufferAttribute([0, 0, 1, 0, 0, 0.5, 1, 0.5, 0, 1, 1, 1], 2),
  );
  geometry.setAttribute(
    'skinIndex',
    new Uint16BufferAttribute(
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      4,
    ),
  );
  geometry.setAttribute(
    'skinWeight',
    new Float32BufferAttribute(
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      4,
    ),
  );
  geometry.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]);
  const skinned = new SkinnedMesh(geometry, new MeshStandardMaterial());
  skinned.name = 'Pillar';
  root.add(skinned);
  root.updateMatrixWorld(true);
  skinned.bind(new Skeleton([base, tip]));
  return { root, skinned, tip };
}

describe('bakeSkinnedMesh', () => {
  it('reproduces the skinned vertex positions of the current pose', () => {
    const { root, skinned, tip } = bendingPillar();
    tip.rotation.z = Math.PI / 2; // 先の骨を 90° 曲げる
    root.updateMatrixWorld(true);
    const baked = bakeSkinnedMesh(skinned);
    const expected = new Vector3();
    for (let i = 0; i < 6; i++) {
      skinned.getVertexPosition(i, expected);
      expected.applyMatrix4(skinned.matrixWorld);
      expect(baked.positions[i * 3]).toBeCloseTo(expected.x, 5);
      expect(baked.positions[i * 3 + 1]).toBeCloseTo(expected.y, 5);
      expect(baked.positions[i * 3 + 2]).toBeCloseTo(expected.z, 5);
    }
    // 上の 2 段は X 軸方向へ曲がっている（先の骨に付いた頂点は y=2 → x=-1 付近）
    expect(baked.positions[12]).toBeCloseTo(-1, 5);
  });

  it('rotates the normals with the skinning', () => {
    const { root, skinned, tip } = bendingPillar();
    tip.rotation.y = Math.PI / 2; // 先の骨をひねる: +Z の法線は +X を向く
    root.updateMatrixWorld(true);
    const baked = bakeSkinnedMesh(skinned);
    expect(baked.normals[12]).toBeCloseTo(1, 4);
    expect(baked.normals[14]).toBeCloseTo(0, 4);
    // 根元の骨に付いた頂点の法線は変わらない
    expect(baked.normals[2]).toBeCloseTo(1, 4);
  });

  it('applies the extra transform (scale and shift)', () => {
    const { root, skinned } = bendingPillar();
    root.updateMatrixWorld(true);
    const baked = bakeSkinnedMesh(skinned, new Matrix4().makeScale(2, 3, 2));
    expect(baked.positions[13]).toBeCloseTo(6, 5); // y=2 の頂点 → 6
  });

  it('produces a static mesh: no skinning attributes, no skeleton, frozen matrices', () => {
    const { root, skinned } = bendingPillar();
    const baked = bakeSkinnedMesh(skinned);
    const geometry = mergeBakedParts([baked, baked]);
    expect(geometry.getAttribute('skinIndex')).toBeUndefined();
    expect(geometry.getAttribute('skinWeight')).toBeUndefined();
    expect(geometry.getAttribute('position').count).toBe(12);
    expect(geometry.getIndex()?.count).toBe(24);
    expect(geometry.boundingSphere).not.toBeNull();

    const group = new Group();
    const mesh = new Mesh(geometry, new MeshStandardMaterial());
    group.position.set(3, 0, 4);
    group.add(mesh);
    freezeStatic(group);
    expect(collectSkinnedMeshes(group)).toHaveLength(0);
    expect(collectSkinnedMeshes(root)).toHaveLength(1); // 元のキャラクターにはスキンメッシュがある
    expect(group.matrixAutoUpdate).toBe(false);
    expect(mesh.matrixAutoUpdate).toBe(false);
    // 更新を止めた後は position を変えても行列は変わらない（描画フレームごとの再計算が無い）
    group.position.set(9, 9, 9);
    group.updateMatrixWorld(true);
    expect(group.matrixWorld.elements[12]).toBe(3);
  });

  it('keeps a directly assigned matrix when freezing', () => {
    const wrapper = new Group();
    wrapper.matrixAutoUpdate = false;
    wrapper.matrix.makeTranslation(1, 2, 3);
    freezeStatic(wrapper);
    wrapper.updateMatrixWorld(true);
    expect(wrapper.matrixWorld.elements[13]).toBe(2);
  });
});
