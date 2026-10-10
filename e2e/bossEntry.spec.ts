import { expect, test, type Page } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 240_000 });

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
    .toBeGreaterThan(60);
  await expect.poll(() => page.evaluate(() => window.__game?.sim.player.grounded)).toBe(true);
  expect(errors).toEqual([]);
}

const entry = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.bossEntry();
  });

const gate = (page: Page) =>
  page.evaluate(() => {
    const g = window.__game?.dev.fogGate();
    if (!g) throw new Error('no fog gate');
    return g;
  });

test('enters the fog gate: the boss is invulnerable during its intro, then engages; death resets it', async ({
  page,
}) => {
  await boot(page);
  // 入る前: ボスは闘技場で待機（戦闘前・無敵ではない）
  const before = await entry(page);
  expect(before).toMatchObject({ exists: true, state: 'dormant', engaged: false });

  // 中庭側の門の前から霧へ入る
  await page.evaluate(() => {
    window.__game?.dev.teleport(102.4, 66.4, (45 * Math.PI) / 180);
  });
  await expect.poll(async () => (await gate(page)).prompt).toBe('霧へ入る');
  await tapKey(page, 'KeyE');
  // 闘技場へ着くと入場演出（無敵）が始まり、HP バーはまだ出ない
  await expect.poll(async () => (await entry(page)).intros, { timeout: 120_000 }).toBe(1);
  const intro = await entry(page);
  expect(intro.invulnerable).toBe(true);
  expect(intro.engaged).toBe(false);
  expect(intro.bgm).toBe('bgm.boss');
  expect((await gate(page)).state).toBe('sealed');

  // 約 90F 後に戦闘開始（bossEngaged = HP バー）。無敵が解ける
  await expect.poll(async () => (await entry(page)).engages, { timeout: 120_000 }).toBe(1);
  const fight = await entry(page);
  expect(fight.engaged).toBe(true);
  expect(fight.invulnerable).toBe(false);
  expect(fight.hp).toBe(fight.maxHp);

  // 死亡: ボスは満タン・フェーズ 1・待機へ。霧の門は閉じ直し、篝火で再開する
  await page.evaluate(() => {
    window.__game?.dev.bossDamage(1000);
    window.__game?.dev.damage(10_000);
  });
  await expect.poll(async () => (await entry(page)).engaged, { timeout: 120_000 }).toBe(false);
  await expect.poll(async () => (await gate(page)).state, { timeout: 180_000 }).toBe('closed');
  await expect
    .poll(async () => (await page.evaluate(() => window.__game?.dev.death()))?.active, {
      timeout: 180_000,
    })
    .toBe(false);
  const reset = await entry(page);
  expect(reset).toMatchObject({ state: 'dormant', engaged: false, phase: 1 });
  expect(reset.hp).toBe(reset.maxHp);
  expect(reset.bgm).toBe('bgm.area');
});
