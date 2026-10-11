import { approachVelocity } from '../movement';
import type { PlayerCore } from '../playerCore';
import type { PlayerStateId } from '../playerStates';

/** 仰け反り・転倒: 行動不能。押し戻しは `slide` が担う。終わったら移動・待機・落下へ。 */
export function updateReaction(c: PlayerCore): PlayerStateId | null {
  c.halt();
  if (c.stateFrame > c.reactionFrames) {
    if (c.airborne) return 'fall';
    return c.idleOrMove();
  }
  return null;
}

/** 倒れたまま動かない。 */
export function updateDead(c: PlayerCore): PlayerStateId | null {
  c.halt();
  return null;
}

/**
 * 状況アクション（調べる・座り込み・休憩・立ち上がり）: 入力を受け付けず、その場で止まる。
 * 長さが過ぎたら次の状態へ（`rest` は `standUp` が呼ばれるまで保持）。
 */
export function updateScripted(c: PlayerCore, dt: number): PlayerStateId | null {
  c.tmpVelocity.x = 0;
  c.tmpVelocity.y = 0;
  const decel = c.tuning.player.run / (c.tuning.player.stopFrames / 60);
  approachVelocity(c.velocity, c.tmpVelocity, decel, decel, dt);
  if (c.state === 'rest' || c.stateFrame <= c.scriptedFrames) return null;
  if (c.state === 'sitDown') return 'rest';
  if (c.airborne) return 'fall';
  return 'idle';
}
