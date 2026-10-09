export interface DynamicResolutionOptions {
  /** 目標 fps（モバイル 30 / PC 60）。 */
  targetFps: number;
  minScale?: number;
  maxScale?: number;
  /** 1 回の調整幅。 */
  step?: number;
  /** 初期スケール。 */
  initialScale?: number;
  /** 評価に使うフレーム数（この数だけ溜まるごとに判定する）。 */
  window?: number;
  /** 目標フレーム時間に対し、これを超えたら解像度を下げる比率。 */
  downThreshold?: number;
  /** 目標フレーム時間に対し、これを下回ったら「余裕あり」と判定する比率。 */
  upThreshold?: number;
  /** 解像度を上げるまでに連続で「余裕あり」と判定される必要のある回数（ヒステリシス）。 */
  upStreak?: number;
  /** これを超えるフレーム間隔は外れ値（タブ非表示・ロード）として無視する（ms）。 */
  outlierMs?: number;
}

/**
 * フレーム時間を監視して内部解像度スケール（0..1）を段階調整する制御ロジック。
 * DOM / three に依存しない。rAF 間隔（vsync 量子化あり）を入力とするので、
 * 「下げる」判定は即座に、「上げる」判定は連続した余裕を確認してから行う。
 */
export class DynamicResolution {
  readonly targetFrameMs: number;
  private readonly minScale: number;
  private readonly maxScale: number;
  private readonly step: number;
  private readonly windowSize: number;
  private readonly downThreshold: number;
  private readonly upThreshold: number;
  private readonly upStreakNeeded: number;
  private readonly outlierMs: number;

  private current: number;
  private sum = 0;
  private count = 0;
  private upStreak = 0;

  constructor(options: DynamicResolutionOptions) {
    this.targetFrameMs = 1000 / options.targetFps;
    this.minScale = options.minScale ?? 0.5;
    this.maxScale = options.maxScale ?? 1;
    this.step = options.step ?? 0.1;
    this.windowSize = options.window ?? 20;
    this.downThreshold = options.downThreshold ?? 1.15;
    this.upThreshold = options.upThreshold ?? 0.8;
    this.upStreakNeeded = options.upStreak ?? 3;
    this.outlierMs = options.outlierMs ?? 1000;
    this.current = clamp(options.initialScale ?? this.maxScale, this.minScale, this.maxScale);
  }

  get scale(): number {
    return this.current;
  }

  /**
   * 1 フレームのフレーム時間（ms）を渡す。スケールが変わったときだけ新しい値を返し、
   * 変わらなければ null を返す。
   */
  update(frameMs: number): number | null {
    if (!(frameMs > 0) || frameMs > this.outlierMs) return null;
    this.sum += frameMs;
    this.count++;
    if (this.count < this.windowSize) return null;

    const avg = this.sum / this.count;
    this.sum = 0;
    this.count = 0;

    const before = this.current;
    if (avg > this.targetFrameMs * this.downThreshold) {
      this.upStreak = 0;
      // 超過が大きいほど大きく下げる（最大 3 段）
      const over = avg / this.targetFrameMs;
      const steps = over > 1.6 ? 3 : over > 1.35 ? 2 : 1;
      this.current = clamp(this.current - this.step * steps, this.minScale, this.maxScale);
    } else if (avg < this.targetFrameMs * this.upThreshold) {
      this.upStreak++;
      if (this.upStreak >= this.upStreakNeeded) {
        this.upStreak = 0;
        this.current = clamp(this.current + this.step, this.minScale, this.maxScale);
      }
    } else {
      this.upStreak = 0;
    }
    return this.current === before ? null : this.current;
  }

  /** 蓄積をリセットする。 */
  reset(): void {
    this.sum = 0;
    this.count = 0;
    this.upStreak = 0;
  }
}

function clamp(v: number, min: number, max: number): number {
  const r = Math.max(min, Math.min(max, v));
  // 0.1 刻みの浮動小数誤差を除く
  return Math.round(r * 1000) / 1000;
}
