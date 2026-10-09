import { expect, test, type Page } from '@playwright/test';
import { webgpuCompatInit } from '../scripts/webgpuCompat.mjs';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(webgpuCompatInit);
});

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test('renders with the WebGPU backend and no console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./');

  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  await expect(page.locator('#app canvas')).toBeVisible();

  const backend = await page.evaluate(() => window.__game?.backend);
  expect(backend).toBe('webgpu');

  // メインループが回り、固定ステップのシミュレーションが進んでいる
  await expect
    .poll(() => page.evaluate(() => window.__game?.frames ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(5);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(5);

  expect(errors).toEqual([]);
});

test('shows the unsupported screen when WebGPU is unavailable', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'gpu', { value: undefined, configurable: true });
  });
  await page.goto('./');

  await expect(page.locator('#app')).toHaveAttribute('data-state', 'unsupported');
  await expect(page.locator('.overlay.unsupported')).toContainText('WebGPU');
  await expect(page.locator('#app canvas')).toHaveCount(0);
  expect(await page.evaluate(() => window.__game)).toBeUndefined();
  expect(errors).toEqual([]);
});
