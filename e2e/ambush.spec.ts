import { expect, test } from '@playwright/test';
import { bootGame, clickInPage } from './helpers';

/** 致命の一撃（#115）。戦闘デバッグシーンの亡者兵（(0, -3.5) で +z を向く）の背後から軽攻撃する。ロジック検証なので描画なし。 */

test('a light attack from behind an unaware soldier becomes a fatal strike (?scene=combat)', async ({
  page,
}) => {
  const errors = await bootGame(page, { scene: 'combat' });

  // 敵の背後 1.2m（北側）に立つ。敵は Idle のまま
  await page.evaluate(() => {
    window.__game?.dev.teleport(0, -4.7, 0);
    window.__game?.dev.advance(5);
  });
  expect(await page.evaluate(() => window.__game?.sim.enemies[0]?.state)).toBe('idle');

  await clickInPage(page);
  await page.evaluate(() => {
    window.__game?.dev.advance(1);
  });
  expect(await page.evaluate(() => window.__game?.sim.player.state)).toBe('backstab');

  // 当たり窓（F11〜F13）を過ぎるまで進める。亡者兵は 160 ダメージで即死する
  await page.evaluate(() => {
    window.__game?.dev.advance(14);
  });
  const enemy = await page.evaluate(() => window.__game?.sim.enemies[0]);
  expect(enemy?.state).toBe('dead');
  expect(errors).toEqual([]);
});
