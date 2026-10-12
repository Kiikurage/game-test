import { PLAYER_ACTIONS, PLUNGE } from '../../data';
import { findPlayerClipEvents } from '../../anim/playerClips';
import { wrapAngle, yawOf } from '../movement';
import type { PlayerCore, PlayerStateHandler } from '../playerCore';
import type { PlayerStateId } from '../playerStates';
import { updateFall, updateLand, updatePlunge, updatePlungeFall } from './air';
import { beginAmbush, updateAttack } from './attack';
import { updateBackstep, updateRoll } from './dodge';
import { updateGround, updateHeavyCharge } from './ground';
import { updateGuard, updateGuardBreak, updateGuardRelease } from './guard';
import { updateDrinking } from './heal';
import { updateDead, updateReaction, updateScripted } from './stagger';

export { applySuperArmor, endAmbush, updateAmbushReady } from './attack';
export { stampFootstepGait } from './dodge';
export { applyHealMarkers } from './heal';

const attack: PlayerStateHandler = (c, _dt, _snap, frame) => updateAttack(c, frame);
const reaction: PlayerStateHandler = (c) => updateReaction(c);
const scripted: PlayerStateHandler = (c, dt) => updateScripted(c, dt);

/** 状態ごとの更新ハンドラ。 */
export const PLAYER_STATE_HANDLERS: Readonly<Record<PlayerStateId, PlayerStateHandler>> = {
  idle: updateGround,
  move: updateGround,
  dash: updateGround,
  roll: updateRoll,
  backstep: updateBackstep,
  fall: updateFall,
  land: updateLand,
  plungeFall: updatePlungeFall,
  plunge: (c) => updatePlunge(c),
  light1: attack,
  light2: attack,
  light3: attack,
  heavy: attack,
  heavyCharged: attack,
  runAttack: attack,
  guardCounter: attack,
  backstab: attack,
  heavyCharge: updateHeavyCharge,
  heal: updateDrinking,
  healEmpty: updateDrinking,
  flinch: reaction,
  knockdown: reaction,
  guard: updateGuard,
  guardRelease: updateGuardRelease,
  guardBreak: (c) => updateGuardBreak(c),
  interact: scripted,
  sitDown: scripted,
  rest: scripted,
  standUp: scripted,
  dead: (c) => updateDead(c),
};

/** `next` へ遷移し、その状態の開始時の処理（スタミナ消費・イベント・コンボの記録など）を行う。 */
export function enterState(c: PlayerCore, next: PlayerStateId): void {
  c.fsm.transition(next);
  c.markers.begin(c.fsm.actionId ? findPlayerClipEvents(`player.${c.fsm.actionId}`) : undefined);
  switch (next) {
    case 'roll': {
      c.lastAttack = null;
      c.stamina.consume(PLAYER_ACTIONS.roll.staminaCost);
      // 入力方向（カメラ基準）へ。向きは以降の更新で素早く合わせる。
      c.dodgeDirYaw = yawOf(c.worldMove.x, c.worldMove.y);
      c.events.push({ type: 'rollStart' });
      break;
    }
    case 'backstep':
      c.lastAttack = null;
      c.stamina.consume(PLAYER_ACTIONS.backstep.staminaCost);
      c.dodgeDirYaw = wrapAngle(c.yaw + Math.PI);
      c.events.push({ type: 'backstepStart' });
      break;
    case 'fall':
      c.fallStartY = Math.max(c.lastGroundY, ...c.groundHistory);
      c.airBase.x = c.velocity.x;
      c.airBase.y = c.velocity.y;
      break;
    case 'plungeFall':
      // 入力時にスタミナ 20 を消費する。踏み出しの速度（airBase）と落下の始点はそのまま引き継ぐ
      c.lastAttack = null;
      c.stamina.consume(PLUNGE.staminaMin);
      break;
    case 'plunge':
      c.lastAttack = null;
      c.attackSerial++;
      c.events.push({ type: 'attackStart', id: next });
      break;
    case 'heal':
      c.lastAttack = null;
      // 消費は動作開始（F1）。F26 より前に仰け反ると HP は増えず、瓶だけ失われる。
      c.flask.use();
      c.events.push({ type: 'healStart' });
      break;
    case 'healEmpty':
      c.events.push({ type: 'healEmpty' });
      break;
    case 'light1':
    case 'light2':
    case 'light3': {
      const data = PLAYER_ACTIONS[next];
      c.stamina.consume(data.staminaCost);
      c.lastAttack = next;
      c.lastAttackStartStep = c.stepCount;
      c.attackSerial++;
      c.events.push({ type: 'attackStart', id: next });
      break;
    }
    case 'heavyCharge':
      // スタミナは溜め開始時に 28（溜めなしの値）を消費し、フル溜めに達した時点で差分（+6 = 計 34）を消費する。
      c.lastAttack = null;
      c.stamina.consume(PLAYER_ACTIONS.heavy.staminaCost);
      c.chargeExtraPaid = false;
      break;
    case 'heavy':
    case 'heavyCharged':
      // 消費は溜め開始時（`heavyCharge`）に済んでいる。ここは発生（F1）。
      c.lastAttack = null;
      c.attackSerial++;
      c.events.push({ type: 'attackStart', id: next });
      break;
    case 'runAttack':
      c.lastAttack = null;
      c.stamina.consume(PLAYER_ACTIONS.runAttack.staminaCost);
      c.attackSerial++;
      c.events.push({ type: 'attackStart', id: next });
      break;
    case 'backstab':
      c.lastAttack = null;
      c.stamina.consume(PLAYER_ACTIONS.backstab.staminaCost);
      c.attackSerial++;
      beginAmbush(c);
      c.events.push({ type: 'attackStart', id: next });
      break;
    case 'guardCounter':
      c.lastAttack = null;
      c.stamina.consume(PLAYER_ACTIONS.guardCounter.staminaCost);
      c.counterWindow.close();
      c.guardStun = 0;
      c.attackSerial++;
      c.events.push({ type: 'attackStart', id: next });
      break;
    case 'guard':
      c.lastAttack = null;
      c.guardStun = 0;
      c.guardAge = c.guardResume ? c.guardParams.justWindow.end : 0;
      if (!c.guardResume) c.counterWindow.close();
      c.guardResume = false;
      break;
    case 'guardRelease':
      c.guardStun = 0;
      break;
    default:
      break;
  }
}
