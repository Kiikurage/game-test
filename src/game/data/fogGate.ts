/** 霧の門の数値（仕様書 7.1 / 7.2 節）。フレームは 60Hz。 */
export const FOG_GATE = {
  /** `LevelData.interactables` / `gates` の ID。 */
  id: 'fog-gate',
  /** 状況アクション「霧へ入る」の反応半径（m。門の中心から）。 */
  radiusM: 2.4,
  /** 入場演出の長さ（操作不能の長さ）。 */
  enterFrames: 90,
  /** 闘技場の入場位置へ移るフレーム（霧のヴェールが画面を覆い切ったところ）。 */
  teleportFrame: 70,
  /** ヴェール（画面を覆う青白い霧）が立ち上がり始める / 覆い切る / 完全に晴れるフレーム（演出開始から）。 */
  veilStartFrame: 34,
  veilFullFrame: 70,
  veilClearFrame: 114,
  /** 門の向こう（前方）へ歩み入る目標点までの距離（m）。 */
  walkAheadM: 4,
  /** 門周辺のフォグ密度の倍率の上限（通常 0.015 に対し 0.04）と、効き始める / 最大になる門からの距離（m）。 */
  localFogFactor: 0.04 / 0.015,
  localFogOuterM: 22,
  localFogInnerM: 5,
  /** 霧の柱の高さ（m。ランドマーク）。 */
  pillarHeightM: 25,
} as const;
