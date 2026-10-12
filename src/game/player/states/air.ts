import type { InputSnapshot } from '../../../core/input';
import { PLAYER_ACTIONS, PLUNGE, totalFrames } from '../../data';
import { canStartPlunge, plungeMultiplier } from '../plunge';
import type { PlayerCore, PlayerFrame } from '../playerCore';
import type { PlayerStateId } from '../playerStates';

export function updateFall(
  c: PlayerCore,
  dt: number,
  snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  if (c.grounded) return c.landed(c.fallStartY - c.position.y);
  const plunge = tryPlunge(c, frame);
  if (plunge) return plunge;
  if (c.fallStartY - c.position.y < PLUNGE.freeSteerDrop) {
    // 階段の段差・縁の出っ張りなどの小さな落ち込みは、地上と同じように操作できる（粘らない）。
    // 速度を引き継ぎ点とし、本格的な落下になってから「踏み出しの速度 ± 1.5 m/s」に切り替わる
    c.computeLocomotion(dt, snap, frame, 1, 'air');
    c.airBase.x = c.velocity.x;
    c.airBase.y = c.velocity.y;
    return null;
  }
  c.driveAir(dt, frame);
  return null;
}

/**
 * 落下中の攻撃入力（軽・強どちらも）で落下攻撃に入れるか（14.3.3 節）。地面から 0.6m 以上離れて下降中・有効な落下高さ
 * 1.0〜3.0m・スタミナ 20 以上・下に敵がいること。満たさないときは入力を残す（着地後の先行入力として通常の攻撃になる）。
 */
function tryPlunge(c: PlayerCore, frame: PlayerFrame): 'plungeFall' | null {
  const light = frame.input.hasBuffered('lightAttack');
  const heavy = frame.input.hasBuffered('heavyAttack');
  if (!light && !heavy) return null;
  const clearance = c.groundClearanceProbe(c.position.x, c.position.y, c.position.z);
  const height = c.fallStartY - (c.position.y - (clearance ?? 0));
  if (
    !canStartPlunge({
      stamina: c.stamina.current,
      clearance,
      height,
      descending: c.verticalVelocity < 0,
    })
  ) {
    return null;
  }
  if (c.plungeTargetNear && !c.plungeTargetNear(c.position.x, c.position.z, PLUNGE.targetReach)) {
    return null;
  }
  frame.input.consumeBuffered('lightAttack');
  frame.input.consumeBuffered('heavyAttack');
  return 'plungeFall';
}

/** 落下攻撃の空中: 振りかぶりを保持して落ちる。着地の高さが有効なら `plunge`、そうでなければ通常の着地。 */
export function updatePlungeFall(
  c: PlayerCore,
  dt: number,
  _snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  if (c.grounded) {
    const height = c.fallStartY - c.position.y;
    const multiplier = plungeMultiplier(height);
    if (multiplier === null) return c.landed(height);
    c.plungeMult = multiplier;
    c.events.push({ type: 'land', fallHeight: height });
    return 'plunge';
  }
  c.driveAir(dt, frame);
  return null;
}

/** 落下攻撃の着地: 判定 4F（円）+ 硬直 24F。動けず、ロールもできない。 */
export function updatePlunge(c: PlayerCore): PlayerStateId | null {
  c.halt();
  if (c.airborne) return 'fall';
  if (c.stateFrame > totalFrames(PLAYER_ACTIONS.plunge)) return c.afterAttackState();
  return null;
}

export function updateLand(
  c: PlayerCore,
  dt: number,
  snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  if (c.airborne) return 'fall';
  // 着地の途中からロールで抜けられる
  if (c.stateFrame >= 4) {
    const dodge = c.tryDodge(frame);
    if (dodge) return dodge;
  }
  if (c.stateFrame > c.landFrames) return c.idleOrMove();
  c.computeLocomotion(dt, snap, frame, c.tuning.player.landSpeedFactor, 'land');
  return null;
}
