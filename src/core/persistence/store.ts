import type { KeyValueStorage } from './storage';

/** 永続化されるデータの形式定義。 */
export interface StoreSchema<T> {
  /** ストレージキー（例: `gametest.save.v1`）。 */
  readonly key: string;
  /** 現在のデータバージョン。 */
  readonly version: number;
  /** 既定値を作る（呼ぶたびに新しいオブジェクトを返すこと）。 */
  createDefaults(): T;
  /**
   * 任意の値を検証し、不正な項目は既定値で補った有効な T にする。例外を投げてはならない。
   * 欠けた項目の補完（既定値マージ）もここで行う。
   */
  sanitize(raw: unknown): T;
  /** `from` バージョンのデータを `from + 1` の形式へ変換する。キーは変換元バージョン。 */
  readonly migrations?: Readonly<Record<number, (data: unknown) => unknown>>;
}

/** 起動時の読み込み結果。 */
export type LoadStatus =
  | 'empty' // 保存データなし
  | 'loaded' // 正常に読み込んだ（マイグレーション含む）
  | 'corrupt' // 壊れていた（既定値で開始）
  | 'future-version' // 想定より新しいバージョン（既定値で開始）
  | 'unavailable'; // ストレージが使えない / 読み込み自体が失敗

export type Listener<T> = (value: T) => void;

interface Envelope {
  version: number;
  data: unknown;
}

function isEnvelope(v: unknown): v is Envelope {
  if (typeof v !== 'object' || v === null || !('version' in v) || !('data' in v)) return false;
  return typeof v.version === 'number' && Number.isInteger(v.version);
}

/**
 * バージョン付き JSON を 1 キーに保存する汎用ストア。
 * - すべてのストレージ操作を try/catch で保護し、失敗時はメモリ上の値で動作し続ける。
 * - 破損・未知バージョンのデータは既定値で開始し、元の文字列を `<key>.backup` に退避する。
 * - 値は不変オブジェクトとして扱う（更新は `set` / `update` で新しい値を渡す）。
 */
export class PersistentStore<T> {
  private value: T;
  private present: boolean;
  private persistent: boolean;
  private readonly listeners = new Set<Listener<T>>();
  readonly loadStatus: LoadStatus;

  constructor(
    private readonly schema: StoreSchema<T>,
    private readonly storage: KeyValueStorage | null,
  ) {
    const { value, status } = this.load();
    this.value = value;
    this.loadStatus = status;
    this.present = status === 'loaded';
    this.persistent = status !== 'unavailable';
  }

  /** 現在の値。 */
  get(): T {
    return this.value;
  }

  /** 保存データが存在するか（「つづきから」の判定）。メモリのみの場合は書き込み済みかどうか。 */
  exists(): boolean {
    return this.present;
  }

  /** ストレージに保存できている状態か（false ならメモリのみで動作中）。 */
  get isPersistent(): boolean {
    return this.persistent;
  }

  /** 値を置き換えて保存し、購読者へ通知する。 */
  set(next: T): void {
    this.value = this.schema.sanitize(next);
    this.write();
    this.emit();
  }

  update(fn: (current: T) => T): void {
    this.set(fn(this.value));
  }

  /** 保存データを削除し、値を既定値に戻す（バックアップは残す）。 */
  clear(): void {
    this.value = this.schema.createDefaults();
    this.present = false;
    try {
      this.storage?.removeItem(this.schema.key);
    } catch {
      this.persistent = false;
    }
    this.emit();
  }

  /** 変更通知を購読する。戻り値は購読解除関数。 */
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const l of [...this.listeners]) {
      try {
        l(this.value);
      } catch (e) {
        console.error('store listener failed', e);
      }
    }
  }

  private write(): void {
    this.present = true;
    if (!this.storage) {
      this.persistent = false;
      return;
    }
    try {
      const envelope: Envelope = { version: this.schema.version, data: this.value };
      this.storage.setItem(this.schema.key, JSON.stringify(envelope));
      this.persistent = true;
    } catch {
      // 容量超過・書き込み禁止など。メモリ上の値は維持する。
      this.persistent = false;
    }
  }

  private load(): { value: T; status: LoadStatus } {
    const { schema, storage } = this;
    if (!storage) return { value: schema.createDefaults(), status: 'unavailable' };
    let raw: string | null;
    try {
      raw = storage.getItem(schema.key);
    } catch {
      return { value: schema.createDefaults(), status: 'unavailable' };
    }
    if (raw === null) return { value: schema.createDefaults(), status: 'empty' };

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isEnvelope(parsed) || parsed.version < 1) throw new Error('bad envelope');
      if (parsed.version > schema.version) {
        this.backup(raw);
        return { value: schema.createDefaults(), status: 'future-version' };
      }
      let data = parsed.data;
      for (let v = parsed.version; v < schema.version; v++) {
        const migrate = schema.migrations?.[v];
        if (!migrate) throw new Error(`missing migration from v${String(v)}`);
        data = migrate(data);
      }
      return { value: schema.sanitize(data), status: 'loaded' };
    } catch {
      this.backup(raw);
      return { value: schema.createDefaults(), status: 'corrupt' };
    }
  }

  private backup(raw: string): void {
    try {
      this.storage?.setItem(`${this.schema.key}.backup`, raw);
    } catch {
      // 退避は best effort。
    }
  }
}
