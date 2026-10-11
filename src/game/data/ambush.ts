// 致命の一撃（Ambush Strike。仕様書 14.3.2 節）の条件・吸着・演出の数値。フレームデータ（発生 10 / 持続 3 / 硬直 34、
// スタミナ 16、倍率 ×4.0、強靭度削り 100）は `PLAYER_ACTIONS.backstab`、ヒットストップ 14F は `HIT_STOP.playerBackstab`。

export const AMBUSH = {
  /** 対象の背面 ±この角度（度）以内に立っていること。 */
  backHalfAngleDeg: 60,
  /** 水平距離の上限（m）。 */
  maxDistanceM: 1.6,
  /** 高低差の上限（m）。 */
  maxHeightDiffM: 1.0,
  /** 吸着で立つ位置: 対象の背後この距離（m）。 */
  snapDistanceM: 0.9,
  /** 吸着にかけるフレーム数。 */
  snapFrames: 6,
  /** 吸着で動かす距離の上限（m）。 */
  snapMaxM: 1.2,
  /** 突きの届く距離（m。体の前、剣先まで）。 */
  reachM: 2.0,
  /** 成立中の剣の縁の光（リムライトの強さ 0..1）と色。HUD 表示は出さない。 */
  glowAmount: 0.3,
  glowColor: 0xffe2a8,
  /** 命中音を鳴らす cue（素材は E7 で接続。未登録なら無音）。 */
  hitCue: 'sfx.ambush-hit',
} as const;
