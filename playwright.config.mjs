import { defineConfig } from '@playwright/test';
import { launchOptions } from './scripts/chromium.mjs';

// 並行する作業ツリーでポートが衝突しないよう E2E_PORT で変更できる（CI は既定の 4173）。
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
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
    launchOptions: launchOptions(),
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/game-test/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
