export default async function (page) {
  await page.waitForFunction(() => window.__game?.dev?.guide?.().hint === 'move', null, {
    timeout: 60000,
  });
  await page.evaluate(() => {
    window.__game.dev.teleport(0, -1.2, 0);
    window.__game.dev.pushNotice('回復瓶を手に入れた');
  });
  await page.waitForTimeout(1200); // 撮影用（実時間の描画待ち）
}
