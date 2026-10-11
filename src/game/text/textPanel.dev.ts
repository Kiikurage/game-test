import { registerDevHooks } from '../../devHooks';
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
    /** テキストパネルを開く（撮影用）。`textId` は文面データの ID。 */
    showText(textId: string, mode?: 'read' | 'conversation'): void;
  }
}

registerDevHooks('textPanel', ({ game }) => ({
  textPanel: () => {
    const c = textPanelOf(game).current;
    return c && { mode: c.mode, text: c.text, index: c.index, total: c.total };
  },
  showText: (textId, mode) => {
    game.events.emit('showText', { id: textId, mode });
  },
}));
