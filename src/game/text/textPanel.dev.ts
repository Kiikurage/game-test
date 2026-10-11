import { registerDevHooks } from '../../devHooks';
import { lookupText } from '../data/texts';
import { textPanelOf } from './textPanel.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** テキストパネルの状態（E2E・撮影用）。表示中でなければ null。 */
    textPanel(): {
      mode: 'read' | 'conversation';
      text: string;
      index: number;
      total: number;
    } | null;
    /** テキストパネルを開く（撮影用）。`textId` は文面データの ID（配列は会話の 1 行ずつの ID）。 */
    showText(textId: string | readonly string[], mode?: 'read' | 'conversation'): void;
  }
}

registerDevHooks('textPanel', ({ game }) => ({
  textPanel: () => {
    const c = textPanelOf(game).current;
    return c && { mode: c.mode, text: c.text, index: c.index, total: c.total };
  },
  showText: (textId, mode) => {
    if (typeof textId === 'string') {
      game.events.emit('showText', { id: textId, mode });
      return;
    }
    const lines = textId.map((id) => {
      const t = lookupText(id);
      return typeof t === 'string' ? t : (t?.join('') ?? id);
    });
    game.events.emit('showText', { text: lines, mode });
  },
}));
