/** 取得アイテムの定義（仕様書 2.1 / 14.4 節）。データ（ID・効果）だけを持ち、ロジックは `game/item/` が読む。 */
export type ItemEffect = { readonly type: 'flaskMax'; readonly amount: number };

export interface ItemDef {
  /** セーブの `items` のキー。 */
  readonly id: string;
  readonly name: string;
  /** 取得通知の文言（9.1 節。3 秒表示）。 */
  readonly message: string;
  readonly effect: ItemEffect;
}

export const ITEM_DEFS: Readonly<Record<string, ItemDef>> = {
  flask_up: {
    id: 'flask_up',
    name: '回復瓶',
    message: '回復瓶を手に入れた',
    effect: { type: 'flaskMax', amount: 1 },
  },
};

export const ITEM = {
  /** 拾う動作（かがむ。`interact` 状態）の長さ。 */
  pickupFrames: 48,
  /** 動作の開始からこのフレームで手に入る（途中で被弾して中断されたら取得しない）。 */
  grantFrame: 24,
  /** 取得通知の表示時間（秒）。表示は E6-2b。 */
  noticeSeconds: 3,
  /** 反応半径（m）。 */
  radiusM: 1.4,
} as const;
