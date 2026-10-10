import { expect, test } from '@playwright/test';
import { startGame } from './helpers';

// 地下墓所（D）・中庭（E）・鉄門 G1 の石積み環境（#44）。D の通路・E を走って壁抜け・引っ掛かりがないことは
// `level.spec.ts`（メインルート全体を入力だけで走破）と `levelWalk.test.ts`（コライダ）が見ている。
// ここでは、環境が組み立てられて可動パーツが取れること・動かしてもエラーが出ないことを確認する。
test('builds the crypt and courtyard environment with movable lid, gate leaves and lever', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);

  const info = await page.evaluate(() => window.__game?.dev.cryptInfo() ?? null);
  expect(info).not.toBeNull();
  expect(info?.lid).toBe(true);
  expect(info?.gateLeaves).toBe(2);
  expect(info?.lever).toBe(true);
  // 小物・石積みの三角形は予算内（D・E・G1 で数万以内）
  expect(info?.triangles).toBeGreaterThan(1000);
  expect(info?.triangles).toBeLessThan(80_000);

  // 可動パーツを開閉してもエラーにならない（姿勢の変更は見た目だけ。コライダ・ゲーム状態は変わらない）
  await page.evaluate(() => {
    window.__game?.dev.poseCrypt({ lid: 1, gate: 1, lever: 1 });
  });
  await page.evaluate(() => {
    window.__game?.dev.poseCrypt({ lid: 0, gate: 0, lever: 0 });
  });
  expect(errors).toEqual([]);
});
