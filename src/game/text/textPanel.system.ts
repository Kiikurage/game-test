// テキストパネル（#120）。`game.events` の `showText` で表示を依頼され、状態（TextPanelModel）を更新する。
// 表示は render/hud/textPanel.view.ts → ui/hud/textPanel.ts。会話は決定ボタン（状況ボタンと同じ `interact`）で進む。
import { lookupText } from '../data/texts';
import { interactionSystem } from '../interaction/interaction.system';
import { registerGameSystem } from '../systems';
import { TextPanelModel } from './textPanelModel';

/** テキストパネルの状態（`game.systems.get(textPanelSystem)`。描画側が読む）。 */
export const textPanelSystem = registerGameSystem(
  'textPanel',
  (game) => {
    const model = new TextPanelModel();
    const interaction = game.systems.get(interactionSystem);
    let release: (() => void) | null = null;
    // 表示依頼を出した押下（状況ボタンで会話を始めた、そのステップの決定ボタン）では進めない
    let justShown = false;

    game.events.on('showText', (e) => {
      const raw = e.text ?? (e.id !== undefined ? lookupText(e.id) : undefined);
      if (raw === undefined) return;
      const lines = typeof raw === 'string' ? [raw] : raw;
      const mode = e.mode ?? 'read';
      const { x, z } = game.player.feet;
      model.show(lines, mode, x, z);
      justShown = game.inputSnapshot.buttons.interact.pressed;
      // 会話中は他の状況アクションを止める（決定ボタンは行送りに使う）
      if (mode === 'conversation' && model.active && !release) release = interaction.lock();
      else if (mode === 'read' && release) {
        release();
        release = null;
      }
    });

    return {
      state: model,
      update: (dt) => {
        if (!model.active) {
          justShown = false;
        } else if (game.player.dead) {
          model.close();
        } else {
          const { x, z } = game.player.feet;
          if (model.conversing && !justShown && game.inputSnapshot.buttons.interact.pressed) {
            model.advance();
          }
          model.step(dt, x, z);
          justShown = false;
        }
        if (release && !model.conversing) {
          release();
          release = null;
        }
      },
    };
  },
  // 会話中の決定ボタンは、同じステップの状況アクション（interaction）が見た後に読む
  { after: ['interaction'] },
);
