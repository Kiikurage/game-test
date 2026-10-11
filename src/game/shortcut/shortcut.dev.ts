import { registerDevHooks } from '../../devHooks';
import { interactionOf } from '../interaction/interaction';
import { shortcutOf } from './shortcut.system';
import type { ShortcutState } from './shortcut';

declare module '../../devHooks' {
  interface DevHooks {
    /** ショートカット（鉄門 G1・レバー）の状態（E2E・撮影用）。鉄門のないレベルでは null。 */
    shortcut(): {
      state: ShortcutState;
      blocked: boolean;
      leverProgress: number;
      gateProgress: number;
      prompt: string | null;
    } | null;
  }
}

registerDevHooks('shortcut', ({ game }) => ({
  shortcut: () => {
    const sc = shortcutOf(game);
    if (!sc) return null;
    const prompt = interactionOf(game).prompt;
    return {
      state: sc.state,
      blocked: sc.blocked,
      leverProgress: sc.leverProgress,
      gateProgress: sc.gateProgress,
      prompt: prompt?.kind === 'lever' ? prompt.label : null,
    };
  },
}));
