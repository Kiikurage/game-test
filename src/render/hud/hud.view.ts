// HUD（DOM）を描画ループにつなぐビュープラグイン。HUD の見た目は `src/ui/hud/`、状態の計算は `src/game/hud/`。
// プラグイン登録口が `src/render/**/*.view.ts` のため、ここが game と ui の橋渡しになる（game は ui を知らない）。
import { hudModelOf } from '../../game/hud/hud.system';
import { applySafeAreaOverride, installUiScale } from '../../ui/scale';
import { mountHud } from '../../ui/hud/hud';
import { registerViewPlugin } from '../viewPlugins';

registerViewPlugin('hud', ({ game }) => {
  applySafeAreaOverride(location.search);
  installUiScale();
  const hud = mountHud(hudModelOf(game));
  return {
    update: () => {
      hud.update();
    },
  };
});
