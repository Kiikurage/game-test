import { defineConfig } from '@playwright/test';
import { launchOptions } from './scripts/chromium.mjs';

const PORT = 4173;

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
    command: 'npm run build && npm run preview',
    url: `http://localhost:${PORT}/game-test/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
