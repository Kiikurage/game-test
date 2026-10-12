import { expect, test } from '@playwright/test';
import { bootGame, stepUntil, tapKey } from './helpers';

test('picks up the flask in the chapel; the max stays 4 after resting at the bonfire', async ({
  page,
}) => {
  const errors = await bootGame(page, { enemies: false });
  const items = () =>
    page.evaluate(() => {
      const dev = window.__game?.dev;
      if (!dev) throw new Error('dev hooks unavailable');
      return dev.items();
    });
  expect((await items()).flasks.max).toBe(3);
  expect((await items()).placed).toEqual(['item-flask-c']);

  // 礼拝堂の奥 (54, 26) で拾う
  await page.evaluate(() => {
    window.__game?.dev.teleport(54, 25, 0);
  });
  await stepUntil(
    page,
    () => page.evaluate(() => window.__game?.dev.bonfire().prompt?.label),
    (v) => v === '拾う',
  );
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    async () => (await items()).flasks.max,
    (v) => v === 4,
  );
  expect((await items()).saved).toEqual({ flask_up: 1 });
  expect((await items()).placed).toEqual([]);

  // 篝火で休憩しても最大数は 4
  await page.evaluate(() => {
    window.__game?.dev.teleport(0, -1.2, 0);
  });
  await stepUntil(
    page,
    () => page.evaluate(() => window.__game?.dev.bonfire().prompt?.label),
    (v) => v === '火を灯す',
  );
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    () => page.evaluate(() => window.__game?.dev.bonfire().lit),
    (v) => v?.includes('bonfire') ?? false,
    { maxSteps: 1200 },
  );
  await stepUntil(
    page,
    () => page.evaluate(() => window.__game?.dev.bonfire().prompt?.label),
    (v) => v === '休む',
    { maxSteps: 1200 },
  );
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    () => page.evaluate(() => window.__game?.dev.bonfire().resting),
    (v) => v === true,
    { maxSteps: 1200 },
  );
  expect((await items()).flasks).toEqual({ count: 4, max: 4 });
  expect(errors).toEqual([]);
});
