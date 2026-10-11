import { registerDevHooks } from '../../devHooks';
import { interactablesOf } from './interactable';

declare module '../../devHooks' {
  interface DevHooks {
    /** データ駆動のインタラクト対象の状態（E2E・撮影用）。 */
    interactables(): {
      ids: readonly string[];
      usable: readonly string[];
      looting: boolean;
      flags: readonly string[];
    };
  }
}

registerDevHooks('interactables', ({ game }) => ({
  interactables: () => ({
    ids: interactablesOf(game).ids,
    usable: interactablesOf(game).usableIds,
    looting: interactablesOf(game).isLooting,
    flags: game.save.get().flags,
  }),
}));
