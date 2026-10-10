import { expect, test } from '@playwright/test';
import { startGame, waitFrames } from './helpers';

/** 闘技場の描画: 台座の篝火スロット・柱の破片の口・闘技場に近づくとライティングが移る（#45）。 */
test('the arena exposes the bonfire slot and the pillar debris hook, and eases the mood in', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw');
  await startGame(page);

  const info = await page.evaluate(() => window.__game?.dev.arenaInfo() ?? null);
  expect(info?.pillars).toBe(4);
  expect(info?.bonfireSlot.x).toBe(122);
  expect(info?.bonfireSlot.z).toBe(86);
  expect(info?.bonfireSlot.y).toBeGreaterThan(9);
  // 篝火の広場（A）は黄昏のまま
  expect(info?.moodWeight).toBe(0);
  expect(info?.pillarHits).toBe(0);

  // 柱の破片の口（bossPillarHit と同じ経路）
  await page.evaluate(() => {
    window.__game?.dev.arenaPillarHit(2);
  });
  const hits = await page.evaluate(() => window.__game?.dev.arenaInfo()?.pillarHits);
  expect(hits).toBe(1);

  // 闘技場へ入ると、ムードが 0 → 1 へ滑らかに移る（瞬間移動でも 1 フレームでは変わらない）
  await page.evaluate(() => {
    window.__game?.dev.arenaEnter();
  });
  await waitFrames(page, 2);
  const early = await page.evaluate(() => window.__game?.dev.arenaInfo()?.moodWeight ?? -1);
  expect(early).toBeGreaterThan(0);
  expect(early).toBeLessThan(1);
  await expect
    .poll(() => page.evaluate(() => window.__game?.dev.arenaInfo()?.moodWeight ?? 0), {
      timeout: 60_000,
    })
    .toBe(1);
  expect(errors).toEqual([]);
});
