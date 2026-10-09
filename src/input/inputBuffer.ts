import type { Action } from '../core/input';

/**
 * 先行入力バッファ。押下を一定時間保持し、行動可能になった時点で消費できるようにする。
 * 時刻はシミュレーション時間（秒）で与える（実時間に依存せず決定的）。
 */
export class InputBuffer {
  private readonly expiresAt = new Map<Action, number>();

  constructor(private readonly windowSeconds: number) {}

  /** `now` 時点で action が押された。保持期限を更新する。 */
  push(action: Action, now: number): void {
    this.expiresAt.set(action, now + this.windowSeconds);
  }

  has(action: Action, now: number): boolean {
    const t = this.expiresAt.get(action);
    if (t === undefined) return false;
    if (now > t) {
      this.expiresAt.delete(action);
      return false;
    }
    return true;
  }

  consume(action: Action, now: number): boolean {
    if (!this.has(action, now)) return false;
    this.expiresAt.delete(action);
    return true;
  }

  clear(action?: Action): void {
    if (action === undefined) this.expiresAt.clear();
    else this.expiresAt.delete(action);
  }
}
