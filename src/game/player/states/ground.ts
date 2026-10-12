import type { InputSnapshot } from '../../../core/input';
import {
  HEAVY_CHARGE_MOVE_SPEED,
  HEAVY_FULL_CHARGE_STAMINA_EXTRA,
  PLAYER_ACTIONS,
} from '../../data';
import type { PlayerCore, PlayerFrame } from '../playerCore';
import type { PlayerStateId } from '../playerStates';

/** 強攻撃の溜めの最大（フレーム）。ボタンをこの長さ以上保持して離すとフル溜め（`heavyCharged`）。 */
const HEAVY_CHARGE_FRAMES = PLAYER_ACTIONS.heavyCharged.chargeFrames;

/** idle / move / dash 共通。 */
export function updateGround(
  c: PlayerCore,
  dt: number,
  snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  if (c.airborne) return 'fall';

  // 回避（先行入力を含む）。ボタンを離した瞬間に確定した入力が対象。スタミナ 0 では開始できない。
  const dodge = c.tryDodge(frame);
  if (dodge) return dodge;

  // 軽攻撃（先行入力を含む）。コンボ窓が残っていれば次段、なければ（走り中なら走り攻撃、でなければ）軽 1。
  const attack = c.tryLightAttack(frame, c.groundLightAttack());
  if (attack) return attack;

  // 強攻撃（溜め開始。ボタンを離した時点で発生へ）
  const heavy = c.tryHeavyAttack(frame);
  if (heavy) return heavy;

  // ガード（保持入力。行動不能中に押していても、動作可能になった瞬間に構える）
  const guard = c.tryGuard(frame, snap);
  if (guard) return guard;

  const heal = c.tryHeal(frame);
  if (heal) return heal;

  c.computeLocomotion(dt, snap, frame, 1);
  return null;
}

/**
 * 強攻撃の溜め: ボタンを保持している間、歩き 1.0 m/s で動ける。離した時点で発生へ（保持したフレーム数が
 * 30 未満なら溜めなし `heavy`、30 以上ならフル溜め `heavyCharged`）。フル溜めに達した時点でスタミナの差分を消費する。
 * 溜め中もロール/バックステップで抜けられる（溜めはまだ攻撃の動作ではないため）。
 */
export function updateHeavyCharge(
  c: PlayerCore,
  dt: number,
  snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  if (c.airborne) return 'fall';
  const dodge = c.tryDodge(frame);
  if (dodge) return dodge;
  // F1 = 入力のステップ。ボタンを保持したステップ数 = stateFrame − 1（離した時点のステップは数えない）
  if (!snap.buttons.heavyAttack.held) {
    return c.stateFrame - 1 >= HEAVY_CHARGE_FRAMES ? 'heavyCharged' : 'heavy';
  }
  if (c.stateFrame >= HEAVY_CHARGE_FRAMES && !c.chargeExtraPaid) {
    c.chargeExtraPaid = true;
    c.stamina.consume(HEAVY_FULL_CHARGE_STAMINA_EXTRA);
  }
  c.driftVelocity(dt, HEAVY_CHARGE_MOVE_SPEED);
  return null;
}
