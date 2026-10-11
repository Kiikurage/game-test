import { expect, test } from '@playwright/test';
import { startGameDev, waitSteps } from './helpers';

// dev の開始口（#296）: 開始画面をクリックせずに始め、Pointer Lock を取らない。入力は注入で与える。

test('dev.start runs without pointer lock and accepts injected input', async ({ page }) => {
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGameDev(page);
  await waitSteps(page, 5);
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  expect(await page.evaluate(() => window.__game?.paused)).toBe(false);

  // 止めて、注入した入力をステップ単位で進める
  const before = await page.evaluate(() => {
    const g = window.__game;
    if (!g) throw new Error('no game');
    g.dev.pause(true);
    return { steps: g.steps, pos: g.sim.player.position };
  });
  expect(await page.evaluate(() => window.__game?.paused)).toBe(true);
  const after = await page.evaluate(() => {
    const g = window.__game;
    if (!g) throw new Error('no game');
    g.dev.input.move(0, 1);
    g.dev.advance(30);
    g.dev.input.releaseAll();
    g.dev.input.tap('lightAttack');
    g.dev.advance(2);
    return {
      steps: g.steps,
      pos: g.sim.player.position,
      attacks: g.sim.events.attackStart,
    };
  });
  expect(after.steps).toBe(before.steps + 32);
  expect(Math.hypot(after.pos.x - before.pos.x, after.pos.z - before.pos.z)).toBeGreaterThan(0.5);
  expect(after.attacks).toBe(1);

  // ロックなしのクリックも攻撃になり、ロックは要求されない
  await page.evaluate(() => {
    const init = { pointerType: 'mouse', button: 0, bubbles: true, cancelable: true };
    document.querySelector('canvas')?.dispatchEvent(new PointerEvent('pointerdown', init));
    window.dispatchEvent(new PointerEvent('pointerup', init));
    window.__game?.dev.advance(40);
  });
  expect(await page.evaluate(() => window.__game?.input.pressCounts.lightAttack)).toBe(2);
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
});
