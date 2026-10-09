import { describe, expect, it, vi } from 'vitest';
import {
  MemoryStorage,
  PersistentStore,
  SAVE_KEY,
  SAVE_VERSION,
  SETTINGS_KEY,
  SaveStore,
  SettingsStore,
  createDefaultSave,
  createDefaultSettings,
  MAX_ITEM_COUNT,
  type SaveData,
  getLocalStorage,
  sanitizeSettings,
  type KeyValueStorage,
  type StoreSchema,
} from './index';

/** すべての操作で例外を投げるストレージ。 */
class ThrowingStorage implements KeyValueStorage {
  getItem(): string | null {
    throw new Error('SecurityError');
  }
  setItem(): void {
    throw new Error('QuotaExceededError');
  }
  removeItem(): void {
    throw new Error('SecurityError');
  }
}

/** 読めるが書けないストレージ。 */
class ReadOnlyStorage extends MemoryStorage {
  private sealed = false;
  constructor(seed: Record<string, string> = {}) {
    super();
    for (const [k, v] of Object.entries(seed)) this.setItem(k, v);
    this.sealed = true;
  }
  override setItem(key: string, value: string): void {
    if (this.sealed) throw new Error('QuotaExceededError');
    super.setItem(key, value);
  }
}

describe('SaveStore', () => {
  it('starts empty with defaults and no save', () => {
    const s = new SaveStore(new MemoryStorage());
    expect(s.loadStatus).toBe('empty');
    expect(s.get()).toEqual(createDefaultSave());
    expect(s.hasSave()).toBe(false);
  });

  it('persists and restores across instances', () => {
    const storage = new MemoryStorage();
    const a = new SaveStore(storage);
    a.igniteBonfire('b1');
    a.openShortcut('g1');
    a.collectItem('flask-1');
    a.defeatBoss('boss');
    const b = new SaveStore(storage);
    expect(b.loadStatus).toBe('loaded');
    expect(b.hasSave()).toBe(true);
    expect(b.get()).toEqual({
      bonfires: ['b1'],
      shortcuts: ['g1'],
      items: { 'flask-1': 1 },
      flags: [],
      equippedWeapon: 'sword',
      bosses: ['boss'],
    });
  });

  it('stores under the documented key with a version field', () => {
    const storage = new MemoryStorage();
    new SaveStore(storage).igniteBonfire('b1');
    const parsed = JSON.parse(storage.getItem('gametest.save.v1') ?? 'null') as { version: number };
    expect(SAVE_KEY).toBe('gametest.save.v1');
    expect(parsed.version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(2);
  });

  it('ignores duplicates without writing or notifying', () => {
    const storage = new MemoryStorage();
    const s = new SaveStore(storage);
    s.collectItem('x');
    const spy = vi.fn();
    s.subscribe(spy);
    const setItem = vi.spyOn(storage, 'setItem');
    s.collectItem('x');
    expect(spy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('notifies subscribers and supports unsubscribe', () => {
    const s = new SaveStore(new MemoryStorage());
    const spy = vi.fn();
    const off = s.subscribe(spy);
    s.igniteBonfire('b1');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ bonfires: ['b1'] }));
    off();
    s.openShortcut('g1');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('isolates listener exceptions', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const s = new SaveStore(new MemoryStorage());
    const good = vi.fn();
    s.subscribe(() => {
      throw new Error('boom');
    });
    s.subscribe(good);
    expect(() => {
      s.igniteBonfire('b1');
    }).not.toThrow();
    expect(good).toHaveBeenCalled();
    err.mockRestore();
  });

  it('newGame / deleteSave clear data and the continue flag', () => {
    const storage = new MemoryStorage();
    const s = new SaveStore(storage);
    s.defeatBoss('boss');
    expect(s.hasSave()).toBe(true);
    s.newGame();
    expect(s.hasSave()).toBe(false);
    expect(s.get()).toEqual(createDefaultSave());
    expect(storage.getItem(SAVE_KEY)).toBeNull();
    s.openShortcut('g1');
    s.deleteSave();
    expect(new SaveStore(storage).hasSave()).toBe(false);
  });

  it('notifies on clear', () => {
    const s = new SaveStore(new MemoryStorage());
    s.collectItem('a');
    const spy = vi.fn();
    s.subscribe(spy);
    s.deleteSave();
    expect(spy).toHaveBeenCalledWith(createDefaultSave());
  });

  it.each([
    ['invalid JSON', '{not json'],
    ['non-object', '42'],
    ['null', 'null'],
    ['missing version', '{"data":{}}'],
    ['string version', '{"version":"1","data":{}}'],
    ['version 0', '{"version":0,"data":{}}'],
    ['fractional version', '{"version":1.5,"data":{}}'],
  ])('falls back to defaults on corrupt data (%s) and keeps a backup', (_name, raw) => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, raw);
    const s = new SaveStore(storage);
    expect(s.loadStatus).toBe('corrupt');
    expect(s.get()).toEqual(createDefaultSave());
    expect(s.hasSave()).toBe(false);
    expect(storage.getItem(`${SAVE_KEY}.backup`)).toBe(raw);
  });

  it('falls back to defaults on an unknown (future) version without losing the raw data', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ version: 99, data: { bonfires: ['x'] } });
    storage.setItem(SAVE_KEY, raw);
    const s = new SaveStore(storage);
    expect(s.loadStatus).toBe('future-version');
    expect(s.get()).toEqual(createDefaultSave());
    expect(storage.getItem(`${SAVE_KEY}.backup`)).toBe(raw);
  });

  it('sanitizes invalid fields and merges missing ones', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        data: { bonfires: ['b', 'a', 'a', 3, null, ''], items: 'nope', bosses: ['boss'], extra: 1 },
      }),
    );
    const s = new SaveStore(storage);
    expect(s.loadStatus).toBe('loaded');
    expect(s.get()).toEqual({
      ...createDefaultSave(),
      bonfires: ['a', 'b'],
      bosses: ['boss'],
    });
  });

  describe('items / flags / equipped weapon (v2)', () => {
    it('adds, sets and reads item counts', () => {
      const s = new SaveStore(new MemoryStorage());
      expect(s.getCount('oil_jar')).toBe(0);
      s.addItem('oil_jar', 3);
      expect(s.getCount('oil_jar')).toBe(3);
      s.setCount('oil_jar', 1);
      expect(s.getCount('oil_jar')).toBe(1);
      s.setCount('oil_jar', 3);
      s.addItem('oil_jar');
      expect(s.getCount('oil_jar')).toBe(4);
      s.setCount('oil_jar', 0);
      expect(s.getCount('oil_jar')).toBe(0);
      expect(s.get().items).toEqual({});
    });

    it('collectItem is idempotent and does not overwrite counts', () => {
      const s = new SaveStore(new MemoryStorage());
      s.addItem('oil_jar', 3);
      s.collectItem('oil_jar');
      expect(s.getCount('oil_jar')).toBe(3);
      s.collectItem('talisman_ash');
      s.collectItem('talisman_ash');
      expect(s.getCount('talisman_ash')).toBe(1);
    });

    it('ignores invalid counts and no-op writes', () => {
      const storage = new MemoryStorage();
      const s = new SaveStore(storage);
      s.addItem('a', 2);
      const setItem = vi.spyOn(storage, 'setItem');
      s.setCount('a', 2);
      s.addItem('a', 0);
      s.addItem('a', -1);
      s.addItem('a', Number.NaN);
      s.setCount('a', Number.NaN);
      s.setCount('', 1);
      expect(setItem).not.toHaveBeenCalled();
      expect(s.getCount('a')).toBe(2);
      s.setCount('a', -5);
      expect(s.getCount('a')).toBe(0);
      s.setCount('b', 1e9);
      expect(s.getCount('b')).toBe(MAX_ITEM_COUNT);
    });

    it('does not mistake prototype keys for items', () => {
      const s = new SaveStore(new MemoryStorage());
      expect(s.getCount('toString')).toBe(0);
      expect(s.getCount('__proto__')).toBe(0);
    });

    it('sets flags once and persists them', () => {
      const storage = new MemoryStorage();
      const s = new SaveStore(storage);
      expect(s.hasFlag('pray.gate')).toBe(false);
      s.setFlag('world.wallG1Broken');
      s.setFlag('read.grave_b2');
      const setItem = vi.spyOn(storage, 'setItem');
      s.setFlag('read.grave_b2');
      s.setFlag('');
      expect(setItem).not.toHaveBeenCalled();
      const b = new SaveStore(storage);
      expect(b.hasFlag('world.wallG1Broken')).toBe(true);
      expect(b.hasFlag('read.grave_b2')).toBe(true);
      expect(b.get().flags).toEqual(['read.grave_b2', 'world.wallG1Broken']);
    });

    it('persists the equipped weapon', () => {
      const storage = new MemoryStorage();
      const s = new SaveStore(storage);
      expect(s.getEquippedWeapon()).toBe('sword');
      s.setEquippedWeapon('sword_gravekeeper');
      expect(new SaveStore(storage).getEquippedWeapon()).toBe('sword_gravekeeper');
    });

    it('saves immediately on pickup / opening (each write hits storage)', () => {
      const storage = new MemoryStorage();
      const s = new SaveStore(storage);
      const setItem = vi.spyOn(storage, 'setItem');
      s.collectItem('talisman_ash');
      expect(setItem).toHaveBeenCalledTimes(1);
      s.addItem('oil_jar', 3);
      expect(setItem).toHaveBeenCalledTimes(2);
      s.setFlag('world.grateDOpen');
      expect(setItem).toHaveBeenCalledTimes(3);
      s.setEquippedWeapon('sword_gravekeeper');
      expect(setItem).toHaveBeenCalledTimes(4);
      const stored = JSON.parse(storage.getItem(SAVE_KEY) ?? '') as { data: SaveData };
      expect(stored.data.items).toEqual({ talisman_ash: 1, oil_jar: 3 });
      expect(stored.data.flags).toEqual(['world.grateDOpen']);
    });

    it('notifies subscribers and keeps working with throwing storage', () => {
      const s = new SaveStore(new ThrowingStorage());
      const spy = vi.fn();
      s.subscribe(spy);
      expect(() => {
        s.addItem('oil_jar', 3);
        s.setFlag('pray.gate');
        s.setEquippedWeapon('sword_gravekeeper');
      }).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(3);
      expect(s.getCount('oil_jar')).toBe(3);
      expect(s.hasFlag('pray.gate')).toBe(true);
    });

    it.each([
      ['string', 'x'],
      ['number', 5],
      ['null', null],
      ['negative / NaN-ish / fractional values', { a: -1, b: 'x', c: 2.7, d: 0, e: null, f: 1 }],
    ])('falls back for invalid items: %s', (_name, items) => {
      const storage = new MemoryStorage();
      storage.setItem(SAVE_KEY, JSON.stringify({ version: 2, data: { items } }));
      const s = new SaveStore(storage);
      expect(s.loadStatus).toBe('loaded');
      expect(s.get().items).toEqual(
        typeof items === 'object' && items !== null ? { c: 2, f: 1 } : {},
      );
    });

    it('falls back for invalid flags and weapon', () => {
      const storage = new MemoryStorage();
      storage.setItem(
        SAVE_KEY,
        JSON.stringify({
          version: 2,
          data: { flags: ['b', 'a', 'a', 1, '', null], equippedWeapon: 'axe' },
        }),
      );
      const s = new SaveStore(storage);
      expect(s.get().flags).toEqual(['a', 'b']);
      expect(s.get().equippedWeapon).toBe('sword');
      storage.setItem(
        SAVE_KEY,
        JSON.stringify({ version: 2, data: { flags: 'x', equippedWeapon: 3 } }),
      );
      expect(new SaveStore(storage).get().flags).toEqual([]);
      expect(new SaveStore(storage).get().equippedWeapon).toBe('sword');
    });
  });

  describe('migration from v1', () => {
    const v1 = {
      bonfires: ['b2', 'b1'],
      shortcuts: ['g1'],
      items: ['flask-1', 'flask-1', 'key', 7],
      bosses: ['boss'],
    };

    it('converts the v1 item list to counts and fills new fields', () => {
      const storage = new MemoryStorage();
      storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, data: v1 }));
      const s = new SaveStore(storage);
      expect(s.loadStatus).toBe('loaded');
      expect(s.hasSave()).toBe(true);
      expect(s.get()).toEqual({
        bonfires: ['b1', 'b2'],
        shortcuts: ['g1'],
        items: { 'flask-1': 1, key: 1 },
        flags: [],
        equippedWeapon: 'sword',
        bosses: ['boss'],
      });
    });

    it('upgrades the stored envelope on the next write and keeps old data', () => {
      const storage = new MemoryStorage();
      storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, data: v1 }));
      const s = new SaveStore(storage);
      s.setFlag('pray.gate');
      const stored = JSON.parse(storage.getItem(SAVE_KEY) ?? '') as {
        version: number;
        data: SaveData;
      };
      expect(stored.version).toBe(2);
      expect(stored.data.bosses).toEqual(['boss']);
      expect(stored.data.items).toEqual({ 'flask-1': 1, key: 1 });
      expect(new SaveStore(storage).hasFlag('pray.gate')).toBe(true);
    });

    it('migrates a v1 save with missing or invalid items', () => {
      for (const data of [{ bonfires: ['b1'] }, { bonfires: ['b1'], items: 'nope' }, {}]) {
        const storage = new MemoryStorage();
        storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, data }));
        const s = new SaveStore(storage);
        expect(s.loadStatus).toBe('loaded');
        expect(s.get().items).toEqual({});
      }
    });

    it('treats non-object v1 data as defaults but loaded', () => {
      const storage = new MemoryStorage();
      storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, data: [1, 2] }));
      const s = new SaveStore(storage);
      expect(s.loadStatus).toBe('loaded');
      expect(s.get()).toEqual(createDefaultSave());
    });
  });

  it('treats a non-object data payload as defaults but still loaded', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, data: [1, 2] }));
    const s = new SaveStore(storage);
    expect(s.loadStatus).toBe('loaded');
    expect(s.get()).toEqual(createDefaultSave());
  });

  describe('with throwing storage', () => {
    it('never throws and works in memory', () => {
      const s = new SaveStore(new ThrowingStorage());
      expect(s.loadStatus).toBe('unavailable');
      expect(s.isPersistent).toBe(false);
      const spy = vi.fn();
      s.subscribe(spy);
      expect(() => {
        s.igniteBonfire('b1');
        s.openShortcut('g1');
        s.collectItem('i1');
        s.defeatBoss('boss');
      }).not.toThrow();
      expect(s.get().bonfires).toEqual(['b1']);
      expect(s.hasSave()).toBe(true);
      expect(spy).toHaveBeenCalledTimes(4);
      expect(() => {
        s.newGame();
        s.deleteSave();
      }).not.toThrow();
      expect(s.hasSave()).toBe(false);
    });

    it('works with null storage (localStorage unavailable)', () => {
      const s = new SaveStore(null);
      expect(s.loadStatus).toBe('unavailable');
      s.igniteBonfire('b1');
      expect(s.get().bonfires).toEqual(['b1']);
      expect(s.hasSave()).toBe(true);
      s.deleteSave();
      expect(s.hasSave()).toBe(false);
    });

    it('keeps in-memory state when only writes fail', () => {
      const storage = new ReadOnlyStorage();
      const s = new SaveStore(storage);
      expect(s.loadStatus).toBe('empty');
      s.igniteBonfire('b1');
      expect(s.isPersistent).toBe(false);
      expect(s.get().bonfires).toEqual(['b1']);
    });

    it('survives a corrupt payload when the backup write also fails', () => {
      const storage = new ReadOnlyStorage({ [SAVE_KEY]: '{broken' });
      const s = new SaveStore(storage);
      expect(s.loadStatus).toBe('corrupt');
      expect(s.get()).toEqual(createDefaultSave());
    });
  });
});

describe('SettingsStore', () => {
  it('uses the documented key and defaults', () => {
    expect(SETTINGS_KEY).toBe('gametest.settings.v1');
    const s = new SettingsStore(new MemoryStorage());
    expect(s.get()).toEqual({
      cameraSensitivityX: 1,
      cameraSensitivityY: 1,
      invertY: false,
      cameraShake: 100,
      volumeMaster: 80,
      volumeBgm: 60,
      volumeSfx: 80,
      quality: 'auto',
      resolutionScale: 'auto',
      frameRateCap: 60,
      inputAssist: 'standard',
      haptics: true,
      buttonLayout: 'standard',
      buttonOpacity: 60,
    });
  });

  it('defaults the frame rate cap to 30 on mobile', () => {
    expect(new SettingsStore(new MemoryStorage(), { mobile: true }).get().frameRateCap).toBe(30);
    expect(createDefaultSettings({ mobile: true }).frameRateCap).toBe(30);
  });

  it('patches, persists and restores', () => {
    const storage = new MemoryStorage();
    const a = new SettingsStore(storage);
    a.patch({ volumeMaster: 30, invertY: true, quality: 'high', resolutionScale: 75 });
    const b = new SettingsStore(storage);
    expect(b.loadStatus).toBe('loaded');
    expect(b.get()).toMatchObject({
      volumeMaster: 30,
      invertY: true,
      quality: 'high',
      resolutionScale: 75,
    });
    expect(b.get().volumeBgm).toBe(60);
  });

  it('merges defaults for missing fields (older saved settings)', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, data: { volumeSfx: 10 } }));
    const s = new SettingsStore(storage);
    expect(s.get()).toEqual({ ...createDefaultSettings(), volumeSfx: 10 });
  });

  it('clamps and coerces out-of-range or invalid values', () => {
    const s = sanitizeSettings({
      cameraSensitivityX: 99,
      cameraSensitivityY: 0,
      invertY: 'yes',
      cameraShake: 70,
      volumeMaster: -5,
      volumeBgm: Number.NaN,
      volumeSfx: '50',
      quality: 'ultra',
      resolutionScale: 77,
      frameRateCap: 144,
      inputAssist: 1,
      haptics: null,
      buttonLayout: 'x',
      buttonOpacity: 1000,
    });
    expect(s).toEqual({
      ...createDefaultSettings(),
      cameraSensitivityX: 2,
      cameraSensitivityY: 0.5,
      volumeMaster: 0,
      resolutionScale: 75,
      buttonOpacity: 100,
    });
  });

  it('handles resolutionScale edge cases', () => {
    expect(sanitizeSettings({ resolutionScale: 10 }).resolutionScale).toBe(50);
    expect(sanitizeSettings({ resolutionScale: 500 }).resolutionScale).toBe(100);
    expect(sanitizeSettings({ resolutionScale: 'auto' }).resolutionScale).toBe('auto');
    expect(sanitizeSettings({ resolutionScale: 'x' }).resolutionScale).toBe('auto');
    expect(sanitizeSettings({ resolutionScale: Infinity }).resolutionScale).toBe('auto');
  });

  it('sanitizes patches so invalid values never get stored', () => {
    const storage = new MemoryStorage();
    const s = new SettingsStore(storage);
    s.patch({ volumeMaster: 1000, quality: 'bogus' as never });
    expect(s.get().volumeMaster).toBe(100);
    expect(s.get().quality).toBe('auto');
  });

  it.each(['{oops', '[]', '"str"', '{"version":5,"data":{}}'])(
    'falls back to defaults for bad payload %s',
    (raw) => {
      const storage = new MemoryStorage();
      storage.setItem(SETTINGS_KEY, raw);
      const s = new SettingsStore(storage);
      expect(s.get()).toEqual(createDefaultSettings());
      expect(['corrupt', 'future-version']).toContain(s.loadStatus);
    },
  );

  it('notifies subscribers on patch and reset', () => {
    const storage = new MemoryStorage();
    const s = new SettingsStore(storage);
    const spy = vi.fn();
    const off = s.subscribe(spy);
    s.patch({ haptics: false });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ haptics: false }));
    s.reset();
    expect(spy).toHaveBeenLastCalledWith(createDefaultSettings());
    expect(storage.getItem(SETTINGS_KEY)).toBeNull();
    off();
    s.patch({ haptics: false });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('never throws with throwing storage', () => {
    const s = new SettingsStore(new ThrowingStorage());
    expect(() => {
      s.patch({ volumeMaster: 10 });
      s.reset();
    }).not.toThrow();
    expect(s.loadStatus).toBe('unavailable');
    s.patch({ volumeMaster: 10 });
    expect(s.get().volumeMaster).toBe(10);
  });
});

describe('PersistentStore migrations', () => {
  interface V3 {
    readonly name: string;
    readonly level: number;
  }
  const schema: StoreSchema<V3> = {
    key: 'test.v3',
    version: 3,
    createDefaults: () => ({ name: 'none', level: 1 }),
    sanitize: (raw) => {
      const r = (raw ?? {}) as Record<string, unknown>;
      return {
        name: typeof r['name'] === 'string' ? r['name'] : 'none',
        level: typeof r['level'] === 'number' ? r['level'] : 1,
      };
    },
    migrations: {
      // v1: { n } -> v2: { name }
      1: (d) => ({ name: (d as { n: string }).n }),
      // v2: { name } -> v3: { name, level }
      2: (d) => ({ ...(d as { name: string }), level: 5 }),
    },
  };

  it('chains migrations from an old version', () => {
    const storage = new MemoryStorage();
    storage.setItem('test.v3', JSON.stringify({ version: 1, data: { n: 'old' } }));
    const s = new PersistentStore(schema, storage);
    expect(s.loadStatus).toBe('loaded');
    expect(s.get()).toEqual({ name: 'old', level: 5 });
    // 次の書き込みで最新バージョンとして保存される。
    s.set({ name: 'new', level: 6 });
    expect((JSON.parse(storage.getItem('test.v3') ?? '') as { version: number }).version).toBe(3);
  });

  it('starts from a middle version', () => {
    const storage = new MemoryStorage();
    storage.setItem('test.v3', JSON.stringify({ version: 2, data: { name: 'mid' } }));
    expect(new PersistentStore(schema, storage).get()).toEqual({ name: 'mid', level: 5 });
  });

  it('treats a throwing migration as corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem('test.v3', JSON.stringify({ version: 1, data: null }));
    const s = new PersistentStore(schema, storage);
    expect(s.loadStatus).toBe('corrupt');
    expect(s.get()).toEqual({ name: 'none', level: 1 });
  });

  it('treats a missing migration step as corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem('test.v3', JSON.stringify({ version: 2, data: {} }));
    const s = new PersistentStore({ ...schema, migrations: {} }, storage);
    expect(s.loadStatus).toBe('corrupt');
  });
});

describe('getLocalStorage', () => {
  it('returns null when accessing localStorage throws', () => {
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      expect(getLocalStorage()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('returns null when localStorage is absent (node)', () => {
    expect(getLocalStorage()).toBeNull();
  });

  it('returns the storage when present', () => {
    const fake = new MemoryStorage();
    vi.stubGlobal('localStorage', fake);
    expect(getLocalStorage()).toBe(fake);
    vi.unstubAllGlobals();
  });
});
