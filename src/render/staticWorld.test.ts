import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { markStatic } from './staticWorld';

function tree() {
  const root = new Group();
  root.position.set(10, 0, 0);
  const child = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  child.position.set(0, 2, 0);
  const door = new Group();
  door.position.set(0, 0, 5);
  const leaf = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  door.add(leaf);
  root.add(child, door);
  return { root, child, door, leaf };
}

const worldPos = (o: Mesh) => new Vector3().setFromMatrixPosition(o.matrixWorld).toArray();

describe('markStatic', () => {
  it('全ノードの自動更新を止め、行列を 1 回だけ確定する', () => {
    const { root, child, door, leaf } = tree();
    markStatic(root);
    for (const o of [root, child, door, leaf]) {
      expect(o.matrixAutoUpdate).toBe(false);
      expect(o.matrixWorldAutoUpdate).toBe(false);
    }
    expect(worldPos(child)).toEqual([10, 2, 0]);
    expect(worldPos(leaf)).toEqual([10, 0, 5]);
  });

  it('止めたあとの変更は反映されない', () => {
    const { root, child } = tree();
    markStatic(root);
    child.position.set(99, 99, 99);
    root.updateMatrixWorld(true);
    expect(worldPos(child)).toEqual([10, 2, 0]);
  });

  it('except の部分木は動かし続けられる', () => {
    const { root, door, leaf } = tree();
    markStatic(root, { except: [door] });
    expect(door.matrixAutoUpdate).toBe(true);
    expect(door.matrixWorldAutoUpdate).toBe(true);
    expect(leaf.matrixAutoUpdate).toBe(true);
    door.position.set(0, 0, 8);
    root.updateMatrixWorld();
    expect(worldPos(leaf)).toEqual([10, 0, 8]);
  });

  it('手で行列を設定した物の行列を上書きしない', () => {
    const { root, child } = tree();
    child.matrixAutoUpdate = false;
    child.matrix.makeTranslation(1, 2, 3);
    markStatic(root);
    expect(worldPos(child)).toEqual([11, 2, 3]);
  });
});
