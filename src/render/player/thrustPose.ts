import { THRUST_CLIP_FRAMES, thrustLunge } from '../anim/thrustClip';
import { ramp, smoothstep01 } from './poseUtils';

/**
 * 軽 3（突き）の手続き的な姿勢補正の時間割（純粋な関数。適用は `lightThrust.view.ts`）。
 * 入力は動作開始からの連続フレーム `frame`（F1 起点。仕様: 発生 16F・持続 F17〜F22・硬直 30F）。
 *
 *  - F1〜F15  溜め: 剣を引いて脇に構え（刃は前を向けたまま）、体幹を右肩が引ける向きへひねる。
 *  - F16〜F19 突き出し: 腕が一気に伸びる（判定開始 F17 には、ほぼ伸びきっている）。体幹は正面へ戻る向きに回り込む。
 *  - F19〜F28 保持: 突き出したまま（持続 F17〜F22 + 余韻）。
 *  - F28〜F44 戻り: 構えへ引き戻す。
 */
export interface ThrustPose {
  /** 補正の強さ 0..1（クリップのポーズから、手続きのポーズへ）。 */
  readonly weight: number;
  /** 引き（溜め）の度合い 0..1。 */
  readonly chamber: number;
  /** 突き出しの度合い 0..1（戻りで 0 へ）。 */
  readonly extend: number;
  /** 体幹のひねり（rad、キャラクターの上方向まわり。正 = 左回り = 右肩が前へ出る）。 */
  readonly twist: number;
  /** 踏み込みの深さ 0..1（モデル全体を前へ出す量に掛ける）。 */
  readonly lunge: number;
}

const DEG = Math.PI / 180;
/** 溜めで体幹を引く角度。 */
export const THRUST_TWIST_CHAMBER = -24 * DEG;
/** 突きで体幹を回し込む角度。 */
export const THRUST_TWIST_EXTEND = 18 * DEG;
/** 溜めの最後（F16）と、突きの最後（F19）。 */
export const THRUST_CHAMBER_END = 15;
export const THRUST_EXTEND_START = 15.5;
export const THRUST_EXTEND_END = 19;
export const THRUST_RETRACT_START = 28;
export const THRUST_RETRACT_END = 44;

export function thrustPose(frame: number): ThrustPose {
  const weight = ramp(frame, 1, 5) * (1 - smoothstep01(ramp(frame, 40, 52)));
  const chamber = smoothstep01(ramp(frame, 2, THRUST_CHAMBER_END));
  // 突き出しは速く（出だしが速く、最後に減速する）
  const strike = 1 - Math.pow(1 - ramp(frame, THRUST_EXTEND_START, THRUST_EXTEND_END), 2.2);
  const retract = smoothstep01(ramp(frame, THRUST_RETRACT_START, THRUST_RETRACT_END));
  const extend = strike * (1 - retract);
  const hold = chamber * (1 - strike) * (1 - retract);
  const twist = THRUST_TWIST_CHAMBER * hold + THRUST_TWIST_EXTEND * extend;
  // 派生クリップのフレームは 1 ステップ = 0.5 フレーム
  const clipFrame = Math.min(THRUST_CLIP_FRAMES, Math.max(0, (frame - 1) / 2));
  const lunge = thrustLunge(clipFrame);
  return { weight, chamber: chamber * (1 - retract), extend, twist, lunge };
}
