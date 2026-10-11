export default async function (page) {
  await page.evaluate(() => { window.__game.dev.pause(true); window.__game.dev.killEnemy(0); window.__game.dev.advance(90); });
}
