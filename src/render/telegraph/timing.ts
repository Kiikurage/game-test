/**
 * 地面予告のタイミング（純粋ロジック）。単位はシミュレーションフレーム（60Hz）。
 * 仕様 6.3 節: 赤橙の線 / 円は **8F かけて出現**、色覚に依存しないよう**点滅パターン**でも示す。
 */

export const FRAME_RATE = 60;
/** 出現にかける時間（F）。 */
export const APPEAR_FRAMES = 8;
/** 消えるまでの時間（F）。 */
export const FADE_OUT_FRAMES = 4;

/** 点滅パターンのパラメータ。 */
export interface BlinkParams {
  /** 1 周期（F）。光過敏への配慮で 3Hz（20F）以下に保つ。 */
  readonly periodFrames: number;
  /** 周期のうち明るい側の割合（0..1）。 */
  readonly duty: number;
  /** 暗い側の明るさ（0..1）。小さいほどコントラストが強い。 */
  readonly minLevel: number;
  /** 点滅を始めるフレーム（出現完了後）。それ以前は常に明るい。 */
  readonly startFrame: number;
  /** 明暗の切り替えになめらかさを与える幅（F）。 */
  readonly edgeFrames: number;
}

export const DEFAULT_BLINK: BlinkParams = {
  periodFrames: 20,
  duty: 0.5,
  minLevel: 0.3,
  startFrame: APPEAR_FRAMES,
  edgeFrames: 2,
};

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

/** 出現の進行度 0..1（8F で完了、ease-out）。frame は表示開始からの経過フレーム。 */
export function appearProgress(frame: number): number {
  const t = clamp01(frame / APPEAR_FRAMES);
  return 1 - (1 - t) * (1 - t);
}

/** 点滅の明るさ係数（minLevel..1）。 */
export function blinkLevel(frame: number, p: BlinkParams = DEFAULT_BLINK): number {
  if (frame < p.startFrame) return 1;
  const phase = ((frame - p.startFrame) % p.periodFrames) / p.periodFrames;
  const on = p.duty;
  const edge = Math.max(1e-6, p.edgeFrames / p.periodFrames);
  // 周期の頭で立ち上がり、duty の位置で立ち下がる
  const rise = smoothstep(0, edge, phase);
  const fall = smoothstep(on, on + edge, phase);
  const pulse = rise * (1 - fall);
  return p.minLevel + (1 - p.minLevel) * pulse;
}

export type TelegraphPhase = 'hidden' | 'appearing' | 'holding' | 'fading';

/**
 * 1 つの予告の時計。`show()` で出現を開始し、`hide()` でフェードアウトする。
 * 呼び出し側は `advance(frames)`（シミュレーション駆動）か `advanceSeconds(dt)`（描画駆動）で進める。
 */
export class TelegraphClock {
  private _frame = 0;
  private fadeFrame = 0;
  private _phase: TelegraphPhase = 'hidden';

  constructor(readonly blink: BlinkParams = DEFAULT_BLINK) {}

  get phase(): TelegraphPhase {
    return this._phase;
  }

  /** 表示開始からの経過フレーム。 */
  get frame(): number {
    return this._frame;
  }

  get visible(): boolean {
    return this._phase !== 'hidden';
  }

  /** 出現を開始する（表示中なら無視）。 */
  show(): void {
    if (this._phase === 'appearing' || this._phase === 'holding') return;
    this._frame = 0;
    this.fadeFrame = 0;
    this._phase = 'appearing';
  }

  /** フェードアウトを開始する。 */
  hide(): void {
    if (this._phase === 'hidden' || this._phase === 'fading') return;
    this.fadeFrame = 0;
    this._phase = 'fading';
  }

  /** 即座に消す。 */
  reset(): void {
    this._frame = 0;
    this.fadeFrame = 0;
    this._phase = 'hidden';
  }

  advance(frames: number): void {
    if (this._phase === 'hidden' || frames <= 0) return;
    if (this._phase === 'fading') {
      this.fadeFrame += frames;
      this._frame += frames;
      if (this.fadeFrame >= FADE_OUT_FRAMES) this.reset();
      return;
    }
    this._frame += frames;
    if (this._phase === 'appearing' && this._frame >= APPEAR_FRAMES) this._phase = 'holding';
  }

  advanceSeconds(dt: number): void {
    this.advance(dt * FRAME_RATE);
  }

  /** デバッグ・撮影用: 表示開始からの経過フレームを直接指定する（出現済みの状態に置く）。 */
  setFrame(frame: number): void {
    this._frame = Math.max(0, frame);
    this.fadeFrame = 0;
    this._phase = this._frame >= APPEAR_FRAMES ? 'holding' : 'appearing';
  }

  /** 出現の進行度 0..1。 */
  get appear(): number {
    return this._phase === 'hidden' ? 0 : appearProgress(this._frame);
  }

  /** 点滅の明るさ係数。 */
  get blinkValue(): number {
    return this._phase === 'hidden' ? 0 : blinkLevel(this._frame, this.blink);
  }

  /** フェードアウトを含む全体の不透明度係数 0..1。 */
  get fade(): number {
    if (this._phase === 'hidden') return 0;
    if (this._phase === 'fading') return 1 - clamp01(this.fadeFrame / FADE_OUT_FRAMES);
    return 1;
  }
}
