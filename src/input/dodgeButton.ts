/** 1 ステップ分の回避ボタンの状態（InputCollector の出力から作る）。 */
export interface DodgeButtonInput {
  /** ステップ終了時点の物理状態。 */
  held: boolean;
  /** このステップ中に押された / 離された（取りこぼし防止のラッチ済み）。 */
  pressed: boolean;
  released: boolean;
  /** 押された / 離された実時刻[ms]（pressed / released が true のときだけ参照する）。 */
  pressedAt: number;
  releasedAt: number;
}

/**
 * 回避ボタンの短押し / 長押し判定（エルデンリング準拠）。
 * - 短押し（しきい値未満で離す）: 離した時点で回避が確定する
 * - 長押し（しきい値以上押し続ける）: 押している間ダッシュ（sprint）。離しても回避は出ない
 *
 * 押下時間は実時間（イベント発生時刻）で測る。シミュレーション時間で測ると、
 * フレーム落ち（1 フレームのステップ数上限）で人間の感覚より長く見えてしまうため。
 */
export class DodgeButton {
  private pressStart: number | null = null;

  /** 長押し判定後、ボタンを押している間 true。 */
  sprint = false;

  constructor(private readonly holdMs: number) {}

  /** 1 ステップ進める。`nowMs` は現在の実時刻[ms]。回避が確定したら true を返す。 */
  update(nowMs: number, b: DodgeButtonInput): boolean {
    let dodge = false;

    // 前ステップから押し続けていて、このステップで離された（再押下の有無によらず先に確定させる）
    if (this.pressStart !== null && b.released) dodge = this.finish(b.releasedAt) || dodge;

    if (b.pressed) this.pressStart = b.pressedAt;

    if (this.pressStart !== null) {
      if (b.held) {
        this.sprint = nowMs - this.pressStart >= this.holdMs;
      } else {
        dodge = this.finish(b.released ? b.releasedAt : nowMs) || dodge;
      }
    }
    return dodge;
  }

  reset(): void {
    this.pressStart = null;
    this.sprint = false;
  }

  /** 押下区間の終了。短押しなら回避確定。 */
  private finish(releasedAt: number): boolean {
    const isTap = this.pressStart !== null && releasedAt - this.pressStart < this.holdMs;
    this.reset();
    return isTap;
  }
}
