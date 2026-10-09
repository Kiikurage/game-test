import { FixedStepper, type FixedStepperOptions } from './fixedStepper';

export interface MainLoopCallbacks {
  /** 固定タイムステップ（dt 秒）でのシミュレーション更新。 */
  update(dt: number): void;
  /** 描画。alpha は直前ステップ状態と最新ステップ状態の補間係数 (0..1)。 */
  render(alpha: number): void;
}

export interface MainLoopOptions extends FixedStepperOptions {
  /** 1 フレームで消化する実時間の上限（秒）。タブ復帰時などの巨大な dt を丸める。 */
  maxFrameSeconds?: number;
}

/**
 * requestAnimationFrame 駆動のメインループ。
 * シミュレーションは固定ステップ、描画はフレームごと（補間付き）。
 */
export class MainLoop {
  /** 累計のシミュレーションステップ数 / 描画フレーム数（デバッグ・E2E 用）。 */
  stepCount = 0;
  frameCount = 0;

  private readonly stepper: FixedStepper;
  private readonly maxFrameSeconds: number;
  private rafId: number | null = null;
  private last = 0;

  constructor(
    private readonly callbacks: MainLoopCallbacks,
    options: MainLoopOptions = {},
  ) {
    this.stepper = new FixedStepper(options);
    this.maxFrameSeconds = options.maxFrameSeconds ?? 0.25;
  }

  start(): void {
    if (this.rafId !== null) return;
    this.stepper.reset();
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private readonly tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const frameSeconds = Math.min((now - this.last) / 1000, this.maxFrameSeconds);
    this.last = now;

    const { steps, alpha } = this.stepper.advance(frameSeconds);
    for (let i = 0; i < steps; i++) {
      this.callbacks.update(this.stepper.stepSeconds);
      this.stepCount++;
    }
    this.callbacks.render(alpha);
    this.frameCount++;
  };
}
