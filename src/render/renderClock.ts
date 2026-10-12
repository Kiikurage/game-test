/**
 * 描画側の時間源。パーティクル・揺らぎ（TSL の `time`）・アニメーションのミキサー・影の更新など、
 * 実時間（`performance.now`）から dt を取る処理は、すべてここの `nowMs` を読む。
 *
 * 通常は描画フレームの先頭（`GameView.render`）で `performance.now()` を 1 回だけ読み込み、そのフレームの中では同じ値を返す
 * （同じフレームの中で消費者ごとに dt がずれない）。
 * 撮影（`?shot` で最初から、または `dev.freezeRenderTime`）では時刻を止め、`tick` で進めた分だけ進める。rAF の描画では時間が進まないので、
 * 描画フレーム数や実時間によらず「同じ操作 → 同じ画像」になる（heroshots の再現性。docs/tech-direction.md §7.1）。
 */
class RenderClock {
  /** 現在のフレームの時刻（ミリ秒）。 */
  nowMs = typeof performance === 'undefined' ? 0 : performance.now();
  /** 止めている間は実時間を読まない。 */
  frozen = false;
  /** 止めた時点の時刻（TSL の `time` は止めてからの経過で決める）。 */
  private baseMs = 0;

  constructor() {
    // `?shot`（撮影用。scripts/heroShots.mjs が付ける）: ロード・ウォームアップの実時間（環境ごとに違う）を
    // 局所光源のゆらぎ・篝火などの積算時計に入れないよう、最初から止めておく。
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('shot')) {
      this.freeze();
    }
  }

  /** フレームの先頭で呼ぶ。止めていなければ実時間を読む。 */
  beginFrame(): void {
    if (!this.frozen) this.nowMs = performance.now();
  }

  /** 時刻を止める。止めた瞬間の `nowMs` を基準にするので、直後の dt は 0。 */
  freeze(): void {
    if (this.frozen) return;
    this.frozen = true;
    this.baseMs = this.nowMs;
  }

  unfreeze(): void {
    this.frozen = false;
  }

  /** 止めている間に、時刻を `ms` 進める。 */
  tick(ms: number): void {
    this.nowMs += ms;
  }

  /** 止めてからの経過秒（TSL の `time` 用）。 */
  get frozenSeconds(): number {
    return (this.nowMs - this.baseMs) / 1000;
  }
}

export const renderClock = new RenderClock();
