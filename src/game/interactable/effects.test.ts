import { describe, expect, it } from 'vitest';
import type { Interactable } from '../data/world/types';
import { InteractableRunner, runEffects, type EffectHost } from './effects';

function fakeHost() {
  const flags = new Set<string>();
  const log: string[] = [];
  const host: EffectHost = {
    hasFlag: (f) => flags.has(f),
    setFlag: (f) => {
      flags.add(f);
      log.push(`flag:${f}`);
    },
    showText: (t) => log.push(`text:${t}`),
    giveItem: (id, n) => log.push(`give:${id}x${n}`),
    emitSound: (r, k) => log.push(`sound:${k}:${r}`),
  };
  return { host, flags, log };
}

const base = (extra: Partial<Interactable>): Interactable => ({
  id: 't',
  kind: 'read',
  x: 0,
  z: 0,
  site: 'main',
  prompt: 'read',
  effects: [],
  ...extra,
});

describe('runEffects', () => {
  it('shows a firstOnly text once and marks it as shown', () => {
    const { host, log, flags } = fakeHost();
    const def = base({});
    const effects = [{ type: 'showText', textId: 'bell_first', firstOnly: true }] as const;
    runEffects(effects, host, def);
    runEffects(effects, host, def);
    expect(log.filter((l) => l === 'text:bell_first')).toHaveLength(1);
    expect(flags.has('shown.bell_first')).toBe(true);
  });

  it('plays a sound cue through the host', () => {
    const { host } = fakeHost();
    const cues: string[] = [];
    runEffects(
      [{ type: 'playSound', cue: 'sfx.bell' }],
      { ...host, playSound: (c) => cues.push(c) },
      base({}),
    );
    expect(cues).toEqual(['sfx.bell']);
  });

  it('runs effects in order and ignores effects the host does not implement', () => {
    const { host, log } = fakeHost();
    const def = base({});
    runEffects(
      [
        { type: 'giveItem', itemId: 'a', count: 2 },
        { type: 'playClip', clip: 'x', durationF: 10 }, // host に実装なし
        { type: 'showText', textId: 'tx' },
        { type: 'setFlag', flag: 'f' },
        { type: 'emitSound', radiusM: 15, kind: 'bell' },
      ],
      host,
      def,
    );
    expect(log).toEqual(['give:ax2', 'text:tx', 'flag:f', 'sound:bell:15']);
  });
});

describe('InteractableRunner', () => {
  it('read: shows the text and saves read.<id>; repeatable unless once', () => {
    const { host, flags, log } = fakeHost();
    const runner = new InteractableRunner(host);
    const def = base({ id: 'grave', effects: [{ type: 'showText', textId: 'grave' }] });
    expect(runner.fire(def)).toBe(true);
    expect(flags.has('read.grave')).toBe(true);
    expect(runner.fire(def)).toBe(true);
    expect(log.filter((l) => l === 'text:grave')).toHaveLength(2);
  });

  it('once (non-loot): the second use does not show the text', () => {
    const { host, log } = fakeHost();
    const runner = new InteractableRunner(host);
    const def = base({ once: true, effects: [{ type: 'showText', textId: 'a' }] });
    expect(runner.fire(def)).toBe(true);
    expect(runner.isUsable(def)).toBe(true);
    expect(runner.fire(def)).toBe(false);
    expect(log.filter((l) => l === 'text:a')).toHaveLength(1);
  });

  it('once (loot): hidden after taken, with the loot flag', () => {
    const { host, flags } = fakeHost();
    const runner = new InteractableRunner(host);
    const def = base({
      id: 'corpse',
      kind: 'loot',
      once: true,
      effects: [{ type: 'giveItem', itemId: 'relic' }],
    });
    expect(runner.isUsable(def)).toBe(true);
    runner.fire(def);
    expect(flags.has('loot.corpse')).toBe(true);
    expect(runner.isUsable(def)).toBe(false);
    expect(runner.fire(def)).toBe(false);
  });

  it('requires: flagSet / flagUnset', () => {
    const { host, flags } = fakeHost();
    const runner = new InteractableRunner(host);
    const needs = base({ requires: { flagSet: 'a' } });
    const blocked = base({ requires: { flagUnset: 'b' } });
    expect(runner.isUsable(needs)).toBe(false);
    expect(runner.fire(needs)).toBe(false);
    flags.add('a');
    expect(runner.isUsable(needs)).toBe(true);
    expect(runner.isUsable(blocked)).toBe(true);
    flags.add('b');
    expect(runner.isUsable(blocked)).toBe(false);
  });

  it('cooldownF: unusable for exactly that many steps after firing', () => {
    const { host } = fakeHost();
    const runner = new InteractableRunner(host);
    const def = base({ kind: 'bell', cooldownF: 1800, effects: [] });
    runner.fire(def);
    expect(runner.isUsable(def)).toBe(false);
    for (let i = 0; i < 1799; i++) runner.update();
    expect(runner.cooldownRemaining(def)).toBe(1);
    expect(runner.isUsable(def)).toBe(false);
    runner.update();
    expect(runner.isUsable(def)).toBe(true);
  });
});
