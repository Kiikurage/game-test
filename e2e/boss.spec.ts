import { expect, test } from '@playwright/test';
import { bootGame } from './helpers';

/** ボス AI 基盤の確認シーン（`?scene=test&boss`。未実装の技はスタブで埋まる）。 */
test('the boss showcase spawns the boss, which beats, picks moves and shows the debug overlay', async ({
  page,
}) => {
  const errors = await bootGame(page, { scene: 'test', params: { boss: '', debug: '' } });

  const initial = await page.evaluate(() => window.__game?.dev.bossDebug() ?? null);
  // bootGame が着地まで進めるので、最初のビートの直後に技を選んでいることがある
  expect(['beat', 'attack']).toContain(initial?.state);
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
