import { registerDevHooks } from '../../devHooks';
import { waterwayRenderInfo, type WaterwayRenderInfo } from './waterway.view';

declare module '../../devHooks' {
  interface DevHooks {
    /** 地下水路の水の描画の状態（#270。E2E・撮影用）。描画プラグインが未初期化なら undefined。 */
    waterwayRender(): WaterwayRenderInfo | undefined;
  }
}

registerDevHooks('waterwayRender', ({ game }) => ({
  waterwayRender: () => waterwayRenderInfo(game),
}));
