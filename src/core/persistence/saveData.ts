import { PersistentStore, type LoadStatus } from './store';
import type { KeyValueStorage } from './storage';
import { MAX_ITEM_COUNT, saveSchema, type SaveData, type WeaponId } from './saveSchema';

export {
  SAVE_KEY,
  SAVE_VERSION,
  MAX_ITEM_COUNT,
  WEAPON_IDS,
  DEFAULT_WEAPON,
  type WeaponId,
  createDefaultSave,
  sanitizeSave,
  saveSchema,
  type SaveData,
} from './saveSchema';

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
