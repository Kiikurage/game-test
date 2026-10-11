// 使い方: npm run bench -- [出力ディレクトリ]
// 環境変数: BENCH_QUERY（`?bench` に足すクエリ。例: 'quality=medium&nomsaa'。'quick' を含めると ?bench=quick）、
//           BENCH_PORT（プレビューのポート。既定 4177）、BENCH_SKIP_BUILD=1（ビルド済みの dist を使う）、
//           BENCH_VIEWPORT（'pc' = 1280x720 既定 / 'mobile' = 915x412 DPR3）
//
// ビルド → プレビュー配信 → Chromium でベンチマークモード（`?bench`。docs/performance.md §0）を完走させ、
// <dir>/bench.json（区間ごとの行・結果テキスト・アダプタ情報）、<dir>/bench.txt（結果テキスト）、<dir>/bench.png を保存する。
// 実 GPU（GPU_MODE=hardware。mac-verify.yml）での計測用。SwiftShader でも動くが 1 区間に数十秒かかる。
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { checkGpuAdapter, launchOptions } from './chromium.mjs';

const outDir = process.argv[2] ?? 'shots/bench';
const port = Number(process.env.BENCH_PORT ?? 4177);
const extra = (process.env.BENCH_QUERY ?? '').replace(/^[?&]+/, '');
const params = new URLSearchParams(extra);
const quick = params.has('quick');
params.delete('quick');
const query = `?bench${quick ? '=quick' : ''}${params.size ? `&${params.toString()}` : ''}`;
const mobile = process.env.BENCH_VIEWPORT === 'mobile';
const contextOptions = mobile
  ? { viewport: { width: 915, height: 412 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
  : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 };

mkdirSync(outDir, { recursive: true });
if (!process.env.BENCH_SKIP_BUILD) await build({ logLevel: 'warn' });
const server = await preview({ preview: { host: 'localhost', port, strictPort: true } });
const browser = await chromium.launch(launchOptions());
try {
  const gpu = await checkGpuAdapter(browser);
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error(`console.error: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
    console.error(`pageerror: ${err.message}`);
  });
  console.log(`open ${query} (${mobile ? 'mobile' : 'pc'})`);
  await page.goto(`http://localhost:${port}/game-test/${query}`);
  await page.waitForFunction(
    () => document.getElementById('app')?.dataset.state === 'ready',
    null,
    {
      timeout: 300_000,
    },
  );
  await page.locator('[data-testid=start-screen]').click();
  // 区間の進行はページ側（bench.ts）が時間とフレーム数で決める。ここは完了を待つだけ
  await page.waitForFunction(() => window.__game?.dev.bench().state === 'done', null, {
    timeout: 900_000,
    polling: 1000,
  });
  const status = await page.evaluate(() => window.__game.dev.bench());
  await page.screenshot({ path: join(outDir, 'bench.png') });
  writeFileSync(
    join(outDir, 'bench.json'),
    `${JSON.stringify({ query, viewport: mobile ? 'mobile' : 'pc', gpu, errors, ...status }, null, 2)}\n`,
  );
  writeFileSync(join(outDir, 'bench.txt'), `${status.text}\n`);
  console.log(status.text);
  await context.close();
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
