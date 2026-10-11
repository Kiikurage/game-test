import { describe, expect, it, vi } from 'vitest';
import { EventBus, type GameEventMap } from '../core/gameEvents';
import { AudioEngine } from './audioEngine';
import { BgmController, Fade, loopedOffset } from './bgmController';
import { bindBgmEvents } from './bgmEvents';
import type { SoundManifestEntry } from './manifest';
import type { BufferSourceLike, GainNodePlaybackLike, PlaybackContextLike } from './playbackTypes';
import { SoundLibrary } from './soundLibrary';
import { dbToGain } from './volume';

const param = (v = 0) => ({
  value: v,
  cancelScheduledValues: vi.fn(),
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
});

interface MockSource extends BufferSourceLike {
  startArgs: [number | undefined, number | undefined] | undefined;
  stopArgs: (number | undefined)[];
}
interface MockGain extends GainNodePlaybackLike {
  dest?: unknown;
}

function makeCtx() {
  const sources: MockSource[] = [];
  const gains: MockGain[] = [];
  const ctx = {
    currentTime: 0,
    state: 'running' as const,
    destination: { connect: vi.fn() },
    resume: () => Promise.resolve(),
    addEventListener: vi.fn(),
    createBiquadFilter: () => ({ type: 'lowpass', frequency: param(), connect: vi.fn() }),
    createGain(): MockGain {
      const g: MockGain = {
        gain: param(1),
        connect(d) {
          g.dest = d;
        },
        disconnect: vi.fn(),
      };
      gains.push(g);
      return g;
    },
    createBufferSource(): MockSource {
      const s: MockSource = {
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        playbackRate: { value: 1 },
        onended: null,
        startArgs: undefined,
        stopArgs: [],
        connect: vi.fn(),
        disconnect: vi.fn(),
        start(when, offset) {
          s.startArgs = [when, offset];
        },
        stop(when) {
          s.stopArgs.push(when);
        },
      };
      sources.push(s);
      return s;
    },
  };
  return { ctx, sources, gains };
}

function entry(id: string, over: Partial<SoundManifestEntry> = {}): SoundManifestEntry {
  return {
    id,
    file: `${id}.ogg`,
    bus: 'bgm',
    kind: 'bgm',
    loop: true,
    loopStart: 1,
    loopEnd: 91,
    priority: 45,
    gain: 1,
    channels: 2,
    bytes: 1,
    duration: 91.5,
    ...over,
  };
}

async function setup(withField = false) {
  const m = makeCtx();
  const lib = new SoundLibrary({
    decode: (d) => Promise.resolve({ duration: d.byteLength / 1000 }),
    baseUrl: '/a/',
    opusSupported: true,
    fetchBytes: () => Promise.resolve(new ArrayBuffer(91500)),
  });
  const sounds = [
    entry('bgm.boss'),
    entry('bgm.boss-layer', { gain: 0.8 }),
    entry('bgm.victory', { loop: false, loopStart: undefined, loopEnd: undefined }),
    entry('bgm.title'),
    ...(withField ? [entry('bgm.field', { gain: 0.5 })] : []),
  ];
  lib.setManifest({ sounds });
  await lib.preload(() => true);
  const engine = new AudioEngine(m.ctx as unknown as PlaybackContextLike);
  const bgm = new BgmController(m.ctx as unknown as PlaybackContextLike, engine, lib);
  const events = new EventBus<GameEventMap>();
  const duckSpy = vi.spyOn(engine, 'duckBgm');
  const releaseSpy = vi.spyOn(engine, 'releaseDuck');
  bindBgmEvents(events, bgm, engine, (id) => lib.get(id) !== undefined);
  return { ...m, lib, engine, bgm, events, duckSpy, releaseSpy };
}

describe('fade math', () => {
  it('interpolates linearly and clamps outside the range', () => {
    const f = new Fade(0, 1, 10, 6);
    expect(f.valueAt(9)).toBe(0);
    expect(f.valueAt(13)).toBeCloseTo(0.5);
    expect(f.valueAt(16)).toBe(1);
    expect(f.valueAt(99)).toBe(1);
    expect(new Fade(0.4, 0.4, 0, 0).valueAt(1)).toBe(0.4);
  });

  it('wraps the playback offset at the loop end', () => {
    expect(loopedOffset(5, true, 1, 91)).toBe(5);
    expect(loopedOffset(91, true, 1, 91)).toBe(1);
    expect(loopedOffset(100, true, 1, 91)).toBeCloseTo(10);
    expect(loopedOffset(181, true, 1, 91)).toBeCloseTo(1 + ((181 - 1) % 90));
    expect(loopedOffset(100, false, 1, 91)).toBe(100);
  });
});

describe('BgmController', () => {
  it('starts the boss loop with the manifest loop points and fades it in', async () => {
    const { bgm, sources, ctx } = await setup();
    ctx.currentTime = 10;
    bgm.play('bgm.boss', { fadeFrames: 60 });
    const main = src(sources, 0);
    expect(main.loop).toBe(true);
    expect(main.loopStart).toBe(1);
    expect(main.loopEnd).toBe(91);
    expect(main.startArgs).toEqual([10, 0]);
    expect(bgm.state.main).toMatchObject({ id: 'bgm.boss', target: 1, fadeSeconds: 1 });
    ctx.currentTime = 10.5;
    expect(bgm.state.main?.gain).toBeCloseTo(0.5);
  });

  it('starts the phase-2 layer silently in sync, then crossfades it in over 6 seconds', async () => {
    const { bgm, sources, ctx } = await setup();
    bgm.play('bgm.boss', { fadeFrames: 0 });
    // 同期レイヤーは同じ時刻に無音で始まっている
    expect(sources).toHaveLength(2);
    expect(src(sources, 1).startArgs).toEqual([0, 0]);
    expect(bgm.state.layers[0]).toMatchObject({ id: 'bgm.boss-layer', gain: 0 });

    ctx.currentTime = 20;
    bgm.addLayer('bgm.boss-layer', 360);
    expect(sources).toHaveLength(2); // 新しい音源は作らず、既存のレイヤーを重ねる
    expect(bgm.state.layers[0]).toMatchObject({ target: 0.8, fadeSeconds: 6 });
    ctx.currentTime = 23;
    expect(bgm.state.layers[0]?.gain).toBeCloseTo(0.4);
    ctx.currentTime = 26;
    expect(bgm.state.layers[0]?.gain).toBeCloseTo(0.8);
    expect(bgm.state.main?.gain).toBe(1); // ベースは維持
  });

  it('syncs a layer that finishes loading late to the main loop position', async () => {
    const { bgm, sources, ctx, lib } = await setup();
    const layerBuf = lib.buffer('bgm.boss-layer');
    // 未ロード状態を再現（ライブラリのキャッシュを隠す）
    vi.spyOn(lib, 'buffer').mockImplementation((id) =>
      id === 'bgm.boss-layer' ? undefined : layerBuf,
    );
    vi.spyOn(lib, 'load').mockImplementation(() => {
      ctx.currentTime = 100;
      vi.spyOn(lib, 'buffer').mockImplementation(() => layerBuf);
      return Promise.resolve(layerBuf);
    });
    bgm.play('bgm.boss');
    expect(sources).toHaveLength(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(sources).toHaveLength(2);
    // 100 秒後（ループ 1 周越え）に、メインと同じ位置から始まる
    expect(src(sources, 1).startArgs?.[1]).toBeCloseTo(loopedOffset(100, true, 1, 91));
  });

  it('fades everything out over 90 frames and stops the sources', async () => {
    const { bgm, sources, ctx } = await setup();
    bgm.play('bgm.boss');
    ctx.currentTime = 5;
    bgm.addLayer('bgm.boss-layer', 360);
    ctx.currentTime = 7;
    bgm.stop(90);
    expect(src(sources, 0).stopArgs).toEqual([8.5]);
    expect(src(sources, 1).stopArgs).toEqual([8.5]);
    expect(bgm.current).toBeUndefined();
  });

  it('does not restart a track that is already playing', async () => {
    const { bgm, sources } = await setup();
    bgm.play('bgm.boss');
    bgm.play('bgm.boss');
    expect(sources).toHaveLength(2); // main + layer のみ
  });

  it('plays the victory jingle once without looping', async () => {
    const { bgm, sources } = await setup();
    bgm.play('bgm.victory', { fadeFrames: 60, loop: false });
    expect(src(sources, 0).loop).toBe(false);
  });
});

describe('bindBgmEvents', () => {
  it('plays the boss loop on entry, adds the layer on transition, fades out on defeat', async () => {
    const { events, bgm, sources, ctx } = await setup();
    events.emit('bgmChange', { track: 'bgm.boss', frames: 60 });
    expect(bgm.state.main).toMatchObject({ id: 'bgm.boss', fadeSeconds: 1 });
    events.emit('bgmLayer', { layer: 'bgm.boss-layer', frames: 360 });
    expect(bgm.state.layers[0]).toMatchObject({ fadeSeconds: 6, target: 0.8 });
    ctx.currentTime = 100;
    events.emit('bgmFadeOut', { frames: 90 });
    expect(src(sources, 0).stopArgs).toEqual([101.5]);
    expect(bgm.current).toBeUndefined();
  });

  it('plays the victory song at the text cue and stops it after the bonfire (no field track)', async () => {
    const { events, bgm, sources, ctx } = await setup();
    events.emit('bossDefeatCue', { id: 'boss', cue: 'text', frame: 150, position: v() });
    expect(bgm.current).toBe('bgm.victory');
    ctx.currentTime = 10;
    events.emit('bossDefeatCue', { id: 'boss', cue: 'bonfire', frame: 300, position: v() });
    expect(bgm.current).toBeUndefined();
    expect(src(sources, 0).stopArgs).toEqual([13]);
  });

  it('stops on area when there is no field track', async () => {
    const { events, bgm } = await setup();
    events.emit('bgmChange', { track: 'bgm.boss', frames: 0 });
    events.emit('bgmChange', { track: 'bgm.area', frames: 60 });
    expect(bgm.current).toBeUndefined();
  });

  it('crossfades to bgm.field on area, and back to it after the victory song', async () => {
    const { events, bgm, sources, ctx } = await setup(true);
    events.emit('bgmChange', { track: 'bgm.boss', frames: 60 });
    ctx.currentTime = 50;
    events.emit('bgmChange', { track: 'bgm.area', frames: 60 });
    expect(bgm.current).toBe('bgm.field');
    // ボスは 3 秒（180F。短い指定はゆっくりに引き上げ）でフェードアウトし、フィールドが同じ時間で入る
    expect(src(sources, 0).stopArgs).toEqual([53]);
    expect(bgm.state.main).toMatchObject({ id: 'bgm.field', fadeSeconds: 3, target: 0.5 });

    events.emit('bossDefeatCue', { id: 'boss', cue: 'text', frame: 150, position: v() });
    expect(bgm.current).toBe('bgm.victory');
    events.emit('bossDefeatCue', { id: 'boss', cue: 'bonfire', frame: 300, position: v() });
    expect(bgm.current).toBe('bgm.field');
  });

  it('ducks by -12dB over 60 frames on death and releases it', async () => {
    const { events, duckSpy, releaseSpy } = await setup();
    events.emit('bgmDuck', { db: -12, frames: 60 });
    expect(duckSpy).toHaveBeenCalledWith({ db: -12, fadeSeconds: 1 });
    expect(dbToGain(-12)).toBeCloseTo(0.251, 3);
    events.emit('bgmDuck', { db: 0, frames: 90 });
    expect(releaseSpy).toHaveBeenCalledWith(1, 1.5);
  });

  it('ignores a release without an active duck', async () => {
    const { events, releaseSpy } = await setup();
    events.emit('bgmDuck', { db: 0, frames: 30 });
    expect(releaseSpy).not.toHaveBeenCalled();
  });
});

function src(sources: MockSource[], i: number): MockSource {
  const s = sources[i];
  if (!s) throw new Error(`no source #${i}`);
  return s;
}

function v() {
  return { x: 0, y: 0, z: 0 };
}
