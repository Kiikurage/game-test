import { expect, test, type Page } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 120_000 });

async function boot(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__game?.sim.player.grounded)).toBe(true);
}

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
  await expect(page.getByTestId('guide-prompt')).toContainText('読む');
  await tapKey(page, 'KeyE');
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
  await expect(page.getByTestId('guide-prompt')).toContainText('調べる');
  await tapKey(page, 'KeyE');
  await expect
    .poll(async () => (await state(page)).flags, { timeout: 60_000 })
    .toContain('loot.corpse_b_flask');
  await expect(page.getByTestId('text-panel')).toContainText('空の水筒。口は、固く握られたまま');
  expect(await page.evaluate(() => window.__game?.dev.items().saved['relic_flask'])).toBe(1);
  // 取得済みは候補から消える
  await expect.poll(async () => (await state(page)).usable).not.toContain('corpse_b_flask');
});
