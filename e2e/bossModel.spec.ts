import { expect, test, type Page } from '@playwright/test';
import { startGame, waitFrames } from './helpers';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test('shows the boss model in phase 1 and phase 2 without errors (#57)', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./?scene=test&bossmodel=1&cam=combat&quality=low&scale=0.25');
  await startGame(page);
  await waitFrames(page, 10);
  await page.goto('./?scene=test&bossmodel=2&cam=up&quality=low&scale=0.25');
  await startGame(page);
  await waitFrames(page, 10);
  expect(errors).toEqual([]);
});

test('throws the shield away on the phase transition without errors (#57)', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./?scene=test&bossmodel=2&throw=1&cam=wide&quality=low&scale=0.25');
  await startGame(page);
  await waitFrames(page, 30);
  expect(errors).toEqual([]);
});

for (const [id, speed] of [
  ['walk', 2.4],
  ['run1', 4.2],
  ['run2', 4.8],
] as const) {
  test(`the stance foot keeps up with the ground speed at ${id} (#57)`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`./?scene=test&bossmodel=1&gait=${id}&quality=low&scale=0.25&nodraw`);
    await startGame(page);
    // 歩行位相は固定刻み（1/60 秒）でフレームごとに進む。1 サイクル（約 1.5 秒 = 90 フレーム）を超えるまで待つ
    await expect
      .poll(() => page.evaluate(() => window.__bossGait?.samples ?? 0), { timeout: 120_000 })
      .toBeGreaterThan(200);
    const gait = await page.evaluate(() => window.__bossGait);
    expect(gait?.commanded).toBeCloseTo(speed, 5);
    // 接地している足の後退速度（中央値）が移動速度に近い（実測: 歩き 約 −15%、走り 約 −3%）
    expect(Math.abs((gait?.stanceSpeed ?? 0) - speed) / speed).toBeLessThan(0.25);
    expect(errors).toEqual([]);
  });
}
