import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import { BossBarModel } from './bossBarModel';

const models = new WeakMap<Game, BossBarModel>();

/** `game` のボス HP バーの表示用状態（描画側が読む）。 */
export function bossBarModelOf(game: Game): BossBarModel {
  const model = models.get(game);
  if (!model) throw new Error('boss bar system is not registered for this game');
  return model;
}

registerGameSystem('bossBar', (game) => {
  const model = new BossBarModel();
  model.attach(game.events);
  models.set(game, model);
  return {
    update: () => {
      model.step();
    },
  };
});
