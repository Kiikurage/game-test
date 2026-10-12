import { registerGameSystem } from '../systems';
import { BossBarModel } from './bossBarModel';

/** ボス HP バーの表示用状態（`game.systems.get(bossBarSystem)`。描画側が読む）。 */
export const bossBarSystem = registerGameSystem('bossBar', (game) => {
  const model = new BossBarModel();
  model.attach(game.events);
  return {
    state: model,
    update: () => {
      model.step();
    },
  };
});
