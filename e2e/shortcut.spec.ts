import { expect, test, type Page } from '@playwright/test';
import { holdKey, startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 180_000 });

/** 鉄門 G1 (78, 32)、レバー (80, 36)。レバーは中庭側（北）。 */
const GATE = { x: 78, z: 32 };
/** 門を通り抜ける向き（A 側 → 中庭側）のヨー。A 側から (68, 8) → G1 の道に沿う。 */
const YAW = Math.atan2(GATE.x - 68, GATE.z - 8);
const FWD = { x: Math.sin(YAW), z: Math.cos(YAW) };

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

const shortcut = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    const s = dev.shortcut();
    if (!s) throw new Error('no shortcut');
    return s;
  });

const playerPos = (page: Page) =>
  page.evaluate(() => {
    const feet = window.__game?.sim.player.position;
    if (!feet) throw new Error('no player');
    return { x: feet.x, z: feet.z };
  });

const teleport = (page: Page, x: number, z: number, yaw: number) =>
  page.evaluate(
    ([px, pz, y]) => {
      window.__game?.dev.teleport(px as number, pz as number, y as number);
    },
    [x, z, yaw],
  );

test('pulls the lever from the courtyard side, then runs south through G1 to area A', async ({
  page,
}) => {
  await boot(page);
  expect(await shortcut(page)).toMatchObject({ state: 'closed', blocked: true });

  // 閉じた門は南からも北からも通れない（北から南へ歩いても門の北側に留まる）
  await teleport(page, GATE.x + FWD.x * 3, GATE.z + FWD.z * 3, YAW + Math.PI);
  await holdKey(page, 'KeyW', 120);
  expect((await playerPos(page)).z).toBeGreaterThan(GATE.z);

  // レバーの手前（中庭側）で「押す」が出る
  await teleport(page, 80.2, 37, Math.atan2(80 - 80.2, 36 - 37));
  await expect.poll(async () => (await shortcut(page)).prompt).toBe('押す');
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await shortcut(page)).state).toBe('opening');
  await expect.poll(async () => (await shortcut(page)).state, { timeout: 90_000 }).toBe('open');
  expect(await shortcut(page)).toMatchObject({ blocked: false, gateProgress: 1 });
  const saved = await page.evaluate(() => {
    const raw = localStorage.getItem('gametest.save.v1');
    return raw ? (JSON.parse(raw) as { data: { shortcuts: string[] } }).data.shortcuts : [];
  });
  expect(saved).toEqual(['G1']);

  // 北から G1 を南へ抜けて、A への道（南南西）へ出る
  await teleport(page, GATE.x + FWD.x * 3, GATE.z + FWD.z * 3, YAW + Math.PI);
  await holdKey(page, 'KeyW', 150);
  expect((await playerPos(page)).z).toBeLessThan(GATE.z - 3);
});

test('an opened shortcut stays open after reloading', async ({ page }) => {
  await boot(page);
  await teleport(page, 80.2, 37, Math.atan2(80 - 80.2, 36 - 37));
  await expect.poll(async () => (await shortcut(page)).prompt).toBe('押す');
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await shortcut(page)).state, { timeout: 90_000 }).toBe('open');

  await page.reload();
  await boot(page);
  expect(await shortcut(page)).toMatchObject({ state: 'open', blocked: false, prompt: null });
  // 南（A 側）から G1 を北へ通り抜けられる
  await teleport(page, GATE.x - FWD.x * 5, GATE.z - FWD.z * 5, YAW);
  await holdKey(page, 'KeyW', 150);
  expect((await playerPos(page)).z).toBeGreaterThan(GATE.z + 2);
});
