// テキストパネル（DOM）を描画ループにつなぐビュープラグイン。状態は `src/game/text/`、見た目は `src/ui/hud/textPanel.ts`。
import { mountTextPanel, type TextPanelView } from '../../ui/hud/textPanel';
import { registerViewPlugin } from '../viewPlugins';
import { textPanelSystem } from '../../game/text/textPanel.system';
import { hudPresentation } from '../../presentation/hud/hudPresentation';

registerViewPlugin('textPanel', ({ game }) => {
  const model = game.systems.get(textPanelSystem);
  const { hud } = hudPresentation(game);
  const view: TextPanelView = {
    get page() {
      return model.current;
    },
    get opacity() {
      return hud.opacity;
    },
  };
  const panel = mountTextPanel(view);
  return {
    update: () => {
      panel.update();
    },
  };
});
