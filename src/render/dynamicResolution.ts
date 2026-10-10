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
  /** 起動直後に捨てるフレーム数（シェーダコンパイル・テクスチャ読み込みのカクつきで誤って下げないため）。既定 0。 */
  warmupFrames?: number;
  /** 解像度を変えた直後に捨てるフレーム数（リサイズ時のバッファ再確保のカクつきを評価に入れない）。既定 0。 */
  settleFrames?: number;
  /** 1 フレームを目標フレーム時間のこの倍率までに丸める（単発のスパイクが窓の平均を支配しない）。既定は丸めない。 */
  spikeClamp?: number;
  /**
   * 窓が埋まらなくても、蓄積時間（ms）がこれを超えたら評価する（1fps のような極端に遅い端末で、
   * 何十秒も反応しないのを防ぐ）。最低 2 フレームは必要。既定は無制限。
   */
  maxWindowMs?: number;
  /** `outlierMs` を超えるフレームが連続でこの回数続いたら、外れ値ではなく「本当に遅い」と見なす。既定 2。 */
  slowRunLength?: number;
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
  private readonly maxWindowMs: number;
  private readonly slowRunLength: number;
  private outlierRun = 0;
  private readonly warmupFrames: number;
  private readonly settleFrames: number;
  private readonly spikeClampMs: number;

  private current: number;
  private sum = 0;
  private count = 0;
  private upStreak = 0;
  /** 読み捨てる残りフレーム数。 */
  private skip: number;
  /** 上げた直後の窓で下げた（上げすぎた）回数に応じた、上げ判定の厳しさ（1, 2, 4, 8）。 */
  private upBackoff = 1;
  private justRaised = false;
  private stableWindows = 0;

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
    this.maxWindowMs = options.maxWindowMs ?? Infinity;
    this.slowRunLength = options.slowRunLength ?? 2;
    this.warmupFrames = options.warmupFrames ?? 0;
    this.settleFrames = options.settleFrames ?? 0;
    this.spikeClampMs =
      options.spikeClamp === undefined ? Infinity : this.targetFrameMs * options.spikeClamp;
    this.skip = this.warmupFrames;
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
    if (!(frameMs > 0)) return null;
    if (frameMs > this.outlierMs) {
      // 単発はタブ復帰・ロードの外れ値として捨てる。連続するなら 1fps 級の本当の低速なので評価に入れる
      // （入れないと極端に遅い端末で解像度が一切下がらない）
      this.outlierRun++;
      if (this.outlierRun < this.slowRunLength) return null;
    } else {
      this.outlierRun = 0;
    }
    if (this.skip > 0) {
      this.skip--;
      return null;
    }
    this.sum += Math.min(frameMs, this.spikeClampMs);
    this.count++;
    if (this.count < this.windowSize && !(this.count >= 2 && this.sum >= this.maxWindowMs)) {
      return null;
    }

    const avg = this.sum / this.count;
    this.sum = 0;
    this.count = 0;

    const before = this.current;
    const wasRaised = this.justRaised;
    this.justRaised = false;
    if (avg > this.targetFrameMs * this.downThreshold) {
      this.upStreak = 0;
      this.stableWindows = 0;
      // 上げた直後に目標を割った = 上げすぎ。次回は上げを慎重にして、上げ下げの往復（リサイズのカクつき）を防ぐ
      if (wasRaised) this.upBackoff = Math.min(this.upBackoff * 2, 8);
      // 超過が大きいほど大きく下げる（最大 3 段）
      const over = avg / this.targetFrameMs;
      const steps = over > 1.6 ? 3 : over > 1.35 ? 2 : 1;
      this.current = clamp(this.current - this.step * steps, this.minScale, this.maxScale);
    } else if (avg < this.targetFrameMs * this.upThreshold) {
      this.upStreak++;
      this.stableWindows++;
      if (this.upStreak >= this.upStreakNeeded * this.upBackoff) {
        this.upStreak = 0;
        this.current = clamp(this.current + this.step, this.minScale, this.maxScale);
        this.justRaised = this.current !== before;
      }
    } else {
      this.upStreak = 0;
      this.stableWindows++;
    }
    if (this.stableWindows >= 10) this.upBackoff = 1;
    if (this.current === before) return null;
    this.skip = this.settleFrames;
    return this.current;
  }

  /** 蓄積をリセットする。 */
  reset(): void {
    this.sum = 0;
    this.count = 0;
    this.upStreak = 0;
    this.skip = this.warmupFrames;
  }
}

function clamp(v: number, min: number, max: number): number {
  const r = Math.max(min, Math.min(max, v));
  // 0.1 刻みの浮動小数誤差を除く
  return Math.round(r * 1000) / 1000;
}
