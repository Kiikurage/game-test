import { Vector3 } from 'three/webgpu';
import type { PlayerAnimLayer } from './assets/playerAnimator';
import { registerDevHooks } from '../devHooks';

declare module '../devHooks' {
  interface DevHooks {
    /** プレイヤーのアニメーションレイヤーを時刻で固定表示する（撮影用）。 */
    pose(layer: PlayerAnimLayer | null, time?: number): void;
    /** カメラを任意の視点へ固定する（俯瞰撮影用）。`null` でゲームのカメラへ戻す。 */
    freeCam(position: [number, number, number] | null, target?: [number, number, number]): void;
  }
}

registerDevHooks('render', ({ view, playerView }) => ({
  freeCam: (position, target = [0, 0, 0]) => {
    view.setFreeCamera(
      position && { position: new Vector3(...position), target: new Vector3(...target) },
    );
  },
  pose: (layer, time = 0) => {
    playerView()?.setDebugPose(layer ? { layer, time } : null);
  },
}));
