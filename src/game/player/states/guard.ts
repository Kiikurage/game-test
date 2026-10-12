import type { InputSnapshot } from '../../../core/input';
import { MOVEMENT, PLAYER_ACTIONS } from '../../data';
import { approachVelocity } from '../movement';
import type { PlayerCore, PlayerFrame } from '../playerCore';
import type { PlayerStateId } from '../playerStates';

/**
 * ガードの構え・保持（2.3 節）。ロール / バックステップへは F1 から即時、ガード被弾から 30F 以内の攻撃入力はガードカウンター。
 * それ以外の攻撃入力・ボタンを離す操作は解除（8F の硬直）へ。被ガードのスタン中は歩行・解除ができない。
 */
export function updateGuard(
  c: PlayerCore,
  dt: number,
  snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  c.guardAge++;
  if (c.airborne) return 'fall';

  const dodge = c.tryDodge(frame);
  if (dodge) return dodge;

  if (
    c.counterWindow.open &&
    c.stamina.canStart(PLAYER_ACTIONS.guardCounter.staminaCost) &&
    frame.input.consumeBuffered('lightAttack')
  ) {
    return 'guardCounter';
  }

  const stunned = c.guardStun > 0;
  if (stunned) c.guardStun--;
  if (!stunned && (!snap.buttons.guard.held || frame.input.hasBuffered('lightAttack'))) {
    c.releaseSawUp = !snap.buttons.guard.held;
    return 'guardRelease';
  }

  if (stunned) {
    // スタンの間は止まる（押し戻しは slide が担う）
    c.tmpVelocity.x = 0;
    c.tmpVelocity.y = 0;
    approachVelocity(
      c.velocity,
      c.tmpVelocity,
      MOVEMENT.run / (MOVEMENT.accelFrames / 60),
      MOVEMENT.run / (MOVEMENT.stopFrames / 60),
      dt,
    );
  } else {
    c.computeLocomotion(dt, snap, frame, 1, 'guard');
  }
  return null;
}

/**
 * 解除の硬直（8F）。ボタンを離してから再び押すと、構えをやり直さず即ガードへ復帰する（残りの硬直はスキップ）。
 * 硬直が終わったら、先行入力の通常攻撃（= ガード解除の 8F 後に出る攻撃）か、移動系へ。
 */
export function updateGuardRelease(
  c: PlayerCore,
  dt: number,
  snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  if (c.airborne) return 'fall';
  if (!snap.buttons.guard.held) c.releaseSawUp = true;
  if (
    snap.buttons.guard.held &&
    c.releaseSawUp &&
    c.stamina.canStart() &&
    !frame.input.hasBuffered('lightAttack')
  ) {
    c.guardResume = true;
    return 'guard';
  }
  if (c.stateFrame > c.guardParams.releaseFrames) {
    const attack = c.tryLightAttack(frame, 'light1');
    if (attack) return attack;
    return c.idleOrMove();
  }
  // 解除の硬直中は新しい動作ができない。歩行は続く（ガード中と同じ速度）。
  c.computeLocomotion(dt, snap, frame, 1, 'guard');
  return null;
}

/** ガード崩し: 54F の行動不能。終わったら移動・待機・落下へ。 */
export function updateGuardBreak(c: PlayerCore): PlayerStateId | null {
  c.halt();
  if (c.stateFrame > c.guardParams.breakFrames) {
    if (c.airborne) return 'fall';
    return c.idleOrMove();
  }
  return null;
}
