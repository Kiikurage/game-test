import type { BufferSourceLike, GainNodePlaybackLike, PlaybackContextLike } from './playbackTypes';
import type { SoundManifestEntry } from './manifest';
import type { SoundLibrary } from './soundLibrary';
import { framesToSeconds } from './volume';

/** 同期して重ねるレイヤー（仕様書 10.2 節: フェーズ 2 のレイヤー）。メイン曲 ID → レイヤー ID。 */
export const BGM_LAYERS: Readonly<Record<string, readonly string[]>> = {
  'bgm.boss': ['bgm.boss-layer'],
};

/** 線形フェード。`valueAt` は区間外で端の値を返す。新しいフェードは現在値から始める。 */
export class Fade {
  constructor(
    readonly from: number,
    readonly to: number,
    readonly start: number,
    readonly seconds: number,
  ) {}

  valueAt(t: number): number {
    if (this.seconds <= 0 || t >= this.start + this.seconds) return this.to;
    if (t <= this.start) return this.from;
    return this.from + (this.to - this.from) * ((t - this.start) / this.seconds);
  }
}

/**
 * 曲の経過時間 → バッファ内の再生位置（秒）。ループ曲は `loopEnd` を越えたら `loopStart` へ折り返す
 * （`AudioBufferSourceNode` の挙動と同じ）。レイヤーを途中から同期して始めるときの `offset` に使う。
 */
export function loopedOffset(
  elapsed: number,
  loop: boolean,
  loopStart: number,
  loopEnd: number,
): number {
  if (!loop || loopEnd <= loopStart || elapsed < loopEnd) return Math.max(0, elapsed);
  return loopStart + ((elapsed - loopStart) % (loopEnd - loopStart));
}

interface Track {
  readonly id: string;
  readonly entry: SoundManifestEntry;
  readonly source: BufferSourceLike;
  readonly gain: GainNodePlaybackLike;
  /** 曲の頭（バッファの 0 秒）に相当する時刻（`ctx.currentTime` 基準）。 */
  readonly startedAt: number;
  fade: Fade;
  ended: boolean;
}

export interface BgmPlayOptions {
  /** フェードイン（フレーム）。 */
  readonly fadeFrames?: number;
  /** 前の曲のフェードアウト（フレーム。既定は `fadeFrames`）。 */
  readonly outFrames?: number;
  /** 素材のループ設定を上書きする（既定は素材どおり）。 */
  readonly loop?: boolean;
}

export interface BgmTrackState {
  readonly id: string;
  /** 現在のゲイン。 */
  readonly gain: number;
  /** 直近のフェードの目標ゲインと所要秒数（検査用）。 */
  readonly target: number;
  readonly fadeSeconds: number;
}

export interface BgmState {
  readonly main: BgmTrackState | undefined;
  readonly layers: readonly BgmTrackState[];
}

type BgmLibrary = Pick<SoundLibrary, 'get' | 'buffer' | 'load'>;

/**
 * BGM の再生制御（ループ・レイヤー・クロスフェード）。ダッキング・ローパスは `AudioEngine` の bgm バスが担当する。
 *
 * - `play`: メイン曲を始める（前の曲はフェードアウトして置き換え）。同じ曲が再生中なら何もしない。
 *   レイヤーが定義された曲（`BGM_LAYERS`）は、無音のレイヤーを同じ時刻に始めて同期を取っておく。
 * - `addLayer`: 同期したレイヤーを `frames` かけて重ねる（フェーズ 2 は 360F = 6 秒）。
 * - `stop`: 全部を `frames` かけてフェードアウトして止める（撃破 90F）。
 *
 * 未ロードの曲はロードしてから始める（要求が後から取り消されたら始めない）。
 */
export class BgmController {
  private main: Track | undefined;
  private readonly layers = new Map<string, Track>();
  /** 要求の世代。`play` / `stop` で進め、非同期ロード完了時に古い要求を捨てる。 */
  private generation = 0;
  /** ロード待ちのレイヤー要求（ID → フレーム数）。 */
  private readonly wantedLayers = new Map<string, number>();

  constructor(
    private readonly ctx: PlaybackContextLike,
    private readonly bus: { input(bus: 'bgm'): unknown },
    private readonly library: BgmLibrary,
  ) {}

  get state(): BgmState {
    const t = this.ctx.currentTime;
    const of = (k: Track): BgmTrackState => ({
      id: k.id,
      gain: k.fade.valueAt(t),
      target: k.fade.to,
      fadeSeconds: k.fade.seconds,
    });
    return { main: this.main && of(this.main), layers: [...this.layers.values()].map(of) };
  }

  /** 再生中（フェードアウト中は含まない）のメイン曲 ID。 */
  get current(): string | undefined {
    return this.main?.id;
  }

  play(id: string, opts: BgmPlayOptions = {}): void {
    if (this.main?.id === id && !this.main.ended) return;
    const gen = ++this.generation;
    this.fadeOutAll(framesToSeconds(opts.outFrames ?? opts.fadeFrames ?? 0));
    this.wantedLayers.clear();
    const entry = this.library.get(id);
    if (!entry) return;
    if (this.library.buffer(id)) {
      this.startMain(id, entry, opts);
      return;
    }
    void this.library.load(id).then((b) => {
      if (b && gen === this.generation) this.startMain(id, entry, opts);
    });
  }

  /** 同期レイヤーを重ねる。メイン曲がなければ無視する。 */
  addLayer(id: string, frames: number): void {
    if (!this.main || this.main.ended) return;
    const existing = this.layers.get(id);
    if (existing) {
      this.rampTo(existing, existing.entry.gain, framesToSeconds(frames));
      return;
    }
    const entry = this.library.get(id);
    if (!entry) return;
    this.wantedLayers.set(id, frames);
    if (this.library.buffer(id)) {
      this.ensureLayer(id, entry, frames);
      return;
    }
    const gen = this.generation;
    void this.library.load(id).then((b) => {
      const wanted = this.wantedLayers.get(id);
      if (b && gen === this.generation && wanted !== undefined) this.ensureLayer(id, entry, wanted);
    });
  }

  /** メイン曲とレイヤーを `frames` かけてフェードアウトして止める。 */
  stop(frames = 0): void {
    this.generation++;
    this.wantedLayers.clear();
    this.fadeOutAll(framesToSeconds(frames));
  }

  dispose(): void {
    this.stop(0);
  }

  private startMain(id: string, entry: SoundManifestEntry, opts: BgmPlayOptions): void {
    const fadeSeconds = framesToSeconds(opts.fadeFrames ?? 0);
    const track = this.startTrack(id, entry, {
      level: fadeSeconds > 0 ? 0 : entry.gain,
      loop: opts.loop ?? entry.loop,
      offset: 0,
    });
    if (!track) return;
    if (fadeSeconds > 0) this.rampTo(track, entry.gain, fadeSeconds);
    this.main = track;
    // 同期レイヤーは無音で同時に始めておく（後から重ねるときもずれない）。
    for (const layerId of BGM_LAYERS[id] ?? []) {
      const layer = this.library.get(layerId);
      if (!layer) continue;
      if (this.library.buffer(layerId)) {
        this.ensureLayer(layerId, layer, undefined);
        continue;
      }
      // 未ロードならロード後に、メイン曲の現在位置へ同期して始める（重ねる要求が先に来ていればそのフェードで）。
      const gen = this.generation;
      void this.library.load(layerId).then((b) => {
        if (b && gen === this.generation) {
          this.ensureLayer(layerId, layer, this.wantedLayers.get(layerId));
        }
      });
    }
  }

  /** レイヤーの音源を（なければ）メイン曲に同期して始める。`frames` があれば重ねるフェードを始める。 */
  private ensureLayer(id: string, entry: SoundManifestEntry, frames: number | undefined): void {
    const main = this.main;
    if (!main || main.ended) return;
    let layer = this.layers.get(id);
    if (!layer) {
      const elapsed = this.ctx.currentTime - main.startedAt;
      const offset = loopedOffset(
        elapsed,
        main.source.loop,
        main.source.loopStart,
        main.source.loopEnd,
      );
      layer = this.startTrack(id, entry, { level: 0, loop: main.source.loop, offset });
      if (!layer) return;
      this.layers.set(id, layer);
    }
    if (frames !== undefined) {
      this.rampTo(layer, entry.gain, framesToSeconds(frames));
      this.wantedLayers.delete(id);
    }
  }

  private startTrack(
    id: string,
    entry: SoundManifestEntry,
    o: { level: number; loop: boolean; offset: number },
  ): Track | undefined {
    const buffer = this.library.buffer(id);
    if (!buffer) return undefined;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (o.loop) {
      source.loop = true;
      source.loopStart = entry.loopStart ?? 0;
      source.loopEnd = entry.loopEnd ?? buffer.duration;
    }
    const gain = ctx.createGain();
    gain.gain.value = o.level;
    source.connect(gain);
    gain.connect(this.bus.input('bgm') as never);
    const track: Track = {
      id,
      entry,
      source,
      gain,
      startedAt: now - o.offset,
      fade: new Fade(o.level, o.level, now, 0),
      ended: false,
    };
    source.onended = () => {
      this.finish(track);
    };
    source.start(now, o.offset);
    return track;
  }

  /** 現在値から `target` へ `seconds` かけて線形に変える。 */
  private rampTo(track: Track, target: number, seconds: number): void {
    const now = this.ctx.currentTime;
    const from = track.fade.valueAt(now);
    track.fade = new Fade(from, target, now, seconds);
    const g = track.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(from, now);
    if (seconds > 0) g.linearRampToValueAtTime(target, now + seconds);
    else g.setValueAtTime(target, now);
  }

  private fadeOutAll(seconds: number): void {
    const tracks = [this.main, ...this.layers.values()];
    this.main = undefined;
    this.layers.clear();
    for (const t of tracks) if (t) this.fadeOutTrack(t, seconds);
  }

  private fadeOutTrack(track: Track, seconds: number): void {
    if (track.ended) return;
    if (seconds <= 0) {
      track.source.onended = null;
      try {
        track.source.stop();
      } catch {
        // 未開始・停止済み
      }
      this.finish(track);
      return;
    }
    this.rampTo(track, 0, seconds);
    track.source.stop(this.ctx.currentTime + seconds);
  }

  private finish(track: Track): void {
    if (track.ended) return;
    track.ended = true;
    track.source.disconnect();
    track.gain.disconnect();
    if (this.main === track) this.main = undefined;
    if (this.layers.get(track.id) === track) this.layers.delete(track.id);
  }
}
