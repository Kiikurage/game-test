import { registerDevHooks } from '../../devHooks';
import { itemsOf } from './item';

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
    placed: itemsOf(game).ids,
    picking: itemsOf(game).isPicking,
    flasks: { count: game.player.flask.count, max: game.player.flask.max },
    saved: game.save.get().items,
  }),
}));
