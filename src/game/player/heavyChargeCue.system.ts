import { PLAYER_ACTIONS } from '../data';
import { registerGameSystem } from '../systems';

/** 強攻撃がフル溜めに達した瞬間の SE の cue（#200）。素材は SE パイプラインで接続する（未登録の cue は無音で捨てられる）。 */
export const HEAVY_CHARGE_FULL_CUE = 'sfx.player-heavy-charge-full';

/** フル溜めに達する溜めのステップ数（この値で離すと `heavyCharged`）。 */
const FULL_CHARGE_FRAMES = PLAYER_ACTIONS.heavyCharged.chargeFrames;

/**
 * 強攻撃の溜めがフル（30F）に達したステップで、`sound` イベントを 1 回だけ出す。
 * 29F では出ず、溜めを途中でやめた（ロールなどでキャンセルした）場合も出ない。
 * 描画側のフラッシュ（`render/player/heavyChargeGlow`）は同じフレーム数（`player.chargeFrames`）を見て切り替わる。
 */
registerGameSystem('heavy-charge-cue', (game) => {
  let fired = false;
  return {
    update() {
      const player = game.player;
      if (player.state !== 'heavyCharge') {
        fired = false;
        return;
      }
      if (fired || player.chargeFrames < FULL_CHARGE_FRAMES) return;
      fired = true;
      const feet = player.feet;
      game.events.emit('sound', {
        cue: HEAVY_CHARGE_FULL_CUE,
        source: 'player',
        position: { x: feet.x, y: feet.y + 1.2, z: feet.z },
      });
    },
  };
});
