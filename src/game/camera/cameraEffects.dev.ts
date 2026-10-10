import { registerDevHooks } from '../../devHooks';
import { PHASE_TRANSITION_CLIP } from './cameraClips';
import type { CameraEffectsOutput } from './cameraEffects';
import { cameraEffectsOf } from './cameraEffects.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** カメラ演出の直近の補正と再生中のクリップ（E2E・撮影用）。 */
    cameraFx(): {
      output: CameraEffectsOutput;
      /** `cameraFxResetPeaks` 以降の振動・FOV 補正の最大値。 */
      peak: { shakeDeg: number; fovOffsetDeg: number };
      strength: number;
      clips: readonly string[];
    };
    cameraFxResetPeaks(): void;
    /** カメラ演出を発火する（確認用）。`slam` の `distance` は叩きつけとの距離 [m]。 */
    cameraFxPlay(
      name: 'hitLight' | 'hitHeavy' | 'playerHeavyHit' | 'slam' | 'phase',
      distance?: number,
    ): void;
    /** 強度設定（0 / 50 / 100）を上書きする（設定ストア接続前の確認用）。 */
    cameraFxStrength(percent: number): void;
  }
}

registerDevHooks('cameraEffects', ({ game }) => {
  const fx = cameraEffectsOf(game);
  return {
    cameraFx: () => ({
      output: fx.output,
      peak: { ...fx.peak },
      strength: fx.strength,
      clips: fx.playingClips,
    }),
    cameraFxPlay: (name, distance) => {
      if (name === 'phase') fx.playClip(PHASE_TRANSITION_CLIP);
      else if (name === 'slam') fx.slam(distance ?? 0);
      else fx[name]();
    },
    cameraFxResetPeaks: () => {
      fx.resetPeaks();
    },
    cameraFxStrength: (percent) => {
      fx.setStrengthSource(() => percent);
    },
  };
});
