// カメラ演出の数値（仕様書 3.3 節 / 6.5 節）。振幅は度、持続はフレーム（60Hz）、距離はメートル。

export const CAMERA_FX = {
  /** 被弾（軽）。 */
  hitLight: { shakeDeg: 0.3, shakeFrames: 6 },
  /** 被弾（重 / ボス）。FOV は `fovFrames` かけて 0 へ戻る。 */
  hitHeavy: { shakeDeg: 0.8, shakeFrames: 12, fovDeg: 2, fovFrames: 8 },
  /** ボスの叩きつけ。プレイヤーとの距離で減衰（`near` 以内で 100%、`far` 以上で 0%、間は線形）。 */
  slam: { shakeDeg: 1.2, shakeFrames: 24, near: 3, far: 24 },
  /** 強攻撃（`heavy` / `heavyCharged`）のヒット。 */
  playerHeavyHit: { shakeDeg: 0.4, shakeFrames: 8 },
  /** 効果の FOV 補正（合計）の上下限（度）。複数の演出が重なっても画角が破綻しない。 */
  fovOffsetMinDeg: -10,
  fovOffsetMaxDeg: 12,
  /** 効果によるアーム長補正（合計）の上下限（m）。 */
  armOffsetMinM: -2,
  armOffsetMaxM: 3,
} as const;

/** 強度設定（仕様書 9.3 節: OFF / 50% / 100%）。 */
export const DEFAULT_CAMERA_SHAKE = 100;
