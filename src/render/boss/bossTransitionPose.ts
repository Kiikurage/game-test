/**
 * ボスのフェーズ移行（6.5 節）の手続きの姿勢。アニメーションクリップの上に重ねる加算の回転で、モデル空間（+Z が正面・+X がボスの左・+Y が上）の角度（rad）。
 * 純粋な関数（three 非依存）。フレームは移行の F（F0 = 開始の瞬間）。
 *
 * | F | 姿勢 |
 * | --- | --- |
 * | 1–12 | 仰け反り: 胸を反らして頭が跳ね上がる（F4 でピーク）。盾の側へ体をひねる |
 * | 13–30 | 盾投げ: 体を盾の側へ溜め（F13–F22）、F26 で振り抜いて手を離す（盾は F13 から離れる） |
 * | 30–58 | 荒い息で肩を揺らしながら前屈み（構え直し）。咆哮の前に息を溜めて胸を張る |
 * | 60–100 | 咆哮: 大きくのけぞって天を仰ぎ、腕を開く。F66 までに最大、F92 から戻す |
 * | 100–120 | 戻る |
 */
export interface BossTransitionPose {
  /** 背骨全体の前後の傾き（負でのけぞる）。 */
  spinePitch: number;
  /** 背骨全体のひねり（正で左 = +X 側へ向く）。 */
  spineTwist: number;
  /** 頭・首の前後（負で見上げる）。 */
  headPitch: number;
  /** 両腕を横へ開く量（左右対称）。 */
  armSpread: number;
  /** 咆哮中の細かい震え（振幅 rad。呼び出し側が時間で揺らす）。 */
  tremor: number;
}

type Key = readonly [frame: number, value: number];

const smooth = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

function sample(keys: readonly Key[], frame: number): number {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) return 0;
  if (frame <= first[0]) return first[1];
  if (frame >= last[0]) return last[1];
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    const a = keys[i - 1];
    if (!a || !b) continue;
    if (frame <= b[0]) return a[1] + (b[1] - a[1]) * smooth((frame - a[0]) / (b[0] - a[0]));
  }
  return last[1];
}

const SPINE_PITCH: readonly Key[] = [
  [0, 0],
  [4, -0.34],
  [12, -0.12],
  [22, 0.08],
  [30, 0.2],
  [44, 0.16],
  [58, 0.22],
  [66, -0.58],
  [92, -0.54],
  [108, -0.06],
  [120, 0],
];

const SPINE_TWIST: readonly Key[] = [
  [0, 0],
  [4, 0.18],
  [12, 0.25],
  [22, 0.5],
  [26, -0.38],
  [34, -0.1],
  [50, 0],
  [120, 0],
];

const HEAD_PITCH: readonly Key[] = [
  [0, 0],
  [3, -0.45],
  [12, -0.1],
  [30, 0.2],
  [58, 0.28],
  [66, -0.72],
  [92, -0.65],
  [108, 0],
  [120, 0],
];

const ARM_SPREAD: readonly Key[] = [
  [0, 0],
  [4, 0.2],
  [14, 0.1],
  [60, 0.1],
  [68, 0.85],
  [92, 0.8],
  [108, 0],
  [120, 0],
];

export function bossTransitionPose(frame: number): BossTransitionPose {
  const roar = smooth((frame - 62) / 6) * (1 - smooth((frame - 92) / 14));
  return {
    spinePitch: sample(SPINE_PITCH, frame),
    spineTwist: sample(SPINE_TWIST, frame),
    headPitch: sample(HEAD_PITCH, frame),
    armSpread: sample(ARM_SPREAD, frame),
    tremor: 0.035 * roar,
  };
}
