/**
 * 描画の「毎フレーム再生成」を検出するための計測（#231）。
 * パイプライン生成は Android Chrome（Dawn/Vulkan）で非常に遅いので、ウォームアップ後に増え続けていたらバグ。
 * `perf.view.ts` が backend をラップして更新し、`perf.dev.ts` が E2E へ公開する。
 */
export interface PerfProbe {
  /** 起動からのレンダーパイプライン生成回数（ウォームアップ後に増えないのが正常）。 */
  pipelineCreations: number;
  /** 直近フレームの JS 側 CPU 時間（beginFrame〜endFrame。描画コマンドの組み立て込み、GPU 待ちは含まない）。 */
  frameCpuMs: number;
  /** 直近 120 フレームの CPU 時間の中央値（初回コンパイルなどの外れ値に引きずられない）。 */
  frameCpuAvgMs: number;
}

export const perfProbe: PerfProbe = { pipelineCreations: 0, frameCpuMs: 0, frameCpuAvgMs: 0 };
