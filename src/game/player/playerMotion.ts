import { Quaternion, Vector3 } from 'three';
import { PLAYER_ACTIONS } from '../data';
import { PLAYER_GROUPS } from '../world/groups';
import { turnToward, yawOf } from './movement';
import { CENTER_Y, DEG, type PlayerCore, type PlayerFrame } from './playerCore';
import {
  isAttackState,
  isGuardState,
  isReactionState,
  isScriptedState,
  type PlayerAttackId,
} from './playerStates';
import type { StaminaContext } from './stamina';
import type { GuardPresentation, PlayerAnimationState } from './playerTypes';

/** 向き・スタミナ・移動・描画用 Transform（状態ハンドラの後に毎ステップ行う処理）。 */

export function applyFacing(c: PlayerCore, frame: PlayerFrame, dt: number): void {
  if (c.state === 'roll') {
    c.yaw = turnToward(c.yaw, c.dodgeDirYaw, c.turnRate, c.turnResponse, dt);
    return;
  }
  if (
    c.state === 'backstep' ||
    c.state === 'guardBreak' ||
    c.state === 'dead' ||
    isReactionState(c.state)
  ) {
    return;
  }
  if (isScriptedState(c.state)) {
    // 状況アクション: 指定された向きへ（ロックオン・入力は無視）
    if (c.scriptedFaceYaw !== null) {
      c.yaw = turnToward(c.yaw, c.scriptedFaceYaw, c.turnRate, c.turnResponse, dt);
    }
    return;
  }
  if (isAttackState(c.state)) {
    applyAttackFacing(c, frame, dt);
    return;
  }

  let target: number | null = null;
  let rate = c.turnRate;
  let response = c.turnResponse;
  if (frame.lockTarget) {
    target = c.toTargetYaw;
    rate = c.tuning.player.lockOnTurnDegPerSecond * DEG;
    response = c.tuning.player.lockOnTurnResponse;
  } else if (c.moveMagnitude > 0.001 && c.state !== 'land') {
    target = yawOf(c.worldMove.x, c.worldMove.y);
  }
  if (target !== null) {
    c.yaw = turnToward(c.yaw, target, rate, response, dt);
  }
}

/**
 * 攻撃中の旋回: 発生の間（当たり窓が開くまで）だけ、ロックオン対象 / 入力方向へ素早く向きを合わせる。
 * 持続・硬直中は向き固定（振り抜く方向がぶれない。ロールで躱される余地にもなる）。
 */
function applyAttackFacing(c: PlayerCore, frame: PlayerFrame, dt: number): void {
  const id = c.state as PlayerAttackId;
  // 致命の一撃の向きは吸着（`updateAmbushSnap`）が決める。入力・ロックオンでは回さない
  if (id === 'backstab') return;
  if (c.stateFrame > PLAYER_ACTIONS[id].startup) return;
  let target: number | null = null;
  if (frame.lockTarget) target = c.toTargetYaw;
  else if (c.moveMagnitude > 0.001) target = yawOf(c.worldMove.x, c.worldMove.y);
  if (target === null) return;
  c.yaw = turnToward(
    c.yaw,
    target,
    c.tuning.player.attackTurnDegPerSecond * DEG,
    c.tuning.player.attackTurnResponse,
    dt,
  );
}

/** スタミナ回復に影響する行動。走り・ダッシュ中と強攻撃の溜め中は回復しない（歩き以下は回復する）。 */
export function staminaContext(c: PlayerCore): StaminaContext {
  const sprinting =
    c.dashing ||
    (c.state === 'move' && Math.hypot(c.velocity.x, c.velocity.y) > c.tuning.player.walk + 0.3);
  return { sprinting, guarding: c.state === 'guard', charging: c.state === 'heavyCharge' };
}

export function moveBody(c: PlayerCore, dt: number): void {
  const p = c.tuning.player;
  if (c.grounded) {
    // 接地中は下向きの移動量を与えない（与えるとオートステップが働かない）。地面への吸着は snapToGround が担う。
    c.verticalVelocity = 0;
  } else {
    c.verticalVelocity = Math.max(-45, c.verticalVelocity - p.gravity * dt);
  }

  c.controller.setOffset(p.controllerOffset);
  c.controller.computeColliderMovement(
    c.collider,
    {
      x: c.velocity.x * dt + c.slide.x,
      y: c.verticalVelocity * dt,
      z: c.velocity.y * dt + c.slide.z,
    },
    undefined,
    PLAYER_GROUPS,
  );
  const move = c.controller.computedMovement();
  c.position.x += move.x;
  c.position.y += move.y;
  c.position.z += move.z;

  // 実際に動けた速度（壁に押し付けても走りアニメが空回りしないよう、描画側はこちらを読む）
  if (dt > 0) {
    const k = 1 - Math.exp(-dt / 0.04);
    c.actualVelocity.x += (move.x / dt - c.actualVelocity.x) * k;
    c.actualVelocity.y += (move.z / dt - c.actualVelocity.y) * k;
  }

  const wasGrounded = c.grounded;
  c.grounded = c.controller.computedGrounded();
  if (c.grounded) {
    c.airFrames = 0;
    c.lastGroundY = c.position.y;
    c.groundHistory[c.groundHistoryIndex] = c.position.y;
    c.groundHistoryIndex = (c.groundHistoryIndex + 1) % c.groundHistory.length;
    if (!wasGrounded) c.verticalVelocity = 0;
  } else {
    c.airFrames++;
  }

  c.body.setNextKinematicTranslation({
    x: c.position.x,
    y: c.position.y + CENTER_Y,
    z: c.position.z,
  });
}

/** 歩行サイクルの位相を進める（移動系の状態だけ）。足の接地で `footstep` を発火する。 */
export function advanceGait(c: PlayerCore, dt: number): void {
  const locomoting =
    c.state === 'idle' || c.state === 'move' || c.state === 'dash' || isGuardState(c.state);
  if (!locomoting) {
    c.gait.lastDelta = 0;
    return;
  }
  const v = c.actualVelocity;
  const speed = Math.hypot(v.x, v.y);
  const sin = Math.sin(c.yaw);
  const cos = Math.cos(c.yaw);
  const localZ = sin * v.x + cos * v.y;
  const localX = -cos * v.x + sin * v.y;
  const reverse = c.lockedOn && localZ < -0.5 && Math.abs(localZ) > Math.abs(localX);
  c.gait.advance(speed, dt, { reverse, out: c.markerEvents });
}

/** アニメーション・デバッグ用の描画情報（`Player.animation`）。 */
export function animationState(c: PlayerCore): PlayerAnimationState {
  const v = c.actualVelocity;
  const speed = Math.hypot(v.x, v.y);
  const sin = Math.sin(c.yaw);
  const cos = Math.cos(c.yaw);
  return {
    state: c.state,
    kind: c.fsm.kind,
    actionId: c.fsm.actionId,
    totalFrames:
      c.state === 'land' ? c.landFrames : isScriptedState(c.state) ? c.scriptedFrames : 0,
    gaitPhase: c.gait.phase,
    gaitPhaseStep: c.gait.lastDelta,
    frozen: c.fsm.isFrozenStep,
    stateFrame: c.stateFrame,
    speed,
    localVelocity: {
      x: -cos * v.x + sin * v.y,
      z: sin * v.x + cos * v.y,
    },
    lockedOn: c.lockedOn,
    yaw: c.yaw,
    guard: guardPresentation(c),
  };
}

function guardPresentation(c: PlayerCore): GuardPresentation {
  const params = c.guardParams;
  if (c.state === 'guardRelease') return { phase: 'release', frame: c.stateFrame };
  if (c.state !== 'guard') return { phase: 'none', frame: 0 };
  if (c.guardStun > 0) {
    return { phase: 'hit', frame: params.stunFrames - c.guardStun + 1 };
  }
  return { phase: c.guardAge < params.raiseFrames ? 'raise' : 'hold', frame: c.guardAge };
}

const Y_AXIS = new Vector3(0, 1, 0);
const tmpQuat = new Quaternion();

/**
 * 描画用の Transform を更新する。段差を自動で乗り越えたときの足元の跳ね上がりは、
 * 見た目だけ短い時定数でならす（物理の位置・カメラの注視点は実位置のまま）。
 */
export function syncTransform(c: PlayerCore, dt = 0): void {
  const dy = c.position.y - c.visualY;
  if (dt > 0 && c.grounded && Math.abs(dy) < 0.6) {
    c.visualY += dy * (1 - Math.exp(-dt / 0.05));
  } else {
    c.visualY = c.position.y;
  }
  c.transform.position.set(c.position.x, c.visualY, c.position.z);
  c.transform.quaternion.copy(tmpQuat.setFromAxisAngle(Y_AXIS, c.yaw));
}
