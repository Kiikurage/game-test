// Playwright の globalSetup（GPU_MODE=hardware のときだけ playwright.config.mjs が使う）。
// テスト開始前に WebGPU アダプタを調べ、ハードウェアでなければ失敗させる。
import { chromium } from '@playwright/test';
import { checkGpuAdapter, launchOptions } from './chromium.mjs';

export default async function globalSetup() {
  const browser = await chromium.launch(launchOptions());
  try {
    await checkGpuAdapter(browser, { requireHardware: true });
  } finally {
    await browser.close();
  }
}
