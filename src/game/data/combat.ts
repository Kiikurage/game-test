import type { FrameWindow } from './frameWindow';

/** ガード（2.3 節）・ヒットストップ（4.1）・ダメージ計算（4.2）・強靭度（4.3）・ノックバック（4.4）。初期値で調整対象。 */

// ---- ガード ----

export const GUARD = {
  /** 構え完了まで（この間はガード判定なし）。 */
  raiseFrames: 6,
  /** 解除時の硬直。 */
  releaseRecoveryFrames: 8,
  /** 防げる正面の角度（度、±60°）。 */
  frontArcDeg: 120,
  /** ガード成功時の HP ダメージ = 攻撃ダメージの 10%（切り捨て、最低 0）。 */
  chipPercent: 10,
  /** ジャストガード: 構え完了（F6）から 10F 以内 = F6–F15。スタミナ 50%・削り 0。 */
  justWindow: { start: 6, end: 15 } satisfies FrameWindow,
  justStaminaPercent: 50,
  /** ガード崩し: 行動不能のフレーム数と、その間の被ダメージ倍率。スタミナは 0 のまま回復待機 60F。 */
  breakFrames: 54,
  breakDamageMultiplier: 1.5,
  /** ガード被弾時のスタン。 */
  stunFrames: 10,
  /** ガードカウンターを出せる、被ガード後のフレーム数。 */
  counterWindowFrames: 30,
  /** ガード中からロールへは F1 から即時キャンセル可。 */
  rollCancelFrom: 1,
} as const;

// ---- ヒットストップ（4.1）----

export const HIT_STOP = {
  playerLight: 4,
  playerHeavy: 8,
  playerHeavyCharged: 12,
  enemyHitsPlayer: 6,
  bossHitsPlayer: 8,
  guardSuccess: 4,
  justGuard: 8,
  /** 撃破（トドメ）: ヒットストップ + スローモーション（0.3 倍速で 30F）。 */
  kill: 12,
  /** ロール成功（無敵中に通過）はヒットストップなし。 */
  rollDodge: 0,
} as const;

export const KILL_SLOWMO = { timeScale: 0.3, frames: 30 } as const;
/** ボス撃破（8.4 節）: 0.3 倍速で 60F。 */
export const BOSS_KILL_SLOWMO = { timeScale: 0.3, frames: 60 } as const;

/** ヒットストップに添える演出の長さ（4.1 節）。敵の攻撃がプレイヤーに命中: 赤フラッシュ 4F、ジャストガード: 白い閃光 2F。 */
export const HIT_FLASH = { redFrames: 4, whiteFrames: 2 } as const;
/** フル溜め強攻撃の画面振動の長さ（フレーム）。 */
export const HEAVY_CHARGED_SCREEN_SHAKE_FRAMES = 10;

/** 強攻撃（フル溜め）命中時の画面振動（度）。 */
export const HEAVY_CHARGED_SCREEN_SHAKE_DEG = 0.4;

// ---- ダメージ計算（4.2）----

/** プレイヤーの攻撃ダメージ = 基本攻撃力 × モーション倍率（四捨五入）。 */
export function attackDamage(attackPower: number, multiplier: number): number {
  return Math.round(attackPower * multiplier);
}

/** ガード成功時の HP ダメージ（削り）= 攻撃ダメージの 10%（切り捨て、最低 0）。整数演算で浮動小数の誤差を避ける。 */
export function guardChipDamage(damage: number): number {
  return Math.max(0, Math.floor((damage * GUARD.chipPercent) / 100));
}

/** 強靭度崩し中・ガード崩し中の敵に対する被弾倍率（弱点追撃）。通常は 1.0。 */
export const STAGGERED_DAMAGE_MULTIPLIER = 1.5;

// ---- 強靭度（4.3）----

export const POISE = {
  player: { max: 40, staggerLightFrames: 24, staggerHeavyFrames: 48 },
  hollowSoldier: { max: 50, staggerFrames: 54 },
  shieldbearer: { max: 80, staggerFrames: 54 },
  /** ボスの崩しはフェーズごとに 1 回まで。 */
  boss: { max: 400, staggerFrames: 120 },
  /** 最後の被弾からこのフレーム数で最大値に戻る。崩し後も最大値に戻る。 */
  recoverFrames: 300,
  /** 敵が攻撃の発生〜持続中に得る強靭度。 */
  enemyAttackingBonus: 30,
  /** 未崩しの被弾で敵が受ける軽い仰け反り（加算アニメ、行動は継続）。 */
  enemyFlinchFrames: 12,
} as const;

// ---- ノックバックと被弾後無敵（4.4）----

/** 重い被弾の閾値: 強靭度削りがこの値以上。 */
export const HEAVY_HIT_POISE_THRESHOLD = 50;

export const KNOCKBACK = {
  player: {
    light: { distance: 0.5, flinchFrames: 24 },
    /** 転倒（`Hit_Knockback`）。起き上がり中は F36 まで無敵（被弾後無敵とは別）。 */
    heavy: { distance: 1.5, downFrames: 48, wakeInvulnUntilFrame: 36 },
    guardLight: 0.6,
    guardHeavy: 1.2,
  },
  enemy: { light: 0.3, heavy: 0.8, staggerBreak: 0.8 },
  /** 被弾（未ガード）後の無敵。ガード成功時は付与しない。 */
  postHitInvulnFrames: 18,
} as const;

export function isHeavyHit(poiseDamage: number): boolean {
  return poiseDamage >= HEAVY_HIT_POISE_THRESHOLD;
}
