import { PersistentStore, type LoadStatus, type StoreSchema } from './store';
import type { KeyValueStorage } from './storage';
import { asStringSet, isRecord } from './validate';

export const SAVE_KEY = 'gametest.save.v1';
export const SAVE_VERSION = 1;

/**
 * セーブデータ（仕様書 1 章）。位置・HP は保存しない。
 * ID は文字列（篝火 ID、ショートカット ID、アイテム ID、ボス ID）。配列は重複なし・ソート済み。
 */
export interface SaveData {
  readonly bonfires: readonly string[];
  readonly shortcuts: readonly string[];
  readonly items: readonly string[];
  readonly bosses: readonly string[];
}

export function createDefaultSave(): SaveData {
  return { bonfires: [], shortcuts: [], items: [], bosses: [] };
}

export function sanitizeSave(raw: unknown): SaveData {
  const r = isRecord(raw) ? raw : {};
  return {
    bonfires: asStringSet(r['bonfires']),
    shortcuts: asStringSet(r['shortcuts']),
    items: asStringSet(r['items']),
    bosses: asStringSet(r['bosses']),
  };
}

/** 将来のバージョンアップ用。`migrations[n]` は v n の data を v n+1 へ変換する。 */
export const saveSchema: StoreSchema<SaveData> = {
  key: SAVE_KEY,
  version: SAVE_VERSION,
  createDefaults: createDefaultSave,
  sanitize: sanitizeSave,
  migrations: {},
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
  collectItem(id: string): void;
  defeatBoss(id: string): void;
  /** 新規開始: 既存データを破棄して既定値にする。 */
  newGame(): void;
  /** セーブ削除。 */
  deleteSave(): void;
}

type ListKey = keyof SaveData;

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
    this.add('items', id);
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
