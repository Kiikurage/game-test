/**
 * シミュレーションの状態フレーム（整数、60Hz のステップごとに増える）を、描画フレームごとの連続フレームへ補間する。
 * 描画はステップの合間に走るので、ステップが変わってからの経過時間（ヒットストップ中は進めない）で 0..1 の端数を足す。
 * `PlayerView` のアニメーションと同じく 1 ステップ遅れで補間する（返す値 = `stateFrame - 1 + 端数`）。
 */
export class StepClock {
  private last = -1;
  private since = 0;

  /** `stateFrame` が動作の開始からのフレーム（F1 起点）。動作の外では `reset` を呼ぶ。 */
  update(dt: number, stateFrame: number, frozen: boolean): number {
    if (stateFrame !== this.last) {
      this.last = stateFrame;
      this.since = 0;
    } else if (!frozen) {
      this.since += dt;
    }
    return stateFrame - 1 + Math.min(1, this.since * 60);
  }

  reset(): void {
    this.last = -1;
    this.since = 0;
  }
}
