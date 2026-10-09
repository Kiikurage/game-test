export interface ResolutionLimits {
  /** devicePixelRatio の上限。 */
  maxPixelRatio: number;
  /** 描画ピクセル総数の上限（高 DPI のスマホで内部解像度が膨らむのを防ぐ）。 */
  maxPixels: number;
}

/** 既定の上限。Xperia 1 V（4K / DPR≈3）でもネイティブ解像度では描画しない。 */
export const DEFAULT_LIMITS: ResolutionLimits = {
  maxPixelRatio: 2,
  maxPixels: 2_500_000,
};

/**
 * CSS サイズと devicePixelRatio から、実際に使う描画ピクセル比を決める。
 * 将来の動的解像度スケーリングはこの値に係数を掛ける形で拡張する。
 */
export function computePixelRatio(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  limits: ResolutionLimits = DEFAULT_LIMITS,
): number {
  const area = Math.max(1, cssWidth * cssHeight);
  const byCap = Math.min(Math.max(devicePixelRatio, 1), limits.maxPixelRatio);
  const byPixels = Math.sqrt(limits.maxPixels / area);
  // 小さすぎる比率は画質が破綻するので下限 0.5
  return Math.max(0.5, Math.min(byCap, byPixels));
}
