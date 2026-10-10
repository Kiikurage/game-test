/**
 * ボスのフェーズ移行（仕様書 6.5 節）に合わせた見た目の時間変化。純粋な関数（three 非依存）。
 * フレームは移行の F1 起点（60Hz 固定ステップ）。
 */
export const PHASE_TRANSITION = {
  /** 盾を投げ捨てる区間（F13–F90）。盾はこの区間の開始で手を離れる。 */
  shieldThrow: { start: 13, end: 90 },
  /** 咆哮で眼窩・武器が橙に発光し、熾火が始まる区間（F60–F100）。 */
  ember: { start: 60, end: 100 },
} as const;

const smooth = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

/** 移行の経過フレーム → 熾火の強さ（0〜1）。咆哮の区間でなめらかに点く。 */
export function emberAtTransitionFrame(frame: number): number {
  const { start, end } = PHASE_TRANSITION.ember;
  return smooth((frame - start) / (end - start));
}

/** 移行の経過フレーム → 盾が手を離れたか（投げ捨ての開始フレーム以降）。 */
export function shieldReleased(frame: number): boolean {
  return frame >= PHASE_TRANSITION.shieldThrow.start;
}

/** 熾火の呼吸（フェーズ 2 の間、発光が鼓動するように ±amount で揺れる倍率）。`time` は秒。 */
export function emberPulse(time: number, base = 1, amount = 0.12): number {
  return Math.min(1, Math.max(0, base * (1 - amount + amount * Math.sin(time * 2.4))));
}
