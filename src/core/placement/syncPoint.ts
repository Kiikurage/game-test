// 同期点: 1 フレームに 1 回、全 executor の sync（Worker との交換・GPU の dispatch・main での実行）と
// GPU へのアップロードをまとめて行う唯一の場所（#383 spike）。個々の job は自分の実行場所を知らない。
import { FixedStepper } from '../fixedStepper';
import type { Executor } from './executors';
import type { StateSchema } from './state';

export interface SyncResult {
  readonly steps: number;
  /** step の job の描画補間係数（previous → current）。 */
  readonly alpha: number;
}

export class SyncPoint {
  private readonly executors: Executor<StateSchema>[] = [];
  private readonly uploads: (() => void)[] = [];
  readonly stepper: FixedStepper;

  constructor(stepSeconds = 1 / 60) {
    this.stepper = new FixedStepper({ stepSeconds, maxStepsPerFrame: 4 });
  }

  add<S extends StateSchema>(executor: Executor<S>): Executor<S> {
    this.executors.push(executor);
    return executor;
  }

  /** 同期の最後に呼ぶアップロード（描画側が CPU の配列を GPU に送る）。 */
  onUpload(fn: () => void): void {
    this.uploads.push(fn);
  }

  frame(frameSeconds: number): SyncResult {
    const { steps, alpha } = this.stepper.advance(frameSeconds);
    const f = { steps, stepDt: this.stepper.stepSeconds, frameDt: frameSeconds };
    for (const e of this.executors) e.sync(f);
    for (const u of this.uploads) u();
    return { steps, alpha };
  }

  dispose(): void {
    for (const e of this.executors) e.dispose();
  }
}
