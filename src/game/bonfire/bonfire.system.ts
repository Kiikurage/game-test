import { registerGameSystem } from '../systems';
import { bonfiresOf } from './bonfire';

// 篝火（点火・休憩・リスポーン）。ロジックは bonfire.ts。篝火の登録はインタラクション基盤（interaction/）へ。
registerGameSystem('bonfire', (game) => {
  const bonfires = bonfiresOf(game);
  return {
    update: () => {
      bonfires.update();
    },
  };
});
