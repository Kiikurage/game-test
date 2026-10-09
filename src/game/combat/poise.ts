import { POISE } from '../data';

/** `Poise.hit` の結果。 */
export interface PoiseHit {
  /** この被弾で強靭度崩しが起きた。 */
  readonly broke: boolean;
  /** 崩し中だったので強靭度ダメージを受けなかった（無限ハメ防止。4.3 節）。 */
  readonly ignored: boolean;
}

/**
 * 強靭度メーター（仕様書 4.3 節）。プレイヤー・雑魚・ボスの共通部品。
 *
 * - `hit(削り, 崩しの硬直)`: 現在値 `P` から引き、`P ≤ 0`（0 ちょうど含む）で崩し。崩しと同時に `P` は最大値へ戻る。
 * - 崩し中（`staggered`）は新たな強靭度ダメージを受けない。崩しは `step()` を `staggerFrames` 回呼ぶと終わる。
 * - 最後の被弾から `step()` を 300 回呼ぶと最大値へ戻る（`POISE.recoverFrames`）。
 * - 一時加算（`grant`）: 敵の攻撃の発生〜持続（+30）・プレイヤーのスーパーアーマー（+40）。窓の頭で 1 回 `grant`、
 *   窓の終わりに `clearBonus`。加算分は被弾で先に削られ、`clearBonus` で残りが消える
 *   （「最大値と現在値が一時的に上がる」のと同じ結果になる）。
 * - `breakEnabled = false` にすると崩れない（ボスの「フェーズごとに 1 回まで」を呼び出し側が制御する口）。
 *
 * `step()` はキャラクターが凍結（ヒットストップ）されていないステップだけ呼ぶ（回復・崩しのカウントも凍結する）。
 */
export class Poise {
  current: number;
  private bonusLeft = 0;
  private staggerLeft = 0;
  private sinceHit = Number.POSITIVE_INFINITY;
  /** false の間は強靭度が 0 以下になっても崩れない（ボスのフェーズ内 1 回制限用）。 */
  breakEnabled = true;

  constructor(
    readonly max: number,
    private readonly recoverFrames: number = POISE.recoverFrames,
  ) {
    this.current = max;
  }

  /** 崩し中か。被ダメージ 1.5 倍（`HitTarget.staggered`）の根拠。 */
  get staggered(): boolean {
    return this.staggerLeft > 0;
  }

  get staggerRemaining(): number {
    return this.staggerLeft;
  }

  /** 一時加算の残り。 */
  get bonus(): number {
    return this.bonusLeft;
  }

  /** 一時加算を与える（攻撃の発生〜持続・スーパーアーマーの窓の頭で呼ぶ）。 */
  grant(amount: number): void {
    this.bonusLeft = Math.max(0, amount);
  }

  clearBonus(): void {
    this.bonusLeft = 0;
  }

  /** 強靭度削り `damage` を受ける。崩れたら `staggerFrames` 間 `staggered` になる。 */
  hit(damage: number, staggerFrames: number): PoiseHit {
    if (this.staggered) return { broke: false, ignored: true };
    this.sinceHit = 0;
    let remaining = Math.max(0, damage);
    const soaked = Math.min(this.bonusLeft, remaining);
    this.bonusLeft -= soaked;
    remaining -= soaked;
    this.current -= remaining;
    if (this.current <= 0 && this.breakEnabled) {
      this.current = this.max;
      this.staggerLeft = Math.max(0, staggerFrames);
      return { broke: true, ignored: false };
    }
    // 崩れない設定のときは 0 で止める（フェーズ側が回復させる）
    if (this.current < 0) this.current = 0;
    return { broke: false, ignored: false };
  }

  /** 1 ステップ進める（崩しの残り・300F 回復）。 */
  step(): void {
    if (this.staggerLeft > 0) this.staggerLeft--;
    if (this.sinceHit !== Number.POSITIVE_INFINITY) {
      this.sinceHit++;
      if (this.sinceHit >= this.recoverFrames) {
        this.current = this.max;
        this.sinceHit = Number.POSITIVE_INFINITY;
      }
    }
  }

  /** 最大値へ戻して崩しも解除する（リスポーン・フェーズ移行）。 */
  reset(): void {
    this.current = this.max;
    this.bonusLeft = 0;
    this.staggerLeft = 0;
    this.sinceHit = Number.POSITIVE_INFINITY;
  }
}
