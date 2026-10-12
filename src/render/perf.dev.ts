import { registerDevHooks } from '../devHooks';
import { perfProbe, type PerfProbe } from './perfProbe';
import type { RenderProfile } from './renderProfile';

declare module '../devHooks' {
  interface DevHooks {
    /** 直近フレームの描画統計（`renderer.info` の実測値。シャドウパス込み）。予算チェック（e2e/perf.spec.ts）用。 */
    renderInfo(): {
      drawCalls: number;
      triangles: number;
      /** GPU 時間（ms。`?perf` かつ timestamp-query 対応時のみ。直近に解決できたフレームの描画パスの合計）。 */
      gpuMs: number | null;
      /** フレーム間隔（ms。rAF 間隔の指数移動平均）。 */
      frameMs: number;
      /** 直近フレームの描画の JS 時間（ms。beginFrame〜endFrame）。 */
      cpuMs: number;
    };
    /** カテゴリ別の描画負荷の内訳（メイン / シャドウ別の draws・tris。見積り）。 */
    renderProfile(): RenderProfile;
    /** パイプライン生成回数と CPU 時間（ウォームアップ後にパイプライン数が増え続けない回帰テスト用。#231）。 */
    perfProbe(): PerfProbe;
  }
}

registerDevHooks('perf', ({ view }) => ({
  renderInfo: () => ({
    drawCalls: view.renderStats.drawCalls,
    triangles: view.renderStats.triangles,
    gpuMs: view.renderStats.gpuMs,
    frameMs: view.renderStats.frameMs,
    cpuMs: perfProbe.frameCpuMs,
  }),
  renderProfile: () => view.profile(),
  perfProbe: () => ({ ...perfProbe }),
}));
