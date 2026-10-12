import { expect, test, type Page } from '@playwright/test';
import { bootGame, stepUntil, tapKey } from './helpers';

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する。敵は置かない（休憩の効果は game のテストで検証）。 */
const boot = (page: Page) => bootGame(page, { enemies: false });

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
  await stepUntil(
    page,
    async () => (await bonfire(page)).prompt?.label,
    (v) => v === '火を灯す',
  );

  // 入力（E）で点火: 動作中は状況アクションが消え、完了で点火・セーブ
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    async () => (await bonfire(page)).playerState,
    (v) => v === 'interact',
  );
  await stepUntil(
    page,
    async () => (await bonfire(page)).lit,
    (v) => JSON.stringify(v) === JSON.stringify(['bonfire']),
    { maxSteps: 1200 },
  );
  expect(await savedBonfires(page)).toEqual(['bonfire']);
  await stepUntil(
    page,
    async () => (await bonfire(page)).playerState,
    (v) => v === 'idle',
    { maxSteps: 1200 },
  );
  await stepUntil(
    page,
    async () => (await bonfire(page)).prompt?.label,
    (v) => v === '休む',
  );

  // 傷ついてから休む: HP 全回復、座って保持
  await page.evaluate(() => {
    window.__game?.dev.damage(120);
  });
  const hurt = (await bonfire(page)).hp;
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    async () => (await bonfire(page)).playerState,
    (v) => v === 'sitDown',
  );
  expect((await bonfire(page)).hp).toBeGreaterThan(hurt);
  await stepUntil(
    page,
    async () => (await bonfire(page)).playerState,
    (v) => v === 'rest',
    { maxSteps: 1200 },
  );
  await stepUntil(
    page,
    async () => (await bonfire(page)).prompt?.label,
    (v) => v === '立ち上がる',
  );
  expect(await savedBonfires(page)).toEqual(['bonfire']);

  // 再入力で立ち上がる
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    async () => (await bonfire(page)).playerState,
    (v) => v === 'standUp',
  );
  await stepUntil(
    page,
    async () => (await bonfire(page)).playerState,
    (v) => v === 'idle',
    { maxSteps: 1200 },
  );
});

test('respawns 1.5m south of the bonfire, standing up facing it', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.teleport(30, 10, 2);
  });
  const ok = await page.evaluate(() => window.__game?.dev.respawnAtBonfire());
  expect(ok).toBe(true);
  await stepUntil(
    page,
    async () => (await bonfire(page)).playerState,
    (v) => v === 'standUp',
  );
  const p = await page.evaluate(() => window.__game?.sim.player);
  expect(p?.position.x).toBeCloseTo(0, 1);
  expect(p?.position.z).toBeCloseTo(-1.5, 1);
  expect(p?.yaw).toBeCloseTo(0, 1);
  await stepUntil(
    page,
    async () => (await bonfire(page)).playerState,
    (v) => v === 'idle',
    { maxSteps: 1200 },
  );
});
