/**
 * 固定タイムステップのアキュムレータ。
 * 実時間の経過を渡すと、シミュレーションを何ステップ進めるべきかと、
 * 描画時の補間係数 alpha (0..1) を返す。DOM / three に依存しない純粋なロジック。
 */
export interface FixedStepperOptions {
  /** 1 ステップの長さ（秒）。既定は 1/60。 */
  stepSeconds?: number;
  /** 1 回の advance で進めるステップ数の上限。超過分は捨てる（死の螺旋の防止）。 */
  maxStepsPerFrame?: number;
}

export interface StepResult {
  /** 今回進めるシミュレーションのステップ数。 */
  steps: number;
  /** 描画に使う補間係数。直前ステップ状態 → 最新ステップ状態の間の位置 (0..1)。 */
  alpha: number;
}

export class FixedStepper {
  readonly stepSeconds: number;
  readonly maxStepsPerFrame: number;
  private accumulator = 0;

  constructor({ stepSeconds = 1 / 60, maxStepsPerFrame = 5 }: FixedStepperOptions = {}) {
    if (!(stepSeconds > 0)) throw new RangeError('stepSeconds must be positive');
    if (!(maxStepsPerFrame >= 1)) throw new RangeError('maxStepsPerFrame must be >= 1');
    this.stepSeconds = stepSeconds;
    this.maxStepsPerFrame = Math.floor(maxStepsPerFrame);
  }

  advance(frameSeconds: number): StepResult {
    // 浮動小数誤差で 1 ステップ分が惜しくも足りなくなるのを避ける微小量
    const epsilon = 1e-9;
    this.accumulator += Math.max(0, frameSeconds);

    let steps = Math.floor((this.accumulator + epsilon) / this.stepSeconds);
    if (steps > this.maxStepsPerFrame) {
      steps = this.maxStepsPerFrame;
      this.accumulator = steps * this.stepSeconds; // 溜まった遅れは破棄
    }
    this.accumulator = Math.max(0, this.accumulator - steps * this.stepSeconds);

    return { steps, alpha: Math.min(1, this.accumulator / this.stepSeconds) };
  }

  reset(): void {
    this.accumulator = 0;
  }
}
