/** 音量まわりの純粋ロジック（DOM / Web Audio 非依存）。 */

/** バス名。`master` ← `bgm` / `sfx` / `ambient` / `ui`。 */
export type BusName = 'master' | 'bgm' | 'sfx' | 'ambient' | 'ui';

/** master 以外のバス（master の子）。 */
export type ChildBusName = Exclude<BusName, 'master'>;

export const CHILD_BUSES: readonly ChildBusName[] = ['bgm', 'sfx', 'ambient', 'ui'];

/**
 * 素材のピーク基準の音量目安（仕様書 10.2 節）。素材の正規化・音量補正の基準値で、
 * ローダ（E7-1b）が素材ごとのゲインを決めるときに使う。バスの設定音量とは別。
 */
export const PEAK_LEVEL = {
  bgm: 0.6,
  ambient: 0.4,
  sfx: 0.8,
  ui: 0.7,
  bossRoar: 1.0,
} as const;

/** 設定音量（0〜100）の既定値。マスター 80 / BGM 60 / SE 80（仕様書 9.3 節）。 */
export const DEFAULT_VOLUME: Readonly<Record<BusName, number>> = {
  master: 80,
  bgm: 60,
  sfx: 80,
  // 設定画面にスライダが無いバス。設定ストア連携（E9-1a）で SE に連動させてもよい。
  ambient: 80,
  ui: 80,
};

/** 固定ステップのフレームレート（フレーム指定の時間を秒へ変換する）。 */
export const FRAMES_PER_SECOND = 60;

export function framesToSeconds(frames: number): number {
  return frames / FRAMES_PER_SECOND;
}

export function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

/** 設定音量（0〜100）→ ゲイン。`gain = (v/100)^2`。範囲外は丸める。 */
export function volumeToGain(v: number): number {
  const n = clampVolume(v) / 100;
  return n * n;
}

/** dB → 振幅ゲイン。 */
export function dbToGain(db: number): number {
  return 10 ** (db / 20);
}

/** 振幅ゲイン → dB（0 以下は -Infinity）。 */
export function gainToDb(gain: number): number {
  return gain <= 0 ? -Infinity : 20 * Math.log10(gain);
}
