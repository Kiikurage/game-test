// 使い方: npm run perf -- [quality(low|medium|high)] [query追加]
// 各視点（scripts/perfViewpoints.mjs）の描画負荷（renderer.info 実測 + カテゴリ別内訳）を表で出す。
// PERF_PC=1 なら PC（1280x720・内部解像度 1）で開き、`?perf` の GPU 時間（timestamp-query。非対応は n/a）・
// フレーム間隔・描画 CPU 時間と、起動時間（ページを開いてから開始画面 / running まで）も出す（GPU_MODE=hardware と併用）。
import { PERF_VIEWPOINTS } from './perfViewpoints.mjs';
import {
  measureTarget,
  newPage,
  openSession,
  setViewpoint,
  startGame,
  waitFrames,
  waitReady,
} from './lib/session.mjs';

const quality = process.argv[2] ?? 'medium';
const extra = process.argv[3] ?? '';
const target = measureTarget();
const timing = !!process.env.PERF_PC;
/** GPU 時間などは直近の値が揺れるので、視点ごとにこのフレーム数だけ取って中央値を出す。 */
const SAMPLE_FRAMES = 60;
const median = (a) => {
  const s = a.filter((v) => typeof v === 'number').sort((x, y) => x - y);
  return s.length === 0 ? null : s[Math.floor(s.length / 2)];
};
const fmt = (v) => (v === null ? 'n/a' : v.toFixed(2));

const session = await openSession({
  port: Number(process.env.SHOT_PORT ?? 4180),
  skipBuild: !!process.env.PERF_SKIP_BUILD,
});
try {
  const { page } = await newPage(session, {
    context: target.context,
    consoleTypes: ['error', 'warning'],
  });
  await page.goto(
    session.url(`?quality=${quality}&${target.query}${timing ? '&perf' : ''}${extra}`),
  );
  if (timing) {
    // navigation からの ms（performance.now）。開始画面（ready）はローディング中の warmUp（シェーダコンパイル）込み
    await waitReady(page);
    const readyMs = await page.evaluate(() => performance.now());
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd };
    });
    await startGame(page);
    const runningMs = await page.evaluate(() => performance.now());
    console.log(
      `startup (ms from navigation): DOMContentLoaded ${nav.dcl.toFixed(0)} / load ${nav.load.toFixed(0)} / ready ${readyMs.toFixed(0)} / running ${runningMs.toFixed(0)}`,
    );
    const env = await page.evaluate(async () => {
      const a = await navigator.gpu?.requestAdapter();
      return {
        adapter: a ? `${a.info.vendor} ${a.info.architecture} ${a.info.description}` : 'none',
        timestamp: a?.features.has('timestamp-query') ?? false,
      };
    });
    console.log(`adapter: ${env.adapter} / timestamp-query: ${env.timestamp ? 'yes' : 'no'}`);
  } else {
    await startGame(page);
  }
  const rows = [];
  for (const v of PERF_VIEWPOINTS) {
    await setViewpoint(page, v);
    await waitFrames(page, 21);
    const samples = [];
    if (timing) {
      for (let i = 0; i < SAMPLE_FRAMES; i++) {
        await waitFrames(page, 1);
        samples.push(await page.evaluate(() => window.__game.dev.renderInfo()));
      }
    }
    const r = await page.evaluate(() => ({
      draws: window.__game.dev.renderInfo().drawCalls,
      tris: window.__game.dev.renderInfo().triangles,
      profile: window.__game.dev.renderProfile(),
    }));
    rows.push({
      name: v.name,
      ...r,
      gpu: median(samples.map((s) => s.gpuMs)),
      frame: median(samples.map((s) => s.frameMs)),
      cpu: median(samples.map((s) => s.cpuMs)),
    });
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
  // 全視点を回った後のレンダーパイプライン生成数（マテリアル統合の効果の目安。#325）
  const pipelines = await page.evaluate(() => window.__game.dev.perfProbe().pipelineCreations);
  console.log(`\n${quality} / ${target.name} / pipelines ${pipelines}`);
  if (timing) {
    console.log(
      '\n| viewpoint | draws | tris | gpu ms (med) | frame ms (med) | render cpu ms (med) |\n| --- | --- | --- | --- | --- | --- |',
    );
    for (const r of rows) {
      console.log(
        `| ${r.name} | ${r.draws} | ${(r.tris / 1000).toFixed(0)}k | ${fmt(r.gpu)} | ${fmt(r.frame)} | ${fmt(r.cpu)} |`,
      );
    }
  } else {
    console.log('\n| viewpoint | draws | tris |\n| --- | --- | --- |');
    for (const r of rows)
      console.log(`| ${r.name} | ${r.draws} | ${(r.tris / 1000).toFixed(0)}k |`);
  }
} finally {
  await session.close();
}
