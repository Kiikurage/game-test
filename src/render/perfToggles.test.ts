import { describe, expect, it } from 'vitest';
import { applyPerfToggles, parsePerfToggles } from './perfToggles';
import { QUALITY_PRESETS, selectQuality } from './quality';

describe('parsePerfToggles', () => {
  it('is all off by default', () => {
    expect(Object.values(parsePerfToggles('')).some(Boolean)).toBe(false);
    expect(Object.values(parsePerfToggles('?quality=low&debug&scale=0.5')).some(Boolean)).toBe(
      false,
    );
  });

  it('reads each toggle, treating =0 as off', () => {
    const t = parsePerfToggles(
      '?perf&noshadow&nobloom&nomsaa&nograss&noparticles&nolights&flatmat',
    );
    expect(Object.values(t).every(Boolean)).toBe(true);
    expect(parsePerfToggles('?noshadow=0').noShadow).toBe(false);
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

describe('mobile defaults (#231)', () => {
  it('keeps the PC preset untouched and makes medium lighter than before', () => {
    expect(QUALITY_PRESETS.high.msaa).toBe(true);
    expect(QUALITY_PRESETS.high.resolution.maxPixels).toBe(4_000_000);
    expect(QUALITY_PRESETS.high.shadowMapSize).toBe(4096);
    expect(QUALITY_PRESETS.medium.msaa).toBe(false);
    expect(QUALITY_PRESETS.medium.resolution.maxPixels).toBe(1_100_000);
  });
});
