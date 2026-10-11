import { defineConfig } from '@playwright/test';
import { gpuMode, launchOptions } from './scripts/chromium.mjs';

// 並行する作業ツリーでポートが衝突しないよう E2E_PORT で変更できる（CI は既定の 4173）。
const PORT = Number(process.env.E2E_PORT ?? 4173);

// GPU_MODE=hardware（ローカル Mac の実 GPU）では channel / headless も launchOptions から決まる。
const { channel, headless, ...browserLaunchOptions } = launchOptions();

export default defineConfig({
  // 実 GPU モードでは開始前に WebGPU アダプタがハードウェアか確かめる（SwiftShader なら失敗させる）
  globalSetup: gpuMode === 'hardware' ? './scripts/gpuCheckSetup.mjs' : undefined,
  testDir: './e2e',
  timeout: 120_000, // 起動時のシェーダ事前コンパイル（SwiftShader で約 20 秒）を含む
  // ソフトウェア描画（SwiftShader）では 1 フレームが数百 ms〜秒かかり、シミュレーションも実時間より遅れる（1 フレーム最大 5 ステップ）。
  // 実時間でなくシミュレーションの進行を待つ poll が多いので、期待値の待機上限は長めにとる。
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/game-test/`,
    ...(channel ? { channel } : {}),
    ...(headless !== undefined ? { headless } : {}),
    launchOptions: browserLaunchOptions,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/game-test/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
