import { registerDevHooks } from '../../devHooks';
import { itemSystem } from './item.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** アイテム取得の状態（E2E・撮影用）。 */
    items(): {
      placed: readonly string[];
      picking: boolean;
      flasks: { count: number; max: number };
      saved: Readonly<Record<string, number>>;
    };
  }
}

registerDevHooks('items', ({ game }) => ({
  items: () => ({
    placed: game.systems.get(itemSystem).ids,
    picking: game.systems.get(itemSystem).isPicking,
    flasks: { count: game.player.flask.count, max: game.player.flask.max },
    saved: game.save.get().items,
  }),
}));
