export default async (page) => {
  await page.evaluate(() => window.__game.dev.teleport(-4.6, 2.2, 0));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__game.dev.showText('dummy.talk', 'conversation'));
  await page.waitForTimeout(800);
};
