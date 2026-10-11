import { describe, expect, it } from 'vitest';
import { createTestTerrainCollisionMesh } from '../game/world/testScene';
import { createTerrainGeometry } from './testScene';

describe('test scene terrain', () => {
  it('collision mesh matches the rendered terrain geometry', () => {
    const geometry = createTerrainGeometry();
    const mesh = createTestTerrainCollisionMesh();
    const position = geometry.attributes.position;
    const index = geometry.index;
    if (!position || !index) throw new Error('missing attributes');
    expect(Array.from(mesh.indices)).toEqual(Array.from(index.array));
    expect(mesh.vertices.length).toBe(position.array.length);
    let maxDiff = 0;
    for (let i = 0; i < mesh.vertices.length; i++) {
      maxDiff = Math.max(maxDiff, Math.abs((mesh.vertices[i] ?? 0) - (position.array[i] ?? 0)));
    }
    expect(maxDiff).toBeLessThan(1e-4);
    geometry.dispose();
  });
});
