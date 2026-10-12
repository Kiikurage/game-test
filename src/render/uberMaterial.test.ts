import { describe, expect, it } from 'vitest';
import {
  DoubleSide,
  FrontSide,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
} from 'three/webgpu';
import { createUberMaterial, uberVariantKey } from './uberMaterial';
import { createMetalMaterial, createSoftMaterial } from './levelMaterials';
import { materialGroupOf } from './materialGroups';

describe('createUberMaterial', () => {
  it('picks the shading model and render state from flags', () => {
    const lit = createUberMaterial({ shading: 'lit', vertexColors: true }, { roughness: 0.5 });
    expect(lit).toBeInstanceOf(MeshStandardNodeMaterial);
    expect(lit.vertexColors).toBe(true);
    expect(lit.side).toBe(FrontSide);
    expect((lit as MeshStandardNodeMaterial).roughness).toBe(0.5);

    const unlit = createUberMaterial({ shading: 'unlit', doubleSided: true }, { intensity: 3 });
    expect(unlit).toBeInstanceOf(MeshBasicNodeMaterial);
    expect(unlit.side).toBe(DoubleSide);
    expect(unlit.colorNode).not.toBeNull();
  });

  it('leaves disabled features out of the graph', () => {
    const plain = createUberMaterial({ shading: 'lit' });
    expect(plain.colorNode).toBeNull();
    expect(plain.positionNode).toBeNull();
    const wind = createUberMaterial({ shading: 'lit', wind: true });
    expect(wind.positionNode).not.toBeNull();
  });

  it('tags the group and records the variant', () => {
    const m = createUberMaterial({ shading: 'lit', detail: true, group: 'env' });
    expect(materialGroupOf(m)).toBe('env');
    expect(m.userData.uberVariant).toBe('lit+detail');
  });

  it('builds soft stone and rusted metal as one variant (shared pipeline)', () => {
    expect(createSoftMaterial().userData.uberVariant).toBe(
      createMetalMaterial().userData.uberVariant,
    );
    expect(uberVariantKey({ shading: 'lit', vertexColors: true, detail: true })).toBe(
      'lit+vc+detail',
    );
  });
});
