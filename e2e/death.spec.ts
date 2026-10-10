import { expect, test, type Page } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 180_000 });

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する。敵は置かない（敵の復活は game のテストで検証）。 */
async function boot(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
  await expect.poll(() => page.evaluate(() => window.__game?.sim.player.grounded)).toBe(true);
  expect(errors).toEqual([]);
}

const death = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.death();
  });

const bonfire = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.bonfire();
  });

const phasesOf = async (page: Page): Promise<string[]> =>
  (await death(page)).log.map((e) => e.phase);

test('dies from damage and respawns at the bonfire after the full timeline', async ({ page }) => {
  await boot(page);
  // 少し離れた場所でダメージを受けて死亡（HP 0）
  await page.evaluate(() => {
    window.__game?.dev.teleport(6, 6, 0);
    window.__game?.dev.damage(10_000);
  });
  await expect.poll(async () => (await death(page)).active).toBe(true);
  await expect.poll(async () => (await bonfire(page)).playerState).toBe('dead');

  // タイムライン: 画面効果が進み、最後に篝火のリスポーン位置で立ち上がる（シミュレーション基準で待つ）
  await expect
    .poll(async () => (await death(page)).frame, { timeout: 120_000 })
    .toBeGreaterThanOrEqual(120);
  expect((await death(page)).visual.grade).toBe(1);

  await expect
    .poll(async () => (await phasesOf(page)).includes('respawn'), { timeout: 120_000 })
    .toBe(true);
  const after = await death(page);
  expect(after.log.map((e) => [e.phase, e.frame])).toEqual([
    ['start', 0],
    ['anim', 12],
    ['grade', 30],
    ['text', 60],
    ['skippable', 90],
    ['hold', 120],
    ['fadeOut', 240],
    ['respawn', 300],
  ]);
  expect(after.visual.grade).toBe(0);
  const b = await bonfire(page);
  expect(b.hp).toBeGreaterThan(0);
  expect(['standUp', 'idle']).toContain(b.playerState);
});

test('skips the death sequence with a button press after F90', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.damage(10_000);
  });
  await expect
    .poll(async () => (await death(page)).frame, { timeout: 120_000 })
    .toBeGreaterThanOrEqual(90);
  await tapKey(page, 'KeyE');
  await expect
    .poll(async () => (await phasesOf(page)).includes('respawn'), { timeout: 120_000 })
    .toBe(true);
  const after = await death(page);
  expect(after.skipped).toBe(true);
  expect(after.log.find((e) => e.phase === 'respawn')?.frame).toBeLessThan(300);
});
