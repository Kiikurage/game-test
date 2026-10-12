import { registerGameSystem } from '../systems';
import { HudModel } from './hudModel';

/** HUD 表示用状態（`game.systems.get(hudSystem)`。描画側が読む。戦闘 UI 以外では `setVisible(false)` でフェードアウト）。 */
export const hudSystem = registerGameSystem(
  'hud',
  (game) => {
    const model = new HudModel({
      hp: game.playerTarget.health,
      stamina: game.player.stamina,
      flask: game.player.flask,
    });
    return {
      state: model,
      update: () => {
        model.step();
      },
    };
  },
  // HP・瓶を戻しうるもの（死亡からの再開・拾得）より先に読む（変化は次のステップで映る）
  { before: ['death', 'interactable'] },
);
