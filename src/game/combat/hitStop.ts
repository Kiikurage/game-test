import type { HitEvent } from './hitResolver';

/**
 * ヒットストップの決定（仕様書 4.1 節）。命中（`HitEvent`）から、凍結フレーム数と付随演出を決める純粋関数。
 * 実際の凍結は `Freezable.freeze` へ渡して行う（`Game` が攻撃側・被弾側の両方へ配る）。
 *
 * 凍結は「そのキャラクターの状態フレーム・アニメーション・移動・イベントマーカー・窓のカウント」を止める
 * 局所的な方式で、シミュレーション全体は止めない（他のキャラクター・パーティクル・カメラは動き続ける）。
 */

/** 凍結できるもの（キャラクターの状態機械など）。重ね掛けは長い方（`CharacterFsm.freeze` と同じ）。 */
export interface Freezable {
  freeze(frames: number): void;
}

/** 凍結の残りステップを数えるだけの `Freezable`（状態機械を持たない被弾側用）。 */
export class FreezeCounter implements Freezable {
  private left = 0;

  freeze(frames: number): void {
    this.left = Math.max(this.left, Math.floor(frames));
  }

  get remaining(): number {
    return this.left;
  }

  /** 1 ステップの先頭で呼ぶ。凍結中なら残りを 1 減らして true（そのステップの更新を飛ばす）。 */
  consume(): boolean {
    if (this.left <= 0) return false;
    this.left--;
    return true;
  }

  reset(): void {
    this.left = 0;
  }
}

/** 凍結フレーム数・スロー・演出の数値（`tuning.hitStop` と同じ形）。 */
export interface HitStopConfig {
  readonly enabled: boolean;
  readonly playerLight: number;
  readonly playerHeavy: number;
  readonly playerHeavyCharged: number;
  readonly enemyHitsPlayer: number;
  readonly bossHitsPlayer: number;
  readonly guardSuccess: number;
  readonly justGuard: number;
  readonly kill: number;
  readonly killSlowmoScale: number;
  readonly killSlowmoFrames: number;
  readonly bossKillSlowmoFrames: number;
  readonly chargedShakeDeg: number;
  readonly chargedShakeFrames: number;
  readonly redFlashFrames: number;
  readonly whiteFlashFrames: number;
}

export interface HitStopInput {
  readonly event: HitEvent;
  readonly attackerIsPlayer: boolean;
  readonly targetIsPlayer: boolean;
  readonly attackerIsBoss: boolean;
  readonly targetIsBoss: boolean;
}

export interface HitStopDecision {
  /** 攻撃側・被弾側の凍結フレーム数（0 なら凍結しない）。 */
  readonly frames: number;
  /** 撃破スロー（プレイヤー以外が倒れたとき）。ヒットストップが明けてから `frames` ステップ続く。 */
  readonly slowMotion: { readonly scale: number; readonly frames: number } | null;
  /** 画面振動（フル溜め強攻撃）。 */
  readonly shake: { readonly amplitudeDeg: number; readonly frames: number } | null;
  /** 画面の閃光。 */
  readonly flash: { readonly kind: 'red' | 'white'; readonly frames: number } | null;
}

const NONE: HitStopDecision = { frames: 0, slowMotion: null, shake: null, flash: null };

/**
 * プレイヤーの攻撃動作 → ヒットストップ。軽攻撃 3 段は軽、`heavy`（溜めなし）は強、`heavyCharged`（フル溜め）は最長。
 * 仕様書に個別の記載がない動作（走り攻撃・ガードカウンター・背後攻撃・落下攻撃）は強攻撃（溜めなし）と同じ。
 */
export function playerAttackFrames(attackId: string, config: HitStopConfig): number {
  switch (attackId) {
    case 'light1':
    case 'light2':
    case 'light3':
      return config.playerLight;
    case 'heavyCharged':
      return config.playerHeavyCharged;
    default:
      return config.playerHeavy;
  }
}

export function decideHitStop(input: HitStopInput, config: HitStopConfig): HitStopDecision {
  if (!config.enabled) return NONE;
  const { event } = input;

  let frames = 0;
  let flash: HitStopDecision['flash'] = null;
  let shake: HitStopDecision['shake'] = null;
  if (event.guard === 'just') {
    frames = config.justGuard;
    flash = { kind: 'white', frames: config.whiteFlashFrames };
  } else if (event.guard === 'guard') {
    frames = config.guardSuccess;
  } else if (input.targetIsPlayer) {
    // 敵（ボス）の攻撃がプレイヤーに命中。攻撃側の敵も凍結する。
    frames = input.attackerIsBoss ? config.bossHitsPlayer : config.enemyHitsPlayer;
    flash = { kind: 'red', frames: config.redFlashFrames };
  } else if (input.attackerIsPlayer) {
    frames = playerAttackFrames(event.attackId, config);
    if (event.attackId === 'heavyCharged') {
      shake = { amplitudeDeg: config.chargedShakeDeg, frames: config.chargedShakeFrames };
    }
  }

  // プレイヤーの死亡も 12F（8.1 節 F0。スローは入れない）
  if (event.killed && input.targetIsPlayer) frames = Math.max(frames, config.kill);

  // 撃破（トドメ）: 12F + スロー。
  let slowMotion: HitStopDecision['slowMotion'] = null;
  if (event.killed && !input.targetIsPlayer) {
    frames = Math.max(frames, config.kill);
    slowMotion = {
      scale: config.killSlowmoScale,
      frames: input.targetIsBoss ? config.bossKillSlowmoFrames : config.killSlowmoFrames,
    };
  }

  return { frames, slowMotion, shake, flash };
}
