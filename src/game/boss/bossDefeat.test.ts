import { describe, expect, it } from 'vitest';
import {
  BOSS_DEFEAT,
  BOSS_DEFEAT_FRAMES,
  deathClipProgress,
  defeatCuesBetween,
  defeatDissolve,
  defeatEmber,
  defeatFogDensity,
} from './bossDefeat';

describe('boss defeat timeline (pure)', () => {
  it('fires the cues at F0 / F62 / F72 / F150 / F300 / F360', () => {
    expect(BOSS_DEFEAT_FRAMES).toEqual({
      defeat: 0,
      touchdown: 62,
      collapse: 72,
      text: 150,
      fogClear: 300,
      bonfire: 300,
      control: 360,
    });
    // from は含まず to は含む。F300 は霧の解除 → 篝火の順
    expect(defeatCuesBetween(-1, 0)).toEqual(['defeat']);
    expect(defeatCuesBetween(299, 300)).toEqual(['fogClear', 'bonfire']);
    expect(defeatCuesBetween(300, 359)).toEqual([]);
    expect(defeatCuesBetween(-1, 400)).toHaveLength(7);
  });

  it('keeps the hit stop and slow-motion lengths of section 8.4 (F12 / F72)', () => {
    expect(BOSS_DEFEAT.hitStopFrames).toBe(12);
    expect(BOSS_DEFEAT.hitStopFrames + BOSS_DEFEAT.slowFrames).toBe(BOSS_DEFEAT.collapse);
  });

  it('plays Death01 from F12 and holds it still during the hit stop', () => {
    expect(deathClipProgress(0)).toBe(0);
    expect(deathClipProgress(12)).toBe(0);
    expect(deathClipProgress(42)).toBeCloseTo(0.5);
    expect(deathClipProgress(72)).toBe(1);
    expect(deathClipProgress(400)).toBe(1);
  });

  it('dissolves over 90 frames from F72 to F162', () => {
    expect(defeatDissolve(72)).toBe(0);
    expect(defeatDissolve(117)).toBeCloseTo(0.5);
    expect(defeatDissolve(162)).toBe(1);
    expect(defeatDissolve(500)).toBe(1);
  });

  it('thickens the fog while the boss crumbles and clears it from 0.04 to 0.015 over F300-F360', () => {
    expect(defeatFogDensity(-1)).toBe(0.015);
    expect(defeatFogDensity(0)).toBeCloseTo(0.015);
    expect(defeatFogDensity(72)).toBeCloseTo(0.04);
    expect(defeatFogDensity(300)).toBeCloseTo(0.04);
    expect(defeatFogDensity(330)).toBeCloseTo(0.0275);
    expect(defeatFogDensity(360)).toBeCloseTo(0.015);
    expect(defeatFogDensity(1000)).toBeCloseTo(0.015);
  });

  it('lights the embers while the boss falls (F12-F72)', () => {
    expect(defeatEmber(0)).toBe(0);
    expect(defeatEmber(12)).toBe(0);
    expect(defeatEmber(42)).toBeCloseTo(0.5);
    expect(defeatEmber(72)).toBe(1);
  });
});
