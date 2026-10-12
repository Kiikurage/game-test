import { registerGameSystem } from '../systems';
import { BossDebugTool } from './bossDebug';

/** 回避検証ツール（`game.systems.get(bossDebugSystem)`。`?debug&scene=boss` でなくても使える。UI は debug のときだけ出る）。 */
export const bossDebugSystem = registerGameSystem(
  'bossDebug',
  (game) => {
    const tool = new BossDebugTool(game);
    return {
      state: tool,
      update: () => {
        tool.update();
      },
    };
  },
  // このステップのボスの状態を見る
  { after: ['boss'] },
);
