import { expect, test, type Page } from '@playwright/test';
import { bootGame, holdKey, stepUntil, tapKey, walkThrough, waitSteps } from './helpers';

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する。地形・壁の検証なので、敵（経路上に立つ）は置かない。 */
const boot = (page: Page) => bootGame(page, { enemies: false });

const sim = (page: Page) =>
  page.evaluate(() => {
    const s = window.__game?.sim;
    if (!s) throw new Error('sim state unavailable');
    return s;
  });

/** 入力（前進の注入）だけで経由点を順に歩く。各経由点の手前（1.5m 以内）で次へ向きを変える。経由点ごとの高さを返す。 */
async function walkRoute(page: Page, route: readonly (readonly [number, number])[]) {
  const heights: number[] = [];
  for (const wp of route) {
    await walkThrough(page, [wp], 1.5, 40);
    heights.push((await sim(page)).player.position.y);
  }
  return heights;
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
  const trail = await walkRoute(page, route);
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
  await holdKey(page, 'KeyW', 150);
  const p = (await sim(page)).player.position;
  expect(p.x).toBeLessThan(39.8);
});

test('the player can walk from the bonfire through C, the catacomb D and the courtyard E to the arena F', async ({
  page,
}) => {
  await boot(page);
  // 霧の門は最初は閉じている（#66。入場演出は fogGate.spec.ts）。通行可能性の検証なので解除しておく
  await page.evaluate(() => window.__game?.dev.fogGateControl('unseal'));
  // メインルート全体を入力（W 押しっぱなし + 向き）だけで走破する。テレポートはしない
  const route: [number, number][] = [
    [10, 0],
    [22, 6],
    [32, 12],
    [40, 17],
    [52, 17],
    [58, 21],
    [58.5, 27],
    [61, 28],
    [62, 36],
    [62, 46],
    [63.5, 48.5],
    [78, 48.5],
    [84, 51],
    [91.5, 52.5],
    [98.5, 56],
    [102, 62],
    [104, 68],
    [111, 75],
    [118, 82],
  ];
  await walkRoute(page, route);
  const end = (await sim(page)).player;
  // 闘技場の床（高さ 9.9m）の上に立っている。壁抜け・落下はしていない
  expect(Math.hypot(end.position.x - 118, end.position.z - 82)).toBeLessThan(2);
  expect(end.position.y).toBeGreaterThan(9.6);
  expect(end.position.y).toBeLessThan(10.3);
  expect(end.grounded).toBe(true);
});

test('rolling in the 2.5m catacomb corridor does not pass through its walls', async ({ page }) => {
  await boot(page);
  // L 字の第 1 区間（x 60.75..63.25）の中央から東の壁へ向かってロール（W + Space の短押し）
  await page.evaluate(() => {
    window.__game?.dev.teleport(62, 42, Math.PI / 2);
  });
  await waitSteps(page, 30);
  await page.keyboard.down('KeyW');
  await tapKey(page, 'Space');
  await stepUntil(
    page,
    async () => (await sim(page)).events.rollStart,
    (v) => v === 1,
    {
      chunk: 1,
    },
  );
  await waitSteps(page, 90);
  await page.keyboard.up('KeyW');
  const p = (await sim(page)).player.position;
  expect(p.x).toBeGreaterThan(60.75);
  expect(p.x).toBeLessThan(63.25);
});

test('?scene=test still opens the old test scene', async ({ page }) => {
  await bootGame(page, { scene: 'test' });
  const p = (await sim(page)).player.position;
  expect(Math.abs(p.x)).toBeLessThan(0.5);
  expect(Math.abs(p.z - 3.5)).toBeLessThan(0.5);
});
