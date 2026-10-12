import { registerDevHooks } from '../../devHooks';
import type { SceneStats } from './framePipeline';
import type { GpuTimingSummary } from './gpuTimer';

declare module '../../devHooks' {
  interface DevHooks {
    /** ブルームへ渡る HDR シーン色の NaN / Inf 個数と最大輝度（#258）。直近に描画したフレームを読む。 */
    sceneStats(): Promise<SceneStats>;
    /** フレームパイプラインの構成（パス id の描画順・G バッファの出力）。 */
    framePipeline(): { passes: readonly string[]; gbuffer: readonly string[] };
    /** パス別 GPU 時間（直近 120 フレームの中央値。`?perf` / `?debug` かつ timestamp-query 対応時のみ。他は null）。 */
    gpuTiming(): GpuTimingSummary | null;
    /** パス別 GPU 時間の集計をやり直す（視点を変えた直後に呼び、前の視点のフレームを混ぜない）。 */
    resetGpuTiming(): void;
  }
}

registerDevHooks('framePipeline', ({ view }) => ({
  sceneStats: () => view.pipeline.readSceneStats(),
  framePipeline: () => ({ passes: view.pipeline.passIds, gbuffer: view.pipeline.gbuffer }),
  gpuTiming: () => view.gpuTimer?.summary() ?? null,
  resetGpuTiming: () => {
    view.gpuTimer?.reset();
  },
}));
