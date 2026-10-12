import { expect, test, type Page } from '@playwright/test';
import { bootGame, stepUntil, tapKey, waitSteps } from './helpers';

const boot = (page: Page) => bootGame(page, { enemies: false });

const state = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.interactables();
  });

test('read: the hearth stele shows its text and saves read.stone_hearth', async ({ page }) => {
  await boot(page);
  expect((await state(page)).ids).toContain('stone_hearth');
  await page.evaluate(() => {
    window.__game?.dev.teleport(-4.6, 2.2, 0);
  });
  await waitSteps(page, 2);
  await expect(page.getByTestId('guide-prompt')).toContainText('読む');
  await tapKey(page, 'KeyE');
  await waitSteps(page, 2);
  await expect(page.getByTestId('text-panel')).toContainText('火を継ぐ者、ここに。');
  expect((await state(page)).flags).toContain('read.stone_hearth');
});

test('loot: examining the corpse in B gives the relic, shows the text and saves loot.<id>', async ({
  page,
}) => {
  await boot(page);
  // 遺体 (24, 9)。調べると遺品「空の水筒」
  await page.evaluate(() => {
    window.__game?.dev.teleport(24, 7.8, 0);
  });
  await waitSteps(page, 2);
  await expect(page.getByTestId('guide-prompt')).toContainText('調べる');
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    async () => (await state(page)).flags,
    (v) => v.includes('loot.corpse_b_flask'),
  );
  await expect(page.getByTestId('text-panel')).toContainText('空の水筒。口は、固く握られたまま');
  expect(await page.evaluate(() => window.__game?.dev.items().saved['relic_flask'])).toBe(1);
  // 取得済みは候補から消える
  expect((await state(page)).usable).not.toContain('corpse_b_flask');
});
