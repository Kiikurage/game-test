import { expect, test, type Page } from '@playwright/test';
import { bootGame, stepUntil, tapKey } from './helpers';

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する。敵は置かない（敵の復活は game のテストで検証）。 */
const boot = (page: Page) => bootGame(page, { enemies: false });

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
  await stepUntil(
    page,
    async () => (await death(page)).active,
    (v) => v,
    { chunk: 1 },
  );
  await stepUntil(
    page,
    async () => (await bonfire(page)).playerState,
    (v) => v === 'dead',
    {
      chunk: 1,
    },
  );

  // タイムライン: 画面効果が進み、最後に篝火のリスポーン位置で立ち上がる（シミュレーション基準で待つ）
  await stepUntil(
    page,
    async () => (await death(page)).frame,
    (v) => v >= 120,
    { chunk: 1 },
  );
  expect((await death(page)).visual.grade).toBe(1);

  await stepUntil(
    page,
    async () => (await phasesOf(page)).includes('respawn'),
    (v) => v,
  );
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
  await stepUntil(
    page,
    async () => (await death(page)).frame,
    (v) => v >= 90,
    { chunk: 1 },
  );
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    async () => (await phasesOf(page)).includes('respawn'),
    (v) => v,
  );
  const after = await death(page);
  expect(after.skipped).toBe(true);
  expect(after.log.find((e) => e.phase === 'respawn')?.frame).toBeLessThan(300);
});
