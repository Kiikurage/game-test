import { PLAYER_ACTIONS } from '../../game/data';

/**
 * 強攻撃の溜めのフィードバック（#200）: 武器の刃の発光の強さと色。
 *
 * 敵の予備動作（`telegraph/weaponTelegraph`: 通常 = 白寄り・弱、強 / ガード不能 = 赤橙・強）と取り違えないよう、
 * プレイヤーは暖色の金（琥珀 → 淡い金白）で、「徐々に強まる」→「フル溜めの瞬間に一度だけ閃く」→「保持中は落ち着いて脈打つ」。
 * 追加のメッシュ・パスは無く、`characterLight` の武器の発光ユニフォームを書き換えるだけ。
 */
export interface ChargeGlow {
  /** 発光の強さ（0..1。`CharacterLight.setWeaponTelegraph` の amount）。 */
  readonly amount: number;
  /** 発光色（sRGB 0xRRGGBB）。 */
  readonly color: number;
}

/** 溜め中の色（琥珀の金）。 */
export const CHARGE_COLOR = 0xff9a2a;
/** フル溜めの閃きの色（淡い金白）。 */
export const CHARGE_FLASH_COLOR = 0xfff0b8;

export const CHARGE_GLOW = {
  /** 溜め開始直後の発光量。 */
  start: 0.3,
  /** フル溜めの 1 ステップ手前（29F）の発光量。 */
  beforeFull: 0.6,
  /** フル溜めの閃きのピーク。 */
  flashPeak: 1,
  /** 閃きが保持レベルへ落ち着くまでのフレーム数。 */
  flashFrames: 10,
  /** フル溜め保持中の発光量（脈動の中心）。 */
  hold: 0.7,
  /** 保持中の脈動の深さと周期（F）。 */
  holdPulse: 0.1,
  holdPulseFrames: 36,
  /** 離して振り下ろす間（`heavyCharged` の頭）に発光が消えるまでのフレーム数。 */
  releaseFadeFrames: 24,
} as const;

/** フル溜めに達する溜めのステップ数（30）。 */
export const FULL_CHARGE_FRAMES = PLAYER_ACTIONS.heavyCharged.chargeFrames;

const NONE: ChargeGlow = { amount: 0, color: CHARGE_COLOR };

function lerpColor(a: number, b: number, t: number): number {
  const ch = (shift: number): number =>
    Math.round(((a >> shift) & 0xff) * (1 - t) + ((b >> shift) & 0xff) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** 溜めのステップ数 `frame`（F1 起点、`heavyCharge` 状態）での発光。 */
export function chargingGlow(frame: number): ChargeGlow {
  if (frame < 1) return NONE;
  const g = CHARGE_GLOW;
  if (frame < FULL_CHARGE_FRAMES) {
    // 序盤は控えめ、終盤に向けて加速する（イーズイン）。フル溜めの閃きとの落差を作る
    const t = (frame - 1) / (FULL_CHARGE_FRAMES - 2);
    return { amount: g.start + (g.beforeFull - g.start) * t * t, color: CHARGE_COLOR };
  }
  const since = frame - FULL_CHARGE_FRAMES; // 0 = 到達したステップ
  const settle = Math.min(1, since / g.flashFrames);
  const ease = 1 - (1 - settle) * (1 - settle);
  const pulse = since > g.flashFrames ? Math.sin((2 * Math.PI * since) / g.holdPulseFrames) : 0;
  const hold = g.hold + g.holdPulse * pulse;
  const amount = g.flashPeak + (hold - g.flashPeak) * ease;
  // 閃きの間は金白、落ち着くと金へ戻る
  return { amount, color: lerpColor(CHARGE_FLASH_COLOR, CHARGE_COLOR, ease) };
}

/** フル溜めで離した直後（`heavyCharged` の F1 起点）。振り下ろしに向けて発光が消える。 */
export function releasedGlow(frame: number): ChargeGlow {
  const g = CHARGE_GLOW;
  if (frame < 1 || frame > g.releaseFadeFrames) return NONE;
  return { amount: g.hold * (1 - frame / g.releaseFadeFrames), color: CHARGE_COLOR };
}

/** プレイヤーの状態と状態フレームから、武器の発光を求める（溜め・フル溜めの振り下ろし以外は 0）。 */
export function heavyChargeGlow(state: string, stateFrame: number): ChargeGlow {
  if (state === 'heavyCharge') return chargingGlow(stateFrame);
  if (state === 'heavyCharged') return releasedGlow(stateFrame);
  return NONE;
}
