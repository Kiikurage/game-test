// 使い方: npm run shot -- [出力パス(.png 省略可)] [待機秒数]
// ビルド → プレビュー配信 → ヘッドレス Chromium(WebGPU) で数秒動かして PNG を保存する。
//   <出力パス>-mobile.png : 915x412 DPR3 (Xperia 1 V 相当の横画面)
//   <出力パス>-pc.png     : 1280x720
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { launchOptions } from './chromium.mjs';
import { webgpuCompatInit } from './webgpuCompat.mjs';

const base = (process.argv[2] ?? 'shots/shot').replace(/\.png$/i, '');
const waitSeconds = Number(process.argv[3] ?? 4);
mkdirSync(dirname(base), { recursive: true });

const viewports = [
  {
    name: 'mobile',
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'pc',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
];

await build({ logLevel: 'warn' });
const server = await preview({ preview: { host: 'localhost', port: 4174, strictPort: true } });
const url = `http://localhost:4174/game-test/`;
const browser = await chromium.launch(launchOptions());

try {
  for (const { name, ...contextOptions } of viewports) {
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    await page.addInitScript(webgpuCompatInit);
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error(`[${name}] console.error: ${msg.text()}`);
    });
    page.on('pageerror', (err) => console.error(`[${name}] pageerror: ${err.message}`));
    await page.goto(url);
    await page.waitForFunction(
      () => document.getElementById('app')?.dataset.state !== undefined,
      null,
      {
        timeout: 30_000,
      },
    );
    await page.waitForTimeout(waitSeconds * 1000);
    const state = await page.evaluate(() => document.getElementById('app')?.dataset.state);
    const file = `${base}-${name}.png`;
    await page.screenshot({ path: file });
    console.log(`${file} (state=${state})`);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
