// 使い方: npm run profile -- [quality(low|medium|high)] [frames]
// CPU フレーム時間の計測（#262）。墓地の視点で敵 3 体と戦闘中の状態を作り、ロックステップ
// （描画 1 フレーム = シミュレーション 1 ステップ。src/render/cpuProfile.dev.ts）で回しながら
// CDP の Profiler でメインスレッドの JS を関数別に集計する。`?nodraw` でも同じ計測をし、差を描画のコストとする。
// SwiftShader の GPU 時間は見ない（メインスレッドの JS だけ）。
// 関数名を読めるよう、未圧縮 + ソースマップ付きで node_modules/.profile-dist にビルドする（PROFILE_SKIP_BUILD=1 で省略）。
import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { SourceMapConsumer } from 'source-map-js';
import { newPage, openSession, setViewpoint, startGame, waitFrames } from './lib/session.mjs';

const quality = process.argv[2] ?? 'medium';
const frames = Number(process.argv[3] ?? 240);
const TOP = Number(process.env.PROFILE_TOP ?? 15);
/** PROFILE_ALLOC=1: ヒープのサンプリングで関数別の割り当て量（KB/フレーム）も出す（GC の原因探し）。 */
const ALLOC = Boolean(process.env.PROFILE_ALLOC);
const outDir = resolve('node_modules/.profile-dist');

/** バンドルの位置 → 元のソース（src/... の関数）へ。 */
const consumers = new Map();
function consumerFor(url) {
  if (consumers.has(url)) return consumers.get(url);
  let c = null;
  const m = /\/game-test\/(.+\.js)$/.exec(url);
  if (m) {
    try {
      c = new SourceMapConsumer(JSON.parse(readFileSync(resolve(outDir, `${m[1]}.map`), 'utf8')));
    } catch {
      c = null;
    }
  }
  consumers.set(url, c);
  return c;
}

function frameLabel(cf) {
  const name = cf.functionName || '(anonymous)';
  if (!cf.url) return name;
  const c = consumerFor(cf.url);
  if (c) {
    const p = c.originalPositionFor({ line: cf.lineNumber + 1, column: cf.columnNumber });
    if (p.source) {
      const src = p.source.replace(/^(\.\.\/)+/, '').replace(/^.*node_modules\//, '');
      return `${name} (${src}:${p.line})`;
    }
  }
  return `${name} (${relative(process.cwd(), cf.url).split('/').pop()}:${cf.lineNumber + 1})`;
}

/** CPU プロファイルを関数別の自己時間（ms）に集計する。 */
function aggregate(profile) {
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const selfUs = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    const dt = profile.timeDeltas[i + 1] ?? 0;
    const id = profile.samples[i];
    selfUs.set(id, (selfUs.get(id) ?? 0) + dt);
  }
  const byFn = new Map();
  let jsUs = 0;
  let gcUs = 0;
  for (const [id, us] of selfUs) {
    const node = byId.get(id);
    const name = node.callFrame.functionName;
    if (name === '(idle)' || name === '(program)' || name === '(root)') continue;
    if (name === '(garbage collector)') gcUs += us;
    jsUs += us;
    const label = frameLabel(node.callFrame);
    byFn.set(label, (byFn.get(label) ?? 0) + us);
  }
  return { jsUs, gcUs, byFn };
}

/** ヒープのサンプリング結果を関数別の割り当てバイト数に集計する。 */
function aggregateAlloc(profile) {
  const byFn = new Map();
  let total = 0;
  const walk = (node) => {
    if (node.selfSize > 0) {
      const label = frameLabel(node.callFrame);
      byFn.set(label, (byFn.get(label) ?? 0) + node.selfSize);
      total += node.selfSize;
    }
    for (const c of node.children) walk(c);
  };
  walk(profile.head);
  return { total, byFn };
}

async function measure(extra) {
  const { context, page } = await newPage(session, {
    context: { viewport: { width: 915, height: 412 } },
  });
  await page.goto(session.url(`?quality=${quality}&scale=0.25${extra}`));
  await startGame(page, 600_000);
  // 墓地の視点（perfViewpoints の graveyard）。墓地の亡者 2 体と礼拝堂の門の 1 体を戦闘の音で呼ぶ
  await setViewpoint(page, { x: 14, z: 6, yaw: Math.PI / 2 });
  await page.evaluate(() => {
    const dev = window.__game.dev;
    dev.cpuProfileLockstep(true);
    for (const [x, z] of [
      [14, 6],
      [24, 8],
      [34, 14],
    ])
      dev.noise(x, 0, z, 'combat');
  });
  // 敵が寄ってくるまで（初回のパイプライン生成も済ませる）
  await waitFrames(page, 150);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
  await page.evaluate(() => window.__game.dev.cpuProfileReset());
  if (ALLOC) {
    await cdp.send('HeapProfiler.enable');
    await cdp.send('HeapProfiler.startSampling', {
      samplingInterval: 4096,
      includeObjectsCollectedByMajorGC: true,
      includeObjectsCollectedByMinorGC: true,
    });
  }
  await cdp.send('Profiler.start');
  await waitFrames(page, frames);
  const { profile } = await cdp.send('Profiler.stop');
  const alloc = ALLOC ? (await cdp.send('HeapProfiler.stopSampling')).profile : null;
  const stats = await page.evaluate(() => window.__game.dev.cpuProfileStats());
  const scene = await page.evaluate(() => window.__game.dev.cpuProfileScene());
  const enemies = await page.evaluate(() =>
    window.__game.sim.enemies?.map((e) => `${e.id}:${e.state}`),
  );
  await context.close();
  return { stats, scene, enemies, alloc: alloc && aggregateAlloc(alloc), ...aggregate(profile) };
}

const session = await openSession({
  port: Number(process.env.PROFILE_PORT ?? 4190),
  skipBuild: !!process.env.PROFILE_SKIP_BUILD,
  build: { outDir, minify: false, sourcemap: true },
});
try {
  const draw = await measure('');
  const nodraw = await measure('&nodraw');
  const row = (label, r) => {
    const f = r.stats.frames;
    return `| ${label} | ${f} | ${(r.jsUs / 1000 / f).toFixed(2)} | ${(r.gcUs / 1000 / f).toFixed(2)} | ${(r.stats.simMs / f).toFixed(2)} | ${(r.stats.renderMs / f).toFixed(2)} | ${r.stats.maxFrameMs.toFixed(1)} |`;
  };
  console.log(`\n# CPU profile (${quality}, graveyard, combat, lockstep 1 step/frame)\n`);
  if (draw.enemies) console.log(`enemy states: ${JSON.stringify(draw.enemies)}\n`);
  console.log(`scene: ${JSON.stringify(draw.scene)}\n`);
  console.log(
    '| mode | frames | JS ms/frame (CDP) | GC ms/frame | sim ms/frame | render ms/frame | worst frame ms |',
  );
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  console.log(row('draw', draw));
  console.log(row('nodraw', nodraw));
  const drawCost = draw.jsUs / draw.stats.frames - nodraw.jsUs / nodraw.stats.frames;
  console.log(`\ndraw cost (draw - nodraw): ${(drawCost / 1000).toFixed(2)} ms/frame`);
  for (const [label, r] of [
    ['draw', draw],
    ['nodraw', nodraw],
  ]) {
    console.log(`\n## top ${TOP} self time (${label}, ms/frame)\n`);
    console.log('| function | ms/frame | % |\n| --- | --- | --- |');
    const sorted = [...r.byFn].sort((a, b) => b[1] - a[1]).slice(0, TOP);
    for (const [fn, us] of sorted) {
      console.log(
        `| ${fn} | ${(us / 1000 / r.stats.frames).toFixed(3)} | ${((us / r.jsUs) * 100).toFixed(1)} |`,
      );
    }
    if (r.alloc) {
      const f = r.stats.frames;
      console.log(
        `\n## top ${TOP} allocations (${label}, sampled, total ${(r.alloc.total / 1024 / f).toFixed(1)} KB/frame)\n`,
      );
      console.log('| function | KB/frame |\n| --- | --- |');
      const sorted = [...r.alloc.byFn].sort((a, b) => b[1] - a[1]).slice(0, TOP);
      for (const [fn, bytes] of sorted) console.log(`| ${fn} | ${(bytes / 1024 / f).toFixed(2)} |`);
    }
  }
} finally {
  await session.close();
}
