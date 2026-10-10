import { AnimationClip, Quaternion, type KeyframeTrack } from 'three/webgpu';

/**
 * 軽攻撃 3 段目（突き）用の派生クリップ `Sword_Thrust`。
 *
 * UAL2 の `Sword_Regular_C` は「跳び上がって叩きつける」動きで（ルートが 0.57 → 0.88 → 0.60m と上下に跳ね、
 * 剣は頭上 1.6m まで振り上がる）、仕様の「突き」に見えない。UAL / UAL2 に突きのクリップは無いので、
 * このクリップの両端の姿勢だけを使い直す:
 *  - A = 終端（f60: 構えに戻った立ち姿勢）
 *  - L = 突っ込みの姿勢（f27: 腰を落とし前脚に体重を乗せた低い踏み込み）
 * 下半身・体幹は A → L → A のブレンドだけで動かす（跳ね・回転を捨てる = ルートの上下動の除去）。
 * 腕・剣・体幹の起こし（突き出し）は `lightThrust.view.ts` が手続き的に補正する。
 */

/** 元になるクリップ。 */
export const THRUST_SOURCE_CLIP = 'Sword_Regular_C';
/** 派生クリップの名前。 */
export const THRUST_CLIP_NAME = 'Sword_Thrust';
export const THRUST_CLIP_FPS = 30;
/** 派生クリップの長さ（フレーム。52 ステップ = 0.867s を等速で再生する）。 */
export const THRUST_CLIP_FRAMES = 26;
/** 突きが伸びきる（踏み込みが最も深くなる）フレーム。仕様の発生 16F = 0.267s のちょうど 8F 目。 */
export const THRUST_HIT_FRAME = 8;

/** 元クリップの「構え（A）」と「踏み込み（L）」のフレーム。 */
const POSE_READY_FRAME = 60;
const POSE_LUNGE_FRAME = 27;

/**
 * 首・頭は踏み込みの前傾（L では頭を深く突っ込む）をあまり採らない。体幹の前傾は描画側が測って起こす（`lightThrust.view.ts`）。
 * ボーン名 → L へ寄せる割合の上限（それ以外は 1）。
 */
const LUNGE_SHARE: Readonly<Record<string, number>> = {
  neck_01: 0.25,
  head: 0.25,
};

/**
 * 派生クリップのフレーム f（0..THRUST_CLIP_FRAMES）での踏み込みの深さ 0..1（0 = 構え、1 = 踏み込み）。
 * 溜め（f0〜f7）でじわりと腰を落とし、f8 で一気に踏み込みきり、f12 まで保ち、残りで構えへ戻る。
 */
export function thrustLunge(frame: number): number {
  const ease = (t: number): number => {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  };
  if (frame <= THRUST_HIT_FRAME) {
    // 前半は緩く（腰を落とす溜め）、後半で鋭く
    const t = frame / THRUST_HIT_FRAME;
    return 0.22 * ease(t * 1.4) + 0.78 * Math.pow(t, 3);
  }
  if (frame <= 12) return 1;
  return 1 - ease((frame - 12) / (THRUST_CLIP_FRAMES - 12));
}

function sampleAt(track: KeyframeTrack, time: number): Float32Array {
  // createInterpolant は three の公開 API だが型定義に無い
  const interpolant = (
    track as unknown as { createInterpolant(): { evaluate(t: number): ArrayLike<number> } }
  ).createInterpolant();
  return Float32Array.from(interpolant.evaluate(time));
}

/** `source`（`Sword_Regular_C`）から突きの派生クリップを作る。元のクリップは変更しない。 */
export function buildThrustClip(source: AnimationClip): AnimationClip {
  const times = Array.from({ length: THRUST_CLIP_FRAMES + 1 }, (_, f) => f / THRUST_CLIP_FPS);
  const tracks: KeyframeTrack[] = [];
  const qa = new Quaternion();
  const qb = new Quaternion();
  for (const track of source.tracks) {
    const size = track.getValueSize();
    const ready = sampleAt(track, POSE_READY_FRAME / THRUST_CLIP_FPS);
    const lunge = sampleAt(track, POSE_LUNGE_FRAME / THRUST_CLIP_FPS);
    const values = new Float32Array(times.length * size);
    const node = track.name.slice(0, track.name.lastIndexOf('.'));
    const share = LUNGE_SHARE[node] ?? 1;
    const isQuaternion = track.ValueTypeName === 'quaternion';
    times.forEach((_, f) => {
      const w = thrustLunge(f) * share;
      const offset = f * size;
      if (isQuaternion) {
        qa.fromArray(ready);
        qb.fromArray(lunge);
        qa.slerp(qb, w).toArray(values, offset);
      } else {
        for (let i = 0; i < size; i++) {
          const a = ready[i] ?? 0;
          values[offset + i] = a + ((lunge[i] ?? 0) - a) * w;
        }
      }
    });
    const Ctor = track.constructor as new (
      name: string,
      times: ArrayLike<number>,
      values: ArrayLike<number>,
    ) => KeyframeTrack;
    tracks.push(new Ctor(track.name, times, values));
  }
  return new AnimationClip(THRUST_CLIP_NAME, times[times.length - 1] ?? 0, tracks);
}
