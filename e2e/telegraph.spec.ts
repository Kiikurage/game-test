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

// 円・影の円・直線のシェーダがコンパイルされ、傾斜地でもエラーなく描画できる
for (const view of ['flat', 'slope']) {
  test(`ground telegraph demo renders without errors (${view})`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`./?telegraph&tview=${view}&tframe=30&quality=low&scale=0.5`);

    await startGame(page);
    await expect
      .poll(() => page.evaluate(() => window.__game?.frames ?? 0), { timeout: 60_000 })
      .toBeGreaterThan(5);

    expect(errors).toEqual([]);
  });
}
