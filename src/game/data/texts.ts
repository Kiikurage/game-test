// テキストパネルの文面データ（#120）。ID → 文面。本番の文面は `world/texts.ja.ts`（#122、仕様書 14.6 節）。
// 配列は会話の 1 行ずつ。文中の「（改行）」は改行になる。
import { TEXTS_JA } from './world/texts.ja';

export type TextEntry = string | readonly string[];

export const TEXTS: Readonly<Record<string, TextEntry>> = TEXTS_JA;

/** 状況ボタンの動詞（仕様書 9.1 / 14.5 節）。`Interactable.label()` が返す。表記のデバイス差（E / A / タップ）は UI 側。 */
export const INTERACT_VERBS = {
  read: '読む',
  loot: '調べる',
  pick: '拾う',
  pray: '祈る',
  bell: '鐘',
  talk: '話す',
  push: '押す',
  rest: '休む',
  fog: '霧へ入る',
} as const;

export type InteractVerb = keyof typeof INTERACT_VERBS;

/** 文面データから引く（なければ undefined）。 */
export function lookupText(id: string): TextEntry | undefined {
  return Object.hasOwn(TEXTS, id) ? TEXTS[id] : undefined;
}
