import { KNOCKBACK, POISE, isHeavyHit } from '../data';
import { tuning } from '../tuning';
import type { HitEvent } from './hitResolver';
import type { Freezable } from './hitStop';
import { Poise } from './poise';

/**
 * 被弾リアクション（仕様書 4.3 / 4.4 節）。プレイヤー・雑魚・ボスが共通で使う。
 *
 * 持ち主（`Player` / 敵）は、自分宛ての `HitEvent` を `react` へ渡し、返ってきた `HitReaction` に従って
 * 自分の状態機械を動かす（仰け反り・転倒・崩しのアニメーションと硬直は持ち主の状態として持つ）。
 * リアクタ自身は、強靭度メーター・被弾後無敵・ノックバックの滑り・敵の加算仰け反りのカウントを持つ。
 *
 * 毎ステップ（凍結中を除く）`step()` を呼び、`consumeSlide(out)` でそのステップの水平変位（m）を受け取って
 * 自分の移動へ足す。
 */

export type ReactionKind =
  /** 反応なし（スーパーアーマー中・崩し中の追撃・死亡）。 */
  | 'none'
  /** 仰け反り。プレイヤー: 行動不能 24F。敵: 加算アニメーション 12F（行動は継続）。 */
  | 'flinch'
  /** 強靭度崩し（敵）。行動不能。 */
  | 'stagger'
  /** 転倒（プレイヤーの重い被弾）。行動不能 48F、F36 まで無敵。 */
  | 'knockdown'
  /** ガード成功の押し戻し（行動はガード状態側が決める）。 */
  | 'guardPush';

export interface HitReaction {
  readonly kind: ReactionKind;
  /** 硬直フレーム数（仰け反り・転倒・崩し）。 */
  readonly frames: number;
  /** 持ち主の行動を止める（敵の加算仰け反りは false）。 */
  readonly blocksAction: boolean;
  /** 回復・溜めなどの進行中の動作が失われる（E2-7 が購読する）。行動不能になる反応と同じ。 */
  readonly interruptsAction: boolean;
  /** 後退距離（m）。 */
  readonly knockback: number;
  /** この被弾で強靭度崩しが起きた。 */
  readonly broke: boolean;
  /** 重い被弾（強靭度削り ≥ 50）。 */
  readonly heavy: boolean;
}

const NO_REACTION: HitReaction = {
  kind: 'none',
  frames: 0,
  blocksAction: false,
  interruptsAction: false,
  knockback: 0,
  broke: false,
  heavy: false,
};

/** キャラクター種別ごとの数値（仕様書の表）。 */
export interface ReactorProfile {
  readonly poiseMax: number;
  readonly isPlayer: boolean;
  /** 崩しの硬直（軽い被弾で崩れたとき / 重い被弾で崩れたとき）。 */
  readonly staggerLight: number;
  readonly staggerHeavy: number;
  /** 被弾後無敵（フレーム）。0 なら付与しない。 */
  readonly postHitInvuln: number;
}

export const PLAYER_REACTOR: ReactorProfile = {
  poiseMax: POISE.player.max,
  isPlayer: true,
  staggerLight: POISE.player.staggerLightFrames,
  staggerHeavy: POISE.player.staggerHeavyFrames,
  postHitInvuln: KNOCKBACK.postHitInvulnFrames,
};
export const HOLLOW_SOLDIER_REACTOR: ReactorProfile = {
  poiseMax: POISE.hollowSoldier.max,
  isPlayer: false,
  staggerLight: POISE.hollowSoldier.staggerFrames,
  staggerHeavy: POISE.hollowSoldier.staggerFrames,
  postHitInvuln: 0,
};
export const SHIELDBEARER_REACTOR: ReactorProfile = {
  poiseMax: POISE.shieldbearer.max,
  isPlayer: false,
  staggerLight: POISE.shieldbearer.staggerFrames,
  staggerHeavy: POISE.shieldbearer.staggerFrames,
  postHitInvuln: 0,
};
export const BOSS_REACTOR: ReactorProfile = {
  poiseMax: POISE.boss.max,
  isPlayer: false,
  staggerLight: POISE.boss.staggerFrames,
  staggerHeavy: POISE.boss.staggerFrames,
  postHitInvuln: 0,
};

/** 押し戻しの滑り: 距離 `distance` を `frames` ステップで、速度が線形に減衰するよう配分する。 */
export class Slide {
  private dirX = 0;
  private dirZ = 0;
  private distance = 0;
  private frames = 0;
  private index = 0;

  get active(): boolean {
    return this.index < this.frames;
  }

  /** 新しい押し戻しを始める（進行中のものは置き換える）。`(dx, dz)` は向き（正規化される）。 */
  start(dx: number, dz: number, distance: number, frames: number): void {
    const len = Math.hypot(dx, dz);
    if (len < 1e-6 || distance <= 0 || frames <= 0) {
      this.frames = 0;
      this.index = 0;
      return;
    }
    this.dirX = dx / len;
    this.dirZ = dz / len;
    this.distance = distance;
    this.frames = Math.max(1, Math.floor(frames));
    this.index = 0;
  }

  /** このステップの変位を `out` へ書く（なければ 0）。 */
  consume(out: { x: number; z: number }): void {
    if (!this.active) {
      out.x = 0;
      out.z = 0;
      return;
    }
    const n = this.frames;
    const d = (this.distance * 2 * (n - this.index)) / (n * (n + 1));
    this.index++;
    out.x = this.dirX * d;
    out.z = this.dirZ * d;
  }
}

export class HitReactor implements Freezable {
  readonly poise: Poise;
  private readonly slide = new Slide();
  /** 直近の被弾（未ガード）からのステップ数。被弾後無敵の判定に使う。 */
  private sinceHit = Number.POSITIVE_INFINITY;
  private flinchLeft = 0;
  private freezeLeft = 0;
  /** 直近の反応（デバッグ・描画用）。 */
  lastReaction: HitReaction = NO_REACTION;

  constructor(readonly profile: ReactorProfile) {
    this.poise = new Poise(profile.poiseMax);
  }

  /** 崩し中か。`UprightTarget.staggered`（被ダメージ 1.5 倍）へ写す。 */
  get staggered(): boolean {
    return this.poise.staggered;
  }

  /**
   * 被弾後無敵中か。未ガード被弾の次のステップから `postHitInvuln` ステップ（18F）の間。
   * 被弾したステップ自体も（同じステップの別の攻撃を防ぐため）無敵。
   */
  get invulnerable(): boolean {
    return this.profile.postHitInvuln > 0 && this.sinceHit <= this.profile.postHitInvuln;
  }

  /** 敵の加算仰け反りの残り（0..`POISE.enemyFlinchFrames`）。 */
  get flinchRemaining(): number {
    return this.flinchLeft;
  }

  /** 加算仰け反りの進み具合（0 = 開始 .. 1 = 終了）。アニメーションの重み付けに使う。 */
  get flinchProgress(): number {
    return this.flinchLeft > 0 ? 1 - this.flinchLeft / POISE.enemyFlinchFrames : 1;
  }

  /** ヒットストップ: `frames` ステップ、`step` と押し戻しを止める。重ね掛けは長い方。 */
  freeze(frames: number): void {
    this.freezeLeft = Math.max(this.freezeLeft, Math.floor(frames));
  }

  /** 1 ステップの先頭で呼ぶ。凍結中なら残りを 1 減らして true（そのステップの `step` を飛ばす）。 */
  consumeFreeze(): boolean {
    if (this.freezeLeft <= 0) return false;
    this.freezeLeft--;
    return true;
  }

  /** 1 ステップ進める（凍結中は呼ばない）。 */
  step(): void {
    this.poise.step();
    if (this.sinceHit !== Number.POSITIVE_INFINITY) this.sinceHit++;
    if (this.flinchLeft > 0) this.flinchLeft--;
  }

  /** このステップの押し戻し変位（水平、m）を `out` へ。 */
  consumeSlide(out: { x: number; z: number }): void {
    this.slide.consume(out);
  }

  get sliding(): boolean {
    return this.slide.active;
  }

  /**
   * 自分宛ての `HitEvent` を処理する。`(awayX, awayZ)` は攻撃側から被弾側へ向かう水平方向（押し戻しの向き）。
   * 死亡した被弾・ジャストガードは何も起こさない。
   */
  react(event: HitEvent, awayX: number, awayZ: number): HitReaction {
    const reaction = this.compute(event, awayX, awayZ);
    this.lastReaction = reaction;
    return reaction;
  }

  /** 状態を初期化する（リスポーン）。 */
  reset(): void {
    this.poise.reset();
    this.slide.start(0, 0, 0, 0);
    this.sinceHit = Number.POSITIVE_INFINITY;
    this.flinchLeft = 0;
    this.freezeLeft = 0;
    this.lastReaction = NO_REACTION;
  }

  private compute(event: HitEvent, awayX: number, awayZ: number): HitReaction {
    if (event.killed) return NO_REACTION;
    const { profile } = this;
    const slideFrames = tuning.reaction;

    if (event.guard === 'just') return NO_REACTION;
    if (event.guard === 'guard') {
      const heavy = isHeavyHit(event.attackPoiseDamage);
      const distance = heavy ? KNOCKBACK.player.guardHeavy : KNOCKBACK.player.guardLight;
      this.slide.start(awayX, awayZ, distance, slideFrames.guardSlideFrames);
      return {
        kind: 'guardPush',
        frames: 0,
        blocksAction: false,
        interruptsAction: false,
        knockback: distance,
        broke: false,
        heavy,
      };
    }

    // 未ガード
    const heavy = isHeavyHit(event.poiseDamage);
    // スーパーアーマー（加算分が残っている間）に守られていたか。崩れない限り仰け反らない。
    const armored = this.poise.bonus > 0;
    const staggerFrames = heavy ? profile.staggerHeavy : profile.staggerLight;
    const hit = this.poise.hit(event.poiseDamage, staggerFrames);
    if (profile.postHitInvuln > 0) this.sinceHit = 0;
    if (hit.ignored) return NO_REACTION;

    const slideLen = heavy ? slideFrames.heavySlideFrames : slideFrames.lightSlideFrames;
    if (profile.isPlayer) {
      if (armored && !hit.broke) return { ...NO_REACTION, heavy };
      const kind: ReactionKind = heavy ? 'knockdown' : 'flinch';
      const distance = heavy
        ? (event.knockback ?? KNOCKBACK.player.heavy.distance)
        : KNOCKBACK.player.light.distance;
      const frames = heavy
        ? KNOCKBACK.player.heavy.downFrames
        : KNOCKBACK.player.light.flinchFrames;
      this.slide.start(awayX, awayZ, distance, slideLen);
      return {
        kind,
        frames,
        blocksAction: true,
        interruptsAction: true,
        knockback: distance,
        broke: hit.broke,
        heavy,
      };
    }

    if (hit.broke) {
      const distance = KNOCKBACK.enemy.staggerBreak;
      this.slide.start(awayX, awayZ, distance, slideFrames.heavySlideFrames);
      this.flinchLeft = 0;
      return {
        kind: 'stagger',
        frames: staggerFrames,
        blocksAction: true,
        interruptsAction: true,
        knockback: distance,
        broke: true,
        heavy,
      };
    }
    const distance = heavy ? KNOCKBACK.enemy.heavy : KNOCKBACK.enemy.light;
    this.slide.start(awayX, awayZ, distance, slideLen);
    this.flinchLeft = POISE.enemyFlinchFrames;
    return {
      kind: 'flinch',
      frames: POISE.enemyFlinchFrames,
      blocksAction: false,
      interruptsAction: false,
      knockback: distance,
      broke: false,
      heavy,
    };
  }
}

/** 転倒（`Hit_Knockback`）の起き上がり無敵か。F36 まで（`KNOCKBACK.player.heavy.wakeInvulnUntilFrame`）。 */
export function knockdownInvulnerable(stateFrame: number): boolean {
  return stateFrame <= KNOCKBACK.player.heavy.wakeInvulnUntilFrame;
}
