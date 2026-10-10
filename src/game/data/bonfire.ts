/** 篝火とインタラクションの数値（仕様書 8.3 節）。フレームは 60Hz。 */
export const INTERACT = {
  /** 「調べる」対象の既定の反応半径（m）。 */
  defaultRadiusM: 1.5,
} as const;

export const BONFIRE = {
  /** 篝火の反応半径（m）。 */
  radiusM: 1.5,
  /** 初回点火（かがんで火を灯す）の長さ。 */
  igniteFrames: 120,
  /** 座り込み・立ち上がり（休憩 / リスポーン）の長さ。 */
  sitDownFrames: 120,
  standUpFrames: 120,
  /** リスポーン位置: 篝火から南（-z）へこの距離。篝火の方（+z）を向いて座った状態から立ち上がる。 */
  respawnDistanceM: 1.5,
  /** 「篝火に火が灯った」バナーの表示時間（秒）。表示は E6-3b。 */
  bannerSeconds: 3,
} as const;
