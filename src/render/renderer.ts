import { PCFShadowMap, WebGPURenderer } from 'three/webgpu';
import { computePixelRatio } from './resolution';

export interface GameRenderer {
  readonly renderer: WebGPURenderer;
  /** コンテナの現在サイズへ合わせ、適用したサイズ（CSS px）を返す。 */
  resize(): { width: number; height: number };
  dispose(): void;
}

/**
 * WebGPURenderer を生成して初期化する。
 * Three.js は WebGPU 非対応時に WebGL2 へ自動フォールバックするが、本プロジェクトは
 * WebGPU 専用なので、初期化後にバックエンドを検証し、WebGPU 以外なら例外にする。
 */
export async function createRenderer(container: HTMLElement): Promise<GameRenderer> {
  const renderer = new WebGPURenderer({ antialias: true, powerPreference: 'high-performance' });
  await renderer.init();

  if ((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend !== true) {
    void renderer.dispose();
    throw new Error('WebGPU backend is not active (WebGL fallback is not supported)');
  }

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  container.appendChild(renderer.domElement);

  const resize = (): { width: number; height: number } => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(computePixelRatio(width, height, window.devicePixelRatio));
    renderer.setSize(width, height, false);
    return { width, height };
  };

  return {
    renderer,
    resize,
    dispose: () => {
      void renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
