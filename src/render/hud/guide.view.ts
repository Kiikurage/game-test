// 状況ボタン・操作ヒント・取得通知（DOM）を描画ループにつなぐビュープラグイン。状態は `src/game/guide/`、見た目は `src/ui/hud/guide.ts`。
import { interactionOf } from '../../game/interaction/interaction';
import { guideOf } from '../../game/guide/guide.system';
import { hudModelOf } from '../../game/hud/hud.system';
import { mountGuide, type GuideView } from '../../ui/hud/guide';
import { registerViewPlugin } from '../viewPlugins';

registerViewPlugin('guide', ({ game }) => {
  const interaction = interactionOf(game);
  const { hints, notices } = guideOf(game);
  const hud = hudModelOf(game);
  const view: GuideView = {
    get prompt() {
      return interaction.prompt;
    },
    get hint() {
      return hints.current;
    },
    get notice() {
      return notices.current;
    },
    get opacity() {
      return hud.opacity;
    },
  };
  const guide = mountGuide(view);
  return {
    update: () => {
      guide.update();
    },
  };
});
