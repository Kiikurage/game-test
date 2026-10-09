/** 同時発音数の管理（純粋ロジック）。超過時は低優先の最古を止める。 */

export const MAX_VOICES_DESKTOP = 24;
export const MAX_VOICES_MOBILE = 16;

export function maxVoicesFor(isMobile: boolean): number {
  return isMobile ? MAX_VOICES_MOBILE : MAX_VOICES_DESKTOP;
}

interface VoiceInfo {
  readonly id: number;
  readonly priority: number;
  /** 開始の通し番号（小さいほど古い）。 */
  readonly seq: number;
}

export type AcquireResult =
  | { readonly accepted: true; readonly id: number; readonly evicted?: number }
  | { readonly accepted: false };

export class VoiceLimiter {
  private readonly voices = new Map<number, VoiceInfo>();
  private seq = 0;
  private nextId = 1;

  constructor(readonly maxVoices: number) {
    if (!(maxVoices >= 1)) throw new RangeError('maxVoices must be >= 1');
  }

  get count(): number {
    return this.voices.size;
  }

  has(id: number): boolean {
    return this.voices.has(id);
  }

  /**
   * 発音枠を要求する。空きがあれば受理。満杯なら、優先度が最も低い（同値なら最古の）ボイスが
   * 新しい要求以下の優先度のときだけそれを追い出して受理、そうでなければ拒否する。
   * 受理時は `id`（解放に使う）を返し、`evicted` があれば呼び出し側がそのボイスを止める。
   */
  acquire(priority: number): AcquireResult {
    let evicted: number | undefined;
    if (this.voices.size >= this.maxVoices) {
      let victim: VoiceInfo | undefined;
      for (const v of this.voices.values()) {
        if (
          !victim ||
          v.priority < victim.priority ||
          (v.priority === victim.priority && v.seq < victim.seq)
        ) {
          victim = v;
        }
      }
      if (!victim || victim.priority > priority) return { accepted: false };
      this.voices.delete(victim.id);
      evicted = victim.id;
    }
    const id = this.nextId++;
    this.voices.set(id, { id, priority, seq: this.seq++ });
    return evicted === undefined ? { accepted: true, id } : { accepted: true, id, evicted };
  }

  release(id: number): void {
    this.voices.delete(id);
  }
}
