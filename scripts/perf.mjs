// 使い方: npm run perf -- [quality(low|medium|high)] [query追加]
// 各視点（scripts/perfViewpoints.mjs）の描画負荷（renderer.info 実測 + カテゴリ別内訳）を表で出す。
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { launchOptions } from './chromium.mjs';
import { webgpuCompatInit } from './webgpuCompat.mjs';
import { PERF_VIEWPOINTS } from './perfViewpoints.mjs';

const quality = process.argv[2] ?? 'medium';
const extra = process.argv[3] ?? '';
const port = Number(process.env.SHOT_PORT ?? 4180);
if (!process.env.PERF_SKIP_BUILD) await build({ logLevel: 'warn' });
const server = await preview({ preview: { host: 'localhost', port, strictPort: true } });
const browser = await chromium.launch(launchOptions());
try {
  const context = await browser.newContext({ viewport: { width: 915, height: 412 } });
  const page = await context.newPage();
  await page.addInitScript(webgpuCompatInit);
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) console.error(`[console.${m.type()}]`, m.text());
  });
  page.on('pageerror', (err) => console.error('pageerror', err.message));
  await page.goto(`http://localhost:${port}/game-test/?quality=${quality}&scale=0.25${extra}`);
  await page.waitForFunction(
    () => document.getElementById('app')?.dataset.state === 'running',
    null,
    {
      timeout: 60_000,
    },
  );
  const rows = [];
  for (const v of PERF_VIEWPOINTS) {
    await page.evaluate(({ x, z, yaw }) => {
      window.__game.dev.teleport(x, z, yaw);
      window.__game.dev.view(0);
    }, v);
    const f0 = await page.evaluate(() => window.__game.frames);
    await page.waitForFunction((n) => window.__game.frames > n + 20, f0, { timeout: 120_000 });
    const r = await page.evaluate(() => ({
      draws: window.__game.render.drawCalls,
      tris: window.__game.render.triangles,
      profile: window.__game.render.profile(),
    }));
    rows.push({ name: v.name, ...r });
  }
  for (const r of rows) {
    console.log(
      `\n## ${r.name}: ${r.draws} draws / ${(r.tris / 1000).toFixed(0)}k tris (renderer.info, shadow pass included)`,
    );
    console.log('category      main draws/tris      shadow draws/tris');
    for (const [k, p] of Object.entries(r.profile)) {
      if (p.draws + p.shadowDraws === 0) continue;
      console.log(
        `${k.padEnd(13)} ${String(p.draws).padStart(5)} ${String(p.tris).padStart(8)}   ${String(p.shadowDraws).padStart(5)} ${String(p.shadowTris).padStart(8)}`,
      );
    }
  }
  console.log('\n| viewpoint | draws | tris |\n| --- | --- | --- |');
  for (const r of rows) console.log(`| ${r.name} | ${r.draws} | ${(r.tris / 1000).toFixed(0)}k |`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
