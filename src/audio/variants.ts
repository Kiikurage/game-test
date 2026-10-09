/** バリエーション選択・ピッチ/音量の揺らぎ・距離減衰（純粋ロジック）。 */
import { dbToGain } from './volume';

/** 乱数源（[0,1)）。テストで差し替える。 */
export type Rng = () => number;

/** ピッチの揺らぎ幅（±4%、仕様書 10.2 節）。 */
export const PITCH_JITTER = 0.04;
/** 音量の揺らぎ幅（±1dB）。 */
export const VOLUME_JITTER_DB = 1;

/**
 * `count` 個のバリエーションから直前（`last`）と異なる添字を選ぶ。
 * 1 個しかなければ 0。`last` が undefined または範囲外なら制限なし。
 */
export function pickVariant(count: number, last: number | undefined, rng: Rng): number {
  if (count <= 1) return 0;
  if (last === undefined || last < 0 || last >= count) {
    return Math.min(count - 1, Math.floor(rng() * count));
  }
  const i = Math.min(count - 2, Math.floor(rng() * (count - 1)));
  return i >= last ? i + 1 : i;
}

/** 再生レートの倍率: 1 ± `jitter`（既定 ±4%）。 */
export function randomPlaybackRate(rng: Rng, jitter: number = PITCH_JITTER): number {
  return 1 + (rng() * 2 - 1) * jitter;
}

/** 線形ゲインの倍率: ±`jitterDb` の範囲。 */
export function randomGain(rng: Rng, jitterDb: number = VOLUME_JITTER_DB): number {
  return dbToGain((rng() * 2 - 1) * jitterDb);
}

/** 3D 定位の減衰パラメータ（仕様書 10.2 節: 1m〜30m、inverse、rolloff 1.2）。 */
export const SPATIAL = {
  refDistance: 1,
  maxDistance: 30,
  rolloffFactor: 1.2,
  distanceModel: 'inverse',
  panningModel: 'equalpower',
} as const;

/** Web Audio の `inverse` モデルと同じ距離減衰（線形ゲイン）。`maxDistance` を超えると頭打ち。 */
export function distanceGain(
  distance: number,
  ref: number = SPATIAL.refDistance,
  max: number = SPATIAL.maxDistance,
  rolloff: number = SPATIAL.rolloffFactor,
): number {
  const d = Math.min(Math.max(distance, ref), max);
  return ref / (ref + rolloff * (d - ref));
}

/** 素材 ID からバリエーショングループ名を得る（末尾の連番を除く）。例 `sfx.sword-light2` → `sfx.sword-light`。 */
export function variantGroupOf(id: string): string {
  return id.replace(/[-_.]?\d+$/, '') || id;
}
