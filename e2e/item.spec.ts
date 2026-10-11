import { expect, test } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 120_000 });

test('picks up the flask in the chapel; the max stays 4 after resting at the bonfire', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  const items = () =>
    page.evaluate(() => {
      const dev = window.__game?.dev;
      if (!dev) throw new Error('dev hooks unavailable');
      return dev.items();
    });
  await expect.poll(() => page.evaluate(() => window.__game?.sim.player.grounded)).toBe(true);
  expect((await items()).flasks.max).toBe(3);
  expect((await items()).placed).toEqual(['item-flask-c']);

  // 礼拝堂の奥 (54, 26) で拾う
  await page.evaluate(() => {
    window.__game?.dev.teleport(54, 25, 0);
  });
  await expect
    .poll(() => page.evaluate(() => window.__game?.dev.bonfire().prompt?.label))
    .toBe('拾う');
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await items()).flasks.max, { timeout: 60_000 }).toBe(4);
  expect((await items()).saved).toEqual({ flask_up: 1 });
  expect((await items()).placed).toEqual([]);

  // 篝火で休憩しても最大数は 4
  await page.evaluate(() => {
    window.__game?.dev.teleport(0, -1.2, 0);
  });
  await expect
    .poll(() => page.evaluate(() => window.__game?.dev.bonfire().prompt?.label))
    .toBe('火を灯す');
  await tapKey(page, 'KeyE');
  await expect
    .poll(() => page.evaluate(() => window.__game?.dev.bonfire().lit), { timeout: 60_000 })
    .toEqual(['bonfire']);
  await expect
    .poll(() => page.evaluate(() => window.__game?.dev.bonfire().prompt?.label), {
      timeout: 30_000,
    })
    .toBe('休む');
  await tapKey(page, 'KeyE');
  await expect
    .poll(() => page.evaluate(() => window.__game?.dev.bonfire().resting), { timeout: 30_000 })
    .toBe(true);
  expect((await items()).flasks).toEqual({ count: 4, max: 4 });
  expect(errors).toEqual([]);
});
