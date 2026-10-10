import { registerGameSystem } from '../systems';
import type { Game } from '../game';
import { HudModel } from './hudModel';

const models = new WeakMap<Game, HudModel>();

/** `game` の HUD 表示用状態（描画側が読む。戦闘 UI 以外では `setVisible(false)` でフェードアウト）。 */
export function hudModelOf(game: Game): HudModel {
  const model = models.get(game);
  if (!model) throw new Error('hud system is not registered for this game');
  return model;
}

registerGameSystem('hud', (game) => {
  const model = new HudModel({
    hp: game.playerTarget.health,
    stamina: game.player.stamina,
    flask: game.player.flask,
  });
  models.set(game, model);
  return {
    update: () => {
      model.step();
    },
  };
});
