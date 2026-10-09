import { describe, expect, it, vi } from 'vitest';
import { AudioEngine, LOWPASS_OPEN_HZ, PAUSE_LOWPASS_HZ } from './audioEngine';
import { DuckingEnvelope } from './ducking';
import type {
  AudioContextLike,
  AudioContextStateLike,
  AudioNodeLike,
  AudioParamLike,
} from './types';
import { installAudioUnlock } from './webAudio';
import {
  DEFAULT_VOLUME,
  clampVolume,
  dbToGain,
  framesToSeconds,
  gainToDb,
  volumeToGain,
} from './volume';

describe('volume curve', () => {
  it('maps 0..100 to gain with a squared curve', () => {
    expect(volumeToGain(0)).toBe(0);
    expect(volumeToGain(100)).toBe(1);
    expect(volumeToGain(50)).toBeCloseTo(0.25);
    expect(volumeToGain(80)).toBeCloseTo(0.64);
  });
  it('clamps out-of-range and non-finite values', () => {
    expect(volumeToGain(-10)).toBe(0);
    expect(volumeToGain(250)).toBe(1);
    expect(clampVolume(NaN)).toBe(0);
  });
  it('converts dB and frames', () => {
    expect(dbToGain(0)).toBe(1);
    expect(dbToGain(-6)).toBeCloseTo(0.501, 3);
    expect(dbToGain(-12)).toBeCloseTo(0.251, 3);
    expect(gainToDb(dbToGain(-9))).toBeCloseTo(-9);
    expect(gainToDb(0)).toBe(-Infinity);
    expect(framesToSeconds(60)).toBe(1);
    expect(framesToSeconds(30)).toBe(0.5);
  });
  it('has the spec default volumes', () => {
    expect(DEFAULT_VOLUME.master).toBe(80);
    expect(DEFAULT_VOLUME.bgm).toBe(60);
    expect(DEFAULT_VOLUME.sfx).toBe(80);
  });
});

describe('DuckingEnvelope', () => {
  it('fades to the target, holds, then releases', () => {
    const env = new DuckingEnvelope();
    env.start(10, { db: -12, fadeSeconds: 1, holdSeconds: 2, releaseSeconds: 1 });
    const target = dbToGain(-12);
    expect(env.gainAt(9)).toBe(1);
    expect(env.gainAt(10)).toBe(1);
    expect(env.gainAt(10.5)).toBeCloseTo((1 + target) / 2);
    expect(env.gainAt(11)).toBeCloseTo(target);
    expect(env.gainAt(12.9)).toBeCloseTo(target);
    expect(env.gainAt(13.5)).toBeCloseTo((1 + target) / 2);
    expect(env.gainAt(14)).toBe(1);
  });

  it('holds until released and releases from the current level', () => {
    const env = new DuckingEnvelope();
    const id = env.start(0, { db: -6, fadeSeconds: 1, releaseSeconds: 2 });
    const target = dbToGain(-6);
    expect(env.gainAt(100)).toBeCloseTo(target);
    env.release(0.5, id);
    const mid = (1 + target) / 2;
    expect(env.gainAt(0.5)).toBeCloseTo(mid);
    expect(env.gainAt(1.5)).toBeCloseTo((mid + 1) / 2);
    expect(env.gainAt(2.5)).toBe(1);
  });

  it('takes the minimum of overlapping ducks', () => {
    const env = new DuckingEnvelope();
    env.start(0, { db: -6, fadeSeconds: 0.5, holdSeconds: 10 });
    env.start(1, { db: -12, fadeSeconds: 0.5, holdSeconds: 1, releaseSeconds: 0.5 });
    expect(env.gainAt(1.6)).toBeCloseTo(dbToGain(-12));
    expect(env.gainAt(3)).toBeCloseTo(dbToGain(-6));
  });

  it('lists knots after a time and prunes finished ducks', () => {
    const env = new DuckingEnvelope();
    env.start(0, { db: -12, fadeSeconds: 1, holdSeconds: 1, releaseSeconds: 1 });
    const knots = env.knotsAfter(0);
    expect(knots.map((k) => k.time)).toEqual([1, 2, 3]);
    expect(knots[2]?.gain).toBe(1);
    env.prune(2);
    expect(env.activeCount).toBe(1);
    env.prune(3);
    expect(env.activeCount).toBe(0);
  });
});

// --- モック AudioContext ---

class MockParam implements AudioParamLike {
  value = 1;
  events: [string, number, number?][] = [];
  cancelScheduledValues(t: number): void {
    this.events.push(['cancel', t]);
  }
  setValueAtTime(v: number, t: number): void {
    this.events.push(['set', v, t]);
    this.value = v;
  }
  linearRampToValueAtTime(v: number, t: number): void {
    this.events.push(['ramp', v, t]);
  }
}

class MockNode implements AudioNodeLike {
  readonly targets: AudioNodeLike[] = [];
  readonly gain = new MockParam();
  readonly frequency = new MockParam();
  type: BiquadFilterType = 'lowpass';
  connect(d: AudioNodeLike): void {
    this.targets.push(d);
  }
}

class MockContext implements AudioContextLike {
  currentTime = 0;
  state: AudioContextStateLike = 'suspended';
  readonly destination = new MockNode();
  readonly gains: MockNode[] = [];
  readonly filters: MockNode[] = [];
  resumeCalls = 0;
  private listener: (() => void) | undefined;
  resume(): Promise<void> {
    this.resumeCalls++;
    this.state = 'running';
    this.listener?.();
    return Promise.resolve();
  }
  createGain(): MockNode {
    const n = new MockNode();
    this.gains.push(n);
    return n;
  }
  createBiquadFilter(): MockNode {
    const n = new MockNode();
    this.filters.push(n);
    return n;
  }
  addEventListener(_t: 'statechange', l: () => void): void {
    this.listener = l;
  }
}

describe('AudioEngine', () => {
  it('builds master <- bgm/sfx/ambient/ui and routes bgm through duck + lowpass', () => {
    const ctx = new MockContext();
    const engine = new AudioEngine(ctx);
    const master = engine.input('master') as MockNode;
    expect(master.targets).toEqual([ctx.destination]);
    for (const bus of ['sfx', 'ambient', 'ui'] as const) {
      expect((engine.input(bus) as MockNode).targets).toEqual([master]);
    }
    const bgm = engine.input('bgm') as MockNode;
    const duck = bgm.targets[0] as MockNode;
    expect(duck.targets).toEqual([ctx.filters[0]]);
    expect(ctx.filters[0]?.targets).toEqual([master]);
    expect(ctx.filters[0]?.frequency.value).toBe(LOWPASS_OPEN_HZ);
  });

  it('applies default volumes with the squared curve', () => {
    const engine = new AudioEngine(new MockContext());
    expect(engine.getBusGain('master')).toBeCloseTo(0.64);
    expect(engine.getBusGain('bgm')).toBeCloseTo(0.36);
    expect(engine.getBusGain('sfx')).toBeCloseTo(0.64);
  });

  it('sets bus volume directly', () => {
    const engine = new AudioEngine(new MockContext());
    engine.setVolume('bgm', 50);
    expect(engine.getVolume('bgm')).toBe(50);
    expect(engine.getBusGain('bgm')).toBeCloseTo(0.25);
    engine.setVolume('master', 500);
    expect(engine.getVolume('master')).toBe(100);
    expect(engine.getBusGain('master')).toBe(1);
  });

  it('schedules ducking ramps on the duck gain and releases', () => {
    const ctx = new MockContext();
    ctx.currentTime = 5;
    const engine = new AudioEngine(ctx);
    const duck = (engine.input('bgm') as MockNode).targets[0] as MockNode;
    const id = engine.duckBgm({ db: -12, fadeSeconds: 1 });
    expect(duck.gain.events).toEqual([
      ['cancel', 5],
      ['set', 1, 5],
      ['ramp', expect.closeTo(dbToGain(-12), 5), 6],
    ]);
    duck.gain.events.length = 0;
    ctx.currentTime = 8;
    engine.releaseDuck(id, 2);
    expect(duck.gain.events[1]).toEqual(['set', expect.closeTo(dbToGain(-12), 5), 8]);
    expect(duck.gain.events[2]).toEqual(['ramp', 1, 10]);
  });

  it('toggles the pause lowpass at 800Hz', () => {
    const ctx = new MockContext();
    const engine = new AudioEngine(ctx);
    const f = ctx.filters[0]?.frequency;
    engine.setPaused(true);
    expect(f?.events.at(-1)).toEqual(['ramp', PAUSE_LOWPASS_HZ, expect.any(Number)]);
    engine.setPaused(false);
    expect(f?.events.at(-1)).toEqual(['ramp', LOWPASS_OPEN_HZ, expect.any(Number)]);
  });

  it('resumes once, reports state and notifies listeners', async () => {
    const ctx = new MockContext();
    const engine = new AudioEngine(ctx);
    const seen: string[] = [];
    engine.onStateChange((s) => seen.push(s));
    expect(engine.state).toBe('suspended');
    const [a, b] = await Promise.all([engine.resume(), engine.resume()]);
    expect([a, b]).toEqual(['running', 'running']);
    expect(ctx.resumeCalls).toBe(1);
    expect(seen).toEqual(['running']);
    expect(await engine.resume()).toBe('running');
    expect(ctx.resumeCalls).toBe(1);
  });

  it('swallows resume failures', async () => {
    const ctx = new MockContext();
    ctx.resume = () => Promise.reject(new Error('blocked'));
    const engine = new AudioEngine(ctx);
    expect(await engine.resume()).toBe('suspended');
  });
});

describe('installAudioUnlock', () => {
  it('resumes on user gestures until running and can be removed', () => {
    const target = new EventTarget();
    const engine = { state: 'suspended' as AudioContextStateLike, resume: vi.fn() };
    const off = installAudioUnlock(engine, target);
    target.dispatchEvent(new Event('touchend'));
    expect(engine.resume).toHaveBeenCalledTimes(1);
    engine.state = 'running';
    target.dispatchEvent(new Event('click'));
    expect(engine.resume).toHaveBeenCalledTimes(1);
    engine.state = 'interrupted';
    target.dispatchEvent(new Event('keydown'));
    expect(engine.resume).toHaveBeenCalledTimes(2);
    off();
    target.dispatchEvent(new Event('pointerup'));
    expect(engine.resume).toHaveBeenCalledTimes(2);
  });
});
