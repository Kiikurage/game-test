/**
 * 固定容量のスロットプール（GC を起こさない）。
 * バーストの粒子ブロックや、篝火などのエミッタ実体の使い回しに使う。
 * 空きがなければ最も古く確保されたスロットを奪う（`recycled` が true）。
 */
export class SlotPool {
  private readonly active: Uint8Array;
  private readonly stamp: Float64Array;
  private counter = 0;
  private activeTotal = 0;

  constructor(readonly capacity: number) {
    this.active = new Uint8Array(capacity);
    this.stamp = new Float64Array(capacity);
  }

  get activeCount(): number {
    return this.activeTotal;
  }

  isActive(index: number): boolean {
    return this.active[index] === 1;
  }

  /** スロットを確保する。容量 0 のときは index = -1。 */
  acquire(): { index: number; recycled: boolean } {
    if (this.capacity === 0) return { index: -1, recycled: false };
    let free = -1;
    let oldest = -1;
    for (let i = 0; i < this.capacity; i++) {
      if (this.active[i] === 0) {
        free = i;
        break;
      }
      if (oldest < 0 || (this.stamp[i] ?? 0) < (this.stamp[oldest] ?? 0)) oldest = i;
    }
    const recycled = free < 0;
    const index = recycled ? oldest : free;
    if (!recycled) this.activeTotal++;
    this.active[index] = 1;
    this.stamp[index] = ++this.counter;
    return { index, recycled };
  }

  release(index: number): void {
    if (index < 0 || index >= this.capacity || this.active[index] === 0) return;
    this.active[index] = 0;
    this.activeTotal--;
  }

  clear(): void {
    this.active.fill(0);
    this.activeTotal = 0;
  }
}
