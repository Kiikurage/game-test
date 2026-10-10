import { expect, test } from '@playwright/test';
import { startGame } from './helpers';

/** ボス AI 基盤の確認シーン（`?scene=test&boss`。未実装の技はスタブで埋まる）。 */
test('the boss showcase spawns the boss, which beats, picks moves and shows the debug overlay', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?scene=test&boss&debug&quality=low&scale=0.25&nodraw');
  await startGame(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });

  const initial = await page.evaluate(() => window.__game?.dev.bossDebug() ?? null);
  expect(initial?.state).toBe('beat');
  expect(initial?.phase).toBe(1);
  expect(initial?.hp).toBe(2400);

  // 約 40 秒分進めると、ビートと技を何度か繰り返す
  await page.evaluate(() => {
    window.__game?.dev.advance(2400);
  });
  const later = await page.evaluate(() => window.__game?.dev.bossDebug() ?? null);
  expect(later?.history.length).toBeGreaterThan(3);
  expect(later?.weights?.entries.length).toBeGreaterThan(0);
  expect(['close', 'mid', 'far']).toContain(later?.band);

  // ?debug の表示（距離帯・直前の技・選択重み）
  await expect(page.locator('.boss-debug')).toContainText('band');
  expect(errors).toEqual([]);
});
