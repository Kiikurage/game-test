import { expect, test, type Page } from '@playwright/test';
import { startGame } from './helpers';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

// 篝火・熾火・ヒット火花・撃破の灰・環境の灰のシェーダがすべてコンパイルされ、エラーなく描画できる
test('particle demo renders every preset without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./?particles&quality=low&scale=0.5&warm=1');

  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.frames ?? 0), { timeout: 60_000 })
    .toBeGreaterThan(5);

  expect(errors).toEqual([]);
});
