/** 残像（被ダメージ後に遅れて減る表示）の遅延・消去フレーム。仕様書 9.1 節。 */
export const AFTERIMAGE = {
  /** 被ダメージから残像が減り始めるまでの待ち（F）。 */
  delayFrames: 36,
  /** 被ダメージから残像が消えるまで（F）。待ち 36F + 減少 24F。 */
  totalFrames: 60,
} as const;

/** 残像のタイミング（待ち・消えるまで）。 */
export interface AfterimageTiming {
  readonly delayFrames: number;
  readonly totalFrames: number;
}

/** ボス HP バーの残像（仕様書 9.1 節: 遅延 60F。減少は 24F）。 */
export const BOSS_AFTERIMAGE: AfterimageTiming = { delayFrames: 60, totalFrames: 84 };

/**
 * HP バーの残像。固定ステップ（60Hz）ごとに `step(current)` を呼ぶ。
 *
 * - `current` が前ステップより減ると、減る前の位置（すでに残像があればその位置）を残像として保持し、
 *   待ち 36F の後、24F かけて `current` まで線形に縮む（被ダメージから 60F で消える）。
 * - 待ちの間に再びダメージを受けたら待ちをやり直す（残像の上端は保たれる）。
 * - 回復で `current` が残像を超えたら残像は `current` に追従する（見えなくなる）。
 */
export class Afterimage {
  private last: number;
  private ghost_: number;
  private hold = 0;
  private decayFrom: number;
  private decayStep = 0;

  constructor(
    initial: number,
    private readonly timing: AfterimageTiming = AFTERIMAGE,
  ) {
    this.last = initial;
    this.ghost_ = initial;
    this.decayFrom = initial;
  }

  /** 残像の上端（`current` 以上）。 */
  get ghost(): number {
    return this.ghost_;
  }

  step(current: number): void {
    if (current < this.last) {
      this.ghost_ = Math.max(this.ghost_, this.last);
      this.hold = this.timing.delayFrames;
      this.decayStep = 0;
    }
    this.last = current;
    if (this.ghost_ <= current) {
      this.ghost_ = current;
      this.hold = 0;
      return;
    }
    if (this.hold > 0) {
      this.hold--;
      this.decayFrom = this.ghost_;
      return;
    }
    const decayFrames = this.timing.totalFrames - this.timing.delayFrames;
    this.decayStep++;
    const t = Math.min(1, this.decayStep / decayFrames);
    this.ghost_ = this.decayFrom + (current - this.decayFrom) * t;
  }
}
