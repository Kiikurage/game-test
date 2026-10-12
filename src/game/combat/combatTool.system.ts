import { registerGameSystem } from '../systems';
import { CombatDebugTool } from './combatTool';

/** 戦闘デバッグツール（`game.systems.get(combatToolSystem)`。`?debug&scene=combat` でなくても使える。UI は debug のときだけ出る）。 */
export const combatToolSystem = registerGameSystem('combatTool', (game) => ({
  state: new CombatDebugTool(game),
}));
