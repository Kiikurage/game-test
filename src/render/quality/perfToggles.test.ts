import { describe, expect, it } from 'vitest';
import {
  applyPerfToggles,
  parseFlatMatGroups,
  parsePerfToggles,
  QUALITY_PRESETS,
  selectQuality,
} from './presets';

describe('parsePerfToggles', () => {
  it('is all off by default', () => {
    expect(Object.values(parsePerfToggles('')).some(Boolean)).toBe(false);
    expect(Object.values(parsePerfToggles('?quality=low&debug&scale=0.5')).some(Boolean)).toBe(
      false,
    );
  });

  it('reads each toggle, treating =0 as off', () => {
    const t = parsePerfToggles(
      '?perf&bench&noshadow&nobloom&nomsaa&nograss&noparticles&nolights&flatmat&notaau&taau=0.6',
    );
    const { flatMatGroups, ...flags } = t;
    expect(Object.values(flags).every(Boolean)).toBe(true);
    expect(flatMatGroups).toBeNull(); // ?flatmat だけなら全グループ
    expect(parsePerfToggles('?noshadow=0').noShadow).toBe(false);
  });

  it('turns on the perf HUD with ?bench', () => {
    const t = parsePerfToggles('?bench');
    expect(t.bench).toBe(true);
    expect(t.perf).toBe(true);
  });

  it('reads flatmat groups', () => {
    const t = parsePerfToggles('?flatmat=terrain,masonry,unknown');
    expect(t.flatMat).toBe(true);
    expect([...(t.flatMatGroups ?? [])].sort()).toEqual(['masonry', 'terrain']);
    expect(parseFlatMatGroups('all')).toBeNull();
    expect(parseFlatMatGroups('1')).toBeNull();
    expect(parsePerfToggles('?flatmat=0').flatMat).toBe(false);
  });
});

describe('applyPerfToggles', () => {
  it('returns the preset itself when nothing applies', () => {
    expect(applyPerfToggles(QUALITY_PRESETS.medium, parsePerfToggles(''))).toBe(
      QUALITY_PRESETS.medium,
    );
  });

  it('turns off bloom, msaa, grass and the bonfire light on the selected preset', () => {
    const { preset } = selectQuality('?quality=high&nobloom&nomsaa&nograss&nolights', {
      isMobile: false,
    });
    expect(preset.bloom).toBe(false);
    expect(preset.bloomStrength).toBe(0);
    expect(preset.msaa).toBe(false);
    expect(preset.grassCount).toBe(0);
    expect(preset.particles.bonfireLight).toBe(false);
    // 他の項目は変えない
    expect(preset.shadowMapSize).toBe(QUALITY_PRESETS.high.shadowMapSize);
  });
});

describe('TAAU toggles (#318)', () => {
  it('?notaau falls back to MSAA on high, and ?nomsaa still wins', () => {
    const hints = { isMobile: false };
    const off = selectQuality('?quality=high&notaau', hints).preset;
    expect(off.taauScale).toBe(0);
    expect(off.msaa).toBe(true);
    expect(selectQuality('?quality=high&notaau&nomsaa', hints).preset.msaa).toBe(false);
  });

  it('?taau= overrides the scale only where TAAU is on', () => {
    const hints = { isMobile: false };
    expect(selectQuality('?quality=high&taau=0.5', hints).preset.taauScale).toBe(0.5);
    expect(selectQuality('?quality=high&taau=2', hints).preset.taauScale).toBe(0.75);
    expect(selectQuality('?quality=medium&taau=0.5', hints).preset).toBe(QUALITY_PRESETS.medium);
    expect(selectQuality('?quality=medium&notaau', hints).preset).toBe(QUALITY_PRESETS.medium);
  });
});

describe('mobile defaults (#231)', () => {
  it('keeps the PC preset untouched and makes medium lighter than before', () => {
    // #318: high は MSAA の代わりに TAAU
    expect(QUALITY_PRESETS.high.msaa).toBe(false);
    expect(QUALITY_PRESETS.high.taauScale).toBe(0.75);
    expect(QUALITY_PRESETS.high.resolution.maxPixels).toBe(4_000_000);
    expect(QUALITY_PRESETS.high.shadowMapSize).toBe(4096);
    expect(QUALITY_PRESETS.medium.msaa).toBe(false);
    expect(QUALITY_PRESETS.medium.resolution.maxPixels).toBe(1_100_000);
  });
});
