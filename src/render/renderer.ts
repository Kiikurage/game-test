import { ACESFilmicToneMapping, PCFShadowMap, WebGPURenderer } from 'three/webgpu';
import { DynamicResolution } from './dynamicResolution';
import type { QualitySelection } from './quality';
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
  const renderer = new WebGPURenderer({
    antialias: preset.msaa,
    powerPreference: 'high-performance',
  });
  await renderer.init();

  if ((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend !== true) {
    void renderer.dispose();
    throw new Error('WebGPU backend is not active (WebGL fallback is not supported)');
  }

  renderer.shadowMap.enabled = true;
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
    initialScale: quality.fixedScale ?? 1,
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
      if (dt > 0 && dt < 1000) {
        // 指数移動平均で表示を安定させる
        stats.frameMs = stats.frameMs === 0 ? dt : stats.frameMs * 0.9 + dt * 0.1;
        stats.fps = 1000 / stats.frameMs;
      }
      if (quality.fixedScale === null && dynamicResolution.update(dt) !== null) resize();
    }
    lastNow = nowMs;
  };

  const endFrame = (): void => {
    stats.drawCalls = renderer.info.render.drawCalls;
    stats.triangles = renderer.info.render.triangles;
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
