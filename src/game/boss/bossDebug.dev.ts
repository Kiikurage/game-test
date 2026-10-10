import { registerDevHooks } from '../../devHooks';
import { isBossToolScene, type BossDebugTool } from './bossDebug';
import { bossDebugOf } from './bossDebug.system';

declare module '../../devHooks' {
  interface DevHooks {
    /**
     * ボス技の回避検証ツール（E5-9）。`set` / `fire` / `info` で操作する（UI は `?debug&scene=boss`）。
     * 一時停止・フレーム送りは `pause(true)` / `advance(1)`、スローは `set('slow', 0.25)`。
     */
    bossTool(): BossDebugTool;
  }
}

registerDevHooks('bossTool', ({ game }) => {
  const tool = bossDebugOf(game);
  if (isBossToolScene(location.search)) tool.ensureBoss();
  return { bossTool: () => tool };
});
