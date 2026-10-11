import { registerGameSystem } from '../systems';
import { itemsOf } from './item';

// アイテム取得（#67）。配置はレベルの `interactables`（kind: 'item'）。動作は `game/interactable`（#122）。
registerGameSystem('item', (game) => {
  itemsOf(game);
  return {};
});
