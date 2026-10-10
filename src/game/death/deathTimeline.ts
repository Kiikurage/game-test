import type { DeathPhase } from '../../core/gameEvents';
import { DEATH } from '../data/death';

/** 画面・カメラ演出の値（描画側とカメラが読む）。 */
export interface DeathVisual {
  /** 0..1。彩度 0% / 明度 -40% / 周辺減光への進行度（F30–F120）。 */
  readonly grade: number;
  /** 0..1。黒へのフェード（F240–F300。再開後は 1 → 0 で戻す）。 */
  readonly fade: number;
  /** FOV の補正（度。0 → -4）。 */
  readonly fovOffsetDeg: number;
  /** カメラを引く距離（m）。 */
  readonly armOffsetM: number;
  /** 注視点を下げる距離（m。倒れた体を画面内に収める）。 */
  readonly pivotDropM: number;
  /** 「倒れた」テキストの不透明度と倍率。 */
  readonly textAlpha: number;
  readonly textScale: number;
}

const IDLE_VISUAL: DeathVisual = {
  grade: 0,
  fade: 0,
  fovOffsetDeg: 0,
  armOffsetM: 0,
  pivotDropM: 0,
  textAlpha: 0,
  textScale: 1,
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (v: number): number => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

/**
 * 死亡演出のタイムライン（仕様書 8.1 節）。DOM・three・Rapier に依存しない純粋なフレームカウンタ。
 * `begin()` が F0、以降 `step()` が 1 ステップごとに 1 フレーム進め、節目（`DeathPhase`）を返す。
 * F90 以降は `skip` でスキップできる（黒へのフェードを max(現在 F, F120) から始める。最短 約 3 秒）。
 */
export class DeathTimeline {
  private f = -1;
  private fadeOutAt: number = DEATH.fadeOutFrame;
  private skippedFlag = false;
  private reveal = 0;

  /** 演出中か（F0 から再開まで）。 */
  get active(): boolean {
    return this.f >= 0;
  }

  /** 死亡からのフレーム（演出中でなければ -1）。 */
  get frame(): number {
    return this.f;
  }

  get skipped(): boolean {
    return this.skippedFlag;
  }

  /** スキップできる段階か（F90 以降、スキップ前・フェードアウト開始前）。 */
  get canSkip(): boolean {
    return this.active && this.f >= DEATH.skipFrame && !this.skippedFlag && this.f < this.fadeOutAt;
  }

  /** 黒へのフェードアウトを始めるフレーム（スキップで前倒しされる）。 */
  get fadeOutFrame(): number {
    return this.fadeOutAt;
  }

  /** 再開のフレーム。 */
  get respawnFrame(): number {
    return this.fadeOutAt + DEATH.fadeOutFrames;
  }

  /** 死亡の開始（F0）。すでに演出中なら何もせず空配列。 */
  begin(): DeathPhase[] {
    if (this.active) return [];
    this.f = 0;
    this.fadeOutAt = DEATH.fadeOutFrame;
    this.skippedFlag = false;
    this.reveal = 0;
    return ['start'];
  }

  /** 1 ステップ進める。このステップで迎えた節目を返す（`respawn` を返したら演出は終わる）。 */
  step(skip = false): DeathPhase[] {
    if (!this.active) {
      if (this.reveal > 0) this.reveal--;
      return [];
    }
    this.f++;
    if (skip && this.canSkip) {
      this.skippedFlag = true;
      this.fadeOutAt = Math.max(this.f, DEATH.skipFadeOutMinFrame);
    }
    const phases: DeathPhase[] = [];
    const at = (frame: number): boolean => this.f === frame;
    if (at(DEATH.animFrame)) phases.push('anim');
    if (at(DEATH.gradeFrame)) phases.push('grade');
    if (at(DEATH.textFrame)) phases.push('text');
    if (at(DEATH.skipFrame)) phases.push('skippable');
    if (at(DEATH.holdFrame) && this.fadeOutAt > this.f) phases.push('hold');
    if (at(this.fadeOutAt)) phases.push('fadeOut');
    if (at(this.respawnFrame)) {
      phases.push('respawn');
      this.f = -1;
      this.reveal = DEATH.revealFrames;
    }
    return phases;
  }

  /** 画面・カメラ演出の現在値。再開後は黒からの復帰（`fade` が 1 → 0）だけが残る。 */
  get visual(): DeathVisual {
    if (!this.active) {
      return this.reveal > 0
        ? { ...IDLE_VISUAL, fade: this.reveal / DEATH.revealFrames }
        : IDLE_VISUAL;
    }
    const f = this.f;
    const fade = clamp01((f - this.fadeOutAt) / DEATH.fadeOutFrames);
    const camera = smooth((f - DEATH.animFrame) / DEATH.cameraFrames);
    return {
      grade: smooth((f - DEATH.gradeFrame) / DEATH.gradeFrames),
      fade,
      fovOffsetDeg: DEATH.fovDeltaDeg * camera + 0,
      armOffsetM: DEATH.cameraPullM * camera,
      pivotDropM: DEATH.cameraPivotDropM * camera,
      textAlpha: clamp01((f - DEATH.textFrame) / DEATH.textFadeFrames) * (1 - fade),
      textScale:
        1 +
        (DEATH.textScaleMax - 1) *
          clamp01((f - DEATH.textFrame) / (DEATH.fadeOutFrame - DEATH.textFrame)),
    };
  }
}
