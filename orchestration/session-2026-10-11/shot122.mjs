export default async function (page) {
  const kind = process.env.SHOT_KIND ?? 'stone';
  await page.evaluate((k) => {
    const dev = window.__game.dev;
    if (k === 'stone') dev.teleport(-4.6, 2.0, 0);
    else dev.teleport(24, 7.8, 0);
  }, kind);
  await page.waitForTimeout(2500);
  await page.keyboard.down('KeyE');
  await page.waitForTimeout(2500);
  await page.keyboard.up('KeyE');
  if (kind !== 'stone') {
    await page.evaluate(() => window.__game.dev.advance(36));
  }
  await page.waitForTimeout(2500);
  console.log(
    'after',
    await page.evaluate(
      () =>
        JSON.stringify(window.__game.dev.interactables().flags) +
        JSON.stringify(window.__game.dev.textPanel()) +
        window.__game.sim.player.state,
    ),
  );
}
