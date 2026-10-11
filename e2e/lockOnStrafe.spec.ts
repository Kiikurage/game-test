import { expect, test } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 180_000 });

/**
 * #256: ロックオン中に横移動し続けても、キャラクターが対象を向いたまま回らない（本番レベル・実際の敵）。
 * ゲームの向き（`player.yaw`）が対象方向から一定以内で、描画上の体の向き（`bodyYawOffset`）が
 * 移動方向に応じた一定の符号を保つ（±60° の間を往復しない）。
 * 描画の更新が要るので `?nodraw` は付けず、シミュレーションを止めて決まったステップずつ進める。
 */
for (const [key, sign] of [
  ['KeyD', -1],
  ['KeyA', 1],
] as const) {
  test(`strafing with ${key} while locked on keeps facing the enemy and the body steady`, async ({
    page,
  }) => {
    await page.goto('./?quality=low&scale=0.25');
    await startGame(page);
    await expect
      .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 90_000 })
      .toBeGreaterThan(30);
    await page.evaluate(() => {
      window.__game?.dev.pause(true);
      // b-undead-1 は (22, 6) で西を向いて立っている。その手前 8m からロックオンする
      window.__game?.dev.teleport(14, 6, Math.PI / 2);
      window.__game?.dev.advance(5);
    });
    await tapKey(page, 'KeyQ');
    await page.evaluate(() => window.__game?.dev.advance(10));
    expect(await page.evaluate(() => window.__game?.sim.lockOn.targetId)).toBe('b-undead-1');

    await page.keyboard.down(key);
    try {
      for (let i = 0; i < 30; i++) {
        await page.evaluate(() => window.__game?.dev.advance(10));
        const frames = await page.evaluate(() => window.__game?.frames ?? 0);
        await expect
          .poll(() => page.evaluate(() => window.__game?.frames ?? 0))
          .toBeGreaterThan(frames + 2);
        const r = await page.evaluate(() => {
          const g = window.__game;
          const p = g?.sim.player;
          const e = g?.sim.enemies.find((x) => x.id === 'b-undead-1');
          if (!g || !p || !e) throw new Error('game state is not available');
          return {
            state: p.state,
            yaw: p.yaw,
            to: Math.atan2(e.x - p.position.x, e.z - p.position.z),
            offset: g.playerView?.bodyYawOffset ?? NaN,
          };
        });
        expect(r.state).toBe('move');
        let diff = r.yaw - r.to;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        expect(Math.abs(diff)).toBeLessThan(0.4);
        // 体は移動方向（右移動なら右）へ一定に向く。折り返しで反対側へ振れない
        if (i >= 3) expect(r.offset * sign).toBeGreaterThan(0.3);
      }
    } finally {
      await page.keyboard.up(key);
    }
  });
}
