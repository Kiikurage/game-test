import type { InputSnapshot } from '../../../core/input';
import { PLAYER_ACTIONS, totalFrames } from '../../data';
import type { PlayerCore, PlayerFrame } from '../playerCore';
import type { PlayerStateId } from '../playerStates';

/**
 * 回復（54F）/ 空振り（20F）。移動 1.0 m/s・向きは通常どおり。回復は F30 からロール、F36 から攻撃へ
 * キャンセル可（F1–F25 はロール・攻撃・ガードへ不可）。F36 からはガードへもキャンセル可。
 */
export function updateDrinking(
  c: PlayerCore,
  dt: number,
  _snap: InputSnapshot,
  frame: PlayerFrame,
): PlayerStateId | null {
  const id = c.state as 'heal' | 'healEmpty';
  if (c.fsm.canCancelTo('dodge')) {
    const dodge = c.tryDodge(frame);
    if (dodge) return dodge;
  }
  if (c.fsm.canCancelTo('lightAttack')) {
    const attack = c.tryLightAttack(frame, 'light1');
    if (attack) return attack;
  }
  if (c.fsm.canCancelTo('heavyAttack')) {
    const heavy = c.tryHeavyAttack(frame);
    if (heavy) return heavy;
  }
  // F36 からガードへキャンセル可（ボタン保持）
  if (c.fsm.canCancelTo('guard')) {
    const guard = c.tryGuard(frame, frame.input.snapshot);
    if (guard) return guard;
  }
  if (c.stateFrame > totalFrames(PLAYER_ACTIONS[id])) return c.afterAttackState();
  c.driftVelocity(dt);
  return null;
}

/** `healApply` マーカー（F26）で HP を加算する。最大 HP でクランプ。 */
export function applyHealMarkers(c: PlayerCore): void {
  for (const e of c.markerEvents) {
    if (e.type !== 'healApply' || e.actionId !== 'player.heal') continue;
    const before = c.health.current;
    c.health.heal(PLAYER_ACTIONS.heal.healAmount);
    c.events.push({ type: 'healApply', amount: c.health.current - before });
  }
}
