// 状況ボタン・操作ヒント・取得通知（DOM）を描画ループにつなぐビュープラグイン。状態は `src/game/guide/`、見た目は `src/ui/hud/guide.ts`。
import { mountGuide, type GuideView } from '../../ui/hud/guide';
import { registerViewPlugin } from '../viewPlugins';
import { textPanelSystem } from '../../game/text/textPanel.system';
import { interactionSystem } from '../../game/interaction/interaction.system';
import { guideSystem } from '../../game/guide/guide.system';
import { hudSystem } from '../../game/hud/hud.system';

registerViewPlugin('guide', ({ game }) => {
  const interaction = game.systems.get(interactionSystem);
  const { hints, notices } = game.systems.get(guideSystem);
  const hud = game.systems.get(hudSystem);
  const text = game.systems.get(textPanelSystem);
  // 会話中は状況ボタンが「次へ」（最後の行は「閉じる」）になり、決定ボタンで行送りする。会話中は他の対象を選ばない
  const advancePrompt = { id: 'advance', label: '次へ' };
  const closePrompt = { id: 'advance', label: '閉じる' };
  const view: GuideView = {
    get prompt() {
      const page = text.current;
      if (page?.mode === 'conversation')
        return page.index + 1 < page.total ? advancePrompt : closePrompt;
      return interaction.prompt;
    },
    get hint() {
      // テキストパネルと重なるので、表示中はヒントを出さない
      return text.active ? null : hints.current;
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
