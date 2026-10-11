// 使い方: npm run heroshots -- <出力ディレクトリ> [high|medium] [オプション]
//   --mobile            モバイル（915x412 DPR3、Xperia 1 V 相当の横画面）で撮る（既定は PC 1280x720）
//   --only a,b          名前（または area）が一致する視点だけ撮る
//   --compare <dir>     撮影後、<dir>（変更前）と今回の出力を左右に並べた compare-sheet.png を出す
//   --no-shoot          撮影せず、既存の PNG から sheet だけ作り直す（--compare と併用可）
// 環境変数: HERO_PORT（プレビューのポート。既定 4176）、HERO_SKIP_BUILD=1（ビルド済みの dist を使う）、
//           HERO_VIEWS（視点データの JSON。既定 scripts/heroShots.json）
//
// 品質ゲート（docs/tech-direction.md §7.1）のヒーローショットを一括で撮る。視点は scripts/heroShots.json のデータで、
// 追加・変更にコードの変更は要らない（形式は JSON 内の `$doc` を参照）。
// 出力: <dir>/<名前>.png、<dir>/contact-sheet.png（全ショットの一覧）、<dir>/index.json（撮影条件）。
// 待ちはシミュレーションのステップ数（dev.advance）と描画フレーム数で数える（実時間待ちはしない）。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { launchOptions } from './chromium.mjs';
import {
  HIDE_HUD_CSS,
  localStorageEntries,
  resolveShot,
  shotQuery,
  stage,
} from './heroShotStage.mjs';

function parseArgs(argv) {
  const opts = {
    outDir: null,
    quality: null,
    mobile: false,
    only: null,
    compare: null,
    shoot: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mobile') opts.mobile = true;
    else if (a === '--no-shoot') opts.shoot = false;
    else if (a === '--only') opts.only = (argv[++i] ?? '').split(',').filter(Boolean);
    else if (a === '--compare') opts.compare = argv[++i] ?? null;
    else if (a === 'high' || a === 'medium' || a === 'low') opts.quality = a;
    else if (a.startsWith('--')) throw new Error(`unknown option: ${a}`);
    else if (opts.outDir === null) opts.outDir = a;
    else throw new Error(`unexpected argument: ${a}`);
  }
  opts.outDir ??= 'shots/hero';
  if (opts.compare !== null && !existsSync(opts.compare)) {
    throw new Error(`--compare: directory not found: ${opts.compare}`);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const port = Number(process.env.HERO_PORT ?? 4176);
const viewsPath = process.env.HERO_VIEWS ?? 'scripts/heroShots.json';
const views = JSON.parse(readFileSync(viewsPath, 'utf8'));
const defaults = views.defaults ?? {};
const shots = views.shots.filter(
  (s) => !opts.only || opts.only.includes(s.name) || opts.only.includes(s.area),
);
if (shots.length === 0) throw new Error('no shots selected');
for (const s of views.shots) {
  if (!/^[a-z0-9-]+$/.test(s.name)) throw new Error(`invalid shot name: ${s.name}`);
}
if (new Set(views.shots.map((s) => s.name)).size !== views.shots.length) {
  throw new Error('duplicate shot names');
}

const viewport = opts.mobile
  ? {
      name: 'mobile',
      context: {
        viewport: { width: 915, height: 412 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    }
  : { name: 'pc', context: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 } };
// 既定の品質: PC は high、モバイルは基準機（Xperia 1 V）相当の medium
const quality = opts.quality ?? (opts.mobile ? 'medium' : 'high');

/** 視点を `query`（敵の有無など URL で決まる条件）ごとにまとめ、ページを 1 回読み込んで順に撮る。 */
async function shootAll() {
  if (!process.env.HERO_SKIP_BUILD) await build({ logLevel: 'warn' });
  const server = await preview({ preview: { host: 'localhost', port, strictPort: true } });
  const groups = new Map();
  for (const shot of shots) {
    const query = shotQuery(shot, defaults, { quality, scale: '1' });
    if (!groups.has(query)) groups.set(query, []);
    groups.get(query).push(shot);
  }
  const results = [];
  try {
    for (const [query, group] of groups) {
      const context = await browser.newContext(viewport.context);
      const page = await context.newPage();
      // 起動前のセーブ・設定（篝火の点火済みなど）。値は JSON 文字列にして localStorage へ入れる
      await page.addInitScript((entries) => {
        for (const [k, v] of entries) localStorage.setItem(k, v);
      }, localStorageEntries(defaults));
      page.on('console', (msg) => {
        if (msg.type() === 'error') console.error(`console.error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => {
        console.error(`pageerror: ${err.message}`);
      });
      await page.goto(`http://localhost:${port}/game-test/${query}`);
      // ローディング（アセット読み込み・初回シェーダコンパイル = GameView.warmUp）の完了を待つ
      await page.waitForFunction(
        () => document.getElementById('app')?.dataset.state === 'ready',
        null,
        { timeout: 300_000 },
      );
      await page.locator('[data-testid=start-screen]').click();
      await page.waitForFunction(
        () => document.getElementById('app')?.dataset.state === 'running',
        null,
        { timeout: 300_000 },
      );
      if (!(defaults.hud ?? false)) await hideHud(page);
      for (const shot of group) {
        const t0 = performance.now();
        const spec = resolveShot(shot, defaults);
        await page.evaluate(stage, spec);
        // 描画側（パーティクル・ムードの補間・影）の立ち上がりをフレーム数で待つ
        await waitFrames(page, spec.frames);
        const file = join(opts.outDir, `${shot.name}.png`);
        await page.screenshot({ path: file, timeout: 300_000 });
        console.log(
          `${file}  (${shot.area ?? ''}, ${((performance.now() - t0) / 1000).toFixed(0)}s)`,
        );
        results.push({ name: shot.name, area: shot.area ?? '', title: shot.title ?? '' });
      }
      await context.close();
    }
  } finally {
    await new Promise((r) => server.httpServer.close(r));
  }
  // 撮った順ではなく JSON の並び順で一覧にする
  const order = views.shots.map((s) => s.name);
  results.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  writeFileSync(
    join(opts.outDir, 'index.json'),
    `${JSON.stringify({ viewport: viewport.name, quality, shots: results }, null, 2)}\n`,
  );
}

async function waitFrames(page, frames) {
  const start = await page.evaluate(() => window.__game.frames);
  await page.waitForFunction((n) => window.__game.frames >= n, start + frames, {
    timeout: 300_000,
  });
}

/** HUD・タッチ操作の UI を隠し、キャンバスだけを撮る。 */
async function hideHud(page) {
  await page.addStyleTag({ content: HIDE_HUD_CSS });
}

// ---- contact sheet（新規依存なしで、Chromium に HTML で並べてスクショする） ----

function listShots(dir) {
  const indexPath = join(dir, 'index.json');
  if (existsSync(indexPath)) {
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    return index.shots.filter((s) => existsSync(join(dir, `${s.name}.png`)));
  }
  // index.json の無いディレクトリ（手で集めた画像など）は視点データの並びで探す
  return views.shots
    .filter((s) => existsSync(join(dir, `${s.name}.png`)))
    .map((s) => ({ name: s.name, area: s.area ?? '', title: s.title ?? '' }));
}

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c,
  );

/** ローカルの画像を仮想オリジンから配信し、HTML を全体スクショして 1 枚の PNG にする。 */
async function renderSheet(html, files, out, width) {
  const context = await browser.newContext({ viewport: { width, height: 400 } });
  const page = await context.newPage();
  await page.route('http://sheet.local/**', async (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    if (path === '/') return route.fulfill({ contentType: 'text/html', body: html });
    const file = files.get(path);
    if (!file) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ contentType: 'image/png', body: readFileSync(file) });
  });
  await page.goto('http://sheet.local/');
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  await page.screenshot({ path: out, fullPage: true });
  await context.close();
  console.log(out);
}

const SHEET_CSS = `
  body { margin: 0; padding: 16px; background: #111; color: #ddd; font: 13px/1.4 system-ui, sans-serif; }
  h1 { font-size: 16px; margin: 0 0 12px; font-weight: 600; }
  .grid { display: grid; gap: 12px; }
  figure { margin: 0; }
  img { display: block; width: 100%; height: auto; background: #000; }
  figcaption { padding: 4px 2px 0; }
  figcaption b { color: #fff; } figcaption span { color: #999; margin-left: 6px; }
  .missing { aspect-ratio: 16 / 9; display: grid; place-items: center; background: #222; color: #777; }
`;

function caption(s) {
  return `<figcaption><b>${escapeHtml(s.name)}</b><span>${escapeHtml(s.area)}${
    s.title ? ` — ${escapeHtml(s.title)}` : ''
  }</span></figcaption>`;
}

async function contactSheet(dir) {
  const list = listShots(dir);
  if (list.length === 0) {
    console.warn(`no shots in ${dir}; contact sheet skipped`);
    return;
  }
  const files = new Map();
  const cells = list.map((s) => {
    files.set(`/img/${s.name}.png`, join(dir, `${s.name}.png`));
    return `<figure><img src="/img/${encodeURIComponent(s.name)}.png">${caption(s)}</figure>`;
  });
  const columns = 4;
  const html = `<!doctype html><meta charset="utf-8"><style>${SHEET_CSS}
    .grid { grid-template-columns: repeat(${columns}, 1fr); }</style>
    <h1>${escapeHtml(dir)} — ${list.length} shots</h1><div class="grid">${cells.join('')}</div>`;
  await renderSheet(html, files, join(dir, 'contact-sheet.png'), 480 * columns);
}

async function compareSheet(beforeDir, afterDir) {
  const before = listShots(beforeDir);
  const after = listShots(afterDir);
  const names = [...new Set([...before.map((s) => s.name), ...after.map((s) => s.name)])];
  const byName = new Map([...before, ...after].map((s) => [s.name, s]));
  const files = new Map();
  const cell = (dir, side, name) => {
    const file = join(dir, `${name}.png`);
    if (!existsSync(file)) return '<div class="missing">（なし）</div>';
    files.set(`/${side}/${name}.png`, file);
    return `<img src="/${side}/${encodeURIComponent(name)}.png">`;
  };
  const rows = names.map(
    (name) =>
      `<figure><div class="grid" style="grid-template-columns: 1fr 1fr; gap: 4px">${cell(beforeDir, 'before', name)}${cell(
        afterDir,
        'after',
        name,
      )}</div>${caption(byName.get(name))}</figure>`,
  );
  const label = (d) => escapeHtml(basename(resolve(d)) || d);
  // 1 行に 2 視点（各視点は 左 = before / 右 = after）
  const html = `<!doctype html><meta charset="utf-8"><style>${SHEET_CSS}
    .pairs { grid-template-columns: 1fr 1fr; row-gap: 20px; column-gap: 28px; }</style>
    <h1>各視点の 左: before（${label(beforeDir)}） / 右: after（${label(afterDir)}）</h1>
    <div class="grid pairs">${rows.join('')}</div>`;
  await renderSheet(html, files, join(afterDir, 'compare-sheet.png'), 2560);
}

// ---- 実行（関数・定数の宣言の後に置く） ----

mkdirSync(opts.outDir, { recursive: true });
const browser = await chromium.launch(launchOptions());
try {
  if (opts.shoot) await shootAll();
  await contactSheet(opts.outDir);
  if (opts.compare !== null) await compareSheet(opts.compare, opts.outDir);
} finally {
  await browser.close();
}
