import type { WebGPURenderer } from 'three/webgpu';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

/**
 * KTX2（Basis Universal）テクスチャの共有ローダー（#328）。
 * トランスコーダ（Worker + wasm）は 1 つを共有する。出力形式（ASTC / BC7 / ETC など）は
 * `detectSupport` で WebGPU デバイスの圧縮テクスチャ機能から選ばれるため、レンダラーの初期化後に
 * `configureKtx2Loader` を呼んでから使う。トランスコーダは vite.config.ts が `<base>basis/` に配る。
 */
let loader: KTX2Loader | null = null;

export function configureKtx2Loader(renderer: WebGPURenderer): void {
  loader ??= new KTX2Loader().setTranscoderPath(`${import.meta.env.BASE_URL}basis/`);
  loader.detectSupport(renderer);
}

export function getKtx2Loader(): KTX2Loader {
  if (!loader)
    throw new Error('KTX2Loader is not configured (call configureKtx2Loader after renderer.init)');
  return loader;
}
