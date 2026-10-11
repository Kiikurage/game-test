// 使い方: npm run shot -- [出力パス(.png 省略可)] [待機秒数]
// 環境変数:
//   SHOT_QUERY      ページの URL クエリ（例: '?clip=Roll&t=0.5'）。'|' 区切りで複数指定すると連番で撮影する
//   SHOT_ONLY       'pc' または 'mobile' で片方のビューポートだけ撮る
//   SHOT_PORT       プレビューサーバのポート（既定 4174。並行実行時の衝突回避用）
//   SHOT_SKIP_BUILD 1 ならビルド済みの dist を使う
//   SHOT_STATE      撮影する画面。'running'（既定: `dev.start()` で開始後に撮る）/ 'ready'（開始画面）/ 'loading'（ローディング画面。本体チャンクの配信を遅らせて撮る）
//   SHOT_SCRIPT     撮影前に実行するモジュールのパス。default export の async (page, { name, index }) で入力を注入できる
//                   （`window.__game.dev.input.*` など）。待機の後、スクリーンショットの直前に呼ぶ
// 決まった視点・状態の撮影は `npm run heroshots -- <dir> --only <名前>`（視点は scripts/heroShots.json）を使う。
// ビルド → プレビュー配信 → ヘッドレス Chromium(WebGPU) で開始し、待機秒数 × 60 ステップ進むのを待って PNG を保存する。
//   <出力パス>-mobile.png : 915x412 DPR3 (Xperia 1 V 相当の横画面)
//   <出力パス>-pc.png     : 1280x720
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  VIEWPORTS,
  newPage,
  openSession,
  startGame,
  waitReady,
  waitSteps,
} from './lib/session.mjs';

const base = (process.argv[2] ?? 'shots/shot').replace(/\.png$/i, '');
const waitSeconds = Number(process.argv[3] ?? 4);
mkdirSync(dirname(base), { recursive: true });

const queries = (process.env.SHOT_QUERY ?? '').split('|');
const script = process.env.SHOT_SCRIPT
  ? (await import(pathToFileURL(resolve(process.env.SHOT_SCRIPT)).href)).default
  : null;
const only = process.env.SHOT_ONLY;
const shotState = process.env.SHOT_STATE ?? 'running';
const session = await openSession({
  port: Number(process.env.SHOT_PORT ?? 4174),
  skipBuild: !!process.env.SHOT_SKIP_BUILD,
});

try {
  for (const name of ['mobile', 'pc'].filter((v) => !only || v === only)) {
    for (const [index, query] of queries.entries()) {
      const { context, page } = await newPage(session, { context: VIEWPORTS[name], label: name });
      if (shotState === 'loading') {
        // 本体チャンク（index 以外の JS）の配信を遅らせて、ローディング画面を撮れるようにする
        await page.route(/\/assets\/(?!index-).*\.js$/, async (route) => {
          await new Promise((r) => setTimeout(r, 15_000));
          await route.continue();
        });
      }
      await page.goto(session.url(query));
      if (shotState === 'loading') {
        await page.waitForFunction(
          () => document.getElementById('app')?.dataset.state === 'loading',
          null,
          { timeout: 60_000 },
        );
      } else if (shotState === 'running' && (await waitReady(page)) === 'ready') {
        await startGame(page);
        // 実時間ではなくシミュレーションのステップ数で待つ（60 ステップ = 1 秒）
        await waitSteps(page, Math.round(waitSeconds * 60));
      } else {
        await waitReady(page);
      }
      if (script) await script(page, { name, index });
      const state = await page.evaluate(() => document.getElementById('app')?.dataset.state);
      const file = queries.length > 1 ? `${base}-${index}-${name}.png` : `${base}-${name}.png`;
      await page.screenshot({ path: file, timeout: 180_000 });
      console.log(`${file} (state=${state}) ${query}`);
      await context.close();
    }
  }
} finally {
  await session.close();
}
