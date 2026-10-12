import type { EventBus, GameEventMap } from '../core/gameEvents';
import type { HitEvent, HitReaction } from './combat';
import { applyHitStop } from './combat/impact';
import type { ReactorRegistry } from './combat/reactorRegistry';
import type { EnemyRoster } from './enemy/enemyRoster';
import type { Player } from './player/player';
import type { GameSystems } from './systems';
import type { TimeScale } from './timeScale';
import type { Tuning } from './tuning';

/** 命中 1 回の処理に使う Game の部品。 */
export interface HitContext {
  readonly player: Player;
  readonly registry: ReactorRegistry;
  readonly roster: EnemyRoster;
  readonly events: EventBus<GameEventMap>;
  readonly timeScale: TimeScale;
  readonly tuning: Tuning;
  /** 登録式のシステム（Game の組み立ての最後に揃うので毎回読む）。 */
  readonly systems: Pick<GameSystems, 'impact'>;
}

/**
 * 命中 1 回の処理（`HitResolver.onHit` から呼ぶ）: 被弾リアクション → 敵 AI への反映 → 死亡 →
 * ヒットストップと `impact`（#307）。
 */
export function handleHit(ctx: HitContext, e: HitEvent): void {
  const { player } = ctx;
  const guardBreaks = player.guardBreakCount;
  const reaction = applyReaction(ctx, e);
  if (reaction) ctx.roster.react(e.targetId, reaction, e);
  // ガードを崩された（ガード中にスタミナが 0 になった）: 崩しの SE を重ねる
  const guardBroken = e.targetId === 'player' && player.guardBreakCount > guardBreaks;
  if (e.targetId === 'player' && e.killed) player.die();
  // 命中 1 回につき 1 つの `impact`（SE・聴覚・FX・カメラ・システムはこれだけを見る。#307）
  const impact = applyHitStop(e, guardBroken, ctx.registry, ctx.timeScale, ctx.tuning.hitStop);
  ctx.events.emit('impact', impact);
  ctx.systems.impact(impact);
}

/** 命中を被弾側の強靭度・押し戻し・仰け反りへ反映し、`hitReaction` を発行する。 */
function applyReaction(ctx: HitContext, e: HitEvent): HitReaction | undefined {
  // 押し戻しの向き: 攻撃側の原点 → 命中位置
  const dx = e.position.x - e.attackerPosition.x;
  const dz = e.position.z - e.attackerPosition.z;
  const reaction =
    e.targetId === 'player' ? ctx.player.receiveHit(e, dx, dz) : ctx.registry.react(e, dx, dz);
  if (!reaction) return undefined;
  ctx.events.emit('hitReaction', { targetId: e.targetId, ...reaction });
  return reaction;
}
