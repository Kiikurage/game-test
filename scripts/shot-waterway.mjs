// 使い方: node scripts/shot-waterway.mjs [出力パス] （例: node scripts/shot-waterway.mjs shots/ww）
// 地下水路（#111 / #270）のヒーローショットを撮る。出力: <出力パス>-<視点>-<quality>-<pc|mobile>.png
//   entrance : 腐った床板の真下（入口。上から光が差す）から東の水路を見る
//   middle   : 東西の水路の中ほどから角（北への曲がり）を見る
//   exit     : 北の水路から上り階段（出口）を見る
//   walk     : 東西の水路をプレイヤーが歩いている（波紋・しぶき）
//   roll     : 東西の水路でローリングした直後（大きなしぶき）
// 環境変数:
//   SHOT_QUALITIES  カンマ区切りの品質（既定 'high,medium'）
//   SHOT_VIEWS      カンマ区切りの視点（既定 全部）
//   SHOT_ONLY       'pc' | 'mobile'
//   SHOT_PORT       プレビューのポート（既定 4176）
//   SHOT_SKIP_BUILD 1 ならビルド済みの dist を使う
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { launchOptions } from './chromium.mjs';

const base = (process.argv[2] ?? 'shots/waterway').replace(/\.png$/i, '');
const port = Number(process.env.SHOT_PORT ?? 4176);
mkdirSync(dirname(base), { recursive: true });

const FLOOR = 1.0; // 水路の床（docs/level.md「地下水路」）
/** [x, z, yaw, yawOffset, distance, pitchDeg, mode] */
const VIEWS = {
  entrance: { at: [44.3, 28, Math.PI / 2], cam: [Math.PI, 2.6, 8] },
  middle: { at: [59, 28, Math.PI / 2], cam: [0.25, 2.4, 10] },
  exit: { at: [66, 36.5, 0], cam: [0.15, 2.4, 8] },
  // カメラを前に低く置き（天井が低いので高いとカメラが寄ってプレイヤーが消える）、S（カメラへ向かう）で歩かせる → 顔と後ろの航跡
  walk: { at: [47, 28, Math.PI / 2], cam: [Math.PI, 2.6, 6], walk: 'KeyS' },
  roll: { at: [47, 28, Math.PI / 2], cam: [Math.PI, 2.6, 6], walk: 'KeyS', roll: true },
};
const views = (process.env.SHOT_VIEWS ?? Object.keys(VIEWS).join(',')).split(',');
const qualities = (process.env.SHOT_QUALITIES ?? 'high,medium').split(',');
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
try {
  for (const quality of qualities) {
    for (const { name: vpName, ...contextOptions } of viewports) {
      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();
      page.on('console', (msg) => {
        if (msg.type() === 'error') console.error(`[${vpName}] console.error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => console.error(`[${vpName}] pageerror: ${err.message}`));
      await page.goto(`http://localhost:${port}/game-test/?quality=${quality}&enemies=0`);
      await page.waitForFunction(
        () => document.getElementById('app')?.dataset.state === 'ready',
        null,
        { timeout: 180_000 },
      );
      await page.locator('[data-testid=start-screen]').click();
      await page.waitForFunction(
        () => document.getElementById('app')?.dataset.state === 'running',
        null,
        { timeout: 180_000 },
      );
      await page.evaluate(() => {
        window.__game.dev.breakHatch();
      });
      for (const name of views) {
        const v = VIEWS[name];
        if (!v) throw new Error(`unknown view ${name}`);
        await page.evaluate(
          async ([v, floor]) => {
            const dev = window.__game.dev;
            const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
            dev.pause(false);
            dev.freeCam(null);
            dev.teleport(v.at[0], v.at[1], v.at[2], floor + 0.02);
            dev.view(v.cam[0], v.cam[1], v.cam[2]);
            // 水面の波が静まり、着地が落ち着くまで（シミュレーション時間で進める）
            dev.pause(true);
            dev.advance(240);
            dev.view(v.cam[0], v.cam[1], v.cam[2]);
            for (let i = 0; i < 4; i++) await frame();
          },
          [v, FLOOR],
        );
        if (v.walk) {
          // 歩かせる（実時間の入力だが撮影なので許容）。ステップは advance で決定的に進める
          await page.keyboard.down(v.walk);
          await page.evaluate(async (roll) => {
            const dev = window.__game.dev;
            dev.advance(roll ? 40 : 70);
          }, !!v.roll);
          if (v.roll) {
            await page.keyboard.down('Space');
            await page.evaluate(() => window.__game.dev.advance(3));
            await page.keyboard.up('Space');
            await page.evaluate(() => window.__game.dev.advance(30));
          }
          await page.keyboard.up(v.walk);
          await page.evaluate(async () => {
            const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
            for (let i = 0; i < 4; i++) await frame();
          });
        }
        const file = `${base}-${name}-${quality}-${vpName}.png`;
        await page.screenshot({ path: file, timeout: 180_000 });
        console.log(file);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
