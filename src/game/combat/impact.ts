import type { ImpactEvent } from '../systems';
import type { TimeScale } from '../timeScale';
import { decideHitStop, type HitStopConfig } from './hitStop';
import type { HitEvent } from './hitResolver';
import type { ReactorRegistry } from './reactorRegistry';

/**
 * 命中からヒットストップを決め、攻撃側・被弾側を同時に凍結する（4.1 節）。撃破スローも始め、
 * 演出・SE 用の `impact` を組み立てて返す。凍結は次のステップから効く（同じステップの SE は 0F 遅延）。
 */
export function applyHitStop(
  e: HitEvent,
  guardBroken: boolean,
  registry: ReactorRegistry,
  timeScale: TimeScale,
  config: HitStopConfig,
): ImpactEvent {
  const attackerIsPlayer = e.attackerId === 'player';
  const targetIsPlayer = e.targetId === 'player';
  const decision = decideHitStop(
    {
      event: e,
      attackerIsPlayer,
      targetIsPlayer,
      attackerIsBoss: registry.bossIds.has(e.attackerId),
      targetIsBoss: registry.bossIds.has(e.targetId),
    },
    config,
  );
  if (decision.frames > 0) {
    registry.freeze(e.attackerId, decision.frames);
    if (e.targetId !== e.attackerId) registry.freeze(e.targetId, decision.frames);
  }
  if (decision.slowMotion) {
    // ヒットストップが明けてから、シミュレーションの 30F（ボスは 60F）の間スロー
    timeScale.start(decision.slowMotion.scale, decision.slowMotion.frames, decision.frames);
  }

  // 飛び散る向き: 攻撃側 → 被弾側の水平方向 + わずかに上
  let nx = e.position.x - e.attackerPosition.x;
  let nz = e.position.z - e.attackerPosition.z;
  const len = Math.hypot(nx, nz);
  if (len > 1e-6) {
    nx /= len;
    nz /= len;
  } else {
    nx = 0;
    nz = 1;
  }
  const ny = 0.3;
  const nl = Math.hypot(nx, ny, nz);
  return {
    hit: e,
    attackerId: e.attackerId,
    targetId: e.targetId,
    attackId: e.attackId,
    kind: e.kind,
    guard: e.guard,
    guardBroken,
    source: attackerIsPlayer ? 'player' : 'enemy',
    frames: decision.frames,
    position: e.position,
    normal: { x: nx / nl, y: ny / nl, z: nz / nl },
    killed: e.killed,
    fromPlayer: attackerIsPlayer,
    toPlayer: targetIsPlayer,
    flash: decision.flash?.kind ?? null,
    flashFrames: decision.flash?.frames ?? 0,
    slowMotion: decision.slowMotion,
  };
}
