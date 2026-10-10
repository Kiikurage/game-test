import { describe, expect, it } from 'vitest';
import { ASHEN_FOUNDATION } from './ashenFoundation';
import { createFootstepSurfaceResolver, footstepSurfaceOf } from './footstepSurface';
import { createLevel } from './level';

describe('footstep surface', () => {
  const surfaceAt = createFootstepSurfaceResolver(createLevel(ASHEN_FOUNDATION));

  it('maps level surface kinds to footstep materials (underground = crypt)', () => {
    expect(footstepSurfaceOf('grass')).toBe('grass');
    expect(footstepSurfaceOf('stone')).toBe('stone');
    expect(footstepSurfaceOf('wood')).toBe('wood');
    expect(footstepSurfaceOf('underground')).toBe('crypt');
  });

  it('resolves the material by area: A stone, B grass, C stone, D crypt', () => {
    expect(surfaceAt(0, 0)).toBe('stone');
    expect(surfaceAt(20, 6)).toBe('grass');
    expect(surfaceAt(50, 22)).toBe('stone');
    expect(surfaceAt(65, 40)).toBe('crypt');
  });

  it('switches exactly at the area boundary and falls back to grass outside areas', () => {
    // A（円 r=8）の縁
    expect(surfaceAt(7.9, 0)).toBe('stone');
    expect(surfaceAt(8.1, 0)).toBe('grass');
    // D（矩形 x 60..78, z 36..52）の入口
    expect(surfaceAt(65, 36.1)).toBe('crypt');
    expect(surfaceAt(65, 35.9)).toBe('grass');
    expect(surfaceAt(78.1, 45)).toBe('grass');
  });
});
