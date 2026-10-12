import { registerDevHooks } from '../../devHooks';
import type { Interactable } from '../data/world/types';
import { interactableSystem } from './interactable.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** データ駆動のインタラクト対象の状態（E2E・撮影用）。 */
    interactables(): {
      ids: readonly string[];
      usable: readonly string[];
      looting: boolean;
      flags: readonly string[];
    };
    /** 配置データにない対象をその場に登録する（テストシーン用のデバッグ配置。戻り値は登録済みか）。 */
    placeInteractable(def: Interactable): boolean;
    /** 壊せる壁の残り HP（壊れていれば 0。登録がなければ null）。 */
    wallHp(id: string): number | null;
    /** 床板が割れたか。 */
    hatchBroken(id: string): boolean;
  }
}

registerDevHooks('interactables', ({ game }) => ({
  interactables: () => ({
    ids: game.systems.get(interactableSystem).ids,
    usable: game.systems.get(interactableSystem).usableIds,
    looting: game.systems.get(interactableSystem).isLooting,
    flags: game.save.get().flags,
  }),
  placeInteractable: (def) => {
    const c = game.systems.get(interactableSystem);
    if (c.ids.includes(def.id)) return false;
    c.add(def);
    return true;
  },
  wallHp: (id) => game.systems.get(interactableSystem).wallHp(id) ?? null,
  hatchBroken: (id) => game.systems.get(interactableSystem).isHatchBroken(id),
}));
