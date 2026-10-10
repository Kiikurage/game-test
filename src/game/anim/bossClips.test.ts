import { describe, expect, it } from 'vitest';
import { bossClipEvents, findBossClipEvents } from './bossClips';
import { playbackRate, simFrameToClipTime, swingEndElapsed } from './eventMarkers';

/**
 * 実クリップ（`animations.glb`）で武器が当たって見えるフレーム（#214）。
 * 実クリップ上の武器の位置・速度を計測し、振り抜きの最速点（斧の刃先が体の前を通る・最下点に達する・突きが伸びきる）に合わせた。
 * `clipHitFrame` はここから外れていないこと（外すなら計測し直す）。値の根拠は docs/boss-moves-45.md「クリップとの照合」。
 */
const CONTACT: Readonly<Record<string, number>> = {
  // 大上段: Sword_Heavy_Combo の 2 打目（斧が頭上から最下点 y=1.4m に達する）。0〜16 は 1 打目（踏み込みの突き）で予備動作に含めない
  'boss.overhead.1': 28,
  // 薙ぎ払い: Sword_Regular_B（右から左へ体の前を通る最速点）と Melee_Hook（戻りの振り抜き）
  'boss.sweep.1': 8,
  'boss.sweep.2': 7,
  // 三連撃: Sword_Regular_Combo の 斬り上げ（34）→ 斬り下ろし（7）→ 突き（48）
  'boss.combo3.1': 34,
  'boss.combo3.2': 7,
  'boss.combo3.3': 48,
  // 盾打ち: Shield_Dash は踏み出しの突き出し（3F で盾が最前）から始まる。追撃は大上段と同じ最下点
  'boss.shieldBash.1': 3,
  'boss.shieldBash.2': 28,
  // 跳躍: Jump_Start の踏み切りは 0〜2F（40F まで空中ポーズ）。着地の接地は Jump_Land の 2F
  'boss.leap.1': 40,
};

describe('ボス技のクリップ: 当たりフレームは実クリップの振り抜きに合わせてある', () => {
  // 技 6・7（#77）の動作は別チケットで合わせる。ここは技 1〜5 だけ
  for (const entry of bossClipEvents.entries.filter(
    (e) => e.id.replace(/\.p[12]$/, '') in CONTACT,
  )) {
    const key = entry.id.replace(/\.p[12]$/, '');
    it(`${entry.id}: clipHitFrame = ${CONTACT[key]}`, () => {
      expect(entry.clipHitFrame).toBe(CONTACT[key]);
    });
  }

  it('hitStart（発生 + 1）の時刻は、どの技・フェーズでもクリップの当たりフレームに来る', () => {
    for (const e of bossClipEvents.entries.filter((x) => x.clipHitFrame !== undefined)) {
      const hit = e.clipHitFrame ?? 0;
      expect(simFrameToClipTime(e, e.spec.startup + 1)).toBeCloseTo(hit / e.clipFps, 6);
    }
  });

  it('跳躍: 踏み切り（クリップの 0〜2F）は滞空が始まる段 F43 の直前に終わる', () => {
    const e = findBossClipEvents('boss.leap.1.p1');
    if (!e) throw new Error('missing');
    // 地上の間は先頭の屈みを保持し、F43 の頃に踏み切りが終わって空中のポーズへ
    expect(simFrameToClipTime(e, 41)).toBe(0);
    expect(simFrameToClipTime(e, 44)).toBeGreaterThan(2 / 30);
    // 着地（hitStart）で戻りクリップ（Jump_Land）へ。接地の 2F から始める
    expect(swingEndElapsed(e)).toBeCloseTo(e.spec.startup, 6);
    expect(e.tail?.startFrame).toBe(2);
  });

  it('大上段・盾打ちの追撃は、振り下ろしのあとは最下点で止める（次の打撃の動きを再生しない）', () => {
    for (const id of ['boss.overhead.1.p1', 'boss.overhead.1.p2', 'boss.shieldBash.2.p1']) {
      const e = findBossClipEvents(id);
      if (!e) throw new Error('missing');
      expect(e.clipRange.endFrame).toBeLessThanOrEqual(30);
      expect(e.clipRange.startFrame).toBeGreaterThanOrEqual(17); // 1 打目の突き（〜16F）を含めない
      expect(playbackRate(e)).toBeLessThan(1);
    }
  });
});
