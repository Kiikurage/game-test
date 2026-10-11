// テキストパネル（#120）。`game.events` の `showText` で表示を依頼され、状態（TextPanelModel）を更新する。
// 表示は render/hud/textPanel.view.ts → ui/hud/textPanel.ts。会話は決定ボタン（状況ボタンと同じ `interact`）で進む。
import { lookupText } from '../data/texts';
import type { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { registerGameSystem } from '../systems';
import { TextPanelModel } from './textPanelModel';

const models = new WeakMap<Game, TextPanelModel>();

/** `game` のテキストパネルの状態（描画側が読む）。 */
export function textPanelOf(game: Game): TextPanelModel {
  const m = models.get(game);
  if (!m) throw new Error('textPanel system is not registered for this game');
  return m;
}

registerGameSystem('textPanel', (game) => {
  const model = new TextPanelModel();
  models.set(game, model);
  const interaction = interactionOf(game);
  let release: (() => void) | null = null;
  // この表示依頼と同じステップの決定ボタン（依頼した本人の押下）では進めない
  let justShown = false;

  game.events.on('showText', (e) => {
    const raw = e.text ?? (e.id !== undefined ? lookupText(e.id) : undefined);
    if (raw === undefined) return;
    const lines = typeof raw === 'string' ? [raw] : raw;
    const mode = e.mode ?? 'read';
    const { x, z } = game.player.feet;
    model.show(lines, mode, x, z);
    justShown = true;
    // 会話中は他の状況アクションを止める（決定ボタンは行送りに使う）
    if (mode === 'conversation' && model.active && !release) release = interaction.lock();
    else if (mode === 'read' && release) {
      release();
      release = null;
    }
  });

  return {
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
});
