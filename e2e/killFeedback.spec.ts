import { expect, test } from '@playwright/test';
import { startGame } from './helpers';

// #281: 雑魚敵の撃破は、トドメの命中で撃破 SE が鳴り、ロックオンが外れ（近くに次の敵がいなければ）、
// 死体への追い打ちは命中にならない。シミュレーションを止めて dev.advance で進めるので、実時間に依存しない。
test('killing an enemy plays the kill SE, drops the lock-on and ignores hits on the corpse', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw');
  await startGame(page);
  const id = await page.evaluate(() => {
    const g = window.__game;
    if (!g) throw new Error('no game');
    g.dev.pause(true);
    g.dev.killEnemy(0, false); // 敵の手前へ移動するだけ
    return g.sim.enemies[0]?.id ?? '';
  });
  expect(id).not.toBe('');
  await page.evaluate((enemyId) => {
    window.__game?.dev.lock(enemyId);
    window.__game?.dev.advance(2);
  }, id);
  expect(await page.evaluate(() => window.__game?.sim.lockOn.targetId)).toBe(id);

  const strike = await page.evaluate(() => window.__game?.dev.strikeEnemy(0));
  expect(strike?.killed).toBe(true);
  expect(strike?.sounds).toContain('sfx.defeat-collapse');

  await page.evaluate(() => window.__game?.dev.advance(1));
  expect(await page.evaluate(() => window.__game?.sim.lockOn.targetId)).not.toBe(id);

  // 死体を何度斬っても命中にならない（命中 SE も出ない）
  for (let i = 0; i < 3; i++) {
    const again = await page.evaluate(() => window.__game?.dev.strikeEnemy(0, 50));
    expect(again).toEqual({ hit: false, killed: false, sounds: [] });
    await page.evaluate(() => window.__game?.dev.advance(4));
  }
  expect(errors).toEqual([]);
});
