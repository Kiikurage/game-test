import { expect, test, type Page } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 120_000 });

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する。敵は置かない（休憩の効果は game のテストで検証）。 */
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

const bonfire = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.bonfire();
  });

const savedBonfires = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem('gametest.save.v1');
    if (!raw) return [];
    return (JSON.parse(raw) as { data: { bonfires: string[] } }).data.bonfires;
  });

test('ignites the bonfire, rests, stands up, and the save reflects it', async ({ page }) => {
  await boot(page);
  // 初期状態: 篝火は消えていて、セーブも空
  expect((await bonfire(page)).lit).toEqual([]);
  expect(await savedBonfires(page)).toEqual([]);

  // 篝火の 1.5m 以内（南 1.2m）へ。状況アクション「火を灯す」が出る
  await page.evaluate(() => {
    window.__game?.dev.teleport(0, -1.2, 0);
  });
  await expect.poll(async () => (await bonfire(page)).prompt?.label).toBe('火を灯す');

  // 入力（E）で点火: 動作中は状況アクションが消え、完了で点火・セーブ
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await bonfire(page)).playerState).toBe('interact');
  await expect
    .poll(async () => (await bonfire(page)).lit, { timeout: 60_000 })
    .toEqual(['bonfire']);
  expect(await savedBonfires(page)).toEqual(['bonfire']);
  await expect
    .poll(async () => (await bonfire(page)).playerState, { timeout: 30_000 })
    .toBe('idle');
  await expect.poll(async () => (await bonfire(page)).prompt?.label).toBe('休む');

  // 傷ついてから休む: HP 全回復、座って保持
  await page.evaluate(() => {
    window.__game?.dev.damage(120);
  });
  const hurt = (await bonfire(page)).hp;
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await bonfire(page)).playerState).toBe('sitDown');
  expect((await bonfire(page)).hp).toBeGreaterThan(hurt);
  await expect
    .poll(async () => (await bonfire(page)).playerState, { timeout: 60_000 })
    .toBe('rest');
  await expect.poll(async () => (await bonfire(page)).prompt?.label).toBe('立ち上がる');
  expect(await savedBonfires(page)).toEqual(['bonfire']);

  // 再入力で立ち上がる
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await bonfire(page)).playerState).toBe('standUp');
  await expect
    .poll(async () => (await bonfire(page)).playerState, { timeout: 60_000 })
    .toBe('idle');
});

test('respawns 1.5m south of the bonfire, standing up facing it', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.teleport(30, 10, 2);
  });
  const ok = await page.evaluate(() => window.__game?.dev.respawnAtBonfire());
  expect(ok).toBe(true);
  await expect.poll(async () => (await bonfire(page)).playerState).toBe('standUp');
  const p = await page.evaluate(() => window.__game?.sim.player);
  expect(p?.position.x).toBeCloseTo(0, 1);
  expect(p?.position.z).toBeCloseTo(-1.5, 1);
  expect(p?.yaw).toBeCloseTo(0, 1);
  await expect
    .poll(async () => (await bonfire(page)).playerState, { timeout: 60_000 })
    .toBe('idle');
});
