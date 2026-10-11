import { SHORTCUT } from '../data/shortcut';
import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import { Shortcut } from './shortcut';

// ショートカット（#65）。ロジックは shortcut.ts。鉄門・レバーは `LevelData.interactables`（'G1' / 'lever-g1'）から作る。
const shortcuts = new WeakMap<Game, Shortcut | null>();

/** `game` のショートカット。鉄門のないレベル・テストシーンでは null。 */
export function shortcutOf(game: Game): Shortcut | null {
  return shortcuts.get(game) ?? null;
}

registerGameSystem('shortcut', (game) => {
  const gate = game.interactableSpawns.find((i) => i.id === SHORTCUT.gateId);
  const lever = game.interactableSpawns.find((i) => i.id === SHORTCUT.leverId);
  if (!gate || !lever) {
    shortcuts.set(game, null);
    return {};
  }
  const shortcut = new Shortcut(game, gate, lever);
  shortcuts.set(game, shortcut);
  return {
    update: () => {
      shortcut.update();
    },
  };
});
