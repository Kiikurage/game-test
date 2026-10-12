import { expect, test, type Page } from '@playwright/test';
import { bootGame, holdKey, stepUntil, tapKey } from './helpers';

/** 鉄門 G1 (78, 32)、レバー (80, 36)。レバーは中庭側（北）。 */
const GATE = { x: 78, z: 32 };
/** 門を通り抜ける向き（A 側 → 中庭側）のヨー。A 側から (68, 8) → G1 の道に沿う。 */
const YAW = Math.atan2(GATE.x - 68, GATE.z - 8);
const FWD = { x: Math.sin(YAW), z: Math.cos(YAW) };

const boot = (page: Page) => bootGame(page, { enemies: false });

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
  await stepUntil(
    page,
    () => shortcut(page),
    (s) => s.prompt === '押す',
  );
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    () => shortcut(page),
    (s) => s.state === 'opening',
  );
  await stepUntil(
    page,
    () => shortcut(page),
    (s) => s.state === 'open',
    { maxSteps: 1800 },
  );
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
  await stepUntil(
    page,
    () => shortcut(page),
    (s) => s.prompt === '押す',
  );
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    () => shortcut(page),
    (s) => s.state === 'open',
    { maxSteps: 1800 },
  );

  await boot(page); // 同じコンテキストで開き直す（localStorage は残る）
  expect(await shortcut(page)).toMatchObject({ state: 'open', blocked: false, prompt: null });
  // 南（A 側）から G1 を北へ通り抜けられる
  await teleport(page, GATE.x - FWD.x * 5, GATE.z - FWD.z * 5, YAW);
  await holdKey(page, 'KeyW', 150);
  expect((await playerPos(page)).z).toBeGreaterThan(GATE.z + 2);
});
