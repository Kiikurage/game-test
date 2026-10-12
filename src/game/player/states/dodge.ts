import type { InputSnapshot } from '../../../core/input';
import { PLAYER_ACTIONS, totalFrames } from '../../data';
import { PLAYER_CONTROL } from '../../data/playerControl';
import { dashProfile } from '../movement';
import { DEG, type PlayerCore, type PlayerFrame } from '../playerCore';
import { isDodgeState, type PlayerStateId } from '../playerStates';

const ROLL_PROFILE = dashProfile(
  PLAYER_ACTIONS.roll.moveDistance,
  PLAYER_ACTIONS.roll.startup + PLAYER_ACTIONS.roll.recovery,
  PLAYER_CONTROL.dodge.rollProfile,
);
const BACKSTEP_PROFILE = dashProfile(
  PLAYER_ACTIONS.backstep.moveDistance,
  PLAYER_ACTIONS.backstep.startup + PLAYER_ACTIONS.backstep.recovery,
  PLAYER_CONTROL.dodge.backstepProfile,
);
const ROLL_FRAMES = ROLL_PROFILE.length;
const BACKSTEP_FRAMES = BACKSTEP_PROFILE.length;
const ROLL_MOVE_CANCEL =
  PLAYER_ACTIONS.roll.cancels.find((c: { to: string }) => c.to === 'move')?.start ??
  totalFrames(PLAYER_ACTIONS.roll);

export function updateRoll(
  c: PlayerCore,
  _dt: number,
  snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  const f = c.stateFrame;
  // 向きは入力方向へ素早く合わせる（ロックオン中も、終了後に対象方向へ戻す）
  c.turnRate = c.tuning.player.rollTurnDegPerSecond * DEG;
  c.turnResponse = PLAYER_CONTROL.dodge.turnResponse;

  const dist = ROLL_PROFILE[f - 1] ?? 0;
  c.velocity.x = Math.sin(c.dodgeDirYaw) * dist * 60;
  c.velocity.y = Math.cos(c.dodgeDirYaw) * dist * 60;

  // F26 から攻撃へキャンセル可（先行入力あり）。
  if (c.fsm.canCancelTo('lightAttack')) {
    const attack = c.tryLightAttack(frame, 'light1');
    if (attack) return attack;
  }
  if (c.fsm.canCancelTo('heavyAttack')) {
    const heavy = c.tryHeavyAttack(frame);
    if (heavy) return heavy;
  }

  // F26 からガードへキャンセル可（ボタン保持）
  if (c.fsm.canCancelTo('guard')) {
    const guard = c.tryGuard(frame, snap);
    if (guard) return guard;
  }
  // F26 から回復へキャンセル可（先行入力 6F）。
  if (c.fsm.canCancelTo('heal')) {
    const heal = c.tryHeal(frame);
    if (heal) return heal;
  }

  // F26 から移動へキャンセル可（移動入力があるとき）。入力がなければ F32 まで硬直。
  if (f > ROLL_FRAMES || (f >= ROLL_MOVE_CANCEL && c.moveMagnitude > 0.001)) {
    return afterDodgeState(c, snap);
  }
  return null;
}

export function updateBackstep(
  c: PlayerCore,
  _dt: number,
  _snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  const f = c.stateFrame;
  const dist = BACKSTEP_PROFILE[f - 1] ?? 0;
  c.velocity.x = Math.sin(c.dodgeDirYaw) * dist * 60;
  c.velocity.y = Math.cos(c.dodgeDirYaw) * dist * 60;
  // 向きは変えない（ロックオン中は対象を向いたまま）
  c.turnRate = 0;
  // F18 から攻撃へキャンセル可（先行入力あり）
  if (c.fsm.canCancelTo('lightAttack')) {
    const attack = c.tryLightAttack(frame, 'light1');
    if (attack) return attack;
  }
  if (c.fsm.canCancelTo('heavyAttack')) {
    const heavy = c.tryHeavyAttack(frame);
    if (heavy) return heavy;
  }
  if (f > BACKSTEP_FRAMES) return c.idleOrMove();
  return null;
}

/** ロール終了・キャンセル時の遷移先。ボタンが押されていればダッシュへ（2.3 節）。 */
function afterDodgeState(c: PlayerCore, snap: InputSnapshot): PlayerStateId {
  if (c.airborne) return 'fall';
  if (snap.buttons.dodge.held && c.moveMagnitude > 0.1) c.dashLatch = true;
  return c.moveMagnitude > 0 ? (c.dashLatch ? 'dash' : 'move') : 'idle';
}

/** ロール・バックステップの足音は歩様 `roll`（それ以外はマーカーを書いた側の歩様 = 走り）。 */
export function stampFootstepGait(c: PlayerCore): void {
  if (!isDodgeState(c.state)) return;
  const events = c.markerEvents;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e && e.type === 'footstep' && e.gait === undefined) {
      events[i] = { ...e, gait: 'roll' };
    }
  }
}
