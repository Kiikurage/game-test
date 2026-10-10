/**
 * ボスのフェーズ移行（仕様書 6.5 節）の演出タイムライン。純粋なデータと関数（three / Rapier 非依存）。
 * フレームは移行の F（`Boss.transitionFrame`。`bossPhaseBoundary` の瞬間が 0、F1 から数える）。
 * ボス本体は演出の完了を待たず固定の `BOSS_BATTLE.transitionFrames`（120F）で進むので、演出はこの F に同期して走らせる。
 */
export const BOSS_TRANSITION = {
  /** F1–F12: 仰け反り（無敵はボス側が 120F 通して持つ）。 */
  flinchEnd: 12,
  /** F13: 盾が手を離れる（F13–F90 が盾投げ・構え直し。BGM はここでフェーズ 2 のレイヤーを重ねる）。 */
  shieldThrow: 13,
  /** F60–F100: 咆哮（眼窩・武器が橙に発光、熾火、カメラの振動、画面端の赤い縁取り 30F）。 */
  roar: 60,
  roarEnd: 100,
  /** F120: 戦闘再開（カメラは F100–F120 で戻る）。 */
  end: 120,
  /** 咆哮・フェーズ移行時の BGM ダッキング（10.2 節: −6dB / 30F）。解除は咆哮の終わり。 */
  duckDb: -6,
  duckFrames: 30,
  /** フェーズ 2 のレイヤーのクロスフェード（10.2 節: 6 秒）。 */
  bgmLayer: 'bgm.boss-layer',
  bgmLayerFrames: 360,
  /**
   * 画面端の赤い縁取り（咆哮の頭から 30F）。(F, 強さ) の折れ線: F60 から 6F で立ち上がり、2 回脈打って（F66 / F75 が山）F90 で消える。
   * `alpha` は縁の最大の不透明度、`band` は縁の幅（画面の短辺に対する割合）。
   */
  rim: {
    keys: [
      [60, 0],
      [66, 1],
      [70, 0.5],
      [75, 1],
      [80, 0.5],
      [90, 0],
    ],
    alpha: 0.33,
    band: 0.075,
  },
} as const;

export type BossTransitionCue = 'start' | 'flinchEnd' | 'shieldThrow' | 'roar' | 'roarEnd' | 'end';

/** 節目が起きる移行 F。`start` は移行の開始の瞬間（F0）。 */
export const BOSS_TRANSITION_FRAMES: Readonly<Record<BossTransitionCue, number>> = {
  start: 0,
  flinchEnd: BOSS_TRANSITION.flinchEnd,
  shieldThrow: BOSS_TRANSITION.shieldThrow,
  roar: BOSS_TRANSITION.roar,
  roarEnd: BOSS_TRANSITION.roarEnd,
  end: BOSS_TRANSITION.end,
};

const CUES = Object.entries(BOSS_TRANSITION_FRAMES) as [BossTransitionCue, number][];

/** `from`（含まない）〜 `to`（含む）の F に達する節目（昇順）。 */
export function cuesBetween(from: number, to: number): BossTransitionCue[] {
  return CUES.filter(([, frame]) => frame > from && frame <= to).map(([cue]) => cue);
}

/** 移行 F → 画面端の赤い縁取りの強さ（0〜1）。F60 から 30F、2 回脈打つ。 */
export function rimAtTransitionFrame(frame: number): number {
  const keys: readonly (readonly [number, number])[] = BOSS_TRANSITION.rim.keys;
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last || frame <= first[0] || frame >= last[0]) return 0;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (!a || !b || frame > b[0]) continue;
    return a[1] + ((b[1] - a[1]) * (frame - a[0])) / (b[0] - a[0]);
  }
  return 0;
}
