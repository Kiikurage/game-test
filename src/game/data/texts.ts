// テキストパネルの文面データ（#120）。ID → 文面。配列は会話の 1 行ずつ。文中の「（改行）」は改行になる。
// 本番の文面は E11-1a（#122）が `texts.ja.ts` として投入する。ここはダミー。
export type TextEntry = string | readonly string[];

export const TEXTS: Readonly<Record<string, TextEntry>> = {
  'dummy.stele-a': '灰の炉に、火を絶やすなかれ。（改行）旅人よ、ここが始まりの地だ。',
  'dummy.talk': [
    'ああ……よく来てくれた。',
    'わたしはもう、長くはない。',
    'この剣を、受け取ってはくれまいか。',
    '頼む。……先へ、進んでくれ。',
  ],
};

/** 状況ボタンの動詞（仕様書 9.1 / 14.5 節）。`Interactable.label()` が返す。表記のデバイス差（E / A / タップ）は UI 側。 */
export const INTERACT_VERBS = {
  read: '読む',
  loot: '調べる',
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
  return TEXTS[id];
}
