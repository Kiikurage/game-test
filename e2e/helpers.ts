import { expect, type Page } from '@playwright/test';

/** ローディング完了 → 開始画面をクリックしてゲームを開始する（`#app[data-state=running]` まで待つ）。 */
export async function startGame(page: Page): Promise<void> {
  const app = page.locator('#app');
  await expect(app).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
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

/** 現在のシミュレーションステップ数（60Hz 固定ステップ）。 */
export const stepCount = (page: Page): Promise<number> =>
  page.evaluate(() => window.__game?.steps ?? 0);

/**
 * シミュレーションが `steps` ステップ進むまで待つ（壁時計ではなくシミュレーション基準）。
 * CI のソフトウェア描画では実時間あたりのステップ数が大きく変動するので、`waitForTimeout` の代わりにこちらを使う。
 * 上限はテスト全体のタイムアウトに任せる（ここでは極端に長くとるだけ）。
 */
export async function waitSteps(page: Page, steps: number): Promise<void> {
  const start = await stepCount(page);
  await expect
    .poll(() => stepCount(page), { timeout: 180_000 })
    .toBeGreaterThanOrEqual(start + steps);
}

/** 描画フレームが `frames` 枚進むまで待つ（シミュレーションを止めている / ショーケース表示用）。 */
export async function waitFrames(page: Page, frames: number): Promise<void> {
  const read = (): Promise<number> => page.evaluate(() => window.__game?.frames ?? 0);
  const start = await read();
  await expect.poll(read, { timeout: 180_000 }).toBeGreaterThanOrEqual(start + frames);
}

/** キーを押したまま、シミュレーションが `steps` ステップ進む間保持する（実時間ではなくステップ基準）。 */
export async function holdKey(page: Page, code: string, steps: number): Promise<void> {
  await page.keyboard.down(code);
  try {
    await waitSteps(page, steps);
  } finally {
    await page.keyboard.up(code);
  }
}
