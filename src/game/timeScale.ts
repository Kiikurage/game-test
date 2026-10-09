/**
 * グローバルのタイムスケール（スローモーション。4.1 / 8.1 / 8.4 節）。
 *
 * シミュレーション自体は常に 60Hz・フレーム単位で決定的に進む。スローは「実時間 1 ステップあたりに進める
 * シミュレーション時間」を絞ることで表現する（メインループが `current` を実時間の経過に掛けて固定ステップ
 * アキュムレータへ渡す）。長さ `frames` は**シミュレーションのステップ数**で数えるので、0.3 倍速 30F は
 * 実時間では約 100 ステップ分かかるが、ゲーム内の出来事の順序・フレーム数は倍速に依存しない。
 *
 * 使い方: `start(0.3, 30, delay)`（`delay` はヒットストップが明けるまで待つシミュレーションステップ数）。
 * `Game.update` の先頭で `step()` を 1 回呼ぶ。撃破・ボス撃破・プレイヤー死亡の演出がこの API を使う。
 */
export class TimeScale {
  private scale = 1;
  private remaining = 0;
  private delay = 0;

  /** 現在のタイムスケール（スローが効いていなければ 1）。待機中（`delay` > 0）は 1。 */
  get current(): number {
    return this.delay <= 0 && this.remaining > 0 ? this.scale : 1;
  }

  /** スローの予約・実行中か。 */
  get active(): boolean {
    return this.remaining > 0;
  }

  /** スローの残りステップ数（待機中は開始前の全長）。 */
  get remainingFrames(): number {
    return this.remaining;
  }

  /**
   * スローを始める。すでに予約・実行中なら、小さい方のスケールと長い方の残りへまとめる（重ね掛けは強い方）。
   * `frames` が 0 以下・`scale` が 1 以上なら何もしない。
   */
  start(scale: number, frames: number, delay = 0): void {
    if (!(frames > 0) || !(scale < 1)) return;
    const s = Math.max(0.01, scale);
    if (this.remaining <= 0) {
      this.scale = s;
      this.remaining = Math.floor(frames);
      this.delay = Math.max(0, Math.floor(delay));
      return;
    }
    this.scale = Math.min(this.scale, s);
    this.remaining = Math.max(this.remaining, Math.floor(frames));
    this.delay = Math.min(this.delay, Math.max(0, Math.floor(delay)));
  }

  /** シミュレーション 1 ステップごとに呼ぶ。 */
  step(): void {
    if (this.remaining <= 0) return;
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.remaining--;
    if (this.remaining === 0) this.scale = 1;
  }

  reset(): void {
    this.scale = 1;
    this.remaining = 0;
    this.delay = 0;
  }
}
