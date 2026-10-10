import { hudModelOf } from '../hud/hud.system';
import { isSeatedState } from '../player/playerStates';
import { registerGameSystem } from '../systems';
import { bonfiresOf } from './bonfire';

// 篝火（点火・休憩・リスポーン）。ロジックは bonfire.ts。篝火の登録はインタラクション基盤（interaction/）へ。
// 休憩中（座り込み・保持・立ち上がり。リスポーン含む）は HUD をフェードアウトする（9 章）。
registerGameSystem('bonfire', (game) => {
  const bonfires = bonfiresOf(game);
  return {
    update: () => {
      bonfires.update();
      hudModelOf(game).setVisible(!isSeatedState(game.player.state));
    },
  };
});
