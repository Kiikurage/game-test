import { expect, test } from '@playwright/test';
import { bootGame, waitFrames } from './helpers';

// #241: 敵が倒れる（死亡 → ディゾルブ）ときの初回パイプライン生成（カクつき）の回帰テスト。
// 倒した後にレンダーパイプラインが新たに生成されないこと（ロード中の warmUp で済んでいること）を確認する。
// 修正前は、詳細メッシュ（亡者マテリアル）が初めて描かれる死亡の瞬間に 6 本生成され、CPU 時間が 400〜600ms に跳ねた。
test('killing an enemy does not create new render pipelines', async ({ page }) => {
  // 描画しながら実ループで 150 ステップ進める（SwiftShader の medium 描画は遅い）ので延長する
  test.setTimeout(300_000);
  await bootGame(page, {
    quality: 'medium',
    draw: true,
    paused: false,
    params: { scale: '0.25' },
  });
  await waitFrames(page, 6);
  type Sample = { n: number; cpu: number };
  const probe = (): Promise<Sample> =>
    page.evaluate(() => {
      const p = window.__game?.dev.perfProbe();
      return { n: p?.pipelineCreations ?? NaN, cpu: p?.frameCpuMs ?? NaN };
    });
  // 敵のそばへ移動（周囲の環境メッシュの初回描画は死亡と無関係なので、先に済ませる）。まだ倒さない
  await page.evaluate(() => window.__game?.dev.killEnemy(0, false));
  await waitFrames(page, 6);
  const before = await probe();
  const killed = await page.evaluate(() => window.__game?.dev.killEnemy(0));
  expect(killed).not.toBeNull();
  // 死亡直後 〜 ディゾルブ開始（60F 後）〜 消滅（さらに 60F）まで、フレームごとの値を集める
  const samples = await page.evaluate(
    () =>
      new Promise<Sample[]>((resolve) => {
        const out: Sample[] = [];
        const start = window.__game?.steps ?? 0;
        const tick = (): void => {
          const p = window.__game?.dev.perfProbe();
          out.push({ n: p?.pipelineCreations ?? NaN, cpu: p?.frameCpuMs ?? NaN });
          if ((window.__game?.steps ?? 0) - start >= 150 && out.length >= 12) resolve(out);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  const after = samples[samples.length - 1] ?? { n: NaN, cpu: NaN };
  const maxCpu = Math.max(...samples.map((s) => s.cpu));
  console.log(
    `death perf: pipelines ${before.n} -> ${after.n}, cpu before ${before.cpu.toFixed(1)}ms, max after ${maxCpu.toFixed(1)}ms, frames ${samples.length}`,
  );
  expect(after.n - before.n, `pipelines: ${before.n} -> ${after.n}`).toBe(0);
});
