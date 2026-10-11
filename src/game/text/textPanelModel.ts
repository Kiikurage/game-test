import { TEXT_PANEL } from '../data/textPanel';

export type TextPanelMode = 'read' | 'conversation';

export interface TextPanelPage {
  /** 表示するたびに増える通し番号（同じ文面でも更新を検知できる）。 */
  readonly id: number;
  readonly mode: TextPanelMode;
  /** 表示中の文面（改行は '\n'）。 */
  readonly text: string;
  /** 会話の現在行（0 始まり）と総行数。read は 0 / 1。 */
  readonly index: number;
  readonly total: number;
}

/** 「（改行）」を '\n' にする。 */
export function formatText(raw: string): string {
  return raw.split(TEXT_PANEL.lineBreakToken).join('\n');
}

/**
 * テキストパネルの状態。DOM 非依存。
 * read: 最長 `readSeconds` 秒表示し、開始位置から `closeDistanceM` 動くと閉じる。
 * conversation: `advance()` で 1 行ずつ進み、最後の行で進めると閉じる。動いたら閉じる（次に始めると 1 行目から）。
 */
export class TextPanelModel {
  private mode: TextPanelMode = 'read';
  private lines: string[] = [];
  private index = 0;
  private remaining = 0;
  private originX = 0;
  private originZ = 0;
  private nextId = 1;
  /** 会話を最後の行まで読み切った（最後の行で進めて閉じた）回数。中断（動いて閉じた）では増えない。 */
  completions = 0;
  current: TextPanelPage | null = null;

  get active(): boolean {
    return this.current !== null;
  }

  get conversing(): boolean {
    return this.current?.mode === 'conversation';
  }

  /** 表示を始める（表示中なら置き換える。会話は 1 行目から）。 */
  show(lines: readonly string[], mode: TextPanelMode, x: number, z: number): void {
    if (lines.length === 0) return;
    this.mode = mode;
    this.lines = mode === 'read' ? [lines.map(formatText).join('\n')] : lines.map(formatText);
    this.index = 0;
    this.remaining = TEXT_PANEL.readSeconds;
    this.originX = x;
    this.originZ = z;
    this.publish();
  }

  /** 次の行へ。最後の行なら閉じる。会話でなければ何もしない。 */
  advance(): void {
    if (this.mode !== 'conversation' || !this.current) return;
    if (this.index + 1 >= this.lines.length) {
      this.completions++;
      this.close();
      return;
    }
    this.index++;
    this.publish();
  }

  close(): void {
    this.current = null;
    this.index = 0;
  }

  /** 1 ステップ進める。`x, z` はプレイヤーの水平位置。 */
  step(dt: number, x: number, z: number): void {
    if (!this.current) return;
    if (Math.hypot(x - this.originX, z - this.originZ) >= TEXT_PANEL.closeDistanceM) {
      this.close();
      return;
    }
    if (this.mode === 'read') {
      this.remaining -= dt;
      if (this.remaining <= 0) this.close();
    }
  }

  private publish(): void {
    this.current = {
      id: this.nextId++,
      mode: this.mode,
      text: this.lines[this.index] ?? '',
      index: this.index,
      total: this.lines.length,
    };
  }
}
