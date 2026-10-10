// 使い方: SHOT_TOUR='名前:x,z,yaw,yawOffset[,distance,pitchDeg];...' node scripts/shot-tour.mjs shots/tour
// 1 回のページ読み込みで複数の地点（teleport + ゲームプレイカメラ）を撮る。出力: <出力パス>-<名前>-pc.png / -mobile.png
// 環境変数: SHOT_ONLY（'pc' | 'mobile'）、SHOT_PORT（既定 4175）、SHOT_SKIP_BUILD=1（ビルド済みの dist を使う）、SHOT_QUALITY（既定は自動）
// 名前が 'free' で始まるときは 'x,y,z,tx,ty,tz'（カメラ位置と注視点）で自由視点（俯瞰など）。
// yaw は +Z 基準（前方 = (sin yaw, cos yaw)）。カメラはプレイヤーの背後に付く。
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { launchOptions } from './chromium.mjs';

const base = (process.argv[2] ?? 'shots/tour').replace(/\.png$/i, '');
const port = Number(process.env.SHOT_PORT ?? 4175);
mkdirSync(dirname(base), { recursive: true });
const tour = (process.env.SHOT_TOUR ?? 'origin:0,0,0,0').split(';').map((entry) => {
  const [name, rest] = entry.split(':');
  return { name, view: (rest ?? '').split(',').map(Number) };
});
const viewports = [
  {
    name: 'mobile',
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  { name: 'pc', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
].filter((v) => !process.env.SHOT_ONLY || v.name === process.env.SHOT_ONLY);

if (!process.env.SHOT_SKIP_BUILD) await build({ logLevel: 'warn' });
const server = await preview({ preview: { host: 'localhost', port, strictPort: true } });
const browser = await chromium.launch(launchOptions());
const quality = process.env.SHOT_QUALITY ? `?quality=${process.env.SHOT_QUALITY}` : '';
try {
  for (const { name: vpName, ...contextOptions } of viewports) {
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error(`[${vpName}] console.error: ${msg.text()}`);
    });
    page.on('pageerror', (err) => console.error(`[${vpName}] pageerror: ${err.message}`));
    await page.goto(`http://localhost:${port}/game-test/${quality}`);
    await page.waitForFunction(
      () => document.getElementById('app')?.dataset.state === 'ready',
      null,
      { timeout: 120_000 },
    );
    await page.locator('[data-testid=start-screen]').click();
    await page.waitForFunction(
      () => document.getElementById('app')?.dataset.state === 'running',
      null,
      { timeout: 120_000 },
    );
    for (const { name, view } of tour) {
      await page.evaluate(
        async ([name, v]) => {
          const dev = window.__game.dev;
          const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
          dev.pause(false);
          dev.freeCam(null);
          if (name.startsWith('free')) {
            // 俯瞰・任意視点: 'free名前:x,y,z,tx,ty,tz'（カメラ位置と注視点。ワールド座標）
            dev.freeCam([v[0], v[1], v[2]], [v[3], v[4], v[5]]);
          } else {
            const [x, z, yaw, off, dist, pitch] = v;
            dev.teleport(x, z, yaw);
            dev.view(
              off ?? 0,
              Number.isNaN(dist) ? undefined : dist,
              Number.isNaN(pitch) ? undefined : pitch,
            );
          }
          dev.pause(true);
          for (let i = 0; i < 10; i++) await frame();
        },
        [name, view],
      );
      const file = `${base}-${name}-${vpName}.png`;
      await page.screenshot({ path: file, timeout: 180_000 });
      console.log(file);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
