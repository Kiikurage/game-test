import { registerDevHooks } from '../devHooks';
import type { RenderProfile } from './renderProfile';

declare module '../devHooks' {
  interface DevHooks {
    /** 直近フレームの描画統計（`renderer.info` の実測値。シャドウパス込み）。予算チェック（e2e/perf.spec.ts）用。 */
    renderInfo(): { drawCalls: number; triangles: number };
    /** カテゴリ別の描画負荷の内訳（メイン / シャドウ別の draws・tris。見積り）。 */
    renderProfile(): RenderProfile;
  }
}

registerDevHooks('perf', ({ view }) => ({
  renderInfo: () => ({
    drawCalls: view.renderStats.drawCalls,
    triangles: view.renderStats.triangles,
  }),
  renderProfile: () => view.profile(),
}));
