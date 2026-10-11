import { preview } from 'vite';
import { chromium } from '@playwright/test';
import { launchOptions } from '/home/user/game-test/scripts/chromium.mjs';
const port = 4391;
const server = await preview({ root: '/home/user/game-test', preview: { host: 'localhost', port, strictPort: true } });
const browser = await chromium.launch(launchOptions());
for (const q of ['?quality=high&scale=1', '?quality=low&scale=0.25']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(`http://localhost:${port}/game-test/${q}`);
  await page.waitForFunction(() => document.getElementById('app')?.dataset.state === 'ready', null, { timeout: 600000 });
  const tReady = Date.now();
  await page.locator('[data-testid=start-screen]').click();
  await page.waitForFunction(() => document.getElementById('app')?.dataset.state === 'running', null, { timeout: 600000 });
  const tRun = Date.now();
  const f0 = await page.evaluate(() => window.__game.frames);
  const s = Date.now();
  await page.waitForFunction((n) => window.__game.frames >= n, f0 + 10, { timeout: 600000 });
  const dt = Date.now() - s;
  const info = await page.evaluate(() => { const r = window.__game.dev?.sceneStats?.(); return r ?? null; }).catch(() => null);
  console.log(JSON.stringify({ q, loadToReadyS: (tReady - t0) / 1000, startS: (tRun - tReady) / 1000, msPerFrame: dt / 10, info }));
  await ctx.close();
}
await browser.close();
await new Promise((r) => server.httpServer.close(r));
