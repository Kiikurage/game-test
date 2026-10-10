/** 死亡演出のタイムライン（仕様書 8.1 / 3.3 節）。フレームは 60Hz、死亡 = F0。 */
export const DEATH = {
  /** F0 のヒットストップ（フレーム）。通常のヒットストップ（`HIT_STOP.kill`）と同じ。 */
  hitStopFrames: 12,
  /** BGM ダッキング（F0 から。dB / 下げきるまでのフレーム）。 */
  bgmDuckDb: -12,
  bgmDuckFrames: 60,
  /** 再開時に BGM を戻すまでのフレーム。 */
  bgmReleaseFrames: 60,
  /** F12: 死亡アニメ（`Death01`）開始。カメラの引きと FOV の縮小もここから `cameraFrames` かけて。 */
  animFrame: 12,
  cameraFrames: 90,
  fovDeltaDeg: -4,
  /** カメラを引く距離（m）。 */
  cameraPullM: 0.8,
  /** 注視点を下げる距離（m）。倒れた体が画面の中央からやや下に収まるようにする。 */
  cameraPivotDropM: 0.9,
  /** F30–F120: 彩度 0% / 明度 -40% / 周辺減光へ（90F 補間）。 */
  gradeFrame: 30,
  gradeFrames: 90,
  dimMax: 0.4,
  /** F60: 「倒れた」表示イベント（60F フェードイン。1.05 倍へゆっくり拡大）。 */
  textFrame: 60,
  textFadeFrames: 60,
  textScaleMax: 1.05,
  /** F90 以降、ボタン入力でスキップできる。スキップ時の黒への移行は遅くとも F120 から。 */
  skipFrame: 90,
  skipFadeOutMinFrame: 120,
  /** F120: テキスト保持の開始（低い鐘の SE）。 */
  holdFrame: 120,
  /** F240–F300: 黒へフェードアウト。F300 で篝火に再開。 */
  fadeOutFrame: 240,
  fadeOutFrames: 60,
  /** 再開後、黒から戻すフレーム。 */
  revealFrames: 30,
} as const;
