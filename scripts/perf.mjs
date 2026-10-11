// 使い方: npm run perf -- [quality(low|medium|high)] [query追加]
// 各視点（scripts/perfViewpoints.mjs）の描画負荷（renderer.info 実測 + カテゴリ別内訳）を表で出す。
import { PERF_VIEWPOINTS } from './perfViewpoints.mjs';
import { newPage, openSession, setViewpoint, startGame, waitFrames } from './lib/session.mjs';

const quality = process.argv[2] ?? 'medium';
const extra = process.argv[3] ?? '';
const session = await openSession({
  port: Number(process.env.SHOT_PORT ?? 4180),
  skipBuild: !!process.env.PERF_SKIP_BUILD,
});
try {
  const { page } = await newPage(session, {
    context: { viewport: { width: 915, height: 412 } },
    consoleTypes: ['error', 'warning'],
  });
  await page.goto(session.url(`?quality=${quality}&scale=0.25${extra}`));
  await startGame(page);
  const rows = [];
  for (const v of PERF_VIEWPOINTS) {
    await setViewpoint(page, v);
    await waitFrames(page, 21);
    const r = await page.evaluate(() => ({
      draws: window.__game.dev.renderInfo().drawCalls,
      tris: window.__game.dev.renderInfo().triangles,
      profile: window.__game.dev.renderProfile(),
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
  await session.close();
}
