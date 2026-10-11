/** ショートカット（鉄門 G1・レバー。仕様書 7.1 節）の数値。フレームは 60Hz。 */
export const SHORTCUT = {
  /** `LevelData.interactables` / `gates` の ID と、セーブ（`shortcuts`）に入れる ID。 */
  gateId: 'G1',
  leverId: 'lever-g1',
  /** レバーの反応半径（m）。 */
  leverRadiusM: 1.2,
  /** レバーを引く動作の長さ（操作不能の長さ）。 */
  leverFrames: 45,
  /** 扉が開き始めるフレーム（操作開始から）と、開ききるまでの長さ。合計 約 3 秒。 */
  gateStartFrame: 30,
  gateFrames: 150,
} as const;
