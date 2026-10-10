import { registerGameSystem } from '../systems';
import { interactionOf } from './interaction';

// 毎ステップ、最寄りの調べる対象を選んで状況アクション（`game.events` の `interactPrompt`）を公開し、
// 入力（`interact` ボタン。キーボード E / パッド A / タッチ「調査」）で実行する。
registerGameSystem('interaction', (game) => {
  const manager = interactionOf(game);
  manager.onPromptChange((prompt) => {
    game.events.emit('interactPrompt', { prompt });
  });
  return {
    update: () => {
      const { player } = game;
      manager.step({
        x: player.feet.x,
        z: player.feet.z,
        canAct: player.canInteract && !player.dead,
        pressed: game.inputSnapshot.buttons.interact.pressed,
      });
    },
  };
});
