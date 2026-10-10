// 使い方: node scripts/wgslStats.mjs [quality] [追加クエリ] [出力ディレクトリ]
// 起動後に生成された WGSL（createShaderModule の code）を集めて、フラグメントシェーダの規模
// （行数・ノイズ呼び出し・テクスチャサンプル・微分）を表にする。出力ディレクトリを渡すと WGSL 全文も保存する。
// 出力ディレクトリはリポジトリ外のスクラッチ（/tmp 配下など）にすること。
import { mkdirSync, writeFileSync } from 'node:fs';
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { launchOptions } from './chromium.mjs';
import { PERF_VIEWPOINTS } from './perfViewpoints.mjs';

const quality = process.argv[2] ?? 'medium';
const extra = process.argv[3] ?? '';
const outDir = process.argv[4];
const port = Number(process.env.SHOT_PORT ?? 4190);
if (!process.env.PERF_SKIP_BUILD) await build({ logLevel: 'warn' });
const server = await preview({ preview: { host: 'localhost', port, strictPort: true } });
const browser = await chromium.launch(launchOptions());
try {
  const page = await (
    await browser.newContext({ viewport: { width: 915, height: 412 } })
  ).newPage();
  await page.addInitScript(() => {
    window.__wgsl = [];
    const proto = GPUDevice.prototype;
    const orig = proto.createShaderModule;
    proto.createShaderModule = function (desc) {
      window.__wgsl.push(desc.code);
      return orig.call(this, desc);
    };
  });
  await page.goto(`http://localhost:${port}/game-test/?quality=${quality}&scale=0.25${extra}`);
  await page.waitForFunction(
    () => document.getElementById('app')?.dataset.state === 'ready',
    null,
    {
      timeout: 120_000,
    },
  );
  await page.locator('[data-testid=start-screen]').click();
  await page.waitForFunction(
    () => document.getElementById('app')?.dataset.state === 'running',
    null,
    { timeout: 120_000 },
  );
  // 起動直後のシェーダ生成が落ち着くまで、描画フレームを進めて待つ
  const f0 = await page.evaluate(() => window.__game.frames);
  await page.waitForFunction((n) => window.__game.frames > n + 30, f0, { timeout: 120_000 });
  // 各視点を巡って、そこで初めて使われるマテリアルのシェーダも生成させる
  for (const v of PERF_VIEWPOINTS) {
    await page.evaluate(({ x, z, yaw }) => {
      window.__game.dev.teleport(x, z, yaw);
      window.__game.dev.view(0);
    }, v);
    const f = await page.evaluate(() => window.__game.frames);
    await page.waitForFunction((n) => window.__game.frames > n + 20, f, { timeout: 120_000 });
  }
  const codes = await page.evaluate(() => window.__wgsl);
  const rows = [];
  codes.forEach((code, i) => {
    if (!code.includes('@fragment')) return;
    const frag = code.slice(code.indexOf('@fragment'));
    const count = (re) => (frag.match(re) ?? []).length;
    rows.push({
      i,
      total: code.split('\n').length,
      lines: frag.split('\n').length,
      noise: count(/mx_perlin_noise_float_\d+\(|bakedNoise\(/g),
      tex: count(/textureSample/g),
      deriv: count(/dpdx|dpdy|fwidth/g),
      code,
    });
  });
  rows.sort((a, b) => b.total - a.total);
  console.log('idx  totalLines  fragLines  noiseCalls  texSamples  derivs');
  for (const r of rows.slice(0, 40))
    console.log(
      `${String(r.i).padStart(3)} ${String(r.total).padStart(10)} ${String(r.lines).padStart(9)} ${String(r.noise).padStart(10)} ${String(r.tex).padStart(11)} ${String(r.deriv).padStart(7)}`,
    );
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    for (const r of rows) writeFileSync(`${outDir}/${String(r.i).padStart(3, '0')}.wgsl`, r.code);
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
