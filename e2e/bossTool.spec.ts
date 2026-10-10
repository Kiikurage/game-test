import { expect, test } from '@playwright/test';
import { startGame } from './helpers';

/** ボス技の回避検証ツール（`?debug&scene=boss`）。ロジックの検証なので最小品質・低解像度・描画なしで開く。 */
const QUERY = 'quality=low&scale=0.25&nodraw';

test('?debug&scene=boss lists the registered moves and fires one from the UI', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(`./?scene=boss&debug&${QUERY}`);
  await startGame(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });

  const panel = page.locator('.boss-tool');
  await expect(panel).toBeVisible();
  // 技の一覧は登録済みの技（スタブ含む）を動的に列挙する: プレースホルダ + 7 技
  await expect(page.locator('.boss-tool-move option')).toHaveCount(8);

  await page.locator('.boss-tool-move').selectOption('overhead');
  await page.locator('.boss-tool-fire').dispatchEvent('click');
  await page.evaluate(() => {
    window.__game?.dev.advance(10);
  });
  const info = await page.evaluate(() => window.__game?.dev.bossTool().info() ?? null);
  expect(info?.moveId).toBe('overhead');
  expect(info?.stageFrame).toBe(10);
  expect(info?.segment).toBe('startup');
  expect(info?.windows?.left.length).toBeGreaterThan(0);
  await expect(page.locator('.boss-tool-info')).toContainText('大上段');
  await expect(page.locator('.boss-tool-info')).toContainText('左ロール');

  // フレーム送り: 一時停止中に 1F だけ進む
  await page.locator('.boss-tool-step').dispatchEvent('click');
  await expect
    .poll(() => page.evaluate(() => window.__game?.dev.bossTool().info().stageFrame))
    .toBe(11);

  // 持続（F49〜）に入ると判定ありの表示になる
  await page.evaluate(() => {
    window.__game?.dev.advance(38);
  });
  const active = await page.evaluate(() => window.__game?.dev.bossTool().info() ?? null);
  expect(active?.stageFrame).toBe(49);
  expect(active?.hitboxActive).toBe(true);
  expect(errors).toEqual([]);
});

test('without ?debug the verification UI is not shown', async ({ page }) => {
  await page.goto(`./?scene=boss&${QUERY}`);
  await startGame(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });
  await expect(page.locator('.boss-tool')).toHaveCount(0);
  await expect(page.locator('.boss-debug')).toHaveCount(0);
  // ボスは出ているが、UI は無い（AI オフで待機）
  const boss = await page.evaluate(() => window.__game?.dev.bossDebug() ?? null);
  expect(boss?.state).toBe('dormant');
});

test('?scene=test&boss still works as the AI showcase', async ({ page }) => {
  await page.goto(`./?scene=test&boss&${QUERY}`);
  await startGame(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });
  const boss = await page.evaluate(() => window.__game?.dev.bossDebug() ?? null);
  expect(boss?.state).toBe('beat');
});
