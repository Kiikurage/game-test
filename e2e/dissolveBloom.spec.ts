import { expect, test } from '@playwright/test';
import { bootGame, waitFrames } from './helpers';

// #258: 敵のディゾルブ中にブルームの GPU 時間が跳ね上がった。ブルームへ渡る HDR シーン色に
// NaN / Inf や極端に明るい画素が出ていないことを、ディゾルブの進行を通して確認する。
// あわせて、ディゾルブで新しいパイプライン（材質切り替え・半透明化・追加パス）が作られないことも確認する。
// シミュレーションを止めて dev.advance で進めるので、実時間に依存しない。
test('dissolving enemy keeps the HDR scene color finite and bounded', async ({ page }) => {
  // medium の描画フレームを待つ（SwiftShader では 1 フレームが重い）ので延長する
  test.setTimeout(300_000);
  await bootGame(page, { quality: 'medium', draw: true, params: { scale: '0.25' } });
  await page.evaluate(() => {
    window.__game?.dev.killEnemy(0, false);
  });
  await waitFrames(page, 4);
  const sample = async (): Promise<{ nonFinite: number; maxRgb: number }> => {
    await waitFrames(page, 3);
    const s = await page.evaluate(() => window.__game?.dev.sceneStats());
    if (!s) throw new Error('sceneStats unavailable');
    return s;
  };
  const alive = await sample();
  const pipelines = (): Promise<number> =>
    page.evaluate(() => window.__game?.dev.perfProbe().pipelineCreations ?? -1);
  const pipelinesAlive = await pipelines();
  await page.evaluate(() => {
    window.__game?.dev.killEnemy(0);
    // 撃破の閃光（F0〜）・燃え尽き（〜20F）・ディゾルブ（20F〜68F。#281）を通して見る
    window.__game?.dev.advance(1);
  });
  const dissolve: { nonFinite: number; maxRgb: number }[] = [];
  for (let i = 0; i < 6; i++) {
    dissolve.push(await sample());
    await page.evaluate(() => window.__game?.dev.advance(10));
  }
  const pipelinesAdded = (await pipelines()) - pipelinesAlive;
  console.log(
    `scene stats: alive ${JSON.stringify(alive)} dissolve ${JSON.stringify(dissolve)} pipelines +${pipelinesAdded}`,
  );
  // ディゾルブは uniform と discard だけ。材質の切り替え・追加パス（= 新しいパイプライン）を作らない
  expect(pipelinesAdded).toBe(0);
  for (const s of [alive, ...dissolve]) {
    expect(s.nonFinite).toBe(0);
    expect(s.maxRgb).toBeLessThanOrEqual(16);
  }
});
