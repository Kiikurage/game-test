import { describe, expect, it } from 'vitest';
import {
  APPEAR_FRAMES,
  DEFAULT_BLINK,
  FADE_OUT_FRAMES,
  TelegraphClock,
  appearProgress,
  blinkLevel,
} from './timing';

describe('appearProgress', () => {
  it('goes from 0 to 1 over exactly 8 frames', () => {
    expect(APPEAR_FRAMES).toBe(8);
    expect(appearProgress(0)).toBe(0);
    expect(appearProgress(8)).toBe(1);
    expect(appearProgress(20)).toBe(1);
    expect(appearProgress(-3)).toBe(0);
  });

  it('is monotonic and eases out', () => {
    let prev = -1;
    for (let f = 0; f <= 8; f++) {
      const v = appearProgress(f);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(appearProgress(4)).toBeGreaterThan(0.5);
  });
});

describe('blinkLevel', () => {
  const p = DEFAULT_BLINK;

  it('stays fully bright until the blink starts', () => {
    for (let f = 0; f < p.startFrame; f++) expect(blinkLevel(f, p)).toBe(1);
  });

  it('alternates between bright and minLevel with the configured period', () => {
    const onMid = p.startFrame + (p.periodFrames * p.duty) / 2;
    const offMid = p.startFrame + p.periodFrames * (p.duty + (1 - p.duty) / 2);
    expect(blinkLevel(onMid, p)).toBeCloseTo(1, 5);
    expect(blinkLevel(offMid, p)).toBeCloseTo(p.minLevel, 5);
    // 1 周期後に同じ値
    expect(blinkLevel(onMid + p.periodFrames, p)).toBeCloseTo(blinkLevel(onMid, p), 9);
    expect(blinkLevel(offMid + p.periodFrames * 3, p)).toBeCloseTo(p.minLevel, 5);
  });

  it('keeps the blink at or below 3Hz and within [minLevel, 1]', () => {
    expect(60 / p.periodFrames).toBeLessThanOrEqual(3);
    for (let f = 0; f < 200; f += 0.5) {
      const v = blinkLevel(f, p);
      expect(v).toBeGreaterThanOrEqual(p.minLevel - 1e-9);
      expect(v).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('honours custom contrast and period', () => {
    const custom = { ...p, periodFrames: 30, minLevel: 0, duty: 0.4, startFrame: 0 };
    expect(blinkLevel(6, custom)).toBeCloseTo(1, 5);
    expect(blinkLevel(24, custom)).toBeCloseTo(0, 5);
    expect(blinkLevel(36, custom)).toBeCloseTo(1, 5);
  });
});

describe('TelegraphClock', () => {
  it('is hidden until shown, then appears in 8 frames', () => {
    const c = new TelegraphClock();
    expect(c.visible).toBe(false);
    expect(c.appear).toBe(0);
    c.show();
    expect(c.phase).toBe('appearing');
    c.advance(4);
    expect(c.appear).toBeGreaterThan(0);
    expect(c.appear).toBeLessThan(1);
    c.advance(4);
    expect(c.phase).toBe('holding');
    expect(c.appear).toBe(1);
  });

  it('fades out over 4 frames and then hides', () => {
    const c = new TelegraphClock();
    c.show();
    c.advance(30);
    c.hide();
    expect(c.phase).toBe('fading');
    c.advance(FADE_OUT_FRAMES / 2);
    expect(c.fade).toBeCloseTo(0.5, 5);
    c.advance(FADE_OUT_FRAMES);
    expect(c.visible).toBe(false);
    expect(c.fade).toBe(0);
  });

  it('converts seconds to 60Hz frames and ignores repeated show()', () => {
    const c = new TelegraphClock();
    c.show();
    c.advanceSeconds(1 / 60);
    expect(c.frame).toBeCloseTo(1, 9);
    c.show();
    expect(c.frame).toBeCloseTo(1, 9);
    c.advanceSeconds(0.5);
    expect(c.frame).toBeCloseTo(31, 9);
  });

  it('setFrame places the clock into appearing or holding', () => {
    const c = new TelegraphClock();
    c.setFrame(3);
    expect(c.phase).toBe('appearing');
    c.setFrame(40);
    expect(c.phase).toBe('holding');
    expect(c.blinkValue).toBeGreaterThanOrEqual(DEFAULT_BLINK.minLevel);
  });
});
