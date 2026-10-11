import { expect, test, type Page } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 120_000 });

const marks = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.lootMarks();
  });

// 調べる対象（遺体・遺品）の目印と仮の遺体（#248）。描画の値は `window.__game.dev.lootMarks()` で読む。
test('unlooted targets show a marker that disappears once looted; corpses get a placeholder body', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__game?.sim.player.grounded)).toBe(true);

  // 開始位置から見える範囲の未取得の遺体に目印が出る
  await expect.poll(async () => (await marks(page)).marks).toContain('corpse_b_flask');
  // 遺体の位置に仮モデル（静的メッシュ）がある。新規アセットなしで既存の騎士から作る
  const bodies = (await marks(page)).corpses;
  expect(bodies.map((b) => b.id)).toEqual(
    expect.arrayContaining(['corpse_b_flask', 'corpse_roof', 'corpse_ledge']),
  );
  for (const b of bodies) expect(b.triangles).toBeGreaterThan(500);

  // 近づくと遺体が見える（遠くでは描かない）
  await page.evaluate(() => {
    window.__game?.dev.teleport(24, 7.8, 0);
  });
  await expect
    .poll(async () => (await marks(page)).corpses.find((b) => b.id === 'corpse_b_flask')?.visible)
    .toBe(true);

  // 調べると目印が消える（遺体は残る）
  await tapKey(page, 'KeyE');
  await expect
    .poll(() => page.evaluate(() => window.__game?.dev.interactables().flags), { timeout: 60_000 })
    .toContain('loot.corpse_b_flask');
  await expect.poll(async () => (await marks(page)).marks).not.toContain('corpse_b_flask');
  expect((await marks(page)).corpses.map((b) => b.id)).toContain('corpse_b_flask');
  expect(errors).toEqual([]);
});
