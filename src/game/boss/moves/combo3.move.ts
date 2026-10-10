import { registerBossMove, type BossStageDef } from '../bossMove';

/**
 * 技 3 三連撃（斬り上げ → 斬り下ろし → 突き）（仕様書 6.3 節）。近距離の技。
 *
 * | 段 | 発生 P1 / P2 | 持続 | ダメージ P1 / P2 | 強靭度 | ガード時スタミナ | 判定 |
 * | 1 | 30 / 24 | 6 | 80 / 85 | 40 | 40 | 前方 90° |
 * | 2 | 20 / 16 | 6 | 80 / 85 | 40 | 40 | 前方 80°（逆方向の振り） |
 * | 3 | 36 / 30 | 8 | 100 / 105 | 60 | 55 | 前方 30°・突進 2.5m |
 *
 * 段間 8F、最終硬直 56（P2: 46）、射程は全段 5.0m。クリップは `Sword_Regular_Combo`（段ごとに範囲を分ける）。
 *
 * テレグラフ: 1・2 段は `normal`（発生 30F / 20F の素早い通常の斬り。ガード可）、3 段の突きは `heavy`（突進つきでダメージ 100 以上・
 * 発生 36F の溜め。ガードは可能なので `unblockable` ではない）。
 * 追尾: 1 段は発生の 12F 前まで、2・3 段は短く弱く（段間で向きを大きく変えない）。
 * 1 段目を「ボスの右手側（プレイヤーから見て左）へのロール」で躱すと 2 段目の 80° の外へ出られる。
 */

/** 段間（各段の硬直）。 */
export const COMBO3_GAP = 8;
/** 突き（3 段目）の突進距離（m）。持続の間に均等に進む。 */
export const COMBO3_THRUST_DISTANCE = 2.5;
/** 各段の振りの向き（ボスから見て）。2 段目は 1 段目の逆方向。 */
export const COMBO3_SWING = ['rightToLeft', 'leftToRight', 'thrust'] as const;

const SLASH_1: BossStageDef = {
  id: 'combo3.1',
  startup: 30,
  active: 6,
  recovery: COMBO3_GAP,
  damage: 80,
  poiseDamage: 40,
  guardStaminaCost: 40,
  moveDistance: 0,
  arcDeg: 90,
  range: 5.0,
  telegraph: 'normal',
  trackEndFrame: 18,
};

const SLASH_2: BossStageDef = {
  ...SLASH_1,
  id: 'combo3.2',
  startup: 20,
  arcDeg: 80,
  followUp: true,
  trackEndFrame: 6,
  trackRate: 0.5,
};

const THRUST: BossStageDef = {
  ...SLASH_1,
  id: 'combo3.3',
  startup: 36,
  active: 8,
  recovery: 56,
  damage: 100,
  poiseDamage: 60,
  guardStaminaCost: 55,
  moveDistance: COMBO3_THRUST_DISTANCE,
  arcDeg: 30,
  telegraph: 'heavy',
  followUp: true,
  trackEndFrame: 12,
  trackRate: 0.6,
};

registerBossMove({
  id: 'combo3',
  name: '三連撃',
  phases: [1, 2],
  stages: [SLASH_1, SLASH_2, THRUST],
  phase2Stages: [
    { ...SLASH_1, startup: 24, damage: 85, trackEndFrame: 12 },
    { ...SLASH_2, startup: 16, damage: 85, trackEndFrame: 4 },
    { ...THRUST, startup: 30, recovery: 46, damage: 105, trackEndFrame: 10 },
  ],
  // 近距離の技。足を止めてから振り始める（射程内なら接近しない）
  approach: { speed: 'walk', stopRange: 3.0 },
});
