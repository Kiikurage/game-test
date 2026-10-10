import { registerDevHooks } from '../../devHooks';
import type { DeathPhase } from '../../core/gameEvents';
import type { DeathVisual } from './deathTimeline';
import { deathOf } from './death.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** 死亡演出の状態（E2E・撮影用）。`log` は発行済みの節目。 */
    death(): {
      active: boolean;
      frame: number;
      skipped: boolean;
      visual: DeathVisual;
      log: readonly { phase: DeathPhase; frame: number }[];
    };
  }
}

registerDevHooks('death', ({ game }) => ({
  death: () => {
    const d = deathOf(game);
    return {
      active: d.active,
      frame: d.frame,
      skipped: d.skipped,
      visual: d.visual,
      log: d.log,
    };
  },
}));
