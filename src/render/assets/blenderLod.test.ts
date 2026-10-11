import { describe, expect, it } from 'vitest';
import { Group, Object3D } from 'three/webgpu';
import { buildBlenderLods } from './blenderLod';

describe('buildBlenderLods', () => {
  it('replaces a node with lodDistances by a LOD holding its _LODn children', () => {
    const root = new Group();
    const node = new Object3D();
    node.name = 'column';
    node.position.set(1, 2, 3);
    node.userData.lodDistances = [0, 10, 30];
    for (let i = 0; i < 3; i++) {
      const child = new Object3D();
      child.name = `column_LOD${i}`;
      node.add(child);
    }
    root.add(node);

    const lods = buildBlenderLods(root);
    const lod = lods.get('column');
    expect(lod).toBeDefined();
    expect(lod?.parent).toBe(root);
    expect(node.parent).toBeNull();
    expect(lod?.position.toArray()).toEqual([1, 2, 3]);
    expect(lod?.levels.map((l) => [l.object.name, l.distance])).toEqual([
      ['column_LOD0', 0],
      ['column_LOD1', 10],
      ['column_LOD2', 30],
    ]);
  });

  it('throws when a level is missing', () => {
    const node = new Object3D();
    node.name = 'x';
    node.userData.lodDistances = [0, 5];
    const child = new Object3D();
    child.name = 'x_LOD0';
    node.add(child);
    expect(() => buildBlenderLods(node)).toThrow(/x_LOD1/);
  });
});
