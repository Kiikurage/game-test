/** ボス入場（#85 / 仕様書 6.2・6.6 節）の数値。フレームは 60Hz。 */
export const BOSS_ENTRY = {
  /** 霧の門の入場演出が終わってから戦闘開始までの、ボスの入場演出（兜を上げて身構える。開始前は無敵）。 */
  introFrames: 90,
  /** 闘技場の床の円の半径（m。内径 32m）。 */
  arenaRadius: 16,
  /** 柱の配置（闘技場の中心から m・半径 m）。`ashenFoundation.ts` の `f-pillar-*` と同じ。 */
  pillarRingM: 12,
  pillarRadiusM: 0.7,
  /** 待機位置: 闘技場の中心から、入口と反対側へ m。入口の方を向いて待つ。 */
  homeOffsetM: 4,
  /** BGM の切替にかけるフレーム。 */
  bgmFrames: 60,
} as const;
