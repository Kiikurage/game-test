import { PersistentStore, type LoadStatus, type StoreSchema } from './store';
import type { KeyValueStorage } from './storage';
import { asOneOf, asStringSet, isRecord } from './validate';

export const SAVE_KEY = 'gametest.save.v1';
/**
 * エンベロープのバージョン。キー名（`.v1`）は互換のため据え置く（仕様書 14.8 節）。
 * v1: items は取得済み ID の配列 / v2: items は ID → 所持数、flags・equippedWeapon を追加。
 */
export const SAVE_VERSION = 2;

/** 所持数の上限（不正に大きい値の補正用）。 */
export const MAX_ITEM_COUNT = 999;

export const WEAPON_IDS = ['sword', 'sword_gravekeeper'] as const;
export type WeaponId = (typeof WEAPON_IDS)[number];
export const DEFAULT_WEAPON: WeaponId = 'sword';

/**
 * セーブデータ（仕様書 1 章）。位置・HP は保存しない。
 * ID は文字列（篝火 ID、ショートカット ID、アイテム ID、ボス ID）。配列は重複なし・ソート済み。
 */
export interface SaveData {
  readonly bonfires: readonly string[];
  readonly shortcuts: readonly string[];
  /** アイテム ID → 所持数（取得済み = 1 以上。消耗品は所持数）。0 のエントリは持たない。 */
  readonly items: Readonly<Record<string, number>>;
  /** 立っているフラグ（`read.<id>` / `pray.gate` / `world.wallG1Broken` / `world.grateDOpen` など）。 */
  readonly flags: readonly string[];
  readonly equippedWeapon: WeaponId;
  readonly bosses: readonly string[];
}

export function createDefaultSave(): SaveData {
  return {
    bonfires: [],
    shortcuts: [],
    items: {},
    flags: [],
    equippedWeapon: DEFAULT_WEAPON,
    bosses: [],
  };
}

/** 所持数の記録を検証する。不正な値・0 以下は捨て、整数に丸め、キー順を安定させる。旧形式（ID 配列）は各 1 個として読む。 */
function asItemCounts(v: unknown): Record<string, number> {
  if (Array.isArray(v)) return Object.fromEntries(asStringSet(v).map((id) => [id, 1]));
  if (!isRecord(v)) return {};
  const entries: [string, number][] = [];
  for (const [id, n] of Object.entries(v)) {
    if (id.length === 0 || typeof n !== 'number' || !Number.isFinite(n)) continue;
    const count = Math.min(MAX_ITEM_COUNT, Math.floor(n));
    if (count >= 1) entries.push([id, count]);
  }
  return Object.fromEntries(entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

export function sanitizeSave(raw: unknown): SaveData {
  const r = isRecord(raw) ? raw : {};
  return {
    bonfires: asStringSet(r['bonfires']),
    shortcuts: asStringSet(r['shortcuts']),
    items: asItemCounts(r['items']),
    flags: asStringSet(r['flags']),
    equippedWeapon: asOneOf(r['equippedWeapon'], WEAPON_IDS, DEFAULT_WEAPON),
    bosses: asStringSet(r['bosses']),
  };
}

/** 将来のバージョンアップ用。`migrations[n]` は v n の data を v n+1 へ変換する。 */
export const saveSchema: StoreSchema<SaveData> = {
  key: SAVE_KEY,
  version: SAVE_VERSION,
  createDefaults: createDefaultSave,
  sanitize: sanitizeSave,
  migrations: {
    // v1 → v2: items（ID 配列）を ID → 所持数へ。flags / equippedWeapon は sanitize が既定値で補う。
    1: (data) => (isRecord(data) ? { ...data, items: asItemCounts(data['items']) } : data),
  },
};

/**
 * ゲーム層が使うセーブの窓口。ストレージ実装（localStorage 等）は注入されるため
 * ゲームロジックは永続化の詳細を知らない（`game` はこの interface だけを参照する）。
 */
export interface SaveGateway {
  get(): SaveData;
  /** 「つづきから」を出せるか。 */
  hasSave(): boolean;
  subscribe(listener: (save: SaveData) => void): () => void;
  igniteBonfire(id: string): void;
  openShortcut(id: string): void;
  /** アイテムを 1 個取得済みにする（既に持っていれば何もしない）。 */
  collectItem(id: string): void;
  /** 所持数を `n` 増やす（消耗品の取得用。`n` ≥ 1 の整数）。 */
  addItem(id: string, n?: number): void;
  /** 所持数（持っていなければ 0）。 */
  getCount(id: string): number;
  /** 所持数を直接設定する（休憩・死亡時の補充用）。0 以下で削除。 */
  setCount(id: string, n: number): void;
  hasFlag(flag: string): boolean;
  /** フラグを立てる（既に立っていれば何もしない。開通・読了などの保存タイミング）。 */
  setFlag(flag: string): void;
  getEquippedWeapon(): WeaponId;
  setEquippedWeapon(id: WeaponId): void;
  defeatBoss(id: string): void;
  /** 新規開始: 既存データを破棄して既定値にする。 */
  newGame(): void;
  /** セーブ削除。 */
  deleteSave(): void;
}

type ListKey = 'bonfires' | 'shortcuts' | 'bosses' | 'flags';

export class SaveStore implements SaveGateway {
  private readonly store: PersistentStore<SaveData>;

  constructor(storage: KeyValueStorage | null) {
    this.store = new PersistentStore(saveSchema, storage);
  }

  get loadStatus(): LoadStatus {
    return this.store.loadStatus;
  }
  get isPersistent(): boolean {
    return this.store.isPersistent;
  }

  get(): SaveData {
    return this.store.get();
  }
  hasSave(): boolean {
    return this.store.exists();
  }
  subscribe(listener: (save: SaveData) => void): () => void {
    return this.store.subscribe(listener);
  }

  igniteBonfire(id: string): void {
    this.add('bonfires', id);
  }
  openShortcut(id: string): void {
    this.add('shortcuts', id);
  }
  collectItem(id: string): void {
    if (this.getCount(id) >= 1) return;
    this.setCount(id, 1);
  }
  addItem(id: string, n = 1): void {
    if (!Number.isFinite(n) || n < 1) return;
    this.setCount(id, this.getCount(id) + Math.floor(n));
  }
  getCount(id: string): number {
    const n = Object.hasOwn(this.store.get().items, id) ? this.store.get().items[id] : 0;
    return n ?? 0;
  }
  setCount(id: string, n: number): void {
    if (id.length === 0 || !Number.isFinite(n)) return;
    const next = Math.min(MAX_ITEM_COUNT, Math.max(0, Math.floor(n)));
    if (next === this.getCount(id)) return;
    this.store.update((s) => {
      const rest = Object.entries(s.items).filter(([k]) => k !== id);
      if (next >= 1) rest.push([id, next]);
      return { ...s, items: Object.fromEntries(rest) };
    });
  }
  hasFlag(flag: string): boolean {
    return this.store.get().flags.includes(flag);
  }
  setFlag(flag: string): void {
    if (flag.length === 0) return;
    this.add('flags', flag);
  }
  getEquippedWeapon(): WeaponId {
    return this.store.get().equippedWeapon;
  }
  setEquippedWeapon(id: WeaponId): void {
    if (this.store.get().equippedWeapon === id) return;
    this.store.update((s) => ({ ...s, equippedWeapon: id }));
  }
  defeatBoss(id: string): void {
    this.add('bosses', id);
  }

  newGame(): void {
    this.store.clear();
  }
  deleteSave(): void {
    this.store.clear();
  }

  /** 既に含まれていれば何も書かず通知もしない。 */
  private add(key: ListKey, id: string): void {
    if (this.store.get()[key].includes(id)) return;
    this.store.update((s) => ({ ...s, [key]: [...s[key], id] }));
  }
}
