import { describe, expect, it } from 'vitest';
import { analyzeHalfFloatRgba } from './postprocess';

describe('analyzeHalfFloatRgba', () => {
  it('counts NaN / Inf and reports the finite max of RGB', () => {
    // 半精度: 1.0 = 0x3c00, 3.0 = 0x4200, +Inf = 0x7c00, NaN = 0x7e00, 負値は無視
    const data = [0x3c00, 0x4200, 0, 0x3c00, 0x7c00, 0x7e00, 0xbc00, 0x7e00];
    expect(analyzeHalfFloatRgba(data)).toEqual({ nonFinite: 3, maxRgb: 3 });
  });
});
