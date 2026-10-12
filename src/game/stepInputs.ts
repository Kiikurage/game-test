import type { InputSnapshot } from '../core/input';
import type { CameraFrameInput } from './camera/thirdPersonCamera';
import type { LockOnController, LockOnEvent } from './lockOn/lockOnController';
import type { Player } from './player/player';
import type { Tuning } from './tuning';

/** ターゲット切替要求: 入力層のフリック/ホイール/十字キー、またはロックオン中のマウスの急な横移動。 */
export function resolveSwitch(
  snap: InputSnapshot,
  lockOn: LockOnController,
  tuning: Tuning,
): -1 | 0 | 1 {
  if (snap.targetSwitch !== 0) return snap.targetSwitch;
  if (lockOn.active && Math.abs(snap.look.x) > tuning.lockOn.flickLookThreshold) {
    return snap.look.x > 0 ? 1 : -1;
  }
  return 0;
}

/** カメラの 1 ステップ分の入力（向きの更新と位置の更新で、その時点のプレイヤーの状態を読む）。 */
export function cameraFrameInput(
  snap: InputSnapshot,
  player: Player,
  lockOn: LockOnController,
  lockEvent: LockOnEvent,
  tuning: Tuning,
): CameraFrameInput {
  return {
    look: snap.look,
    playerPosition: player.feet,
    playerYaw: player.yaw,
    moveInput: snap.move,
    running:
      player.state === 'dash' ||
      (player.state === 'move' && player.speed > tuning.player.walk + 0.5),
    lockTarget: lockOn.target,
    lockEvent,
    device: snap.device,
  };
}
