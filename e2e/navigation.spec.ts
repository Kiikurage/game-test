import { expect, test, type Page } from '@playwright/test';
import { webgpuCompatInit } from '../scripts/webgpuCompat.mjs';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(webgpuCompatInit);
});

/** 既定のレベル（灰の礎）を最小品質・低解像度で `?debug`（ナビゲーションの可視化つき）で起動する。 */
async function boot(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?debug&quality=low&scale=0.25');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  // シミュレーションは dev.advance で手動で進めるので、描画ループが回るのは待たない（SwiftShader は遅い）
  await page.waitForFunction(() => window.__game !== undefined, undefined, { timeout: 30_000 });
  return errors;
}

test('an enemy goes around the rock of the catacombs to reach a player on the other side', async ({
  page,
}) => {
  const errors = await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });

  // d-shield-1 は地下墓所 D の出口側 (74, 49) に立つ。プレイヤーは岩盤（x 63..78, z 35.5..47.25）を
  // 挟んだ南側 (73, 34.5) で、直線距離は約 14.5m。L 字の通路を西へ出て南へ回り込まないと着かない（経路は約 36m）。
  const sample = await page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('game is not ready');
    // sim は読むたびに最新の状態を返す
    const sim = () => {
      const s = window.__game?.sim;
      if (!s) throw new Error('game is not ready');
      return s;
    };
    dev.teleport(73, 34.5, 0);
    dev.advance(2);
    const player = sim().player.position;
    const start = sim().enemies.find((e) => e.id === 'd-shield-1');
    if (!start) throw new Error('enemy not found');
    const trail: [number, number][] = [[start.x, start.z]];
    let inRock = false;
    let state = start.state;
    // 鐘（半径 15m。壁越しに聞こえる）で呼ぶ。視線は岩盤に遮られているので、追跡は聴覚だけで続く。
    for (let i = 0; i < 160 && state !== 'approach'; i++) {
      dev.noise(player.x, player.y, player.z, 'bell');
      dev.advance(10);
      const e = sim().enemies.find((x) => x.id === 'd-shield-1');
      if (!e) throw new Error('enemy lost');
      state = e.state;
      trail.push([e.x, e.z]);
      if (e.x > 63.5 && e.x < 77.8 && e.z > 36 && e.z < 47) inRock = true;
    }
    // Approach は 5m 以内で視認してから 3m まで詰める
    dev.advance(120);
    const e2 = sim().enemies.find((x) => x.id === 'd-shield-1');
    if (e2) trail.push([e2.x, e2.z]);
    let travelled = 0;
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1] as [number, number];
      const b = trail[i] as [number, number];
      travelled += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    const last = trail[trail.length - 1] as [number, number];
    return {
      state,
      travelled,
      inRock,
      distance: Math.hypot(last[0] - player.x, last[1] - player.z),
      minX: Math.min(...trail.map((t) => t[0])),
    };
  });

  expect(sample.state).toBe('approach');
  expect(sample.distance).toBeLessThan(3.6);
  expect(sample.inRock).toBe(false);
  expect(sample.travelled).toBeGreaterThan(28); // 直線 14.5m を壁の向こうへ突っ込まず、通路を回った
  expect(sample.minX).toBeLessThan(63); // 通路の西端（x≈62）まで行って戻った
  expect(errors).toEqual([]);
});
