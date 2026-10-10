import { describe, expect, it } from 'vitest';
import { GUARD } from '../data';
import {
  DEFAULT_GUARD_PARAMS,
  GuardCounterWindow,
  guardOutcomeAt,
  isWithinGuardArc,
} from './guard';

describe('guardOutcomeAt（構え完了・ジャストガード窓）', () => {
  const p = DEFAULT_GUARD_PARAMS;

  it('既定値は仕様書 2.3 節（F6 で構え完了、ジャストは F6–F15）', () => {
    expect(p.raiseFrames).toBe(6);
    expect(p.justWindow).toEqual({ start: 6, end: 15 });
    expect(p.releaseFrames).toBe(8);
    expect(p.frontArcDeg).toBe(120);
    expect(p.stunFrames).toBe(10);
    expect(p.counterWindowFrames).toBe(30);
    expect(p.breakFrames).toBe(54);
  });

  it('F5 まではガード判定なし、F6 から有効（構え完了）', () => {
    expect(guardOutcomeAt(1, p)).toBe('none');
    expect(guardOutcomeAt(5, p)).toBe('none');
    expect(guardOutcomeAt(6, p)).toBe('just');
  });

  it('ジャストガードは F6–F15、F16 からは通常のガード', () => {
    expect(guardOutcomeAt(6, p)).toBe('just');
    expect(guardOutcomeAt(15, p)).toBe('just');
    expect(guardOutcomeAt(16, p)).toBe('guard');
    expect(guardOutcomeAt(120, p)).toBe('guard');
  });

  it('窓・構え完了は外部から差し替えられる（入力補助 11.2 節）', () => {
    const easy = { ...p, raiseFrames: 4, justWindow: { start: 4, end: 21 } };
    expect(guardOutcomeAt(3, easy)).toBe('none');
    expect(guardOutcomeAt(4, easy)).toBe('just');
    expect(guardOutcomeAt(21, easy)).toBe('just');
    expect(guardOutcomeAt(22, easy)).toBe('guard');
  });

  it('GUARD の定数と一致する', () => {
    expect(p.raiseFrames).toBe(GUARD.raiseFrames);
  });
});

describe('isWithinGuardArc（正面 120° = ±60°）', () => {
  /** 原点で向き `yaw` のガード側に対し、正面から右へ `bearingDeg` の方向にいる攻撃者（距離 1.5m）。 */
  function guards(bearingDeg: number, yaw = 0.7): boolean {
    const dir = yaw + (bearingDeg * Math.PI) / 180;
    return isWithinGuardArc(0, 0, yaw, Math.sin(dir) * 1.5, Math.cos(dir) * 1.5, 120);
  }

  it('正面・±30° は防げる', () => {
    expect(guards(0)).toBe(true);
    expect(guards(30)).toBe(true);
    expect(guards(-30)).toBe(true);
  });

  it('ちょうど ±60° は防げる（境界を含む）', () => {
    expect(guards(60)).toBe(true);
    expect(guards(-60)).toBe(true);
    expect(guards(60, 0)).toBe(true);
    expect(guards(-60, Math.PI)).toBe(true);
  });

  it('±60° をわずかに超えると防げない', () => {
    expect(guards(60.1)).toBe(false);
    expect(guards(-60.1)).toBe(false);
    expect(guards(61)).toBe(false);
  });

  it('側面（±90°）・背面（180°）は防げない', () => {
    expect(guards(90)).toBe(false);
    expect(guards(-90)).toBe(false);
    expect(guards(180)).toBe(false);
    expect(guards(135)).toBe(false);
  });

  it('向きの座標系: yaw = 0 で前方は +z、yaw = π/2 で前方は +x', () => {
    expect(isWithinGuardArc(0, 0, 0, 0, 2, 120)).toBe(true);
    expect(isWithinGuardArc(0, 0, 0, 0, -2, 120)).toBe(false);
    expect(isWithinGuardArc(0, 0, Math.PI / 2, 2, 0, 120)).toBe(true);
    expect(isWithinGuardArc(0, 0, Math.PI / 2, -2, 0, 120)).toBe(false);
  });

  it('角度は外部から差し替えられる（例: 180° なら側面まで）', () => {
    const dir = Math.PI / 2;
    expect(isWithinGuardArc(0, 0, 0, Math.sin(dir), Math.cos(dir), 180)).toBe(true);
    expect(isWithinGuardArc(0, 0, 0, Math.sin(dir), Math.cos(dir), 120)).toBe(false);
  });

  it('水平距離 0（真上・真下）は防げる扱い', () => {
    expect(isWithinGuardArc(1, 1, 0, 1, 1, 120)).toBe(true);
  });
});

describe('GuardCounterWindow（被ガード後 30F 以内）', () => {
  it('被弾の次のステップ（1）から 30 まで開き、31 で閉じる', () => {
    const w = new GuardCounterWindow(() => 30);
    expect(w.open).toBe(false);
    w.hit();
    expect(w.open).toBe(false); // 被弾したステップ自体（0）
    w.step();
    expect(w.open).toBe(true);
    for (let i = 2; i <= 30; i++) w.step();
    expect(w.elapsed).toBe(30);
    expect(w.open).toBe(true);
    w.step();
    expect(w.open).toBe(false);
  });

  it('新たな被ガードで窓が延びる。close で閉じる', () => {
    const w = new GuardCounterWindow(() => 30);
    w.hit();
    for (let i = 0; i < 25; i++) w.step();
    w.hit();
    for (let i = 0; i < 10; i++) w.step();
    expect(w.open).toBe(true);
    w.close();
    expect(w.open).toBe(false);
  });

  it('窓の長さは外部から差し替えられる', () => {
    let frames = 30;
    const w = new GuardCounterWindow(() => frames);
    w.hit();
    for (let i = 0; i < 40; i++) w.step();
    expect(w.open).toBe(false);
    frames = 45;
    expect(w.open).toBe(true);
  });
});
