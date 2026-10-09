import { DuckingEnvelope, type DuckOptions } from './ducking';
import type {
  AudioContextLike,
  AudioContextStateLike,
  AudioNodeLike,
  BiquadFilterNodeLike,
  GainNodeLike,
} from './types';
import {
  CHILD_BUSES,
  DEFAULT_VOLUME,
  clampVolume,
  volumeToGain,
  type BusName,
  type ChildBusName,
} from './volume';

/** ポーズ中の BGM 低域カットの周波数（仕様書 10.2 節）。 */
export const PAUSE_LOWPASS_HZ = 800;
/** ローパス無効時の周波数（可聴域の上限より上）。 */
export const LOWPASS_OPEN_HZ = 20000;
const PAUSE_FILTER_FADE_SECONDS = 0.25;

/**
 * オーディオエンジン: バス構成・音量設定・BGM ダッキング・resume。
 *
 * ```
 * sfx ─────────┐
 * ambient ─────┤
 * ui ──────────┼→ master → destination
 * bgm → duck → lowpass ┘
 * ```
 *
 * 各素材の再生側は `input(bus)` で得たノードへ接続する（ローダ・再生は E7-1b 以降）。
 */
export class AudioEngine {
  private readonly buses: Record<BusName, GainNodeLike>;
  private readonly volumes: Record<BusName, number> = { ...DEFAULT_VOLUME };
  private readonly duckGain: GainNodeLike;
  private readonly duckEnvelope = new DuckingEnvelope();
  private readonly lowpass: BiquadFilterNodeLike;
  private paused = false;
  private resumePromise: Promise<AudioContextStateLike> | undefined;
  private readonly stateListeners = new Set<(state: AudioContextStateLike) => void>();

  constructor(private readonly ctx: AudioContextLike) {
    const master = ctx.createGain();
    const children = {} as Record<ChildBusName, GainNodeLike>;
    for (const name of CHILD_BUSES) children[name] = ctx.createGain();
    this.buses = { master, ...children };

    // bgm → duck → lowpass → master
    this.duckGain = ctx.createGain();
    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = LOWPASS_OPEN_HZ;
    children.bgm.connect(this.duckGain);
    this.duckGain.connect(this.lowpass);
    this.lowpass.connect(master);
    for (const name of ['sfx', 'ambient', 'ui'] as const) children[name].connect(master);
    master.connect(ctx.destination);

    for (const name of Object.keys(this.volumes) as BusName[]) this.applyVolume(name);

    ctx.addEventListener('statechange', () => {
      for (const l of this.stateListeners) l(ctx.state);
    });
  }

  get state(): AudioContextStateLike {
    return this.ctx.state;
  }

  get currentTime(): number {
    return this.ctx.currentTime;
  }

  /** 素材の再生ノードを接続する先（バスの入力）。 */
  input(bus: BusName): AudioNodeLike {
    return this.buses[bus];
  }

  /** `AudioContext` の状態変化を購読する。戻り値は購読解除。 */
  onStateChange(listener: (state: AudioContextStateLike) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * ユーザー操作（「タップして始める」等）のハンドラ内で呼ぶ。
   * 既に running なら何もしない。失敗しても例外は投げず、結果の状態を返す。
   */
  resume(): Promise<AudioContextStateLike> {
    if (this.ctx.state === 'running' || this.ctx.state === 'closed') {
      return Promise.resolve(this.ctx.state);
    }
    // resume() はジェスチャ内で同期的に呼ぶ必要があるため、await を挟まずに起動する。
    const p = (this.resumePromise ??= this.ctx.resume().then(
      () => this.ctx.state,
      () => this.ctx.state,
    ));
    void p.then(() => {
      if (this.resumePromise === p) this.resumePromise = undefined;
    });
    return p;
  }

  /** バスの設定音量（0〜100）を直接設定する。 */
  setVolume(bus: BusName, volume: number): void {
    this.volumes[bus] = clampVolume(volume);
    this.applyVolume(bus);
  }

  getVolume(bus: BusName): number {
    return this.volumes[bus];
  }

  /** バスの現在のゲイン設定値（検査・デバッグ用）。 */
  getBusGain(bus: BusName): number {
    return this.buses[bus].gain.value;
  }

  /** BGM をダッキングする。解放用の ID を返す（`holdSeconds` 指定時は自動で戻る）。 */
  duckBgm(opts: DuckOptions): number {
    const now = this.ctx.currentTime;
    const id = this.duckEnvelope.start(now, opts);
    this.scheduleDuck(now);
    return id;
  }

  /** `holdSeconds` なしで開始したダッキングを解除する。 */
  releaseDuck(id: number, releaseSeconds?: number): void {
    const now = this.ctx.currentTime;
    this.duckEnvelope.release(now, id, releaseSeconds);
    this.scheduleDuck(now);
  }

  /** ポーズ時の BGM 低域カット（ローパス 800Hz）の切り替え。 */
  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    const f = this.lowpass.frequency;
    const now = this.ctx.currentTime;
    f.cancelScheduledValues(now);
    f.setValueAtTime(f.value, now);
    f.linearRampToValueAtTime(
      paused ? PAUSE_LOWPASS_HZ : LOWPASS_OPEN_HZ,
      now + PAUSE_FILTER_FADE_SECONDS,
    );
  }

  get isPaused(): boolean {
    return this.paused;
  }

  private applyVolume(bus: BusName): void {
    const g = this.buses[bus].gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(volumeToGain(this.volumes[bus]), now);
  }

  private scheduleDuck(now: number): void {
    const g = this.duckGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(this.duckEnvelope.gainAt(now), now);
    for (const k of this.duckEnvelope.knotsAfter(now)) g.linearRampToValueAtTime(k.gain, k.time);
    this.duckEnvelope.prune(now);
  }
}
