// 使い方: npm run shot -- [出力パス(.png 省略可)] [待機秒数]
// 環境変数:
//   SHOT_QUERY    ページの URL クエリ（例: '?clip=Roll&t=0.5'）。'|' 区切りで複数指定すると連番で撮影する
//   SHOT_ONLY     'pc' または 'mobile' で片方のビューポートだけ撮る
//   SHOT_PORT     プレビューサーバのポート（既定 4174。並行実行時の衝突回避用）
//   SHOT_STATE    撮影する画面。'running'（既定: 開始画面をタップして開始後に撮る）/ 'ready'（開始画面）/ 'loading'（ローディング画面。本体チャンクの配信を遅らせて撮る）
//   SHOT_SCRIPT   撮影前に実行するモジュールのパス。default export の async (page, { name, index }) で入力を注入できる
//                 （例: キーボードで歩かせる・ロックオンさせる）。ページの待機後、スクリーンショットの直前に呼ぶ
// ビルド → プレビュー配信 → ヘッドレス Chromium(WebGPU) で数秒動かして PNG を保存する。
//   <出力パス>-mobile.png : 915x412 DPR3 (Xperia 1 V 相当の横画面)
//   <出力パス>-pc.png     : 1280x720
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { launchOptions } from './chromium.mjs';

const base = (process.argv[2] ?? 'shots/shot').replace(/\.png$/i, '');
const shotPort = Number(process.env.SHOT_PORT ?? 4174);
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
const server = await preview({ preview: { host: 'localhost', port: shotPort, strictPort: true } });
const queries = (process.env.SHOT_QUERY ?? '').split('|');
const script = process.env.SHOT_SCRIPT
  ? (await import(pathToFileURL(resolve(process.env.SHOT_SCRIPT)).href)).default
  : null;
const only = process.env.SHOT_ONLY;
const shotState = process.env.SHOT_STATE ?? 'running';
const browser = await chromium.launch(launchOptions());

try {
  for (const { name, ...contextOptions } of viewports.filter((v) => !only || v.name === only)) {
    for (const [index, query] of queries.entries()) {
      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();
      page.on('console', (msg) => {
        if (msg.type() === 'error') console.error(`[${name}] console.error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => console.error(`[${name}] pageerror: ${err.message}`));
      if (shotState === 'loading') {
        // 本体チャンク（index 以外の JS）の配信を遅らせて、ローディング画面を撮れるようにする
        await page.route(/\/assets\/(?!index-).*\.js$/, async (route) => {
          await new Promise((r) => setTimeout(r, 15_000));
          await route.continue();
        });
      }
      await page.goto(`http://localhost:${shotPort}/game-test/${query}`);
      await page.waitForFunction(
        (want) => {
          const state = document.getElementById('app')?.dataset.state;
          return want === 'loading'
            ? state === 'loading'
            : state === 'ready' || state === 'unsupported';
        },
        shotState,
        { timeout: 60_000 },
      );
      if (shotState === 'running' && (await page.locator('[data-testid=start-screen]').count())) {
        await page.locator('[data-testid=start-screen]').click();
      }
      await page.waitForTimeout(waitSeconds * 1000);
      if (script) await script(page, { name, index });
      const state = await page.evaluate(() => document.getElementById('app')?.dataset.state);
      const file = queries.length > 1 ? `${base}-${index}-${name}.png` : `${base}-${name}.png`;
      await page.screenshot({ path: file, timeout: 180_000 });
      console.log(`${file} (state=${state}) ${query}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
