import { IMPLEMENTED_KINDS, WORLD_INTERACTABLES } from '../data/world/interactables';
import { registerGameSystem } from '../systems';
import { interactablesOf } from './interactable';

// データ駆動のインタラクト（#122）。レベルに配置（`interactables` の spawn）がある対象だけを、
// 配置データ（`data/world/interactables.ts`）の定義で登録する。実動作は read / loot のみ。
registerGameSystem('interactable', (game) => {
  const controller = interactablesOf(game);
  const placed = new Set(game.interactableSpawns.map((s) => s.id));
  for (const def of WORLD_INTERACTABLES) {
    if (placed.has(def.id) && IMPLEMENTED_KINDS.has(def.kind)) controller.add(def);
  }
  return {
    update: () => {
      controller.update();
    },
  };
});
