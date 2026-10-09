import { expect, test, type Page } from '@playwright/test';
import { webgpuCompatInit } from '../scripts/webgpuCompat.mjs';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(webgpuCompatInit);
});

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する（`?debug` で敵の可視化も確認）。 */
async function boot(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?debug&quality=low&scale=0.25');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
  return errors;
}

/** シミュレーションを止めて、指定ステップずつ進める（SwiftShader の描画速度に左右されない）。 */
const advance = (page: Page, steps: number) =>
  page.evaluate((n) => {
    window.__game?.dev.advance(n);
  }, steps);

const enemy = (page: Page, id: string) =>
  page.evaluate((enemyId) => {
    const e = window.__game?.sim.enemies.find((x) => x.id === enemyId);
    if (!e) throw new Error(`enemy not found: ${enemyId}`);
    return e;
  }, id);

test('enemies are spawned from the level data and render without errors', async ({ page }) => {
  const errors = await boot(page);
  const count = await page.evaluate(() => window.__game?.sim.enemies.length ?? 0);
  expect(count).toBeGreaterThan(0); // レベルデータの敵の配置（`enemies`）の数だけ生成される
  // ?debug の可視化（状態ラベル）が出ている
  await expect(page.locator('.enemy-debug')).toHaveCount(1);
  await expect.poll(() => page.locator('.enemy-debug div').count()).toBe(count);
  expect(errors).toEqual([]);
});

test('an enemy notices the player, chases, loses sight, and returns to its post', async ({
  page,
}) => {
  const errors = await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });

  // b-undead-1 は (22, 6) で西（-x）を向いて立っている。その正面 8m に立つ。
  await page.evaluate(() => {
    window.__game?.dev.teleport(14, 6, Math.PI / 2);
  });
  await advance(page, 5);
  expect((await enemy(page, 'b-undead-1')).state).toBe('idle');

  // 立ち止まっていても視界の中なら気付きゲージが溜まり、Suspicious → Alert → Chase
  const seen: string[] = [];
  for (let i = 0; i < 400 && !seen.includes('approach'); i++) {
    await advance(page, 3);
    const s = (await enemy(page, 'b-undead-1')).state;
    if (seen[seen.length - 1] !== s) seen.push(s);
  }
  expect(seen).toEqual(['idle', 'suspicious', 'alert', 'chase', 'approach']);
  await advance(page, 120); // Approach で 3m まで詰めて待つ
  const near = await enemy(page, 'b-undead-1');
  const player = (await page.evaluate(() => window.__game?.sim.player.position)) ?? { x: 0, z: 0 };
  expect(Math.hypot(near.x - player.x, near.z - player.z)).toBeLessThan(3.5);

  // 視界の外・聞こえない距離へ移ると、見失って Return し、持ち場へ戻って Idle になる
  await page.evaluate(() => {
    window.__game?.dev.teleport(100, 90, 0);
  });
  for (let i = 0; i < 600; i++) {
    await advance(page, 3);
    if ((await enemy(page, 'b-undead-1')).state === 'return') break;
  }
  expect((await enemy(page, 'b-undead-1')).state).toBe('return');
  for (let i = 0; i < 600; i++) {
    await advance(page, 3);
    if ((await enemy(page, 'b-undead-1')).state === 'idle') break;
  }
  const home = await enemy(page, 'b-undead-1');
  expect(home.state).toBe('idle');
  expect(home.homeDistance).toBeLessThan(0.5);
  expect(errors).toEqual([]);
});
