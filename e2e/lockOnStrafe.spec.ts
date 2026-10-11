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

/**
 * #256（再発）: 背骨のひねり（上半身を対象へ戻す）が毎フレーム積み重なって上半身が回り続けていた。
 * three のミキサーは合成結果が前フレームと同じだとボーンへ書き込まないため、描画フレームがステップより多い
 * （高リフレッシュレート・ヒットストップ・ステップの無いフレーム）と前フレームのひねりの上にまたひねっていた。
 * 実機と同じく 1 フレーム 1 ステップで進めた後、ステップの無いフレームを描き、上半身（両肩）の向きを毎フレーム測る。
 */
test('the upper body does not keep spinning while strafing locked on', async ({ page }) => {
  await page.goto('./?quality=low&scale=0.25');
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 90_000 })
    .toBeGreaterThan(30);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
    window.__game?.dev.teleport(17, 6, Math.PI / 2);
    window.__game?.dev.advance(5);
  });
  await tapKey(page, 'KeyQ');
  await page.evaluate(() => window.__game?.dev.advance(10));
  expect(await page.evaluate(() => window.__game?.sim.lockOn.targetId)).toBe('b-undead-1');

  // 上半身の向き − 対象方向（ラジアン）
  const sample = (): Promise<number> =>
    page.evaluate(() => {
      const g = window.__game;
      const p = g?.sim.player;
      const e = g?.sim.enemies.find((x) => x.id === 'b-undead-1');
      const f = g?.dev.playerFacing();
      if (!p || !e || !f) throw new Error('game state is not available');
      return f.chestYaw - Math.atan2(e.x - p.position.x, e.z - p.position.z);
    });
  const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
  let prev = NaN;
  let total = 0;
  let maxStep = 0;
  await page.keyboard.down('KeyD');
  try {
    for (let i = 0; i < 70; i++) {
      const frames = await page.evaluate(() => window.__game?.frames ?? 0);
      // 前半は 1 フレーム 1 ステップ、後半はステップの無いフレーム（120Hz 表示・停止中の描画相当）
      await page.evaluate((n) => window.__game?.dev.advance(n), i < 40 ? 1 : 0);
      await expect
        .poll(() => page.evaluate(() => window.__game?.frames ?? 0))
        .toBeGreaterThan(frames);
      const a = await sample();
      if (i >= 10 && !Number.isNaN(prev)) {
        const d = wrap(a - prev);
        total += d;
        maxStep = Math.max(maxStep, Math.abs(d));
      }
      prev = a;
    }
  } finally {
    await page.keyboard.up('KeyD');
  }
  // 歩行の肩の揺れ（±40° 程度）はあってよいが、一方向へ回り続けない
  expect(Math.abs(total) * (180 / Math.PI)).toBeLessThan(90);
  expect(maxStep * (180 / Math.PI)).toBeLessThan(45);
});
