/**
 * 回避ボタンの短押し / 長押し判定（エルデンリング準拠）。
 * - 短押し（しきい値未満で離す）: 離した時点で回避が確定する
 * - 長押し（しきい値以上押し続ける）: 押している間ダッシュ（sprint）。離しても回避は出ない
 */
export class DodgeButton {
  private active = false;
  private heldSeconds = 0;

  /** 長押し判定後、ボタンを押している間 true。 */
  sprint = false;

  constructor(private readonly holdSeconds: number) {}

  /**
   * 1 ステップ進める。pressedEdge / releasedEdge はそのステップ中の押下/離上（取りこぼし防止のラッチ済み）、
   * held はステップ終了時点の物理状態。回避が確定したら true を返す。
   */
  update(dt: number, held: boolean, pressedEdge: boolean, releasedEdge: boolean): boolean {
    let dodge = false;

    // 前ステップから押し続けていて、このステップで離された（再押下の有無によらず先に確定させる）
    if (this.active && releasedEdge) dodge = this.finish() || dodge;

    if (pressedEdge) {
      this.active = true;
      this.heldSeconds = 0;
    }

    if (this.active) {
      if (held) {
        this.heldSeconds += dt;
        this.sprint = this.heldSeconds >= this.holdSeconds;
      } else {
        dodge = this.finish() || dodge;
      }
    }
    return dodge;
  }

  reset(): void {
    this.active = false;
    this.heldSeconds = 0;
    this.sprint = false;
  }

  /** 押下区間の終了。短押しなら回避確定。 */
  private finish(): boolean {
    const isTap = this.heldSeconds < this.holdSeconds;
    this.reset();
    return isTap;
  }
}
