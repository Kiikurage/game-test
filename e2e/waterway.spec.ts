import { expect, test, type Page } from '@playwright/test';
import { bootGame, holdKey } from './helpers';

/**
 * 脇道 side_waterway（#111）の描画。走破（床板 → 水路 → 墓室 → 鉄格子 → D の通路）はブラウザ無しで検証している
 * （src/game/world/levelTraversal.test.ts）。
 */

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する。敵は置かない（地形の検証）。シミュレーションは止めたまま進める。 */
const boot = (page: Page) => bootGame(page, { enemies: false });

const sim = (page: Page) =>
  page.evaluate(() => {
    const s = window.__game?.sim;
    if (!s) throw new Error('sim state unavailable');
    return s;
  });

const teleport = (page: Page, x: number, z: number, yaw: number, y?: number) =>
  page.evaluate(
    ([px, pz, pyaw, py]) => {
      window.__game?.dev.teleport(px, pz, pyaw, py);
    },
    [x, z, yaw, y] as const,
  );

/** カメラをプレイヤーの向き + offset の背後へ置き直す（前進は常にカメラ前方へ進む）。 */
const aimCamera = (page: Page, yawOffset: number) =>
  page.evaluate((o) => {
    window.__game?.dev.view(o, 4.2, 15);
  }, yawOffset);

const WATER_FLOOR = 1.0;

test('the waterway water is built and drawn only while the player is down there, and skipped under nodraw (#270)', async ({
  page,
}) => {
  await boot(page);
  const render = () => page.evaluate(() => window.__game?.dev.waterwayRender());
  const start = (await sim(page)).player.position;
  await expect.poll(async () => (await render())?.built).toBe(true);
  // 地上（開始位置）では水路を描かない
  await expect.poll(async () => (await render())?.visible).toBe(false);

  await page.evaluate(() => window.__game?.dev.breakHatch());
  await teleport(page, 47, 28, Math.PI / 2, WATER_FLOOR + 0.02);
  await aimCamera(page, 0);
  await expect.poll(async () => (await render())?.visible).toBe(true);
  await expect.poll(async () => (await render())?.moodWeight ?? 0).toBeGreaterThan(0.99);
  // low は平面反射を描かない
  expect((await render())?.reflection).toBe(false);

  // ?nodraw では GPU の波のシミュレーションを作らない（歩いても進まない）
  await holdKey(page, 'KeyW', 30);
  expect((await render())?.simSteps).toBe(0);

  // 地上へ戻ると描かない・霧の調子も戻る
  await teleport(page, start.x, start.z, 0, start.y);
  await expect.poll(async () => (await render())?.visible).toBe(false);
  await expect.poll(async () => (await render())?.moodWeight ?? 1).toBeLessThan(0.01);
});
