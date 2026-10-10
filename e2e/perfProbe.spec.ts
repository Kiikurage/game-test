import { expect, test } from '@playwright/test';
import { holdKey, startGame, waitFrames } from './helpers';

// #231: スマホ実機で 1fps まで落ちる類の破滅的な不具合（毎フレームのパイプライン / シェーダ再生成）の回帰テスト。
// ウォームアップ後にレンダーパイプラインの生成回数が増え続けていないことを確認する。
// Android Chrome（Dawn/Vulkan）ではパイプライン生成が非常に遅いので、1 つでも毎フレーム増えれば致命的。
for (const level of ['medium'] as const) {
  test(`no render pipelines are created per frame after warm-up (${level})`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto(`./?quality=${level}&scale=0.25`);
    await startGame(page);
    await waitFrames(page, 4);
    const created = (): Promise<number> =>
      page.evaluate(() => window.__game?.dev.perfProbe().pipelineCreations ?? NaN);

    const before = await created();
    expect(before).toBeGreaterThan(0);
    // 立ち止まって描画 → 移動して描画。移動・カメラ回転でもパイプラインは増えない
    await waitFrames(page, 8);
    const idle = await created();
    await holdKey(page, 'KeyW', 30);
    await waitFrames(page, 8);
    const moved = await created();
    // 敵の被弾などで初めて出る描画は許容するが、フレーム数（数十）に比例して増えてはならない
    expect(idle - before, `idle: ${before} -> ${idle}`).toBeLessThanOrEqual(2);
    expect(moved - idle, `moving: ${idle} -> ${moved}`).toBeLessThanOrEqual(2);
  });
}
