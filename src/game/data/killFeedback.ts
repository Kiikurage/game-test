/**
 * 雑魚敵の撃破演出のタイムライン（#281、vertical-slice.md 5.2 節「撃破」）。F0 = トドメの命中ステップ。
 * 撃破がパッシブな変化（ロックオンが外れる・攻撃が空振る）ではなく、色・形・動きの変化で一目で分かるようにする。
 * ボスの撃破（8.4 節）には使わない。
 */
export const KILL_FEEDBACK = {
  /** 全身の輪郭の閃光（白〜橙のリム）。F0〜`flashHoldFrames` は最大、`flashFrames` で消える。 */
  flashHoldFrames: 4,
  flashFrames: 10,
  /** 眼の発光が消えるまで（F0 から）。 */
  eyeFadeFrames: 6,
  /** 「燃え尽きた」灰色と熾火のひびが命中点から全身へ広がるまで。 */
  burnoutFrames: 20,
  /** ディゾルブ（灰化）の開始と長さ。旧: 倒れてから 60F 後に 60F。 */
  dissolveStartFrames: 20,
  dissolveFrames: 48,
} as const;

/** 撃破から消滅までのフレーム数（60Hz）。約 1.2 秒以内（#281）。 */
export const KILL_VANISH_FRAMES = KILL_FEEDBACK.dissolveStartFrames + KILL_FEEDBACK.dissolveFrames;

export interface KillFeedbackState {
  /** 輪郭の閃光の強さ（0..1）。 */
  readonly flash: number;
  /** 眼の発光の倍率（1 = 生前、0 = 消灯）。 */
  readonly eyeGlow: number;
  /** 燃え尽きの広がり（0 = 命中点のみ、1 = 全身）。 */
  readonly burnout: number;
  /** ディゾルブ進行度（0..1）。 */
  readonly dissolve: number;
}

const clamp01 = (v: number): number => (Number.isNaN(v) ? 0 : Math.min(1, Math.max(0, v)));

/** 撃破からの経過フレーム（F0 = 0。生きている間は負の値を渡してよい）から演出の状態を求める（純粋関数）。 */
export function killFeedbackAt(frames: number): KillFeedbackState {
  const k = KILL_FEEDBACK;
  if (frames < 0) return { flash: 0, eyeGlow: 1, burnout: 0, dissolve: 0 };
  const fade = clamp01((frames - k.flashHoldFrames) / (k.flashFrames - k.flashHoldFrames));
  const burn = clamp01(frames / k.burnoutFrames);
  return {
    flash: 1 - fade * fade * (3 - 2 * fade),
    eyeGlow: 1 - clamp01(frames / k.eyeFadeFrames),
    // 立ち上がりを速く（ease-out）: 命中から数フレームで体の大半に届く
    burnout: 1 - (1 - burn) * (1 - burn),
    dissolve: clamp01((frames - k.dissolveStartFrames) / k.dissolveFrames),
  };
}
