import { expect, test } from '@playwright/test';
import { bootGame } from './helpers';

// レベルの地形・壁・走破はブラウザ無しで検証している（src/game/world/levelWalk.test.ts / levelTraversal.test.ts）。
// ここでは起動 URL（`?scene=`）によるレベルの切り替えだけを見る。

test('?scene=test still opens the old test scene', async ({ page }) => {
  await bootGame(page, { scene: 'test' });
  const p = await page.evaluate(() => window.__game?.sim.player.position);
  expect(Math.abs(p?.x ?? Infinity)).toBeLessThan(0.5);
  expect(Math.abs((p?.z ?? Infinity) - 3.5)).toBeLessThan(0.5);
});
