import { expect, test, type Page } from '@playwright/test';
import { startGame } from './helpers';
import { PERF_VIEWPOINTS } from '../scripts/perfViewpoints.mjs';
import { RENDER_BUDGET } from '../src/render/renderBudget';
import type { QualityLevel } from '../src/render/quality';

/** 計測視点へ移動し、数フレーム描いてから直近フレームの draws / tris を読む（解像度は負荷に影響しないので低解像度で動かす）。 */
async function measure(
  page: Page,
  view: { x: number; z: number; yaw: number },
): Promise<{ draws: number; tris: number }> {
  await page.evaluate((v) => {
    window.__game?.dev.teleport(v.x, v.z, v.yaw);
    window.__game?.dev.view(0);
  }, view);
  const start = await page.evaluate(() => window.__game?.frames ?? 0);
  await expect
    .poll(() => page.evaluate(() => window.__game?.frames ?? 0), { timeout: 120_000 })
    .toBeGreaterThan(start + 20);
  return page.evaluate(() => ({
    draws: window.__game?.render.drawCalls ?? NaN,
    tris: window.__game?.render.triangles ?? NaN,
  }));
}

// 描画負荷の予算（docs/performance.md）。篝火・墓地・礼拝堂の門・礼拝堂内部の各視点で上限を超えない
for (const level of ['medium', 'low'] as const satisfies readonly QualityLevel[]) {
  test(`draw calls and triangles stay within the ${level} budget at every viewpoint`, async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`./?quality=${level}&scale=0.25`);
    await startGame(page);

    const budget = RENDER_BUDGET[level];
    const results: string[] = [];
    for (const view of PERF_VIEWPOINTS) {
      const { draws, tris } = await measure(page, view);
      results.push(`${view.name}: ${draws} draws / ${tris} tris`);
      expect(draws, `${view.name} draw calls`).toBeGreaterThan(0);
      expect(draws, `${view.name} draw calls (${results.join(', ')})`).toBeLessThanOrEqual(
        budget.drawCalls,
      );
      expect(tris, `${view.name} triangles (${results.join(', ')})`).toBeLessThanOrEqual(
        budget.triangles,
      );
    }
    expect(errors).toEqual([]);
  });
}

// `?debug` の HUD にカテゴリ別の内訳が出る
test('the debug HUD shows the draw call breakdown', async ({ page }) => {
  await page.goto('./?debug&quality=low&scale=0.25');
  await startGame(page);
  await expect(page.locator('.debug-hud')).toContainText('terrain', { timeout: 30_000 });
  await expect(page.locator('.debug-hud')).toContainText('character');
});
