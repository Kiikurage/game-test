// 撃破演出の撮影（#281）: 通常の命中と、撃破の F0/F2/F10/F20/F40/F60 を同じページで撮る。
const OUT = process.env.KILL_OUT ?? '/tmp/claude-0/-home-user-game-test/31f8f843-5216-5ee9-851d-3ca43c4a860a/scratchpad/kill';
const ENEMY = Number(process.env.KILL_ENEMY ?? 0);

const frames = (page, n) =>
  page.evaluate(
    (k) =>
      new Promise((resolve) => {
        let i = 0;
        const tick = () => (++i >= k ? resolve() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
      }),
    n,
  );

export default async function (page, { name }) {
  await page.evaluate((idx) => {
    const g = window.__game;
    g.dev.pause(true);
    const p = g.dev.killEnemy(idx, false);
    g.dev.teleport(p.x - 0.6, p.z - 2.4, 0.25, p.y);
    g.dev.view(0.35, 3.2, 8);
    g.dev.advance(2);
  }, ENEMY);
  await frames(page, 6);
  await page.screenshot({ path: `${OUT}-${name}-alive.png`, timeout: 240_000 });
  await page.evaluate((idx) => window.__game.dev.strikeEnemy(idx, 1), ENEMY);
  await frames(page, 1);
  await page.screenshot({ path: `${OUT}-${name}-hit.png`, timeout: 240_000 });
  await page.evaluate(() => window.__game.dev.advance(40));
  await frames(page, 30);
  const r = await page.evaluate((idx) => window.__game.dev.strikeEnemy(idx), ENEMY);
  console.log('strike', JSON.stringify(r));
  await frames(page, 1);
  await page.screenshot({ path: `${OUT}-${name}-F0.png`, timeout: 240_000 });
  let f = 0;
  for (const target of [2, 10, 20, 40, 60]) {
    await page.evaluate((n) => window.__game.dev.advance(n), target - f);
    f = target;
    await frames(page, 1);
    await page.screenshot({ path: `${OUT}-${name}-F${target}.png`, timeout: 240_000 });
  }
}
