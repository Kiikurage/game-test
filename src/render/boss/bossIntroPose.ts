import type { BossTransitionPose } from './bossTransitionPose';

/**
 * ボスの入場演出（#85 / 6.2 節、約 90F）の手続きの姿勢。`bossTransitionPose` と同じ形（加算の回転。モデル空間）。純粋な関数。
 * 兜を上げて身構える: F0–F30 うつむいて立つ → F30–F54 顔を上げる（兜を上げる）→ F54–F90 腕を開いて前屈みに身構える。
 */
export const BOSS_INTRO_FRAMES = 90;

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
    const a = keys[i - 1];
    const b = keys[i];
    if (!a || !b) continue;
    if (frame <= b[0]) return a[1] + (b[1] - a[1]) * smooth((frame - a[0]) / (b[0] - a[0]));
  }
  return last[1];
}

const SPINE_PITCH: readonly Key[] = [
  [0, 0.12],
  [30, 0.12],
  [54, -0.08],
  [72, 0.2],
  [90, 0.16],
];
const HEAD_PITCH: readonly Key[] = [
  [0, 0.5],
  [30, 0.5],
  [44, -0.3],
  [54, -0.18],
  [90, 0.05],
];
const ARM_SPREAD: readonly Key[] = [
  [0, 0],
  [54, 0],
  [72, 0.45],
  [90, 0.35],
];

export function bossIntroPose(frame: number): BossTransitionPose {
  const f = Math.min(BOSS_INTRO_FRAMES, Math.max(0, frame));
  return {
    spinePitch: sample(SPINE_PITCH, f),
    spineTwist: 0,
    headPitch: sample(HEAD_PITCH, f),
    armSpread: sample(ARM_SPREAD, f),
    tremor: 0,
  };
}
