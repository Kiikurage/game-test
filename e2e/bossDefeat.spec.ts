import { expect, test } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 120_000 });

/**
 * ボス撃破演出（#86）: ボス HP を 0 にして撃破 → 撃破のセーブ → F300 に台座の篝火が灯る → F360 に操作可能で休める。
 * シミュレーションは `pause` + `advance` で進める（実時間に依存しない）。
 */
test('defeating the boss lights the pedestal bonfire and returns control', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?arena=boss&quality=low&scale=0.25&nodraw');
  await startGame(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });
  const defeat = () => page.evaluate(() => window.__game?.dev.bossDefeat());
  const advance = (steps: number) =>
    page.evaluate((n) => {
      window.__game?.dev.advance(n);
    }, steps);

  // 撃破前: 台座の篝火は存在しない。ボスは生きている
  const before = await defeat();
  expect(before?.frame).toBe(-1);
  expect(before?.bossAlive).toBe(true);
  expect(before?.arenaBonfireLit).toBe(false);
  expect(before?.saved).toEqual([]);

  // ボスの HP を 0 に: 撃破のセーブ（以降ボスは復活しない）
  await page.evaluate(() => {
    window.__game?.dev.bossDamage(1e9);
  });
  const hit = await defeat();
  expect(hit?.frame).toBe(0);
  expect(hit?.bossAlive).toBe(false);
  expect(hit?.saved).toEqual(['boss']);
  const raw = await page.evaluate(() => localStorage.getItem('gametest.save.v1'));
  expect((JSON.parse(raw ?? '{}') as { data: { bosses: string[] } }).data.bosses).toEqual(['boss']);

  // F299: まだ灯っていない / 霧は濃い。F300: 灯る
  await advance(299);
  const f299 = await defeat();
  expect(f299?.frame).toBe(299);
  expect(f299?.arenaBonfireLit).toBe(false);
  expect(f299?.fogDensity).toBeCloseTo(0.04, 3);
  await advance(1);
  expect((await defeat())?.arenaBonfireLit).toBe(true);

  // F360: 操作可能になり、台座の篝火で休める
  await advance(60);
  const control = await defeat();
  expect(control?.frame).toBe(360);
  expect(control?.controlRestored).toBe(true);
  expect(control?.fogDensity).toBeCloseTo(0.015, 3);
  const info = await page.evaluate(() => window.__game?.dev.arenaInfo());
  const slot = info?.bonfireSlot;
  if (!slot) throw new Error('no arena');
  await page.evaluate((s) => {
    window.__game?.dev.teleport(s.x, s.z - 1.2, 0, s.y);
  }, slot);
  await advance(10);
  const near = await page.evaluate(() => window.__game?.dev.bonfire());
  expect(near?.lit).toContain('bonfire-arena');
  expect(near?.prompt?.id).toBe('bonfire-arena');
  expect(near?.prompt?.label).toBe('休む');
  await tapKey(page, 'KeyE');
  await advance(2);
  expect((await page.evaluate(() => window.__game?.dev.bonfire()))?.playerState).toBe('sitDown');
  expect(errors).toEqual([]);
});
