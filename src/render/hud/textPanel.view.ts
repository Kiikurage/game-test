// テキストパネル（DOM）を描画ループにつなぐビュープラグイン。状態は `src/game/text/`、見た目は `src/ui/hud/textPanel.ts`。
import { hudModelOf } from '../../game/hud/hud.system';
import { textPanelOf } from '../../game/text/textPanel.system';
import { mountTextPanel, type TextPanelView } from '../../ui/hud/textPanel';
import { registerViewPlugin } from '../viewPlugins';

registerViewPlugin('textPanel', ({ game }) => {
  const model = textPanelOf(game);
  const hud = hudModelOf(game);
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
