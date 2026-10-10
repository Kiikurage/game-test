import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import { CombatDebugTool } from './combatTool';

const tools = new WeakMap<Game, CombatDebugTool>();

/** `game` の戦闘デバッグツール（`?debug&scene=combat` でなくても使える。UI は debug のときだけ出る）。 */
export function combatToolOf(game: Game): CombatDebugTool {
  const tool = tools.get(game);
  if (!tool) throw new Error('combat debug tool is not registered for this game');
  return tool;
}

registerGameSystem('combatTool', (game) => {
  tools.set(game, new CombatDebugTool(game));
  return {};
});
