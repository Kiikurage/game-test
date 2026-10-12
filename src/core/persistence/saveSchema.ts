/**
 * セーブの形式（スキーマ）と版移行を 1 か所に集めたモジュール。セーブに何が入るかはこのファイルだけ見れば分かる。
 *
 * 保存先: localStorage の `SAVE_KEY` に `{ version, data }`（エンベロープ。`PersistentStore` が読み書き）。
 *
 * | 項目 | 型 | 書くシステム | 内容 |
 * | --- | --- | --- | --- |
 * | `bonfires` | ID[] | bonfire | 灯した篝火 |
 * | `shortcuts` | ID[] | shortcut | 開けた近道 |
 * | `items` | ID → 所持数 | item / interactable / bonfire（補充） | 取得済みアイテムと消耗品の数 |
 * | `flags` | 文字列[] | interactable / world | 下の `SAVE_FLAGS` の名前空間のいずれか |
 * | `equippedWeapon` | `WeaponId` | 装備 | 装備中の武器 |
 * | `bosses` | ID[] | boss | 倒したボス |
 *
 * 位置・HP は保存しない（仕様書 1 章）。
 *
 * 版の履歴（`SAVE_VERSION` を上げたら `saveMigrations` に変換を足し、`saveSchema.test.ts` に旧版の実データを残す）:
 * - v1: items は取得済み ID の配列
 * - v2: items は ID → 所持数。flags・equippedWeapon を追加
 *
 * 検証は寛容（不正な項目は捨てて既定値で補う）。壊れた 1 項目でセーブ全体を失わないため、
 * 例外で止める厳格な検証（`core/schema.ts` の `parseData`）は使わない。
 */
import type { StoreSchema } from './store';
import { asOneOf, asStringSet, isRecord } from './validate';

export const SAVE_KEY = 'gametest.save.v1';
/** エンベロープのバージョン。キー名（`.v1`）は互換のため据え置く（仕様書 14.8 節）。 */
export const SAVE_VERSION = 2;

/** 所持数の上限（不正に大きい値の補正用）。 */
export const MAX_ITEM_COUNT = 999;

export const WEAPON_IDS = ['sword', 'sword_gravekeeper'] as const;
export type WeaponId = (typeof WEAPON_IDS)[number];
export const DEFAULT_WEAPON: WeaponId = 'sword';

/**
 * セーブデータ。ID は文字列（篝火 ID、ショートカット ID、アイテム ID、ボス ID）。配列は重複なし・ソート済み。
 */
export interface SaveData {
  readonly bonfires: readonly string[];
  readonly shortcuts: readonly string[];
  /** アイテム ID → 所持数（取得済み = 1 以上。消耗品は所持数）。0 のエントリは持たない。 */
  readonly items: Readonly<Record<string, number>>;
  /** 立っているフラグ（名前は `SAVE_FLAGS` で作る）。 */
  readonly flags: readonly string[];
  readonly equippedWeapon: WeaponId;
  readonly bosses: readonly string[];
}

/**
 * `flags` に入る名前の一覧（名前空間）。フラグ名はここで作り、各システムで文字列を組み立てない。
 * 配置データ（interactables）の `setFlag` / `requires.flagSet` もこの名前空間に従う。
 */
export const SAVE_FLAGS = {
  /** 読んだ（`read`）。 */
  read: (id: string): string => `read.${id}`,
  /** 調べた（`loot`）。 */
  loot: (id: string): string => `loot.${id}`,
  /** 初回だけ出す文（`showText` の `firstOnly`）を出した。 */
  shown: (textId: string): string => `shown.${textId}`,
  /** 一度きりの対象を済ませた（`once`。状態フラグを持たない `push` などの既定）。 */
  done: (id: string): string => `done.${id}`,
  /** 祈った（配置データの `setFlag`。例: `pray.gate`）。 */
  pray: (id: string): string => `pray.${id}`,
  /** 世界に残る変化。 */
  world: {
    /** 鉄格子 D を開けた（開けたまま残る）。 */
    grateDOpen: 'world.grateDOpen',
    /** 亀裂の壁 G1 を壊した（元に戻らない）。 */
    wallG1Broken: 'world.wallG1Broken',
  },
} as const;

/**
 * `boss.<id>` は保存されない仮想フラグ。条件（`requires.flagSet`）から `bosses` を参照するための名前。
 */
export const BOSS_FLAG_PREFIX = 'boss.';

/** 仮想フラグ `boss.<id>` ならボス ID を返す。 */
export function bossIdOfFlag(flag: string): string | undefined {
  return flag.startsWith(BOSS_FLAG_PREFIX) ? flag.slice(BOSS_FLAG_PREFIX.length) : undefined;
}

/** 保存されたフラグとして `save` で立っているか（`boss.<id>` は `bosses` を見る）。 */
export function isFlagSet(save: SaveData, flag: string): boolean {
  if (save.flags.includes(flag)) return true;
  const bossId = bossIdOfFlag(flag);
  return bossId !== undefined && save.bosses.includes(bossId);
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

/** 任意の値を現行版の `SaveData` にする（欠けた項目は既定値、不正な要素は捨てる）。例外を投げない。 */
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

/** `saveMigrations[n]` は v n の data を v n+1 へ変換する。 */
export const saveMigrations: Readonly<Record<number, (data: unknown) => unknown>> = {
  // v1 → v2: items（ID 配列）を ID → 所持数へ。flags / equippedWeapon は sanitize が既定値で補う。
  1: (data) => (isRecord(data) ? { ...data, items: asItemCounts(data['items']) } : data),
};

export const saveSchema: StoreSchema<SaveData> = {
  key: SAVE_KEY,
  version: SAVE_VERSION,
  createDefaults: createDefaultSave,
  sanitize: sanitizeSave,
  migrations: saveMigrations,
};
