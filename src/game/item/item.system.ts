import { registerGameSystem } from '../systems';
import { ItemController } from './item';

// アイテム取得（#67）。配置はレベルの `interactables`（kind: 'item'）。動作は `game/interactable`（#122）。
/** アイテム（`game.systems.get(itemSystem)`）。 */
export const itemSystem = registerGameSystem('item', (game) => ({
  state: new ItemController(game),
}));
