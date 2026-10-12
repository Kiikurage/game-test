// 使い方: npm run perf -- [quality(low|medium|high)] [query追加]
// 各視点（scripts/perfViewpoints.mjs）の描画負荷（renderer.info 実測 + カテゴリ別内訳）を表で出す。
// PERF_PC=1 なら PC（1280x720・内部解像度 1）で開き、`?perf` の GPU 時間（timestamp-query。非対応は n/a）・
// フレーム間隔・描画 CPU 時間と、起動時間（ページを開いてから開始画面 / running まで）も出す（GPU_MODE=hardware と併用）。
// GPU 時間はパス別（`dev.gpuTiming()`。視点ごとに集計をやり直し、120 フレームの中央値）も出す。
// GPU_NOVSYNC=1 で vsync を外す（frame ms が 60Hz に頭打ちにならない。120fps 判定用。scripts/chromium.mjs）。
// PERF_SPIKE=particles|physics: 配置の spike（#383。`?spike=`）を配置ごと（PERF_PLACES、カンマ区切り）に測る。
//   メインスレッドの JS ms/frame（CDP Profiler。Worker は含まない）・GPU 時間・フレーム時間・同期点〜描画の CPU 時間を出す。
//   PERF_SPIKE_SHOT=<接頭辞> で配置ごとの画面も保存する。
import { PERF_VIEWPOINTS } from './perfViewpoints.mjs';
import {
  measureTarget,
  newPage,
  openSession,
  setViewpoint,
  startGame,
  waitFrames,
  waitReady,
  waitSteps,
} from './lib/session.mjs';

const quality = process.argv[2] ?? 'medium';
const extra = process.argv[3] ?? '';
const target = measureTarget();
const timing = !!process.env.PERF_PC;
/** GPU 時間などは直近の値が揺れるので、視点ごとにこのフレーム数だけ取って中央値を出す。 */
const SAMPLE_FRAMES = 60;
/** パス別 GPU 時間を集計するフレーム数（dev.gpuTiming は直近 120 フレームの中央値）。 */
const GPU_FRAMES = 130;
const median = (a) => {
  const s = a.filter((v) => typeof v === 'number').sort((x, y) => x - y);
  return s.length === 0 ? null : s[Math.floor(s.length / 2)];
};
const fmt = (v) => (v === null ? 'n/a' : v.toFixed(2));

if (process.env.PERF_SPIKE) {
  await measureSpike(process.env.PERF_SPIKE);
  process.exit(0);
}

/** 配置の spike を配置ごとに測る（#383）。 */
async function measureSpike(kind) {
  const places = (
    process.env.PERF_PLACES ?? (kind === 'physics' ? 'main,worker-sab,worker-msg' : 'main,gpu')
  ).split(',');
  const session = await openSession({
    port: Number(process.env.SHOT_PORT ?? 4180),
    skipBuild: !!process.env.PERF_SKIP_BUILD,
  });
  const rows = [];
  try {
    for (const place of places) {
      const { context, page } = await newPage(session, {
        context: target.context,
        consoleTypes: ['error', 'warning'],
      });
      await page.goto(session.url(`?spike=${kind}&place=${kind}:${place}&perf${extra}`));
      await page.waitForFunction(() => (window.__game?.frames ?? 0) > 0, null, {
        timeout: 120_000,
      });
      // シミュレーション時間で温める（vsync 無しでは 1 フレームが短く、フレーム数では物理が進まない）
      await waitSteps(page, 600);
      await waitFrames(page, 60);
      await page.evaluate(() => window.__game.dev.resetGpuTiming());
      const cdp = await context.newCDPSession(page);
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
      const [f0, s0] = await page.evaluate(() => [window.__game.frames, window.__game.steps]);
      await cdp.send('Profiler.start');
      const samples = [];
      for (let i = 0; i < SAMPLE_FRAMES; i++) {
        await waitFrames(page, 1);
        samples.push(await page.evaluate(() => window.__game.dev.renderInfo()));
      }
      await waitFrames(page, GPU_FRAMES - SAMPLE_FRAMES);
      await waitSteps(page, 240);
      const { profile } = await cdp.send('Profiler.stop');
      const [f1, s1] = await page.evaluate(() => [window.__game.frames, window.__game.steps]);
      let jsUs = 0;
      const ids = new Map(profile.nodes.map((n) => [n.id, n.callFrame.functionName]));
      for (let i = 0; i < profile.samples.length; i++) {
        const name = ids.get(profile.samples[i]);
        if (name === '(idle)' || name === '(program)' || name === '(root)') continue;
        jsUs += profile.timeDeltas[i + 1] ?? 0;
      }
      const gpu = await page.evaluate(() => window.__game.dev.gpuTiming());
      const info = await page.evaluate(() => window.__game.dev.spikeInfo());
      // PERF_SPIKE_SHOT=<接頭辞>: 配置ごとの見た目を `<接頭辞>-<place>.png` に保存する（描画が同じかの確認用）
      if (process.env.PERF_SPIKE_SHOT)
        await page.screenshot({ path: `${process.env.PERF_SPIKE_SHOT}-${place}.png` });
      rows.push({
        place,
        js: jsUs / 1000 / (f1 - f0),
        jsPerStep: jsUs / 1000 / Math.max(1, s1 - s0),
        fps: (f1 - f0) / ((s1 - s0) / 60),
        maxCpu: (await page.evaluate(() => window.__game.dev.renderInfo())).maxCpuMs,
        workPerStep: info.workMs === null ? null : info.workMs / Math.max(1, info.workSteps),
        workPerFrame: info.workMs === null ? null : info.workMs / Math.max(1, info.workFrames),
        gpu: gpu?.sumMs ?? null,
        frame: median(samples.map((s) => s.frameMs)),
        cpu: median(samples.map((s) => s.cpuMs)),
        coi: info.crossOriginIsolated,
        passes: gpu?.passes ?? [],
      });
      await context.close();
    }
  } finally {
    await session.close();
  }
  console.log(
    `\n# spike ${kind} (${quality}, ${target.name})\n\n| place | main JS ms/frame (CDP) | main JS ms/step (CDP) | sync+render cpu ms (med) | worst sync+render cpu ms | gpu busy ms (med) | frame ms (med) | fps (sim time) | job ms/frame | job ms/step | crossOriginIsolated | passes |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`,
  );
  for (const r of rows) {
    console.log(
      `| ${r.place} | ${r.js.toFixed(2)} | ${r.jsPerStep.toFixed(2)} | ${fmt(r.cpu)} | ${fmt(r.maxCpu)} | ${fmt(r.gpu)} | ${fmt(r.frame)} | ${r.fps.toFixed(0)} | ${fmt(r.workPerFrame)} | ${fmt(r.workPerStep)} | ${r.coi} | ${r.passes.map((p) => `${p.label} ${p.ms.toFixed(2)}`).join(', ')} |`,
    );
  }
}

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
    let gpuTiming = null;
    if (timing) {
      await page.evaluate(() => window.__game.dev.resetGpuTiming());
      await waitFrames(page, GPU_FRAMES);
      // 解決は非同期なので、集計が溜まるまで待つ（フレーム数基準）
      await page.waitForFunction(
        (n) => (window.__game.dev.gpuTiming()?.frames ?? n) >= n,
        GPU_FRAMES - 10,
        { polling: 'raf' },
      );
      gpuTiming = await page.evaluate(() => window.__game.dev.gpuTiming());
      for (let i = 0; i < SAMPLE_FRAMES; i++) {
        await waitFrames(page, 1);
        samples.push(await page.evaluate(() => window.__game.dev.renderInfo()));
      }
    }
    const r = await page.evaluate(() => ({
      draws: window.__game.dev.renderInfo().drawCalls,
      tris: window.__game.dev.renderInfo().triangles,
      profile: window.__game.dev.renderProfile(),
      pipelines: window.__game.dev.perfProbe().pipelineCreations,
    }));
    rows.push({
      name: v.name,
      ...r,
      gpu: gpuTiming?.sumMs ?? null,
      raw: gpuTiming?.rawSumMs ?? null,
      span: gpuTiming?.spanMs ?? null,
      passes: gpuTiming?.passes ?? [],
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
  // 視点ごとの累計と、その視点で新たに作られた数（#326）
  console.log('\n| viewpoint | pipelines (cumulative) | new |\n| --- | --- | --- |');
  let prev = 0;
  for (const r of rows) {
    console.log(`| ${r.name} | ${r.pipelines} | ${r.pipelines - prev} |`);
    prev = r.pipelines;
  }
  // 何がパイプラインを分けているか（マテリアルの種類・ウーバーのバリアント・メッシュの種類で集計）
  const labels = await page.evaluate(() => window.__game.dev.perfProbe().pipelineLabels);
  const counts = new Map();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  console.log('\n| pipelines | label |\n| --- | --- |');
  for (const [l, n] of [...counts].sort((a, b) => b[1] - a[1])) console.log(`| ${n} | ${l} |`);
  if (process.env.PIPELINE_DETAIL) {
    // v / f = 頂点・フラグメントのシェーダコード、s = レンダーステート（ブレンド・深度・サンプル数・ジオメトリ）のハッシュ
    const details = await page.evaluate(() => window.__game.dev.perfProbe().pipelineDetails);
    console.log('\n# pipeline details');
    for (const d of [...details].sort()) console.log(d);
  }
  if (timing) {
    console.log(
      '\n| viewpoint | draws | tris | gpu busy ms (med) | gpu span ms (med) | gpu raw-sum ms (med) | frame ms (med) | render cpu ms (med) |\n| --- | --- | --- | --- | --- | --- | --- | --- |',
    );
    for (const r of rows) {
      console.log(
        `| ${r.name} | ${r.draws} | ${(r.tris / 1000).toFixed(0)}k | ${fmt(r.gpu)} | ${fmt(r.span)} | ${fmt(r.raw)} | ${fmt(r.frame)} | ${fmt(r.cpu)} |`,
      );
    }
    // パス別 GPU 時間（ms。中央値）。列は全視点に出てきたパス名
    const labels = [...new Set(rows.flatMap((r) => r.passes.map((p) => p.label)))];
    if (labels.length > 0) {
      console.log(
        `\n| viewpoint | ${labels.join(' | ')} |\n| --- | ${labels.map(() => '---').join(' | ')} |`,
      );
      for (const r of rows) {
        const cell = (l) => fmt(r.passes.find((p) => p.label === l)?.ms ?? null);
        console.log(`| ${r.name} | ${labels.map(cell).join(' | ')} |`);
      }
    }
  } else {
    console.log('\n| viewpoint | draws | tris |\n| --- | --- | --- |');
    for (const r of rows)
      console.log(`| ${r.name} | ${r.draws} | ${(r.tris / 1000).toFixed(0)}k |`);
  }
} finally {
  await session.close();
}
