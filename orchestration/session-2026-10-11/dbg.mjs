export default async function (page) {
  await page.evaluate(() => window.__game.dev.teleport(24, 7.8, 0));
  await page.waitForTimeout(2500);
  const f = () =>
    page.evaluate(() =>
      JSON.stringify([
        window.__game.dev.bonfire().prompt,
        window.__game.sim.player.state,
        window.__game.sim.player.feet,
        window.__game.dev.interactables().looting,
        window.__game.dev.interactables().flags,
      ]),
    );
  console.log('A', await f());
  await page.keyboard.down('KeyE');
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(600);
    console.log('B', await f());
  }
}
