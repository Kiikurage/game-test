import type { CameraClip } from './cameraEffects';

/**
 * ボスのフェーズ移行のカメラ（仕様書 6.5 節）。再生開始（F1）から 120F。
 * F60 までに引き（距離 +1.5m）・FOV +6° へ、F100 まで保ち、F120 で元へ戻る。咆哮の振動 0.8° は F60 から 60F。
 * #84（フェーズ移行）が `cameraEffectsOf(game).playClip(PHASE_TRANSITION_CLIP)` で呼ぶ。
 */
export const PHASE_TRANSITION_CLIP: CameraClip = {
  id: 'phaseTransition',
  frames: 120,
  keys: [
    { frame: 0, armOffsetM: 0, fovOffsetDeg: 0, shakeDeg: 0 },
    { frame: 59, shakeDeg: 0 },
    { frame: 60, armOffsetM: 1.5, fovOffsetDeg: 6, shakeDeg: 0.8 },
    { frame: 100, armOffsetM: 1.5, fovOffsetDeg: 6 },
    { frame: 119, armOffsetM: 0, fovOffsetDeg: 0, shakeDeg: 0 },
  ],
};
