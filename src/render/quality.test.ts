import { describe, expect, it } from 'vitest';
import { detectQuality, parseFixedScale, parseQualityParam, selectQuality } from './quality';

describe('parseQualityParam', () => {
  it('accepts the three levels', () => {
    expect(parseQualityParam('?quality=low')).toBe('low');
    expect(parseQualityParam('?debug&quality=medium')).toBe('medium');
    expect(parseQualityParam('?quality=high')).toBe('high');
  });

  it('returns null for missing or invalid values', () => {
    expect(parseQualityParam('')).toBeNull();
    expect(parseQualityParam('?quality=ultra')).toBeNull();
    expect(parseQualityParam('?debug')).toBeNull();
  });
});

describe('detectQuality', () => {
  it('uses high on desktop', () => {
    expect(detectQuality({ isMobile: false })).toBe('high');
  });

  it('uses medium on capable phones and low on weak ones', () => {
    expect(detectQuality({ isMobile: true, hardwareConcurrency: 8, deviceMemory: 8 })).toBe(
      'medium',
    );
    expect(detectQuality({ isMobile: true })).toBe('medium');
    expect(detectQuality({ isMobile: true, hardwareConcurrency: 4 })).toBe('low');
    expect(detectQuality({ isMobile: true, hardwareConcurrency: 8, deviceMemory: 2 })).toBe('low');
  });
});

describe('selectQuality', () => {
  it('lets the URL override the detected level', () => {
    const s = selectQuality('?quality=low', { isMobile: false });
    expect(s.preset.level).toBe('low');
    expect(s.targetFps).toBe(60);
  });

  it('targets 30fps on mobile', () => {
    expect(selectQuality('', { isMobile: true }).targetFps).toBe(30);
  });
});

describe('parseFixedScale', () => {
  it('parses a valid scale and rejects bad values', () => {
    expect(parseFixedScale('?scale=0.75')).toBe(0.75);
    expect(parseFixedScale('?scale=1')).toBe(1);
    expect(parseFixedScale('')).toBeNull();
    expect(parseFixedScale('?scale=2')).toBeNull();
    expect(parseFixedScale('?scale=abc')).toBeNull();
  });
});
