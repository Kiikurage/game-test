import { expect, test, type Page } from '@playwright/test';
import { webgpuCompatInit } from '../scripts/webgpuCompat.mjs';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(webgpuCompatInit);
});

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する。 */
async function boot(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  // 地形・壁の検証なので、敵（経路上に立つ）は置かない
  await page.goto('./?quality=low&scale=0.25&enemies=0');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
  await expect.poll(async () => (await sim(page)).player.grounded).toBe(true);
  expect(errors).toEqual([]);
}

const sim = (page: Page) =>
  page.evaluate(() => {
    const s = window.__game?.sim;
    if (!s) throw new Error('sim state unavailable');
    return s;
  });

/** カメラをプレイヤーの向き + offset の背後へ置き直す（W は常にカメラ前方へ進むので、これで進行方向を決める）。 */
const aimCamera = (page: Page, yawOffset: number) =>
  page.evaluate((o) => {
    window.__game?.dev.view(o, 4.2, 15);
  }, yawOffset);

/** 入力（W 押しっぱなし）だけで経由点を順に歩く。各経由点の手前（1.5m 以内）で次へ向きを変える。 */
async function walkThrough(page: Page, waypoints: readonly (readonly [number, number])[]) {
  await page.keyboard.down('KeyW');
  try {
    for (const [wx, wz] of waypoints) {
      const deadline = Date.now() + 40_000;
      for (;;) {
        const p = (await sim(page)).player;
        const dx = wx - p.position.x;
        const dz = wz - p.position.z;
        if (Math.hypot(dx, dz) < 1.5) break;
        expect(
          Date.now(),
          `timed out before (${wx}, ${wz}) at ${JSON.stringify(p.position)}`,
        ).toBeLessThan(deadline);
        // 目標方向 - 現在のカメラ向き。カメラ前方（-sin/-cos ではなく、ヨーの前方 = (sin, cos)）へ合わせる
        const camYaw = (await sim(page)).camera.yaw;
        const want = Math.atan2(dx, dz);
        let diff = want - camYaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        if (Math.abs(diff) > 0.12) await aimCamera(page, want - p.yaw);
        await page.waitForTimeout(80);
      }
    }
  } finally {
    await page.keyboard.up('KeyW');
  }
}

test('starts at the bonfire in area A on the level terrain', async ({ page }) => {
  await boot(page);
  const p = (await sim(page)).player;
  expect(Math.hypot(p.position.x, p.position.z)).toBeLessThan(4);
  expect(Math.abs(p.position.y)).toBeLessThan(0.3);
  expect(p.state).toBe('idle');
});

test('the player can walk from the bonfire through B to the chapel C without getting stuck', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await boot(page);
  // メインルート: A → B の小径（緩い上り）→ 礼拝堂の西の門 → 身廊 → 祭壇の手前
  const route: [number, number][] = [
    [10, 0],
    [22, 6],
    [32, 12],
    [40, 17],
    [50, 17],
    [50, 22],
  ];
  const trail: number[] = [];
  const watch = setInterval(() => {
    void sim(page)
      .then((s) => trail.push(s.player.position.y))
      .catch(() => undefined);
  }, 500);
  try {
    await walkThrough(page, route);
  } finally {
    clearInterval(watch);
  }
  const end = await sim(page);
  // 礼拝堂の床（高さ 3.4m）の上に立っている。壁抜け・落下はしていない
  expect(Math.hypot(end.player.position.x - 50, end.player.position.z - 22)).toBeLessThan(2);
  expect(end.player.position.y).toBeGreaterThan(3.2);
  expect(end.player.position.y).toBeLessThan(3.8);
  expect(Math.min(...trail)).toBeGreaterThan(-0.3);
  expect(end.player.grounded).toBe(true);
});

test('the chapel walls block the player (no walking through them)', async ({ page }) => {
  await boot(page);
  // 西の壁（x=40、z=22 付近は壁）の外側から東へ向かっても通り抜けられない
  await page.evaluate(() => {
    window.__game?.dev.teleport(36, 22, Math.PI / 2);
  });
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2500);
  await page.keyboard.up('KeyW');
  const p = (await sim(page)).player.position;
  expect(p.x).toBeLessThan(39.8);
});

test('?scene=test still opens the old test scene', async ({ page }) => {
  await page.goto('./?scene=test&quality=low&scale=0.25');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
  const p = (await sim(page)).player.position;
  expect(Math.abs(p.x)).toBeLessThan(0.5);
  expect(Math.abs(p.z - 3.5)).toBeLessThan(0.5);
});
