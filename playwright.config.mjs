import { defineConfig } from '@playwright/test';
import { launchOptions } from './scripts/chromium.mjs';

// 並行する作業ツリーでポートが衝突しないよう E2E_PORT で変更できる（CI は既定の 4173）。
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
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
