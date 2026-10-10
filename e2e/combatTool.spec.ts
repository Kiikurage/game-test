import { expect, test } from '@playwright/test';
import { clickInPage, startGame } from './helpers';

/** 戦闘デバッグツール（`?debug&scene=combat`）。ロジックの検証なので最小品質・低解像度・描画なしで開く。 */
const QUERY = 'quality=low&scale=0.25&nodraw';

test('?debug&scene=combat shows action name, frame and windows, and steps one frame at a time', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(`./?scene=combat&debug&${QUERY}`);
  await startGame(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });

  const panel = page.locator('.combat-tool');
  await expect(panel).toBeVisible();
  await expect(page.locator('.combat-tool-info')).toContainText('HP');

  // 軽攻撃を 1 回入力（Pointer Lock は開始画面のクリックで取得済み。止まっているので次のステップで消費される）
  await expect
    .poll(() => page.evaluate(() => document.pointerLockElement !== null), { timeout: 10_000 })
    .toBe(true);
  await clickInPage(page);
  await page.evaluate(() => {
    window.__game?.dev.advance(1);
  });
  const first = await page.evaluate(() => window.__game?.dev.combatTool().info().action ?? null);
  expect(first?.actionId).toBe('light1');
  expect(first?.frame).toBe(1);

  // UI の 1F 送りで 1F ずつ進む
  for (const frame of [2, 3, 4]) {
    await page.locator('.combat-tool-step').dispatchEvent('click');
    await expect
      .poll(() => page.evaluate(() => window.__game?.dev.combatTool().info().action.frame))
      .toBe(frame);
  }
  await expect(page.locator('.combat-tool-info')).toContainText('light1');
  await expect(page.locator('.combat-tool-info')).toContainText('F4/36');
  await expect(page.locator('.combat-tool-info')).toContainText('キャンセル窓');

  // 持続（F13〜）に入ると窓の表示が変わる
  await page.evaluate(() => {
    window.__game?.dev.advance(9);
  });
  const active = await page.evaluate(() => window.__game?.dev.combatTool().info().action ?? null);
  expect(active?.frame).toBe(13);
  expect(active?.segment).toBe('active');

  // スロー再生の指定がタイムスケールへ届く
  await page.locator('.combat-tool-slow').selectOption('0.25');
  await expect.poll(() => page.evaluate(() => window.__game?.sim.combat.timeScale)).toBe(0.25);
  expect(errors).toEqual([]);
});

test('without ?debug the combat debug UI is not shown', async ({ page }) => {
  await page.goto(`./?scene=combat&${QUERY}`);
  await startGame(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });
  await expect(page.locator('.combat-tool')).toHaveCount(0);
  await expect(page.locator('.debug-hud')).toHaveCount(0);
});

test('?debug on other scenes does not add the combat panel', async ({ page }) => {
  await page.goto(`./?scene=test&debug&${QUERY}`);
  await startGame(page);
  await expect(page.locator('.combat-tool')).toHaveCount(0);
});
