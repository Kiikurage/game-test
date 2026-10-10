import { expect, type Page } from '@playwright/test';

/** ローディング完了 → 開始画面をクリックしてゲームを開始する（`#app[data-state=running]` まで待つ）。 */
export async function startGame(page: Page): Promise<void> {
  const app = page.locator('#app');
  await expect(app).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  await page.getByTestId('start-screen').click();
  await expect(app).toHaveAttribute('data-state', 'running');
}

/**
 * キーの短押し（keydown → keyup を同一タスクで発火する）。
 * `page.keyboard.press` は keydown と keyup の間に CDP の往復が入り、遅い CI では 0.5 秒近く空くことがある。
 * 回避の短押し判定（実時間 0.25 秒）に影響するため、短押しの検証にはこちらを使う。
 */
export async function tapKey(page: Page, code: string): Promise<void> {
  await page.evaluate((c) => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: c, bubbles: true, cancelable: true }),
    );
    window.dispatchEvent(new KeyboardEvent('keyup', { code: c, bubbles: true, cancelable: true }));
  }, code);
}
