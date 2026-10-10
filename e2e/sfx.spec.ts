import { expect, test } from '@playwright/test';
import { webgpuCompatInit } from '../scripts/webgpuCompat.mjs';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(webgpuCompatInit);
});

test('loads the title-group SFX from the manifest and accepts play requests without errors', async ({
  page,
}) => {
  test.setTimeout(150_000); // 初回フレームまで SwiftShader のコンパイルで遅いことがある
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

  await page.goto('./?quality=low&scale=0.25');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });

  // title グループ（UI・環境音・BGM）のプリロードで、マニフェストのそれらの素材がすべてデコードされる
  const titleCount = await page.evaluate(async () => {
    const res = await fetch(new URL('assets/audio/manifest.json', document.baseURI));
    const manifest = (await res.json()) as { sounds: { kind: string }[] };
    return manifest.sounds.filter((s) => ['bgm', 'ui', 'ambient'].includes(s.kind)).length;
  });
  expect(titleCount).toBeGreaterThan(0);
  await expect
    .poll(() => page.evaluate(() => window.__game?.audio?.sfx.loaded ?? 0), { timeout: 30_000 })
    .toBe(titleCount);

  // 最初の操作で resume してから再生要求を出す（未 resume の要求は見送られる仕様）
  await page.mouse.click(200, 200);
  await expect
    .poll(() => page.evaluate(() => window.__game?.audio?.state), { timeout: 10_000 })
    .toBe('running');

  const stats = await page.evaluate(() => {
    const audio = window.__game?.audio;
    if (!audio) throw new Error('audio unavailable');
    for (let i = 0; i < 40; i++) audio.emitSound('ui.click'); // 上限超過でも例外なし
    audio.emitSound('sfx.no-such-sound'); // 未知の cue は無視
    // `audio` は取得時点のスナップショットなので、統計は取り直す
    return window.__game?.audio?.sfx.stats as { played: number; unknown: number };
  });
  expect(stats.played, JSON.stringify(stats)).toBeGreaterThan(0);
  expect(stats.unknown).toBe(1);

  // 少し待ってもメインループが回り続け、エラーが出ない
  const before = await page.evaluate(() => window.__game?.frames ?? 0);
  await expect
    .poll(() => page.evaluate(() => window.__game?.frames ?? 0), { timeout: 90_000 })
    .toBeGreaterThan(before);
  expect(errors).toEqual([]);
});
