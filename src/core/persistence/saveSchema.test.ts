import { describe, expect, it } from 'vitest';
import { MemoryStorage } from './storage';
import { SaveStore } from './saveData';
import {
  SAVE_FLAGS,
  SAVE_KEY,
  SAVE_VERSION,
  isFlagSet,
  createDefaultSave,
  type SaveData,
} from './saveSchema';

/**
 * 各版で実際に書かれていた localStorage の文字列（固定）。版を上げても消さず、現行版で読めることを確かめ続ける。
 */
const FIXTURES: Record<number, string> = {
  1: '{"version":1,"data":{"bonfires":["bonfire_arena","bonfire_start"],"shortcuts":["gate_a"],"items":["key_chapel","flask"],"bosses":["gravekeeper"]}}',
  2: '{"version":2,"data":{"bonfires":["bonfire_start"],"shortcuts":[],"items":{"flask":3,"key_chapel":1},"flags":["loot.l1","pray.gate","world.grateDOpen"],"equippedWeapon":"sword_gravekeeper","bosses":[]}}',
};

const EXPECTED: Record<number, SaveData> = {
  1: {
    bonfires: ['bonfire_arena', 'bonfire_start'],
    shortcuts: ['gate_a'],
    items: { flask: 1, key_chapel: 1 },
    flags: [],
    equippedWeapon: 'sword',
    bosses: ['gravekeeper'],
  },
  2: {
    bonfires: ['bonfire_start'],
    shortcuts: [],
    items: { flask: 3, key_chapel: 1 },
    flags: ['loot.l1', 'pray.gate', 'world.grateDOpen'],
    equippedWeapon: 'sword_gravekeeper',
    bosses: [],
  },
};

function load(raw: string): SaveStore {
  const storage = new MemoryStorage();
  storage.setItem(SAVE_KEY, raw);
  return new SaveStore(storage);
}

describe('save schema', () => {
  it('has a fixture for every version up to the current one', () => {
    for (let v = 1; v <= SAVE_VERSION; v++) expect(FIXTURES[v], `fixture v${v}`).toBeDefined();
  });

  for (const [version, raw] of Object.entries(FIXTURES)) {
    it(`reads a v${version} save written by an older build`, () => {
      const s = load(raw);
      expect(s.loadStatus).toBe('loaded');
      expect(s.hasSave()).toBe(true);
      expect(s.get()).toEqual(EXPECTED[Number(version)]);
    });

    it(`rewrites a v${version} save as the current version without losing data`, () => {
      const storage = new MemoryStorage();
      storage.setItem(SAVE_KEY, raw);
      new SaveStore(storage).setFlag(SAVE_FLAGS.done('x'));
      const stored = JSON.parse(storage.getItem(SAVE_KEY) ?? '') as { version: number };
      expect(stored.version).toBe(SAVE_VERSION);
      const reread = new SaveStore(storage).get();
      expect(reread).toEqual({
        ...EXPECTED[Number(version)],
        flags: [...(EXPECTED[Number(version)]?.flags ?? []), 'done.x'].sort(),
      });
    });
  }

  it('builds flag names in one namespace', () => {
    expect(SAVE_FLAGS.read('a')).toBe('read.a');
    expect(SAVE_FLAGS.loot('a')).toBe('loot.a');
    expect(SAVE_FLAGS.shown('t')).toBe('shown.t');
    expect(SAVE_FLAGS.done('a')).toBe('done.a');
    expect(SAVE_FLAGS.pray('gate')).toBe('pray.gate');
    expect(SAVE_FLAGS.world.grateDOpen).toBe('world.grateDOpen');
  });

  it('treats boss.<id> as a virtual flag backed by bosses', () => {
    const save = { ...createDefaultSave(), bosses: ['gravekeeper'], flags: ['read.a'] };
    expect(isFlagSet(save, 'read.a')).toBe(true);
    expect(isFlagSet(save, 'boss.gravekeeper')).toBe(true);
    expect(isFlagSet(save, 'boss.other')).toBe(false);
    expect(isFlagSet(save, 'read.b')).toBe(false);
  });
});
