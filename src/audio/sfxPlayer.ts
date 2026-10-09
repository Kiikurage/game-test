import type { Vec3Like } from '../core/gameEvents';
import type { BusName } from './volume';
import type {
  BufferSourceLike,
  DisconnectableNodeLike,
  GainNodePlaybackLike,
  PlaybackContextLike,
} from './playbackTypes';
import type { SoundManifestEntry } from './manifest';
import type { SoundLibrary } from './soundLibrary';
import { VoiceLimiter } from './voiceLimiter';
import { SPATIAL, pickVariant, randomGain, randomPlaybackRate, type Rng } from './variants';

export interface PlayRequest {
  /** 素材 ID またはバリエーショングループ名。 */
  readonly cue: string;
  /** 指定すると `PannerNode`（equalpower、inverse 減衰）で定位する。省略時は非定位。 */
  readonly position?: Vec3Like;
  /** 線形ゲインの追加倍率（既定 1）。 */
  readonly volume?: number;
  /** マニフェストの優先度を上書きする（0〜100）。 */
  readonly priority?: number;
}

export interface LoopOptions {
  readonly position?: Vec3Like;
  readonly volume?: number;
  readonly fadeInSeconds?: number;
}

export interface SoundHandle {
  /** 停止。`fadeSeconds` > 0 ならフェードアウトして止める。 */
  stop(fadeSeconds?: number): void;
}

export interface SfxStats {
  /** 再生を開始した数。 */
  played: number;
  /** 同時発音数の上限で拒否された数。 */
  dropped: number;
  /** より優先度の高い要求に追い出された数。 */
  evicted: number;
  /** 未ロード・コンテキスト停止中で見送った数（未ロードは裏でロードを開始する）。 */
  skipped: number;
  /** マニフェストに無い cue の要求数。 */
  unknown: number;
}

interface Voice {
  readonly id: number;
  readonly source: BufferSourceLike;
  readonly gain: GainNodePlaybackLike;
  readonly extra: readonly DisconnectableNodeLike[];
  ended: boolean;
  readonly onEnded: (() => void) | undefined;
}

interface WantedLoop {
  opts: LoopOptions;
  voice?: Voice;
}

export interface SfxPlayerOptions {
  readonly maxVoices: number;
  readonly rng?: Rng;
}

/**
 * SE・環境音の再生層。同時発音数の制限（優先度による淘汰）、バリエーションの直前回避、
 * ピッチ/音量の揺らぎ、`PannerNode` による定位、ループのフェードを担当する。
 *
 * `play` は同期的に `start()` する（デコード済みなら 0F 遅延）。ヒットストップ開始と同じ tick で呼べる。
 * 未ロードの素材は取りこぼして裏でロードする（呼び出し側は事前に `SoundLibrary.preload` する）。
 */
export class SfxPlayer {
  readonly stats: SfxStats = { played: 0, dropped: 0, evicted: 0, skipped: 0, unknown: 0 };
  private readonly limiter: VoiceLimiter;
  private readonly rng: Rng;
  private readonly voices = new Map<number, Voice>();
  private readonly lastVariant = new Map<string, string>();
  private readonly loops = new Map<string, WantedLoop>();

  constructor(
    private readonly ctx: PlaybackContextLike,
    private readonly buses: { input(bus: BusName): unknown },
    private readonly library: SoundLibrary,
    opts: SfxPlayerOptions,
  ) {
    this.limiter = new VoiceLimiter(opts.maxVoices);
    this.rng = opts.rng ?? Math.random;
  }

  get activeVoices(): number {
    return this.limiter.count;
  }

  /** リスナー（カメラ）の位置と向きを更新する。毎フレーム呼んでよい。 */
  setListener(position: Vec3Like, forward: Vec3Like, up: Vec3Like): void {
    const l = this.ctx.listener;
    l.positionX.value = position.x;
    l.positionY.value = position.y;
    l.positionZ.value = position.z;
    l.forwardX.value = forward.x;
    l.forwardY.value = forward.y;
    l.forwardZ.value = forward.z;
    l.upX.value = up.x;
    l.upY.value = up.y;
    l.upZ.value = up.z;
  }

  /** ワンショット再生。再生できたら停止用ハンドルを返す。 */
  play(req: PlayRequest): SoundHandle | undefined {
    const variants = this.library.variantsOf(req.cue);
    if (variants.length === 0) {
      this.stats.unknown++;
      return undefined;
    }
    const entry = this.chooseVariant(req.cue, variants);
    if (!entry) {
      this.stats.skipped++;
      for (const v of variants) void this.library.load(v.id);
      return undefined;
    }
    // 停止中のコンテキストへ溜め込むと、再開時にまとめて鳴ってしまう。
    if (this.ctx.state !== 'running') {
      this.stats.skipped++;
      return undefined;
    }
    const voice = this.start(entry, req.priority ?? entry.priority, {
      loop: false,
      position: req.position,
      volume: req.volume,
    });
    return voice && this.handleFor(voice);
  }

  /**
   * ループ再生（環境音など）を開始する。同じ cue は 1 本だけ。ロード前・コンテキスト停止中でも
   * 要求は保持され、準備ができた時点で始まる。
   */
  startLoop(cue: string, opts: LoopOptions = {}): SoundHandle {
    const existing = this.loops.get(cue);
    if (existing) return this.loopHandle(cue, existing);
    const wanted: WantedLoop = { opts };
    this.loops.set(cue, wanted);
    this.tryStartLoop(cue, wanted);
    return this.loopHandle(cue, wanted);
  }

  stopLoop(cue: string, fadeSeconds = 0): void {
    const w = this.loops.get(cue);
    if (!w) return;
    this.loops.delete(cue);
    if (w.voice) this.stopVoice(w.voice, fadeSeconds);
  }

  isLooping(cue: string): boolean {
    return this.loops.has(cue);
  }

  stopAll(fadeSeconds = 0): void {
    this.loops.clear();
    for (const v of [...this.voices.values()]) this.stopVoice(v, fadeSeconds);
  }

  private loopHandle(cue: string, wanted: WantedLoop): SoundHandle {
    return {
      stop: (fade) => {
        if (this.loops.get(cue) === wanted) this.stopLoop(cue, fade);
      },
    };
  }

  private tryStartLoop(cue: string, wanted: WantedLoop): void {
    if (this.loops.get(cue) !== wanted || wanted.voice) return;
    const variants = this.library.variantsOf(cue);
    if (variants.length === 0) {
      this.stats.unknown++;
      this.loops.delete(cue);
      return;
    }
    const entry = this.chooseVariant(cue, variants);
    if (!entry) {
      // ロード完了後に再試行する。
      void Promise.all(variants.map((v) => this.library.load(v.id))).then(() => {
        if (variants.some((v) => this.library.buffer(v.id))) this.tryStartLoop(cue, wanted);
        else if (this.loops.get(cue) === wanted) this.loops.delete(cue);
      });
      return;
    }
    const voice = this.start(entry, entry.priority, {
      loop: true,
      position: wanted.opts.position,
      volume: wanted.opts.volume,
      fadeInSeconds: wanted.opts.fadeInSeconds,
      onEnded: () => {
        // 優先度で追い出されたなど、止めた覚えのない終了。要求も取り下げる。
        if (this.loops.get(cue) === wanted) this.loops.delete(cue);
      },
    });
    if (voice) wanted.voice = voice;
    else this.loops.delete(cue);
  }

  /** ロード済みのバリエーションから直前と違うものを選ぶ。 */
  private chooseVariant(
    cue: string,
    variants: readonly SoundManifestEntry[],
  ): SoundManifestEntry | undefined {
    const ready = variants.filter((v) => this.library.buffer(v.id));
    if (ready.length === 0) return undefined;
    const lastId = this.lastVariant.get(cue);
    const last = lastId === undefined ? undefined : ready.findIndex((v) => v.id === lastId);
    const picked = ready[pickVariant(ready.length, last === -1 ? undefined : last, this.rng)];
    if (picked) this.lastVariant.set(cue, picked.id);
    return picked;
  }

  private start(
    entry: SoundManifestEntry,
    priority: number,
    o: {
      loop: boolean;
      position?: Vec3Like | undefined;
      volume?: number | undefined;
      fadeInSeconds?: number | undefined;
      onEnded?: () => void;
    },
  ): Voice | undefined {
    const buffer = this.library.buffer(entry.id);
    if (!buffer) return undefined;
    const slot = this.limiter.acquire(priority);
    if (!slot.accepted) {
      this.stats.dropped++;
      return undefined;
    }
    if (slot.evicted !== undefined) {
      this.stats.evicted++;
      const victim = this.voices.get(slot.evicted);
      if (victim) this.stopVoice(victim, 0);
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (o.loop) {
      source.loop = true;
      source.loopStart = entry.loopStart ?? 0;
      source.loopEnd = entry.loopEnd ?? buffer.duration;
    } else {
      // ループは揺らがせない（ループ点がずれる）。ワンショットだけピッチを ±4% 揺らす。
      source.playbackRate.value = randomPlaybackRate(this.rng);
    }
    const gain = ctx.createGain();
    const level = entry.gain * (o.volume ?? 1) * (o.loop ? 1 : randomGain(this.rng));
    const extra: DisconnectableNodeLike[] = [];
    if (o.fadeInSeconds && o.fadeInSeconds > 0) {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(level, now + o.fadeInSeconds);
    } else {
      gain.gain.value = level;
    }
    source.connect(gain);
    let tail: GainNodePlaybackLike | DisconnectableNodeLike = gain;
    if (o.position) {
      const panner = ctx.createPanner();
      panner.panningModel = SPATIAL.panningModel;
      panner.distanceModel = SPATIAL.distanceModel;
      panner.refDistance = SPATIAL.refDistance;
      panner.maxDistance = SPATIAL.maxDistance;
      panner.rolloffFactor = SPATIAL.rolloffFactor;
      panner.positionX.value = o.position.x;
      panner.positionY.value = o.position.y;
      panner.positionZ.value = o.position.z;
      gain.connect(panner);
      extra.push(panner);
      tail = panner;
    }
    tail.connect(this.buses.input(entry.bus) as never);

    const voice: Voice = { id: slot.id, source, gain, extra, ended: false, onEnded: o.onEnded };
    this.voices.set(voice.id, voice);
    source.onended = () => {
      this.finish(voice);
    };
    source.start(now);
    this.stats.played++;
    return voice;
  }

  private handleFor(voice: Voice): SoundHandle {
    return {
      stop: (fade) => {
        this.stopVoice(voice, fade ?? 0);
      },
    };
  }

  private stopVoice(voice: Voice, fadeSeconds: number): void {
    if (voice.ended) return;
    if (fadeSeconds > 0) {
      const now = this.ctx.currentTime;
      const g = voice.gain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + fadeSeconds);
      voice.source.stop(now + fadeSeconds);
      return;
    }
    // 追い出し・即停止: 発音枠はすぐ空ける（onended を待たない）。
    voice.source.onended = null;
    try {
      voice.source.stop();
    } catch {
      // 未開始・停止済み
    }
    this.finish(voice);
  }

  private finish(voice: Voice): void {
    if (voice.ended) return;
    voice.ended = true;
    this.voices.delete(voice.id);
    this.limiter.release(voice.id);
    voice.source.disconnect();
    voice.gain.disconnect();
    for (const n of voice.extra) n.disconnect();
    voice.onEnded?.();
  }
}
