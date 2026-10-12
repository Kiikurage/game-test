import { registerDevHooks } from '../../devHooks';
import type { CombatDebugTool } from './combatTool';
import { combatToolSystem } from './combatTool.system';

declare module '../../devHooks' {
  interface DevHooks {
    /**
     * 戦闘デバッグツール（#51）。`info()` で読み、`restorePlayer` / `resetDummies` / `setSlow` で操作する
     * （UI は `?debug&scene=combat`）。一時停止・フレーム送りは `pause(true)` / `advance(1)`。
     */
    combatTool(): CombatDebugTool;
  }
}

registerDevHooks('combatTool', ({ game }) => {
  const tool = game.systems.get(combatToolSystem);
  return { combatTool: () => tool };
});
