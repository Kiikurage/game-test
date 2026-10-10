import { ramp, smoothstep01 } from './poseUtils';

/**
 * 回復（瓶を飲む）の手続き的な姿勢補正の時間割（純粋な関数。適用は `healFlask.view.ts`）。
 * 入力は動作の進行 `u`（0..1 = 動作開始からのフレーム ÷ 全体フレーム）。
 *
 *  - 0.02〜0.24 瓶を持った左手を口元へ運ぶ（`raise`）。
 *  - 0.20〜0.38 頭を後ろへ反らして傾ける（`sip`）。0.62〜0.80 で頭を戻す。
 *  - 0.66〜0.92 手を下ろす（`lower`）。
 *  - 瓶は 0.04〜0.12 で手に現れ、0.88〜0.96 で消える（`flask`）。
 */
export interface DrinkPose {
  /** 手の IK の強さ 0..1（上げて、下ろす間は 0 に戻る）。 */
  readonly arm: number;
  /** 手が口元へ寄っている度合い 0..1（口に当てる瓶が、胸の前から口へ上がる）。 */
  readonly raise: number;
  /** 頭を反らして飲んでいる度合い 0..1。 */
  readonly sip: number;
  /** 瓶の現れ具合 0..1（大きさ）。 */
  readonly flask: number;
}

export function drinkPose(u: number): DrinkPose {
  const raise = smoothstep01(ramp(u, 0.02, 0.24));
  const lower = smoothstep01(ramp(u, 0.66, 0.92));
  const sip = smoothstep01(ramp(u, 0.2, 0.38)) * (1 - smoothstep01(ramp(u, 0.62, 0.8)));
  const flask = smoothstep01(ramp(u, 0.04, 0.12)) * (1 - smoothstep01(ramp(u, 0.88, 0.96)));
  return { arm: raise * (1 - lower), raise: raise * (1 - lower), sip, flask };
}

/** 瓶の中身の量 0..1: 飲み始めまでは満杯、飲んでいる間に減って底に残る。空振り（中身なし）は常に 0。 */
export function flaskFill(u: number, empty: boolean): number {
  if (empty) return 0;
  return 1 - 0.7 * smoothstep01(ramp(u, 0.38, 0.62));
}

/** 液体の発光の強さ（1 = 通常）。回復が効く瞬間（`healApply` = F26 付近）に強く光る。 */
export function flaskGlow(u: number, empty: boolean): number {
  if (empty) return 1;
  const pulse = Math.exp(-Math.pow((u - 0.48) / 0.07, 2));
  return 1 + 0.9 * pulse;
}
