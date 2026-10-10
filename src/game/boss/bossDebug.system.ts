import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import { BossDebugTool } from './bossDebug';

const tools = new WeakMap<Game, BossDebugTool>();

/** `game` の回避検証ツール（`?debug&scene=boss` でなくても使える。UI は debug のときだけ出る）。 */
export function bossDebugOf(game: Game): BossDebugTool {
  const tool = tools.get(game);
  if (!tool) throw new Error('boss debug tool is not registered for this game');
  return tool;
}

registerGameSystem('bossDebug', (game) => {
  const tool = new BossDebugTool(game);
  tools.set(game, tool);
  return {
    update: () => {
      tool.update();
    },
  };
});
