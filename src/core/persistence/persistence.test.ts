import { describe, expect, it, vi } from 'vitest';
import {
  MemoryStorage,
  PersistentStore,
  SAVE_KEY,
  SETTINGS_KEY,
  SaveStore,
  SettingsStore,
  createDefaultSave,
  createDefaultSettings,
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
      items: ['flask-1'],
      bosses: ['boss'],
    });
  });

  it('stores under the documented key with a version field', () => {
    const storage = new MemoryStorage();
    new SaveStore(storage).igniteBonfire('b1');
    const parsed = JSON.parse(storage.getItem('gametest.save.v1') ?? 'null') as { version: number };
    expect(SAVE_KEY).toBe('gametest.save.v1');
    expect(parsed.version).toBe(1);
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
    expect(s.get()).toEqual({ bonfires: ['a', 'b'], shortcuts: [], items: [], bosses: ['boss'] });
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
