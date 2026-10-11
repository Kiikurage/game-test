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
  /**
   * グローバルのタイムスケール（スローモーション）。実時間の経過に掛けて固定ステップへ渡す。
   * シミュレーションのステップ自体は 1/60 秒のまま（フレーム単位の決定性を保つ）。省略時は常に 1。
   */
  timeScale?: () => number;
}

/**
 * requestAnimationFrame 駆動のメインループ。
 * シミュレーションは固定ステップ、描画はフレームごと（補間付き）。
 */
export class MainLoop {
  /** 累計のシミュレーションステップ数 / 描画フレーム数（デバッグ・E2E 用）。 */
  stepCount = 0;
  frameCount = 0;
  /**
   * シミュレーションの一時停止。止めている間も描画は続ける（補間は最新ステップ = alpha 1）。
   * `step` / `frame` による手動の進行は止めない（撮影・E2E 用）。
   */
  paused = false;

  private readonly stepper: FixedStepper;
  private readonly maxFrameSeconds: number;
  private readonly timeScale: () => number;
  private rafId: number | null = null;
  private last = 0;

  constructor(
    private readonly callbacks: MainLoopCallbacks,
    options: MainLoopOptions = {},
  ) {
    this.stepper = new FixedStepper(options);
    this.maxFrameSeconds = options.maxFrameSeconds ?? 0.25;
    this.timeScale = options.timeScale ?? (() => 1);
  }

  /** 1 ステップの長さ（秒）。 */
  get stepSeconds(): number {
    return this.stepper.stepSeconds;
  }

  get running(): boolean {
    return this.rafId !== null;
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

  /**
   * シミュレーションを `steps` ステップ進める（rAF の 1 フレームと同じ `update` を呼び、`stepCount` も進める）。
   * タイムスケールは「実時間あたりのステップ数」に効くだけなので、ステップ単位の進行には関係しない。
   * `paused` でも進める。`render: true` なら最後に 1 回描画する。
   */
  step(steps: number, { render = false }: { render?: boolean } = {}): void {
    for (let i = 0; i < steps; i++) this.runStep();
    if (render) this.runRender(1);
  }

  /**
   * 実時間 `frameSeconds` 秒の 1 フレームを、rAF と同じ処理（タイムスケール・ステップ数の上限・描画）で進める。
   * `paused` でも進める。戻り値はこのフレームで進んだステップ数。
   */
  frame(frameSeconds: number, { render = true }: { render?: boolean } = {}): number {
    return this.runFrame(frameSeconds, render, true);
  }

  private readonly tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const frameSeconds = Math.min((now - this.last) / 1000, this.maxFrameSeconds);
    this.last = now;
    this.runFrame(frameSeconds, true, false);
  };

  private runFrame(frameSeconds: number, render: boolean, force: boolean): number {
    if (this.paused && !force) {
      if (render) this.runRender(1);
      return 0;
    }
    const { steps, alpha } = this.stepper.advance(
      Math.min(frameSeconds, this.maxFrameSeconds) * this.timeScale(),
    );
    for (let i = 0; i < steps; i++) this.runStep();
    if (render) this.runRender(alpha);
    return steps;
  }

  private runStep(): void {
    this.callbacks.update(this.stepper.stepSeconds);
    this.stepCount++;
  }

  private runRender(alpha: number): void {
    this.callbacks.render(alpha);
    this.frameCount++;
  }
}
