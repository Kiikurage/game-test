import { ACESFilmicToneMapping, PCFShadowMap, WebGPURenderer } from 'three/webgpu';
import { DynamicResolution } from './dynamicResolution';
import type { QualitySelection } from './quality';
import { setMaterialDetail } from './bakedNoise';
import { computePixelRatio } from './resolution';

/** デバッグ表示（`?debug`）用の計測値。 */
export interface RenderStats {
  /** 平滑化した fps / フレーム時間（rAF 間隔ベース）。 */
  fps: number;
  frameMs: number;
  /** 動的解像度スケール（0..1）と、実際の描画バッファ解像度（px）。 */
  scale: number;
  width: number;
  height: number;
  pixelRatio: number;
  drawCalls: number;
  triangles: number;
  /** GPU 時間（ms。`?perf` かつ timestamp-query 対応時のみ。それ以外は null）。 */
  gpuMs: number | null;
}

export interface GameRenderer {
  readonly renderer: WebGPURenderer;
  readonly quality: QualitySelection;
  readonly stats: Readonly<RenderStats>;
  /** コンテナの現在サイズへ合わせ、適用したサイズ（CSS px）を返す。 */
  resize(): { width: number; height: number };
  /** 1 フレームの描画開始時に呼ぶ。フレーム時間を計測して動的解像度を更新し、描画統計をリセットする。 */
  beginFrame(nowMs: number): void;
  /** 1 フレームの描画終了時に呼ぶ。描画コール数などを stats へ取り込む。 */
  endFrame(): void;
  dispose(): void;
}

/**
 * WebGPURenderer を生成して初期化する。
 * Three.js は WebGPU 非対応時に WebGL2 へ自動フォールバックするが、本プロジェクトは
 * WebGPU 専用なので、初期化後にバックエンドを検証し、WebGPU 以外なら例外にする。
 */
export async function createRenderer(
  container: HTMLElement,
  quality: QualitySelection,
): Promise<GameRenderer> {
  const { preset } = quality;
  // マテリアルのノイズ層の数（#236）。マテリアルは各 view が後で作るので、その前に決めておく
  setMaterialDetail(preset.level);
  const renderer = new WebGPURenderer({
    antialias: preset.msaa,
    powerPreference: 'high-performance',
    // `?perf` のときだけ GPU 時間を測る（非対応端末では three が自動で無効にする）
    trackTimestamp: quality.toggles.perf,
  });
  await renderer.init();

  if ((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend !== true) {
    void renderer.dispose();
    throw new Error('WebGPU backend is not active (WebGL fallback is not supported)');
  }

  renderer.shadowMap.enabled = !quality.toggles.noShadow;
  renderer.shadowMap.type = PCFShadowMap;
  // トーンマッピングはポストエフェクト（RenderPipeline）の最終段で適用される
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  // 複数パスの合計を 1 フレームとして数えるため、自動リセットを切って beginFrame で手動リセットする
  renderer.info.autoReset = false;
  container.appendChild(renderer.domElement);

  const dynamicResolution = new DynamicResolution({
    targetFps: quality.targetFps,
    minScale: 0.5,
    maxScale: 1,
    step: 0.1,
    // モバイルは 0.8 から始め、下限も低くする（起動直後に最大解像度で重いフレームを出さない）。
    // 起動直後・解像度変更直後のカクつきは評価に入れず、1fps 級の遅さでも数フレームで反応する
    initialScale: quality.fixedScale ?? (quality.isMobile ? 0.8 : 1),
    ...(quality.isMobile && { minScale: 0.4 }),
    ...(quality.fixedScale !== null && { minScale: 0.25 }),
    window: quality.isMobile ? 15 : 20,
    downThreshold: quality.isMobile ? 1.1 : 1.15,
    warmupFrames: 6,
    settleFrames: 2,
    spikeClamp: 6,
    maxWindowMs: 1000,
  });
  const stats: RenderStats = {
    fps: 0,
    frameMs: 0,
    scale: 1,
    width: 0,
    height: 0,
    pixelRatio: 1,
    drawCalls: 0,
    triangles: 0,
    gpuMs: null,
  };

  const resize = (): { width: number; height: number } => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const base = computePixelRatio(width, height, window.devicePixelRatio, preset.resolution);
    const ratio = base * dynamicResolution.scale;
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    stats.scale = dynamicResolution.scale;
    stats.pixelRatio = ratio;
    stats.width = Math.round(width * ratio);
    stats.height = Math.round(height * ratio);
    return { width, height };
  };

  let lastNow = 0;
  const beginFrame = (nowMs: number): void => {
    renderer.info.reset();
    if (lastNow > 0) {
      const dt = nowMs - lastNow;
      if (dt > 0 && dt < 5000) {
        // 指数移動平均で表示を安定させる
        stats.frameMs = stats.frameMs === 0 ? dt : stats.frameMs * 0.9 + dt * 0.1;
        stats.fps = 1000 / stats.frameMs;
      }
      if (quality.fixedScale === null && dynamicResolution.update(dt) !== null) resize();
    }
    lastNow = nowMs;
  };

  let resolvingGpu = false;
  const endFrame = (): void => {
    stats.drawCalls = renderer.info.render.drawCalls;
    stats.triangles = renderer.info.render.triangles;
    if (quality.toggles.perf && !resolvingGpu) {
      // 結果は非同期（描画をブロックしない）。前の解決が終わるまで次は要求しない
      resolvingGpu = true;
      renderer
        .resolveTimestampsAsync('render')
        .then((ms) => {
          if (typeof ms === 'number' && ms > 0) stats.gpuMs = ms;
        })
        .catch(() => undefined)
        .finally(() => {
          resolvingGpu = false;
        });
    }
  };

  return {
    renderer,
    quality,
    stats,
    resize,
    beginFrame,
    endFrame,
    dispose: () => {
      void renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
