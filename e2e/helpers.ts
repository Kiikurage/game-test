import { expect, type Page } from '@playwright/test';

/** ローディング完了 → 開始画面をクリックしてゲームを開始する（`#app[data-state=running]` まで待つ）。 */
export async function startGame(page: Page): Promise<void> {
  const app = page.locator('#app');
  await expect(app).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  await page.getByTestId('start-screen').click();
  await expect(app).toHaveAttribute('data-state', 'running');
}
