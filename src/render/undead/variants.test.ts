import { describe, expect, it } from 'vitest';
import {
  DISSOLVE_FRAMES,
  OUTFIT_MESHES,
  UNDEAD_VARIANTS,
  UNDEAD_VARIANT_IDS,
  clampProgress,
  createRng,
  dissolveProgress,
  parseVariantId,
  pickVariantId,
} from './variants';

describe('undead variants', () => {
  it('defines at least three variants whose ids match their keys', () => {
    expect(UNDEAD_VARIANT_IDS.length).toBeGreaterThanOrEqual(3);
    for (const id of UNDEAD_VARIANT_IDS) expect(UNDEAD_VARIANTS[id].id).toBe(id);
  });

  it('keeps skin dark and desaturated (no bright or saturated tones)', () => {
    for (const v of Object.values(UNDEAD_VARIANTS)) {
      const r = (v.skin >> 16) & 0xff;
      const g = (v.skin >> 8) & 0xff;
      const b = v.skin & 0xff;
      expect(Math.max(r, g, b)).toBeLessThanOrEqual(0x80);
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(0x28);
    }
  });

  it('gives every variant a distinct silhouette or outfit', () => {
    const keys = new Set(
      Object.values(UNDEAD_VARIANTS).map((v) =>
        [v.build.width, v.build.height, v.hood, v.pauldron, v.belts].join('/'),
      ),
    );
    expect(keys.size).toBe(UNDEAD_VARIANT_IDS.length);
  });

  it('references outfit meshes that exist in knight.glb', () => {
    expect(OUTFIT_MESHES.hood).toEqual(['Male_Ranger_Head_Hood']);
    expect(OUTFIT_MESHES.belts).toHaveLength(2);
  });

  it('never picks the same variant twice in a row', () => {
    const rand = createRng(1234);
    let prev = pickVariantId(rand);
    for (let i = 0; i < 500; i++) {
      const next = pickVariantId(rand, prev);
      expect(next).not.toBe(prev);
      prev = next;
    }
  });

  it('eventually picks every variant', () => {
    const rand = createRng(7);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(pickVariantId(rand));
    expect(seen.size).toBe(UNDEAD_VARIANT_IDS.length);
  });

  it('handles rand() returning values at the edges', () => {
    expect(() => pickVariantId(() => 0)).not.toThrow();
    expect(() => pickVariantId(() => 0.9999999)).not.toThrow();
  });

  it('parses variant ids from untrusted input', () => {
    expect(parseVariantId('gaunt')).toBe('gaunt');
    expect(parseVariantId('nope')).toBeUndefined();
    expect(parseVariantId(null)).toBeUndefined();
  });

  it('createRng is deterministic and within [0, 1)', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('dissolve progress', () => {
  it('clamps to 0..1 and treats NaN as not dissolved', () => {
    expect(clampProgress(-0.5)).toBe(0);
    expect(clampProgress(0.25)).toBe(0.25);
    expect(clampProgress(3)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
    expect(clampProgress(Infinity)).toBe(1);
  });

  it('maps elapsed frames to progress (60F soldier, 90F boss)', () => {
    expect(dissolveProgress(0, DISSOLVE_FRAMES.soldier)).toBe(0);
    expect(dissolveProgress(30, DISSOLVE_FRAMES.soldier)).toBe(0.5);
    expect(dissolveProgress(60, DISSOLVE_FRAMES.soldier)).toBe(1);
    expect(dissolveProgress(45, DISSOLVE_FRAMES.boss)).toBe(0.5);
    expect(dissolveProgress(500, DISSOLVE_FRAMES.boss)).toBe(1);
    expect(dissolveProgress(-3, DISSOLVE_FRAMES.boss)).toBe(0);
  });

  it('treats a non-positive duration as already finished', () => {
    expect(dissolveProgress(0, 0)).toBe(1);
  });
});
