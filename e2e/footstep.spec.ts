import { expect, test, type Page } from '@playwright/test';
import { holdKey, startGame, waitSteps } from './helpers';

// 足音 SE（E7-3a）: 歩くと `footstep` イベントが地表素材に応じた再生要求（cue）になり、A → D の移動で素材が切り替わる。
// 再生要求は dev フック `footstepLog`（audio 層と同じ変換）で、実際の再生は SfxPlayer の統計（played）で確認する。

const log = (page: Page) => page.evaluate(() => window.__game?.dev.footstepLog() ?? []);
const played = (page: Page) =>
  page.evaluate(
    () => (window.__game?.audio?.sfx.stats as { played: number } | undefined)?.played ?? 0,
  );

/** 指定位置・向きへ置き直し、カメラを進行方向の背後へ向けて W を `steps` ステップ押し続ける。 */
async function walkFrom(page: Page, x: number, z: number, yaw: number, steps: number) {
  await page.evaluate(
    ([px, pz, py]) => {
      window.__game?.dev.teleport(px as number, pz as number, py as number);
      window.__game?.dev.view(0, 4.2, 15);
    },
    [x, z, yaw],
  );
  await holdKey(page, 'KeyW', steps);
}

test('footsteps follow the ground material from area A to the crypt D', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  // 経路上の敵は置かない（足音は敵のものも混ざるため、プレイヤーのものだけを見る）
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.audio?.sfx.loaded ?? 0), { timeout: 30_000 })
    .toBeGreaterThanOrEqual(16); // 足音 16 本（title グループで先読み）
  await page.mouse.click(200, 200); // 最初の操作で AudioContext を resume
  await expect
    .poll(() => page.evaluate(() => window.__game?.audio?.state), { timeout: 10_000 })
    .toBe('running');

  const playedBefore = await played(page);

  // A（石）: 篝火の広場
  await walkFrom(page, 0, 0, Math.PI / 2, 45);
  const inA = (await log(page)).filter((e) => e.source === 'player');
  expect(inA.length).toBeGreaterThan(0);
  expect(inA.every((e) => e.cue === 'sfx.footstep-stone' && e.surface === 'stone')).toBe(true);

  // A → 外（草）: 東へ歩いて円の縁（x = 8）を越える。最新の足音は草、直前までは石
  await walkFrom(page, 4, 0, Math.PI / 2, 150);
  const cross = (await log(page)).filter((e) => e.source === 'player').map((e) => e.surface);
  expect(cross[0]).toBe('grass');
  expect(cross).toContain('stone');

  // B（草）
  await walkFrom(page, 20, 6, Math.PI / 2, 90);
  const inB = (await log(page)).filter((e) => e.source === 'player');
  expect(inB.slice(0, 3).every((e) => e.cue === 'sfx.footstep-grass')).toBe(true);

  // D 地下墓所: 入口（z = 36）の手前から北へ入る。草 → crypt に切り替わる
  await walkFrom(page, 62, 33, 0, 150);
  const toD = (await log(page)).filter((e) => e.source === 'player');
  expect(toD[0]?.cue).toBe('sfx.footstep-crypt');
  expect(toD.map((e) => e.surface)).toContain('grass');

  // 再生要求が実際に SfxPlayer へ渡っている（素材の切替ごとに別の音が鳴る）
  await waitSteps(page, 1);
  expect(await played(page)).toBeGreaterThan(playedBefore);
  expect(errors).toEqual([]);
});
