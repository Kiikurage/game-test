import { describe, expect, it } from 'vitest';
import { WEAPON_TELEGRAPH } from '../telegraph/weaponTelegraph';
import {
  CHARGE_COLOR,
  CHARGE_FLASH_COLOR,
  CHARGE_GLOW,
  FULL_CHARGE_FRAMES,
  chargingGlow,
  heavyChargeGlow,
  releasedGlow,
} from './heavyChargeGlow';

describe('heavy charge glow', () => {
  it('溜めの進行に従って単調に強まる（F1 → F29）', () => {
    let prev = 0;
    for (let f = 1; f < FULL_CHARGE_FRAMES; f++) {
      const a = chargingGlow(f).amount;
      expect(a, `F${f}`).toBeGreaterThan(prev);
      prev = a;
    }
    expect(prev).toBeLessThan(CHARGE_GLOW.hold);
  });

  it('フル溜め到達の F30 で閃く: ピークで金白、直前（F29）より大きく跳ねる', () => {
    const before = chargingGlow(FULL_CHARGE_FRAMES - 1);
    const flash = chargingGlow(FULL_CHARGE_FRAMES);
    expect(flash.amount).toBe(CHARGE_GLOW.flashPeak);
    expect(flash.color).toBe(CHARGE_FLASH_COLOR);
    expect(flash.amount - before.amount).toBeGreaterThan(0.35);
  });

  it('閃きのあとは保持レベルへ落ち着き、金へ戻って脈打つ', () => {
    const settled = chargingGlow(FULL_CHARGE_FRAMES + CHARGE_GLOW.flashFrames);
    expect(settled.amount).toBeCloseTo(CHARGE_GLOW.hold, 5);
    expect(settled.color).toBe(CHARGE_COLOR);
    for (let f = FULL_CHARGE_FRAMES + 12; f < FULL_CHARGE_FRAMES + 100; f++) {
      const a = chargingGlow(f).amount;
      expect(a).toBeGreaterThanOrEqual(CHARGE_GLOW.hold - CHARGE_GLOW.holdPulse - 1e-9);
      expect(a).toBeLessThanOrEqual(CHARGE_GLOW.hold + CHARGE_GLOW.holdPulse + 1e-9);
    }
  });

  it('フル溜めで離すと振り下ろしの間に消える。溜めなし・他の状態では光らない', () => {
    expect(releasedGlow(1).amount).toBeGreaterThan(0);
    expect(releasedGlow(CHARGE_GLOW.releaseFadeFrames + 1).amount).toBe(0);
    expect(heavyChargeGlow('heavy', 5).amount).toBe(0);
    expect(heavyChargeGlow('light1', 5).amount).toBe(0);
    expect(heavyChargeGlow('idle', 0).amount).toBe(0);
    expect(heavyChargeGlow('heavyCharge', 10).amount).toBeGreaterThan(0);
    expect(heavyChargeGlow('heavyCharged', 3).amount).toBeGreaterThan(0);
  });

  it('敵のテレグラフの色（赤橙・白）とは別の暖色の金', () => {
    const channels = (c: number): [number, number, number] => [c >> 16, (c >> 8) & 255, c & 255];
    for (const enemy of Object.values(WEAPON_TELEGRAPH)) {
      const [er, eg, eb] = channels(enemy.color);
      const [pr, pg, pb] = channels(CHARGE_COLOR);
      // 敵: 赤橙は G が低く、白は B が高い。プレイヤー: G が中間で B が低い金
      const distance = Math.hypot(er - pr, eg - pg, eb - pb);
      expect(distance).toBeGreaterThan(60);
    }
  });
});
