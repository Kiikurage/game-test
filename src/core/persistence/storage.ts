/** 文字列キーバリューストレージの最小インターフェース（`Storage` のサブセット）。 */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** メモリ上だけで動くストレージ。テストおよび localStorage 不可環境のフォールバック用。 */
export class MemoryStorage implements KeyValueStorage {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

/**
 * `window.localStorage` を取得する。プライベートモードやサイトデータ無効化時は
 * アクセスだけで SecurityError を投げるため、try/catch で保護して null を返す。
 */
export function getLocalStorage(): KeyValueStorage | null {
  try {
    const s = globalThis.localStorage as Storage | undefined;
    return s ?? null;
  } catch {
    return null;
  }
}
