import { expect, test, type Page } from '@playwright/test';
import { holdKey, startGame, tapKey, waitSteps } from './helpers';

test.describe.configure({ timeout: 180_000 });

/** 霧の門 (104, 68)。通り抜ける向きは北東（yaw 45°）。 */
const GATE = { x: 104, z: 68 };
const DEG = Math.PI / 180;

/** 門の前方（北東 = 闘技場側）への距離（m）。正なら闘技場側。 */
const along = (p: { x: number; z: number }): number =>
  (p.x - GATE.x) * Math.sin(45 * DEG) + (p.z - GATE.z) * Math.cos(45 * DEG);

async function boot(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
  await expect.poll(() => page.evaluate(() => window.__game?.sim.player.grounded)).toBe(true);
  expect(errors).toEqual([]);
}

const fogGate = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    const g = dev.fogGate();
    if (!g) throw new Error('no fog gate');
    return g;
  });

const teleport = (page: Page, x: number, z: number, yawDeg: number) =>
  page.evaluate(
    ([px, pz, yaw]) => {
      window.__game?.dev.teleport(px as number, pz as number, ((yaw as number) * Math.PI) / 180);
    },
    [x, z, yawDeg],
  );

test('walks into the fog gate from the courtyard and reaches the arena; the gate seals behind', async ({
  page,
}) => {
  await boot(page);
  // 中庭側の門の前。閉じた霧の門は通れず、状況アクション「霧へ入る」が出る
  await teleport(page, 102.4, 66.4, 45);
  await expect.poll(async () => (await fogGate(page)).prompt).toBe('霧へ入る');
  expect((await fogGate(page)).state).toBe('closed');
  await holdKey(page, 'KeyW', 60);
  expect(along((await fogGate(page)).player)).toBeLessThan(0);

  // 入力（E）で入場演出: 操作不能のあと、闘技場の入場位置へ
  await teleport(page, 102.4, 66.4, 45);
  await expect.poll(async () => (await fogGate(page)).prompt).toBe('霧へ入る');
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await fogGate(page)).state).toBe('entering');
  // 演出中はボタンを押しても動作に入らない
  await tapKey(page, 'Space');
  await expect.poll(async () => (await fogGate(page)).entered, { timeout: 120_000 }).toBe(1);
  const entered = await fogGate(page);
  expect(entered.state).toBe('sealed');
  expect(entered.blocked).toBe(true);
  // 闘技場（中心 (122, 86)）の内側
  expect(Math.hypot(entered.player.x - 122, entered.player.z - 86)).toBeLessThan(16);

  // 封鎖中は戻れない: 門の闘技場側から門へ向かっても通れない
  await teleport(page, 106.4, 70.4, 225);
  await waitSteps(page, 5);
  await holdKey(page, 'KeyW', 90);
  const after = await fogGate(page);
  expect(along(after.player)).toBeGreaterThan(0);

  // 解除（ボス撃破）で霧が消え、通れる
  await page.evaluate(() => window.__game?.dev.fogGateControl('unseal'));
  expect((await fogGate(page)).state).toBe('open');
  await teleport(page, 106.4, 70.4, 225);
  await waitSteps(page, 5);
  await holdKey(page, 'KeyW', 120);
  expect(along((await fogGate(page)).player)).toBeLessThan(0);
});
