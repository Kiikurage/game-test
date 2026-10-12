/**
 * 画面に出す文言（仕様書 9.1 / 14.5 / 14.6 節）。文面は `texts.json`（コードに文面を書かない）。
 * - `texts`: テキストパネルの文面（ID → 文面）。ID は Interactable の id / アイテム ID と揃える。
 *   アイテムは `item.<id>.name|desc|notice`。会話は `<id>.1`, `<id>.2` ... の 1 行ずつ。文中の「（改行）」は改行になる。
 * - `verbs`: 状況ボタンの動詞。`Interactable.label()` が返す。表記のデバイス差（E / A / タップ）は UI 側。
 * - `notices`: ゲームが出す通知の文言。
 */
import { s, type Infer, type Schema, SchemaError } from '../../core/schema';
import { loadData } from './loadData';
import json from './texts.json';

export type TextEntry = string | readonly string[];

/** 文字列 → `TextEntry` の辞書（キーは任意）。 */
const TextTableSchema: Schema<Readonly<Record<string, TextEntry>>> = {
  describe: '{ [id]: string | string[] }',
  check(v, path) {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) {
      throw new SchemaError(path, 'expected object');
    }
    const entry = s.array(s.string(), { minLength: 1 });
    for (const [key, value] of Object.entries(v)) {
      if (typeof value !== 'string') entry.check(value, `${path}.${key}`);
    }
    return v as Readonly<Record<string, TextEntry>>;
  },
};

export const TextsDataSchema = s.object({
  verbs: s.object({
    read: s.string(),
    loot: s.string(),
    pick: s.string(),
    pray: s.string(),
    bell: s.string(),
    talk: s.string(),
    push: s.string(),
    rest: s.string(),
    fog: s.string(),
  }),
  notices: s.object({ shortcutOpened: s.string() }),
  texts: TextTableSchema,
});
export type TextsData = Infer<typeof TextsDataSchema>;

const data = loadData(TextsDataSchema, json, 'texts.json');

export const TEXTS: Readonly<Record<string, TextEntry>> = data.texts;

/** 状況ボタンの動詞（仕様書 9.1 / 14.5 節）。 */
export const INTERACT_VERBS = data.verbs;

export type InteractVerb = keyof typeof INTERACT_VERBS;

/** 通知の文言。 */
export const NOTICE_TEXTS = data.notices;

/** 文面データから引く（なければ undefined）。 */
export function lookupText(id: string): TextEntry | undefined {
  return Object.hasOwn(TEXTS, id) ? TEXTS[id] : undefined;
}
