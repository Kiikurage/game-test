/**
 * ガード（2.3 節）・ヒットストップ（4.1）・ダメージ計算（4.2）・強靭度（4.3）・ノックバック（4.4）。
 * 値は `combat.json`（スキーマは下、読み込みは `loadData.ts`）。初期値で調整対象。
 */
import { s, type Infer } from '../../core/schema';
import combatJson from './combat.json';
import { loadData } from './loadData';

const pos = s.number({ min: 0 });
const frames = s.number({ min: 0, integer: true });
const percent = s.number({ min: 0, max: 100 });

export const CombatDataSchema = s.object({
  guard: s.object({
    /** 構え完了まで（この間はガード判定なし）。 */
    raiseFrames: frames,
    /** 解除時の硬直。 */
    releaseRecoveryFrames: frames,
    /** 防げる正面の角度（度、±60° なら 120）。 */
    frontArcDeg: s.number({ min: 0, max: 360 }),
    /** ガード成功時の HP ダメージ = 攻撃ダメージの `chipPercent`%（切り捨て、最低 0）。 */
    chipPercent: percent,
    /** ジャストガード: 構え完了（F6）から 10F 以内 = F6–F15。スタミナ `justStaminaPercent`%・削り 0。 */
    justWindow: s.object({ start: frames, end: frames }),
    justStaminaPercent: percent,
    /** ガード崩し: 行動不能のフレーム数と、その間の被ダメージ倍率。 */
    breakFrames: frames,
    breakDamageMultiplier: pos,
    /** ガード被弾時のスタン。 */
    stunFrames: frames,
    /** ガードカウンターを出せる、被ガード後のフレーム数。 */
    counterWindowFrames: frames,
    /** ガード中からロールへキャンセルできる最初のフレーム。 */
    rollCancelFrom: frames,
  }),
  /** ヒットストップ（4.1）の凍結フレーム数。 */
  hitStop: s.object({
    playerLight: frames,
    playerHeavy: frames,
    playerHeavyCharged: frames,
    /** 致命の一撃（14.3.2 節）。強攻撃より長く止めて、決まった手応えを出す。 */
    playerBackstab: frames,
    enemyHitsPlayer: frames,
    bossHitsPlayer: frames,
    guardSuccess: frames,
    justGuard: frames,
    /** プレイヤーの死亡（8.1 節 F0）とボスの撃破（8.4 節 F0）。 */
    kill: frames,
    /**
     * 雑魚敵の撃破（トドメ）。通常の命中と同程度に短く、スローモーションも入れない（#277 オーナー判断）。
     * 命中側のフレームの方が長ければそちらを使う。
     */
    enemyKill: frames,
    /** ロール成功（無敵中に通過）。 */
    rollDodge: frames,
  }),
  /** ボス撃破（8.4 節）のスロー。雑魚敵の撃破にはスローを入れない（#277）。 */
  bossKillSlowmo: s.object({ timeScale: s.number({ min: 0, max: 1 }), frames }),
  /** ヒットストップに添える演出の長さ（4.1 節）: 被弾の赤フラッシュ、ジャストガードの白い閃光。 */
  hitFlash: s.object({ redFrames: frames, whiteFrames: frames }),
  /** 強靭度崩し中・ガード崩し中の敵に対する被弾倍率（弱点追撃）。 */
  staggeredDamageMultiplier: pos,
  /** 強靭度（4.3）。 */
  poise: s.object({
    player: s.object({ max: pos, staggerLightFrames: frames, staggerHeavyFrames: frames }),
    hollowSoldier: s.object({ max: pos, staggerFrames: frames }),
    shieldbearer: s.object({ max: pos, staggerFrames: frames }),
    /** ボスの崩しはフェーズごとに 1 回まで。 */
    boss: s.object({ max: pos, staggerFrames: frames }),
    /** 最後の被弾からこのフレーム数で最大値に戻る。崩し後も最大値に戻る。 */
    recoverFrames: frames,
    /** 敵が攻撃の発生〜持続中に得る強靭度。 */
    enemyAttackingBonus: pos,
    /** 未崩しの被弾で敵が受ける軽い仰け反り（加算アニメ、行動は継続）。 */
    enemyFlinchFrames: frames,
  }),
  /** 重い被弾の閾値: 強靭度削りがこの値以上。 */
  heavyHitPoiseThreshold: pos,
  /** ノックバックと被弾後無敵（4.4）。距離は m。 */
  knockback: s.object({
    player: s.object({
      light: s.object({ distance: pos, flinchFrames: frames }),
      /** 転倒（`Hit_Knockback`）。起き上がり中は F`wakeInvulnUntilFrame` まで無敵（被弾後無敵とは別）。 */
      heavy: s.object({ distance: pos, downFrames: frames, wakeInvulnUntilFrame: frames }),
      guardLight: pos,
      guardHeavy: pos,
    }),
    enemy: s.object({ light: pos, heavy: pos, staggerBreak: pos }),
    /** 被弾（未ガード）後の無敵。ガード成功時は付与しない。 */
    postHitInvulnFrames: frames,
  }),
  /** 扇形の攻撃の壁越し判定の始点の高さ（m）。扇形の原点は足元なので胸の高さへ持ち上げる。 */
  sectorRayHeight: pos,
});
export type CombatData = Infer<typeof CombatDataSchema>;

const data = loadData(CombatDataSchema, combatJson, 'combat.json');

export const GUARD = data.guard;
export const HIT_STOP = data.hitStop;
export const BOSS_KILL_SLOWMO = data.bossKillSlowmo;
export const HIT_FLASH = data.hitFlash;
export const STAGGERED_DAMAGE_MULTIPLIER = data.staggeredDamageMultiplier;
export const POISE = data.poise;
export const HEAVY_HIT_POISE_THRESHOLD = data.heavyHitPoiseThreshold;
export const KNOCKBACK = data.knockback;
export const SECTOR_RAY_HEIGHT = data.sectorRayHeight;

/** プレイヤーの攻撃ダメージ = 基本攻撃力 × モーション倍率（四捨五入）。 */
export function attackDamage(attackPower: number, multiplier: number): number {
  return Math.round(attackPower * multiplier);
}

/** ガード成功時の HP ダメージ（削り）= 攻撃ダメージの 10%（切り捨て、最低 0）。整数演算で浮動小数の誤差を避ける。 */
export function guardChipDamage(damage: number): number {
  return Math.max(0, Math.floor((damage * GUARD.chipPercent) / 100));
}

export function isHeavyHit(poiseDamage: number): boolean {
  return poiseDamage >= HEAVY_HIT_POISE_THRESHOLD;
}
