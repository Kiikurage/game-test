import { expect, test, type Page } from '@playwright/test';
import { bootGame, waitSteps } from './helpers';

/** 既定のレベルを最小品質・低解像度で起動する（敵は置かない。被弾は dev.hitPlayer で本物の命中経路に流す）。 */
const boot = (page: Page) => bootGame(page, { enemies: false });

const fx = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.cameraFx();
  });

test('被弾でカメラが振動し、強度 OFF では振動しない', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.teleport(6, 6, 0);
  });
  await waitSteps(page, 5); // 被弾側の位置が追従してから当てる
  await page.evaluate(() => {
    window.__game?.dev.cameraFxResetPeaks();
    window.__game?.dev.hitPlayer({ from: 'front' });
  });
  await waitSteps(page, 20);
  const hit = await fx(page);
  expect(hit.peak.shakeDeg).toBeGreaterThanOrEqual(0.3 - 1e-6);
  expect(hit.output.shakeDeg).toBe(0); // 6F で止まっている

  await page.evaluate(() => {
    window.__game?.dev.cameraFxStrength(0);
    window.__game?.dev.cameraFxResetPeaks();
    window.__game?.dev.cameraFxPlay('hitHeavy');
  });
  await waitSteps(page, 20);
  const off = await fx(page);
  expect(off.strength).toBe(0);
  expect(off.peak.shakeDeg).toBe(0);
  expect(off.peak.fovOffsetDeg).toBe(0);
});

test('フェーズ移行クリップで FOV が動き、終われば戻る', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.cameraFxResetPeaks();
    window.__game?.dev.cameraFxPlay('phase');
  });
  await waitSteps(page, 140);
  const after = await fx(page);
  expect(after.clips).toEqual([]);
  expect(after.peak.fovOffsetDeg).toBeCloseTo(6, 3);
  expect(after.peak.shakeDeg).toBeGreaterThan(0.5);
  expect(after.output.fovOffsetDeg).toBe(0);
});
