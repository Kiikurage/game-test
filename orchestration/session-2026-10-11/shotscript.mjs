const VIEWS = [
  { x: 24, y: 1.54, z: 9 },
  { x: 29, y: 4.96, z: 16 },
  { x: 38, y: 5.73, z: 29.8 },
];
export default async (page, { index }) => {
  const v = VIEWS[index % VIEWS.length];
  await page.evaluate((v) => {
    window.__game?.dev.teleport(v.x - 6, v.z - 6, 0);
    window.__game?.dev.freeCam([v.x + 2.4, v.y + 1.7, v.z + 2.4], [v.x, v.y + 0.2, v.z]);
  }, v);
  const start = await page.evaluate(() => window.__game?.frames ?? 0);
  await page.waitForFunction((s) => (window.__game?.frames ?? 0) > s + 8, start, { timeout: 120000 });
};
