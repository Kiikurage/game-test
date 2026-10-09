/* eslint-disable @typescript-eslint/unbound-method -- vi.fn のモックメソッドを expect に渡す */
import { describe, expect, it, vi } from 'vitest';
import { EventBus, type GameEventMap } from '../core/gameEvents';
import type { SoundManifestEntry } from './manifest';
import type {
  BufferSourceLike,
  GainNodePlaybackLike,
  PannerLike,
  PlaybackContextLike,
} from './playbackTypes';
import { listenerPoseFromMatrix } from './listener';
import { bindSfxEvents, toPlayRequest } from './sfxEvents';
import { SfxPlayer } from './sfxPlayer';
import { SoundLibrary, chooseFile, isOpusSupported } from './soundLibrary';
import {
  PITCH_JITTER,
  SPATIAL,
  VOLUME_JITTER_DB,
  distanceGain,
  pickVariant,
  randomGain,
  randomPlaybackRate,
  variantGroupOf,
} from './variants';
import { MAX_VOICES_DESKTOP, MAX_VOICES_MOBILE, VoiceLimiter, maxVoicesFor } from './voiceLimiter';

describe('VoiceLimiter', () => {
  it('has the spec limits for desktop and mobile', () => {
    expect(maxVoicesFor(false)).toBe(24);
    expect(maxVoicesFor(true)).toBe(16);
    expect(MAX_VOICES_DESKTOP).toBe(24);
    expect(MAX_VOICES_MOBILE).toBe(16);
  });

  it('accepts up to the limit, then evicts the oldest of the lowest priority', () => {
    const l = new VoiceLimiter(3);
    const a = l.acquire(30);
    const b = l.acquire(10);
    const c = l.acquire(10);
    expect([a, b, c].every((r) => r.accepted)).toBe(true);
    const d = l.acquire(50);
    // 最低優先 10 のうち最古（b）が追い出される
    expect(d).toMatchObject({ accepted: true, evicted: b.accepted ? b.id : -1 });
    expect(l.count).toBe(3);
    expect(l.has(c.accepted ? c.id : -1)).toBe(true);
  });

  it('rejects a request that is lower priority than every active voice', () => {
    const l = new VoiceLimiter(2);
    l.acquire(50);
    l.acquire(70);
    expect(l.acquire(30)).toEqual({ accepted: false });
    expect(l.count).toBe(2);
  });

  it('evicts the oldest on equal priority (newest wins)', () => {
    const l = new VoiceLimiter(2);
    const a = l.acquire(30);
    l.acquire(30);
    const c = l.acquire(30);
    expect(c).toMatchObject({ accepted: true, evicted: a.accepted ? a.id : -1 });
  });

  it('frees a slot on release', () => {
    const l = new VoiceLimiter(1);
    const a = l.acquire(50);
    if (!a.accepted) throw new Error('unreachable');
    l.release(a.id);
    expect(l.acquire(1)).toMatchObject({ accepted: true });
  });

  it('keeps the spec priority order player > boss > enemy > footstep > ambient', () => {
    const l = new VoiceLimiter(1);
    for (const p of [10, 30, 50, 70, 90]) expect(l.acquire(p).accepted).toBe(true);
    expect(l.acquire(30).accepted).toBe(false);
  });
});

describe('variant selection and randomization', () => {
  it('never repeats the previous variant', () => {
    let seed = 1;
    const rng = (): number => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (const count of [2, 3, 4, 7]) {
      let last: number | undefined;
      const seen = new Set<number>();
      for (let i = 0; i < 500; i++) {
        const v = pickVariant(count, last, rng);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(count);
        if (last !== undefined) expect(v).not.toBe(last);
        seen.add(v);
        last = v;
      }
      expect(seen.size).toBe(count);
    }
  });

  it('handles a single variant, and the rng upper edge', () => {
    expect(pickVariant(1, 0, () => 0.5)).toBe(0);
    expect(pickVariant(0, undefined, () => 0.5)).toBe(0);
    expect(pickVariant(3, undefined, () => 0.999999)).toBe(2);
    expect(pickVariant(3, 2, () => 0.999999)).toBe(1);
    expect(pickVariant(3, 0, () => 0)).toBe(1);
  });

  it('keeps pitch within +/-4% and gain within +/-1dB', () => {
    expect(PITCH_JITTER).toBe(0.04);
    expect(randomPlaybackRate(() => 0)).toBeCloseTo(0.96);
    expect(randomPlaybackRate(() => 0.5)).toBeCloseTo(1);
    expect(randomPlaybackRate(() => 0.999999)).toBeCloseTo(1.04, 4);
    for (let i = 0; i <= 100; i++) {
      const r = randomPlaybackRate(() => i / 100);
      expect(r).toBeGreaterThanOrEqual(0.96);
      expect(r).toBeLessThanOrEqual(1.04);
    }
    const lo = 10 ** (-VOLUME_JITTER_DB / 20);
    expect(randomGain(() => 0)).toBeCloseTo(lo);
    expect(randomGain(() => 0.5)).toBeCloseTo(1);
  });

  it('groups ids by stripping trailing numbers', () => {
    expect(variantGroupOf('sfx.sword-light1')).toBe('sfx.sword-light');
    expect(variantGroupOf('sfx.footstep-stone.12')).toBe('sfx.footstep-stone');
    expect(variantGroupOf('ui.dummy-click')).toBe('ui.dummy-click');
  });
});

describe('distance attenuation', () => {
  it('matches the Web Audio inverse model (ref 1m, max 30m, rolloff 1.2)', () => {
    expect(SPATIAL.refDistance).toBe(1);
    expect(SPATIAL.maxDistance).toBe(30);
    expect(SPATIAL.rolloffFactor).toBe(1.2);
    expect(distanceGain(0.2)).toBe(1);
    expect(distanceGain(1)).toBe(1);
    expect(distanceGain(2)).toBeCloseTo(1 / 2.2);
    expect(distanceGain(11)).toBeCloseTo(1 / 13);
    expect(distanceGain(30)).toBeCloseTo(1 / (1 + 1.2 * 29));
    // 30m で頭打ち
    expect(distanceGain(100)).toBe(distanceGain(30));
  });
});

describe('listener pose', () => {
  it('reads position, forward (-Z) and up from a world matrix', () => {
    // 単位回転 + 平行移動 (1,2,3)
    const e = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1];
    expect(listenerPoseFromMatrix(e)).toEqual({
      position: { x: 1, y: 2, z: 3 },
      forward: { x: -0, y: -0, z: -1 },
      up: { x: 0, y: 1, z: 0 },
    });
  });
});

describe('file selection', () => {
  const entry = { id: 'a', file: 'a.ogg', fallbackFile: 'a.m4a' } as SoundManifestEntry;
  it('uses Ogg Opus when supported, m4a otherwise', () => {
    expect(chooseFile(entry, true)).toBe('a.ogg');
    expect(chooseFile(entry, false)).toBe('a.m4a');
    expect(chooseFile({ ...entry, fallbackFile: undefined }, false)).toBe('a.ogg');
  });
  it('treats an empty canPlayType as unsupported', () => {
    expect(isOpusSupported('')).toBe(false);
    expect(isOpusSupported('maybe')).toBe(true);
    expect(isOpusSupported('probably')).toBe(true);
  });
});

// ---- モック AudioContext ----

const param = (v = 0) => ({
  value: v,
  cancelScheduledValues: vi.fn(),
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
});
const vp = () => ({ value: 0 });

interface MockSource extends BufferSourceLike {
  started: number | undefined;
  stopped: boolean;
  dest?: unknown;
}
interface MockGain extends GainNodePlaybackLike {
  dest?: unknown;
}
interface MockPanner extends PannerLike {
  dest?: unknown;
}

function makeCtx(state: 'running' | 'suspended' = 'running') {
  const sources: MockSource[] = [];
  const panners: MockPanner[] = [];
  const ctx = {
    currentTime: 0,
    state,
    destination: { connect: vi.fn() },
    listener: {
      positionX: vp(),
      positionY: vp(),
      positionZ: vp(),
      forwardX: vp(),
      forwardY: vp(),
      forwardZ: vp(),
      upX: vp(),
      upY: vp(),
      upZ: vp(),
    },
    resume: () => Promise.resolve(),
    addEventListener: vi.fn(),
    createBiquadFilter: vi.fn(),
    decodeAudioData: (d: ArrayBuffer) => Promise.resolve({ duration: d.byteLength / 1000 }),
    createGain(): MockGain {
      const g: MockGain = {
        gain: param(1),
        connect(d) {
          g.dest = d;
        },
        disconnect: vi.fn(),
      };
      return g;
    },
    createPanner(): MockPanner {
      const p: MockPanner = {
        panningModel: 'HRTF',
        distanceModel: 'linear',
        refDistance: 0,
        maxDistance: 0,
        rolloffFactor: 0,
        positionX: vp(),
        positionY: vp(),
        positionZ: vp(),
        connect(d) {
          p.dest = d;
        },
        disconnect: vi.fn(),
      };
      panners.push(p);
      return p;
    },
    createBufferSource(): MockSource {
      const s: MockSource = {
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        playbackRate: vp(),
        onended: null,
        started: undefined,
        stopped: false,
        connect(d) {
          s.dest = d;
        },
        disconnect: vi.fn(),
        start(when = 0) {
          s.started = when;
        },
        stop() {
          s.stopped = true;
        },
      };
      s.playbackRate.value = 1;
      sources.push(s);
      return s;
    },
  };
  return {
    ctx: ctx as unknown as PlaybackContextLike & { state: string },
    raw: ctx,
    sources,
    panners,
  };
}

function entry(id: string, over: Partial<SoundManifestEntry> = {}): SoundManifestEntry {
  return {
    id,
    file: `${id}.ogg`,
    bus: 'sfx',
    kind: 'se',
    loop: false,
    priority: 30,
    gain: 0.5,
    channels: 1,
    bytes: 1,
    duration: 1,
    ...over,
  };
}

async function setup(
  sounds: SoundManifestEntry[],
  opts: { maxVoices?: number; state?: 'running' | 'suspended'; rng?: () => number } = {},
) {
  const m = makeCtx(opts.state);
  const lib = new SoundLibrary({
    decode: (d) => m.ctx.decodeAudioData(d),
    baseUrl: '/audio/',
    opusSupported: true,
    fetchBytes: () => Promise.resolve(new ArrayBuffer(2000)),
  });
  lib.setManifest({ sounds });
  await lib.preload((e) => !!e);
  const busNodes: Record<string, object> = {
    sfx: { tag: 'sfx' },
    ambient: { tag: 'ambient' },
    ui: { tag: 'ui' },
    bgm: { tag: 'bgm' },
  };
  const player = new SfxPlayer(m.ctx, { input: (b) => busNodes[b] }, lib, {
    maxVoices: opts.maxVoices ?? 24,
    ...(opts.rng && { rng: opts.rng }),
  });
  return { ...m, lib, player, busNodes };
}

describe('SoundLibrary', () => {
  it('loads lazily, caches decoded buffers and dedupes concurrent loads', async () => {
    const fetchBytes = vi.fn(() => Promise.resolve(new ArrayBuffer(500)));
    const m = makeCtx();
    const lib = new SoundLibrary({
      decode: (d) => m.ctx.decodeAudioData(d),
      baseUrl: '/audio/',
      opusSupported: true,
      fetchBytes,
    });
    lib.setManifest({ sounds: [entry('sfx.a1'), entry('sfx.a2')] });
    expect(lib.buffer('sfx.a1')).toBeUndefined();
    await Promise.all([lib.load('sfx.a1'), lib.load('sfx.a1')]);
    await lib.load('sfx.a1');
    expect(fetchBytes).toHaveBeenCalledTimes(1);
    expect(fetchBytes).toHaveBeenCalledWith('/audio/sfx.a1.ogg');
    expect(lib.loadedCount).toBe(1);
    expect(lib.variantsOf('sfx.a').map((e) => e.id)).toEqual(['sfx.a1', 'sfx.a2']);
    expect(lib.variantsOf('sfx.a2').map((e) => e.id)).toEqual(['sfx.a2']);
    await lib.preload(['sfx.a']);
    expect(lib.loadedCount).toBe(2);
  });

  it('uses the m4a fallback when Opus is unsupported, and after an Opus decode failure', async () => {
    const fetched: string[] = [];
    const e = entry('x', { fallbackFile: 'x.m4a' });
    const lib = new SoundLibrary({
      decode: () => Promise.resolve({ duration: 1 }),
      baseUrl: '/a/',
      opusSupported: false,
      fetchBytes: (u) => {
        fetched.push(u);
        return Promise.resolve(new ArrayBuffer(1));
      },
    });
    lib.setManifest({ sounds: [e] });
    await lib.load('x');
    expect(fetched).toEqual(['/a/x.m4a']);

    const fetched2: string[] = [];
    let first = true;
    const lib2 = new SoundLibrary({
      decode: () =>
        first
          ? ((first = false), Promise.reject(new Error('decode')))
          : Promise.resolve({ duration: 1 }),
      baseUrl: '/a/',
      opusSupported: true,
      fetchBytes: (u) => {
        fetched2.push(u);
        return Promise.resolve(new ArrayBuffer(1));
      },
    });
    lib2.setManifest({ sounds: [e] });
    expect(await lib2.load('x')).toBeDefined();
    expect(fetched2).toEqual(['/a/x.ogg', '/a/x.m4a']);
  });

  it('marks a failed load and does not retry it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchBytes = vi.fn(() => Promise.reject(new Error('404')));
    const lib = new SoundLibrary({
      decode: () => Promise.resolve({ duration: 1 }),
      baseUrl: '/a/',
      opusSupported: true,
      fetchBytes,
    });
    lib.setManifest({ sounds: [entry('x')] });
    expect(await lib.load('x')).toBeUndefined();
    expect(await lib.load('x')).toBeUndefined();
    expect(fetchBytes).toHaveBeenCalledTimes(1);
    expect(lib.failedCount).toBe(1);
    warn.mockRestore();
  });
});

describe('SfxPlayer', () => {
  it('plays a one-shot immediately with jittered pitch and the entry gain', async () => {
    const { player, sources, busNodes } = await setup([entry('sfx.a1')], { rng: () => 0 });
    const h = player.play({ cue: 'sfx.a1' });
    expect(h).toBeDefined();
    expect(sources).toHaveLength(1);
    const s = sources[0];
    expect(s?.started).toBe(0);
    expect(s?.playbackRate.value).toBeCloseTo(0.96);
    expect((s?.dest as MockGain).gain.value).toBeCloseTo(0.5 * 10 ** (-1 / 20));
    expect((s?.dest as MockGain).dest).toBe(busNodes['sfx']);
    expect(player.stats.played).toBe(1);
  });

  it('returns silently for an unknown cue and counts it', async () => {
    const { player, sources } = await setup([entry('sfx.a1')]);
    expect(player.play({ cue: 'nope' })).toBeUndefined();
    expect(sources).toHaveLength(0);
    expect(player.stats.unknown).toBe(1);
  });

  it('skips when the context is not running or the buffer is not loaded yet', async () => {
    const s = await setup([entry('sfx.a1')], { state: 'suspended' });
    expect(s.player.play({ cue: 'sfx.a1' })).toBeUndefined();
    expect(s.player.stats.skipped).toBe(1);

    const m = makeCtx();
    const lib = new SoundLibrary({
      decode: (d) => m.ctx.decodeAudioData(d),
      baseUrl: '/a/',
      opusSupported: true,
      fetchBytes: () => Promise.resolve(new ArrayBuffer(10)),
    });
    lib.setManifest({ sounds: [entry('sfx.b')] });
    const p = new SfxPlayer(m.ctx, { input: () => ({}) }, lib, { maxVoices: 4 });
    expect(p.play({ cue: 'sfx.b' })).toBeUndefined();
    await lib.load('sfx.b');
    expect(p.play({ cue: 'sfx.b' })).toBeDefined(); // 裏でロードが始まっており 2 回目から鳴る
  });

  it('avoids repeating the same variant back to back', async () => {
    let n = 0;
    const { player, sources } = await setup([entry('sfx.s1'), entry('sfx.s2'), entry('sfx.s3')], {
      rng: () => (n++ * 0.37) % 1,
    });
    const bufs: unknown[] = [];
    for (let i = 0; i < 60; i++) {
      player.play({ cue: 'sfx.s' });
      bufs.push(sources[sources.length - 1]?.buffer);
    }
    for (let i = 1; i < bufs.length; i++) expect(bufs[i]).not.toBe(bufs[i - 1]);
  });

  it('spatializes positioned sounds with an equalpower inverse panner', async () => {
    const { player, panners, sources, busNodes } = await setup([entry('sfx.e1')]);
    player.play({ cue: 'sfx.e1', position: { x: 3, y: 1, z: -5 } });
    expect(panners).toHaveLength(1);
    const p = panners[0];
    expect(p).toMatchObject({
      panningModel: 'equalpower',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 30,
      rolloffFactor: 1.2,
    });
    expect([p?.positionX.value, p?.positionY.value, p?.positionZ.value]).toEqual([3, 1, -5]);
    expect(p?.dest).toBe(busNodes['sfx']);
    expect(sources).toHaveLength(1);
    player.play({ cue: 'sfx.e1' });
    expect(panners).toHaveLength(1); // 位置なしは非定位
  });

  it('follows the camera listener', async () => {
    const { player, raw } = await setup([entry('sfx.a1')]);
    player.setListener({ x: 1, y: 2, z: 3 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 });
    expect(raw.listener.positionZ.value).toBe(3);
    expect(raw.listener.forwardZ.value).toBe(-1);
    expect(raw.listener.upY.value).toBe(1);
  });

  it('evicts the lowest-priority oldest voice when over the limit', async () => {
    const { player, sources } = await setup(
      [
        entry('amb', { priority: 10, bus: 'ambient' }),
        entry('step', { priority: 30 }),
        entry('boss', { priority: 70 }),
        entry('hit', { priority: 90 }),
      ],
      { maxVoices: 2 },
    );
    player.play({ cue: 'amb' });
    player.play({ cue: 'step' });
    expect(player.activeVoices).toBe(2);
    player.play({ cue: 'boss' }); // amb を追い出す
    expect(sources[0]?.stopped).toBe(true);
    expect(sources[1]?.stopped).toBe(false);
    expect(player.stats.evicted).toBe(1);
    expect(player.play({ cue: 'amb' })).toBeUndefined(); // 低優先は拒否
    expect(player.stats.dropped).toBe(1);
    player.play({ cue: 'hit' }); // step を追い出す
    expect(sources[1]?.stopped).toBe(true);
    expect(player.activeVoices).toBe(2);
  });

  it('frees the slot when a sound ends', async () => {
    const { player, sources } = await setup([entry('a')], { maxVoices: 1 });
    player.play({ cue: 'a' });
    sources[0]?.onended?.(new Event('ended'));
    expect(player.activeVoices).toBe(0);
    expect(player.play({ cue: 'a' })).toBeDefined();
  });

  it('starts, fades out and stops a loop; one loop per cue', async () => {
    const { player, sources, raw } = await setup([
      entry('amb', {
        priority: 10,
        bus: 'ambient',
        kind: 'ambient',
        loop: true,
        loopStart: 1,
        loopEnd: 3,
      }),
    ]);
    const h = player.startLoop('amb', { fadeInSeconds: 2 });
    expect(player.startLoop('amb')).toBeDefined();
    expect(sources).toHaveLength(1);
    const s = sources[0];
    expect(s).toMatchObject({ loop: true, loopStart: 1, loopEnd: 3 });
    expect(s?.playbackRate.value).toBe(1);
    const g = (s?.dest as MockGain).gain;
    expect(g.setValueAtTime).toHaveBeenCalledWith(0, 0);
    expect(g.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, 2);
    expect(player.isLooping('amb')).toBe(true);

    raw.currentTime = 5;
    h.stop(1.5);
    expect(g.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 6.5);
    expect(player.isLooping('amb')).toBe(false);
    s?.onended?.(new Event('ended'));
    expect(player.activeVoices).toBe(0);
  });

  it('starts a loop requested before the sound is loaded', async () => {
    const m = makeCtx();
    const lib = new SoundLibrary({
      decode: (d) => m.ctx.decodeAudioData(d),
      baseUrl: '/a/',
      opusSupported: true,
      fetchBytes: () => Promise.resolve(new ArrayBuffer(10)),
    });
    lib.setManifest({ sounds: [entry('amb', { loop: true, bus: 'ambient', kind: 'ambient' })] });
    const p = new SfxPlayer(m.ctx, { input: () => ({}) }, lib, { maxVoices: 4 });
    p.startLoop('amb');
    expect(m.sources).toHaveLength(0);
    await lib.load('amb');
    await Promise.resolve();
    expect(m.sources).toHaveLength(1);
  });
});

describe('game events to SFX', () => {
  it('maps footstep/hit/sound events to play requests', () => {
    expect(
      toPlayRequest('footstep', {
        surface: 'stone',
        gait: 'run',
        source: 'player',
        position: { x: 1, y: 0, z: 1 },
      }),
    ).toEqual({ cue: 'sfx.footstep-stone', volume: 0.85 });
    expect(
      toPlayRequest('footstep', {
        surface: 'grass',
        gait: 'walk',
        source: 'enemy',
        position: { x: 1, y: 0, z: 1 },
      }),
    ).toMatchObject({ cue: 'sfx.footstep-grass', position: { x: 1, y: 0, z: 1 } });
    expect(toPlayRequest('hit', { kind: 'guard', source: 'player' })).toEqual({
      cue: 'sfx.guard',
      priority: 90,
    });
    expect(
      toPlayRequest('hit', { kind: 'heavy', source: 'boss', position: { x: 0, y: 0, z: 2 } }),
    ).toEqual({
      cue: 'sfx.hit-heavy',
      priority: 70,
      position: { x: 0, y: 0, z: 2 },
    });
    expect(toPlayRequest('sound', { cue: 'ui.dummy-click', volume: 0.5 })).toEqual({
      cue: 'ui.dummy-click',
      volume: 0.5,
    });
  });

  it('plays through the event bus and survives a throwing subscriber', () => {
    const bus = new EventBus<GameEventMap>();
    const play = vi.fn();
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    bus.on('hit', () => {
      throw new Error('boom');
    });
    const off = bindSfxEvents(bus, { play });
    bus.emit('hit', { kind: 'light', source: 'enemy' });
    expect(play).toHaveBeenCalledWith({ cue: 'sfx.hit-light', priority: 50 });
    off();
    bus.emit('hit', { kind: 'light', source: 'enemy' });
    expect(play).toHaveBeenCalledTimes(1);
    err.mockRestore();
  });
});
