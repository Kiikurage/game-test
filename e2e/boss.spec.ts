import { expect, test } from '@playwright/test';
import { startGame } from './helpers';

/** ボス AI 基盤の確認シーン（`?scene=test&boss`。未実装の技はスタブで埋まる）。 */
test('the boss showcase spawns the boss, which beats, picks moves and shows the debug overlay', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?scene=test&boss&debug&quality=low&scale=0.25&nodraw');
  await startGame(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });

  const initial = await page.evaluate(() => window.__game?.dev.bossDebug() ?? null);
  expect(initial?.state).toBe('beat');
  expect(initial?.phase).toBe(1);
  expect(initial?.hp).toBe(2400);

  // 数秒ずつ進めて、ビートを挟んで技を複数回選ぶのを待つ（棒立ちのプレイヤーは技 4・5 などで死ぬとボスが待機へ戻って履歴が消えるので、
  // 死ぬ前に履歴が貯まったところで確認する）
  let later = initial;
  for (let i = 0; i < 12 && (later?.history.length ?? 0) < 2; i++) {
    await page.evaluate(() => {
      window.__game?.dev.advance(90);
    });
    later = await page.evaluate(() => window.__game?.dev.bossDebug() ?? null);
  }
  expect(later?.history.length).toBeGreaterThanOrEqual(2);
  expect(later?.weights?.entries.length).toBeGreaterThan(0);
  expect(['close', 'mid', 'far']).toContain(later?.band);

  // ?debug の表示（距離帯・直前の技・選択重み）
  await expect(page.locator('.boss-debug')).toContainText('band');
  expect(errors).toEqual([]);
});
