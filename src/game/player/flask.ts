import { PLAYER_STATS } from '../data';

/**
 * 回復瓶の残数（仕様書 2.1 節）。初期 3、最大 4（礼拝堂のアイテムで +1 = `increaseMax`）。
 * 篝火・死亡（リスポーン）で最大数まで補充（`refill`）。
 */
export class Flask {
  private max_: number;
  private count_: number;
  private readonly listeners = new Set<(count: number, max: number) => void>();

  constructor(initial: number = PLAYER_STATS.flask.initial) {
    this.max_ = initial;
    this.count_ = initial;
  }

  get count(): number {
    return this.count_;
  }

  /** 現在の最大数。 */
  get max(): number {
    return this.max_;
  }

  /** 残数 1 以上か。 */
  get available(): boolean {
    return this.count_ >= 1;
  }

  /** 1 本消費する。残数 0 なら何もせず false。 */
  use(): boolean {
    if (this.count_ < 1) return false;
    this.count_--;
    this.notify();
    return true;
  }

  /** 最大数まで補充（篝火・死亡時）。 */
  refill(): void {
    this.count_ = this.max_;
    this.notify();
  }

  /**
   * 最大数を増やす（礼拝堂のアイテム）。上限は `PLAYER_STATS.flask.max`。増えた分は残数にも足す。
   * 増えたら true。
   */
  increaseMax(by = 1): boolean {
    const next = Math.min(PLAYER_STATS.flask.max, this.max_ + by);
    const added = next - this.max_;
    if (added <= 0) return false;
    this.max_ = next;
    this.count_ = Math.min(this.max_, this.count_ + added);
    this.notify();
    return true;
  }

  /** セーブデータ等からの復元。範囲に丸める。 */
  restore(count: number, max: number = this.max_): void {
    this.max_ = Math.max(0, Math.min(PLAYER_STATS.flask.max, Math.floor(max)));
    this.count_ = Math.max(0, Math.min(this.max_, Math.floor(count)));
    this.notify();
  }

  /** 残数・最大数の変化（HUD 用）を購読する。戻り値は購読解除。 */
  onChange(listener: (count: number, max: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of [...this.listeners]) l(this.count_, this.max_);
  }
}
