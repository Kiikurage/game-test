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

test('loads the character assets and plays the idle animation', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });

  const initial = await page.evaluate(() => window.__game?.showcase);
  expect(initial?.clip).toBe('Idle_Loop');
  expect(initial?.triangles).toBeGreaterThan(10_000);

  // アニメーションの再生位置が進んでいる
  await expect
    .poll(() => page.evaluate(() => window.__game?.showcase?.time ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(0.2);
  expect(errors).toEqual([]);
});

test('plays the requested clip and can freeze it at a given time', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./?clip=Roll&t=0.5');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });

  await page.waitForTimeout(500);
  const state = await page.evaluate(() => window.__game?.showcase);
  expect(state?.clip).toBe('Roll');
  expect(state?.time).toBeCloseTo(0.5, 5);
  expect(errors).toEqual([]);
});

test('shows the exploration props preview without errors (#108)', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./?props=all&quality=low&scale=0.25');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  await page.goto('./?props=sword-back&view=back&quality=low&scale=0.25');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
