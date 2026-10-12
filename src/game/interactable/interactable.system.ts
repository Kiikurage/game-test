import { IMPLEMENTED_KINDS, WORLD_INTERACTABLES } from '../data/world/interactables';
import { registerGameSystem } from '../systems';
import { InteractableController } from './interactable';

// データ駆動のインタラクト（#122 / #123）。レベルに配置（`interactables` の spawn）がある対象だけを、
// 配置データ（`data/world/interactables.ts`）の定義で登録する。壊せる壁は命中（`onImpact`）で HP が減る。
/** インタラクト対象の管理（`game.systems.get(interactableSystem)`）。 */
export const interactableSystem = registerGameSystem('interactable', (game) => {
  const controller = new InteractableController(game);
  const placed = new Set(game.interactableSpawns.map((s) => s.id));
  for (const def of WORLD_INTERACTABLES) {
    if (placed.has(def.id) && IMPLEMENTED_KINDS.has(def.kind)) controller.add(def);
  }
  return {
    state: controller,
    update: () => {
      controller.update();
    },
    onImpact: (e) => {
      controller.onHit(e.hit);
    },
  };
});
