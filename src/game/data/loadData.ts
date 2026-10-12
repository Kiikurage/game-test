/**
 * ゲームデータ（`src/game/data/**\/*.json`）の読み込み口。
 *
 * データ 1 つにつき、JSON と同じ名前の `.ts` を置き、スキーマ（`core/schema` の `s.*`）で検証して型付きで公開する。
 *
 *   // playerStats.ts
 *   import json from './playerStats.json';
 *   const PlayerStatsData = s.object({ hp: s.number({ min: 1 }), ... });
 *   const data = loadData(PlayerStatsData, json, 'playerStats.json');
 *   export const PLAYER_STATS = data.player;
 *
 * - 検証はモジュールの読み込み時に 1 回だけ（以後はただのオブジェクト。実行時のコストは無い）。
 * - `source` は `src/game/data/` からの相対パス。`data.test.ts` が data 配下の全 JSON について
 *   「どこかの `loadData` で検証されたこと」を確かめるので、スキーマの無い JSON・スキーマ違反は `npm test` で落ちる。
 * - 値は凍結して返す（調整は JSON で行い、実行中に書き換えない）。
 * - レベル（`world/levels/*.json`）も同じ `core/schema` を使う（`world/levelLoader.ts`）。
 */
import { parseData, type Schema } from '../../core/schema';

const loaded = new Set<string>();

/** JSON を検証して凍結した型付きの値を返す。不正なら `SchemaError`（`<source>: $.path: 理由`）。 */
export function loadData<T>(schema: Schema<T>, json: unknown, source: string): T {
  const value = parseData(schema, json, source);
  loaded.add(source);
  return deepFreeze(value);
}

/** `loadData` で検証済みの `source` 一覧（テスト用）。 */
export function loadedDataSources(): ReadonlySet<string> {
  return loaded;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}
