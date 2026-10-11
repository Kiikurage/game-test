import { NOTICE } from '../data/guide';

export interface Notice {
  /** 通知ごとに増える通し番号（同じ文言が続いても表示を更新できる）。 */
  readonly id: number;
  readonly text: string;
}

/**
 * 取得・開通通知の待ち行列。1 つずつ出し（同時発生は順番待ち）、各 `seconds` 秒表示する。DOM 非依存。
 */
export class NoticeModel {
  private readonly queue: { text: string; seconds: number }[] = [];
  private remaining = 0;
  private gap = 0;
  private nextId = 1;
  /** 表示中の通知（なければ null）。 */
  current: Notice | null = null;

  get pending(): number {
    return this.queue.length;
  }

  push(text: string, seconds: number = NOTICE.seconds): void {
    this.queue.push({ text, seconds });
    while (this.queue.length > NOTICE.maxQueue) this.queue.shift();
  }

  step(dt: number): void {
    if (this.current) {
      this.remaining -= dt;
      if (this.remaining > 0) return;
      this.current = null;
      this.gap = NOTICE.gapSeconds;
      return;
    }
    if (this.gap > 0) {
      this.gap -= dt;
      if (this.gap > 0) return;
    }
    const next = this.queue.shift();
    if (!next) return;
    this.current = { id: this.nextId++, text: next.text };
    this.remaining = next.seconds;
  }
}
