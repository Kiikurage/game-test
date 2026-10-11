export default async function (page) {
  await page.evaluate(() => {
    window.__game.dev.pause(true);
    window.__game.dev.teleport(14, 6, Math.PI / 2);
    window.__game.dev.advance(5);
  });
  await page.evaluate(() => {
    for (const t of ['keydown', 'keyup'])
      window.dispatchEvent(new KeyboardEvent(t, { code: 'KeyQ', bubbles: true }));
  });
  await page.evaluate(() => window.__game.dev.advance(10));
  await page.keyboard.down('KeyD');
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.__game.dev.advance(15));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/claude-0/shots/s${i}.png`, timeout: 180000 });
  }
  await page.keyboard.up('KeyD');
}
