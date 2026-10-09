/** ローディング進捗の集計。ステージ（重み付き）を先に宣言し、各ステージが 0..1 を報告する。 */
export const LOAD_STAGES = {
  /** 本体コード（three / rapier を含むチャンク）のダウンロードと評価 */
  code: 4,
  renderer: 2,
  physics: 1,
  scene: 1,
  /** キャラクター等のアセット */
  assets: 4,
} as const;

export type LoadStage = keyof typeof LOAD_STAGES;

export interface ProgressTask {
  /** 0..1。減らす報告は無視する。 */
  set(fraction: number): void;
  done(): void;
}

export interface ProgressSnapshot {
  readonly fraction: number;
  /** 直近に進捗を報告したステージ名。 */
  readonly stage: string;
}

export class ProgressTracker<S extends string = LoadStage> {
  private readonly fractions = new Map<S, number>();
  private readonly total: number;
  private shown = 0;

  constructor(
    private readonly weights: Readonly<Record<S, number>>,
    private readonly onChange?: (snapshot: ProgressSnapshot) => void,
  ) {
    this.total = Object.values<number>(weights).reduce((a, b) => a + b, 0);
  }

  /** 全体の進捗（0..1、単調増加）。 */
  get fraction(): number {
    return this.shown;
  }

  task(stage: S): ProgressTask {
    return {
      set: (f) => {
        this.report(stage, f);
      },
      done: () => {
        this.report(stage, 1);
      },
    };
  }

  private report(stage: S, fraction: number): void {
    const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
    if (f <= (this.fractions.get(stage) ?? 0)) return;
    this.fractions.set(stage, f);
    let sum = 0;
    for (const [s, v] of this.fractions) sum += this.weights[s] * v;
    this.shown = Math.max(this.shown, sum / this.total);
    this.onChange?.({ fraction: this.shown, stage });
  }
}
