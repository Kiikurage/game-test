import { registerDevHooks } from '../../devHooks';
import { bossSystemOf } from '../../game/boss/boss.system';
import { arenaOf } from '../../game/world/arena';
import { arenaViewOf } from './arena.view';

declare module '../../devHooks' {
  interface DevHooks {
    /** 闘技場の情報（台座の篝火スロット・柱・ムードの重み・描画の統計）。闘技場がなければ null。 */
    arenaInfo(): {
      bonfireSlot: { x: number; y: number; z: number };
      pillars: number;
      pillarHits: number;
      moodWeight: number;
      triangles: number;
      meshes: number;
    } | null;
    /** 柱の破片の口を開く（デバッグ用。`bossPillarHit` と同じ経路）。 */
    arenaPillarHit(pillar: number): void;
    /**
     * 闘技場へ入る（霧の門側の入口の内側、中心を向いて立つ）。`boss: true` でボスを中央付近に待機で置く
     * （アリーナ・柱つき。確認・撮影用）。
     */
    arenaEnter(options?: { boss?: boolean }): void;
  }
}

registerDevHooks('arena', ({ game, view }) => {
  const level = view.levelView?.level;
  const def = level ? arenaOf(level) : null;
  const enter = (options: { boss?: boolean } = {}): void => {
    if (!def) return;
    // 入口の内側 6m、中心を向く。ボスは中心の北東寄りで入口の方を向く
    const dx = def.center.x - def.entry.x;
    const dz = def.center.z - def.entry.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = def.entry.x + (dx / len) * 5;
    const pz = def.entry.z + (dz / len) * 5;
    game.teleportPlayer(px, pz, Math.atan2(dx, dz));
    if (options.boss) {
      const bx = def.center.x + (dx / len) * 4;
      const bz = def.center.z + (dz / len) * 4;
      bossSystemOf(game).spawn({
        x: bx,
        z: bz,
        y: def.floorY,
        yaw: Math.atan2(-dx, -dz),
        engage: false,
        arena: def.circle,
        pillars: def.pillars,
      });
    }
  };
  // `?arena` で闘技場の入口から始める。`?arena=boss` はボスも置く（撮影・確認用）
  const param = new URLSearchParams(location.search).get('arena');
  if (param !== null && def) {
    enter({ boss: param === 'boss' });
  }
  return {
    arenaInfo: () => {
      const arena = arenaViewOf(game);
      if (!arena) return null;
      return {
        bonfireSlot: { ...arena.def.bonfireSlot },
        pillars: arena.def.pillars.length,
        pillarHits: arena.pillarHitCount,
        moodWeight: arena.moodWeight,
        triangles: arena.stats.triangles,
        meshes: arena.stats.meshes,
      };
    },
    arenaPillarHit: (pillar) => {
      // ボスの技が柱に触れたときと同じ `bossPillarHit` を発行する（イベント → 破片の口の経路ごと確認する）
      const p = def?.pillars[pillar];
      if (!def || !p) return;
      const dx = def.center.x - p.x;
      const dz = def.center.z - p.z;
      const len = Math.hypot(dx, dz) || 1;
      game.events.emit('bossPillarHit', {
        id: 'boss',
        pillar,
        position: {
          x: p.x + (dx / len) * p.radius,
          y: def.floorY + 1.5,
          z: p.z + (dz / len) * p.radius,
        },
        moveId: 'debug',
      });
    },
    arenaEnter: enter,
  };
});
