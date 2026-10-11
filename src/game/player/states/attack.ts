import { AMBUSH, PLAYER_ACTIONS, inWindow, totalFrames } from '../../data';
import { wrapAngle, yawOf } from '../movement';
import { snapDelta, snapGoal, snapProgress } from '../ambush';
import { NEXT_LIGHT, type PlayerCore, type PlayerFrame } from '../playerCore';
import {
  isHeavyAttackState,
  isLightAttackState,
  type PlayerAttackId,
  type PlayerStateId,
} from '../playerStates';

/**
 * 軽攻撃の前進量の配分（フレームごとの移動距離 m）。発生 + 持続の間に、中ほどを厚く（踏み込み）、
 * 振り終わり（硬直）では止まる。合計が仕様の前進量（0.5 / 0.5 / 1.0 m）になる。
 */
function attackLungeProfile(id: PlayerAttackId): number[] {
  const a = PLAYER_ACTIONS[id];
  const n = a.startup + a.active;
  const w: number[] = [];
  for (let f = 1; f <= n; f++) w.push(Math.sin((Math.PI * (f - 0.5)) / n) ** 1.5);
  const sum = w.reduce((x, y) => x + y, 0);
  return w.map((x) => (x / sum) * a.moveDistance);
}
const LUNGE: Readonly<Record<PlayerAttackId, readonly number[]>> = {
  light1: attackLungeProfile('light1'),
  light2: attackLungeProfile('light2'),
  light3: attackLungeProfile('light3'),
  heavy: attackLungeProfile('heavy'),
  heavyCharged: attackLungeProfile('heavyCharged'),
  runAttack: attackLungeProfile('runAttack'),
  // 致命の一撃は前進ではなく吸着（`updateAmbushSnap`）で動く。この表は使わない
  backstab: [],
  guardCounter: attackLungeProfile('guardCounter'),
  plunge: attackLungeProfile('plunge'),
};

/**
 * 攻撃（軽・強・走り・ガードカウンター・致命）。前進（発生 + 持続の間）・キャンセル（ロール / 次段）・終了。
 * 動作の全体（発生 + 持続 + 硬直）が終わった次のステップで移動系へ戻り、そのステップから入力を受け付ける。
 */
export function updateAttack(c: PlayerCore, frame: PlayerFrame): PlayerStateId | null {
  const id = c.state as PlayerAttackId;
  const f = c.stateFrame;
  const data = PLAYER_ACTIONS[id];

  // 前進: 向いている方向へ、モーションの踏み込み量だけ（硬直中は止まる）。致命の一撃は吸着
  if (id === 'backstab') {
    updateAmbushSnap(c, 1 / 60);
  } else {
    const dist = LUNGE[id][f - 1] ?? 0;
    c.velocity.x = Math.sin(c.yaw) * dist * 60;
    c.velocity.y = Math.cos(c.yaw) * dist * 60;
  }

  // キャンセル: ロール / バックステップ（持続終了の 2F 後〜）、次段の軽攻撃（持続終了 + 4F 〜 全体 + 12F）
  if (c.fsm.canCancelTo('dodge')) {
    const dodge = c.tryDodge(frame);
    if (dodge) return dodge;
  }
  const next = isLightAttackState(id) ? NEXT_LIGHT[id] : null;
  if (next && c.fsm.canCancelTo('lightAttack')) {
    const chain = c.tryLightAttack(frame, next);
    if (chain) return chain;
  }
  // 軽攻撃の窓から強攻撃へ（軽 1 → 強、軽 2 → 強、軽 3 の後も可）
  if (isLightAttackState(id) && c.fsm.canCancelTo('heavyAttack')) {
    const heavy = c.tryHeavyAttack(frame);
    if (heavy) return heavy;
  }
  // ガード: 持続終了の 6F 後から（軽攻撃のキャンセル窓）
  if (c.fsm.canCancelTo('guard')) {
    const guard = c.tryGuard(frame, frame.input.snapshot);
    if (guard) return guard;
  }

  if (f > totalFrames(data)) return c.afterAttackState();
  return null;
}

/**
 * 強攻撃のスーパーアーマー（2.3 節）: 発生 F6 から持続終了まで、強靭度に `poiseBonus`（+40）を加える。
 * 窓の頭で 1 回 `grant`、窓を出たら（状態が変わって被弾で崩れた場合も含め）`clearBonus`。
 * 加算分は被弾で先に削られるので、崩れない限り仰け反らない（`HitReactor`）。
 */
export function applySuperArmor(c: PlayerCore): void {
  const state = c.state;
  const armor = isHeavyAttackState(state) ? PLAYER_ACTIONS[state].superArmor : undefined;
  const wanted = armor !== undefined && inWindow(c.stateFrame, armor);
  if (wanted && !c.armorActive) {
    c.reactor.poise.grant(armor.poiseBonus);
    c.armorActive = true;
  } else if (!wanted && c.armorActive) {
    c.reactor.poise.clearBonus();
    c.armorActive = false;
  }
}

// ---- 致命の一撃（#115）----

/** 致命の一撃の発動（F1）: 対象を拘束し、吸着の始点・向きを決める。 */
export function beginAmbush(c: PlayerCore): void {
  const target = c.pendingAmbush;
  c.pendingAmbush = null;
  c.ambushTarget = target;
  if (!target) return;
  c.ambushSource?.begin(target);
  c.snapStart.x = c.position.x;
  c.snapStart.z = c.position.z;
  snapGoal(target.position, target.yaw, c.snapOffset);
  snapDelta(c.snapStart, c.snapOffset, c.snapOffset);
  // 吸着後に対象の背中を向く
  const goalX = c.snapStart.x + c.snapOffset.x;
  const goalZ = c.snapStart.z + c.snapOffset.z;
  c.snapYawStart = c.yaw;
  c.snapYawDelta = wrapAngle(yawOf(target.position.x - goalX, target.position.z - goalZ) - c.yaw);
}

export function endAmbush(c: PlayerCore): void {
  const target = c.ambushTarget;
  c.ambushTarget = null;
  if (target) c.ambushSource?.end(target);
}

/** 条件が成立している間だけ true（地上で動作可能なとき）。剣の縁の光に使う。 */
export function updateAmbushReady(c: PlayerCore): void {
  const s = c.state;
  c.ambushReady =
    c.ambushSource !== null &&
    (s === 'idle' || s === 'move' || s === 'dash') &&
    c.stamina.canStart(PLAYER_ACTIONS.backstab.staminaCost) &&
    c.ambushSource.find(c.position) !== null;
}

/**
 * 吸着: 動作の最初の 6F で、対象の背後 0.9m へ（最大 1.2m の補正）寄り、対象の背中を向く。
 * 毎ステップ「進み具合に対応する位置」との差分を速度にして、壁・地形には衝突判定が従う。
 */
function updateAmbushSnap(c: PlayerCore, dt: number): void {
  const f = c.stateFrame;
  c.velocity.x = 0;
  c.velocity.y = 0;
  if (!c.ambushTarget || f > AMBUSH.snapFrames) return;
  const k = snapProgress(f);
  const wantX = c.snapStart.x + c.snapOffset.x * k;
  const wantZ = c.snapStart.z + c.snapOffset.z * k;
  c.velocity.x = (wantX - c.position.x) / dt;
  c.velocity.y = (wantZ - c.position.z) / dt;
  c.yaw = wrapAngle(c.snapYawStart + c.snapYawDelta * k);
}
