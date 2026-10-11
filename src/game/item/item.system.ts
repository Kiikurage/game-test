import { registerGameSystem } from '../systems';
import { itemsOf } from './item';

// アイテム取得（#67）。ロジックは item.ts。配置はレベルの `interactables`（kind: 'item'）。
registerGameSystem('item', (game) => {
  const items = itemsOf(game);
  return {
    update: () => {
      items.update();
    },
  };
});
