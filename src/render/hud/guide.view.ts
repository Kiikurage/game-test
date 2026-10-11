// 状況ボタン・操作ヒント・取得通知（DOM）を描画ループにつなぐビュープラグイン。状態は `src/game/guide/`、見た目は `src/ui/hud/guide.ts`。
import { interactionOf } from '../../game/interaction/interaction';
import { guideOf } from '../../game/guide/guide.system';
import { hudModelOf } from '../../game/hud/hud.system';
import { textPanelOf } from '../../game/text/textPanel.system';
import { mountGuide, type GuideView } from '../../ui/hud/guide';
import { registerViewPlugin } from '../viewPlugins';

registerViewPlugin('guide', ({ game }) => {
  const interaction = interactionOf(game);
  const { hints, notices } = guideOf(game);
  const hud = hudModelOf(game);
  const text = textPanelOf(game);
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
