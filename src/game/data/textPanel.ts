/** テキストパネルの数値（仕様書 9.1 / 14.5 節）。 */
export const TEXT_PANEL = {
  /** 「読む」文の最長表示時間（秒）。 */
  readSeconds: 6,
  /** 表示開始位置からこの距離（m）以上動いたら閉じる。 */
  closeDistanceM: 2,
  /** 文面中の改行指定。 */
  lineBreakToken: '（改行）',
} as const;
