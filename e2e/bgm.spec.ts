import { expect, test } from '@playwright/test';
import { bootGame } from './helpers';

// 実 AudioContext 上で、フィールド曲（開始時）とボス戦の流れ（入場 → フェーズ移行 → 撃破 → 篝火）に対して
// 期待する曲・レイヤー・フェード（目標ゲインと秒数）が発行されることを検証する。
// フェードの長さはコントローラが記録した秒数で見る（実時間では待たない）。
test('field and boss BGM flow: start, entry, phase-2 layer, defeat fade-out and victory song', async ({
  page,
}) => {
  const errors = await bootGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.audio?.sfx.loaded ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(5);
  // 自動再生制限: 最初の操作で resume する
  await page.mouse.click(200, 200);
  await expect
    .poll(() => page.evaluate(() => window.__game?.audio?.state), { timeout: 10_000 })
    .toBe('running');

  const bgm = () => page.evaluate(() => window.__game?.audio?.bgm);
  const emit = (e: Parameters<NonNullable<Window['__game']>['dev']['emitBgmEvent']>[0]) =>
    page.evaluate((ev) => window.__game?.dev.emitBgmEvent(ev), e);
  const pos = { x: 0, y: 0, z: 0 };

  // ゲーム開始でフィールド曲が 5 秒かけて入る（#255）
  await expect.poll(async () => (await bgm())?.main?.id).toBe('bgm.field');
  expect((await bgm())?.main).toMatchObject({ target: 1, fadeSeconds: 5 });

  await emit({ name: 'bgmChange', payload: { track: 'bgm.boss', frames: 60 } });
  await expect.poll(async () => (await bgm())?.main?.id).toBe('bgm.boss');
  expect((await bgm())?.main).toMatchObject({ target: 1, fadeSeconds: 1 });
  // 同期レイヤーは無音で待機
  await expect.poll(async () => (await bgm())?.layers.map((l) => l.id)).toEqual(['bgm.boss-layer']);

  await emit({ name: 'bgmLayer', payload: { layer: 'bgm.boss-layer', frames: 360 } });
  const layer = (await bgm())?.layers[0];
  expect(layer).toMatchObject({ id: 'bgm.boss-layer', fadeSeconds: 6 });
  expect(layer?.target).toBeGreaterThan(0);

  await emit({ name: 'bgmFadeOut', payload: { frames: 90 } });
  await expect.poll(async () => (await bgm())?.main).toBeUndefined();

  await emit({
    name: 'bossDefeatCue',
    payload: { id: 'boss', cue: 'text', frame: 150, position: pos },
  });
  expect((await bgm())?.main).toMatchObject({ id: 'bgm.victory' });

  await emit({
    name: 'bossDefeatCue',
    payload: { id: 'boss', cue: 'bonfire', frame: 300, position: pos },
  });
  // 台座の篝火後はフィールド曲へ戻る
  await expect.poll(async () => (await bgm())?.main?.id).toBe('bgm.field');
  expect(errors).toEqual([]);
});
