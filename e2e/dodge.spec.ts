import { expect, test, type Page } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 120_000 });

/** ロール / バックステップのフレーム検証。シミュレーションを止めて 1 ステップずつ進め、実キャラクターのクリップも読む。 */
async function boot(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?scene=test&quality=low&scale=0.25');
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 60_000 })
    .toBeGreaterThan(30);
  await expect
    .poll(() => page.evaluate(() => window.__game?.sim.player.grounded ?? false))
    .toBe(true);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });
  return errors;
}

/**
 * 1 ステップ進めて、プレイヤーの状態・F・無敵・再生中のクリップを返す。
 * クリップを読むステップだけ `readClip` で描画フレームを待つ（毎ステップ待つと、負荷時に描画が遅れてタイムアウトする #206）。
 */
const step = (page: Page, readClip = false) =>
  page.evaluate(async (readClip) => {
    const g = window.__game;
    if (!g) throw new Error('no game');
    g.dev.advance(1);
    if (readClip) {
      // 描画フレームを 2 つ挟んで、アニメーションのクリップを更新させる
      await new Promise<void>((r) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            r();
          }),
        ),
      );
    }
    const p = g.sim.player;
    return {
      state: p.state,
      frame: p.stateFrame,
      invulnerable: p.invulnerable,
      clip: g.playerView?.clip ?? '',
      x: p.position.x,
      z: p.position.z,
    };
  }, readClip);

test('roll: F4–F15 invulnerable, 32 frames long, 3.2m, plays the Roll clip', async ({ page }) => {
  const errors = await boot(page);
  const start = await page.evaluate(() => window.__game?.sim.player.position);
  if (!start) throw new Error('no player');

  await page.keyboard.down('KeyD');
  await tapKey(page, 'Space');
  const log: Awaited<ReturnType<typeof step>>[] = [];
  const first = await step(page);
  log.push(first);
  await page.keyboard.up('KeyD'); // 以降はスティック入力なし
  // クリップを検証するフレーム（下の expect と揃える）だけ描画を待つ。ロールの F1 は log[0]。
  const clipFrames = [2, 4, 15, 26, 31];
  for (let i = 0; i < 40; i++) log.push(await step(page, clipFrames.includes(log.length + 1)));

  expect(first.state).toBe('roll');
  expect(first.frame).toBe(1);
  const roll = log.filter((s) => s.state === 'roll');
  expect(roll.map((s) => s.frame)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1));
  expect(roll.filter((s) => s.invulnerable).map((s) => s.frame)).toEqual(
    Array.from({ length: 12 }, (_, i) => i + 4),
  );
  // 実キャラクターのクリップが Roll（描画は ?nodraw なし）
  for (const f of [2, 4, 15, 26, 31]) {
    expect(roll.find((s) => s.frame === f)?.clip).toBe('Roll');
  }
  const end = log[log.length - 1];
  expect(end?.state).toBe('idle');
  expect(Math.hypot((end?.x ?? 0) - start.x, (end?.z ?? 0) - start.z)).toBeCloseTo(3.2, 1);
  expect(errors).toEqual([]);
});

test('backstep: F1–F8 invulnerable, 22 frames long, 2.0m, plays the dash clip', async ({
  page,
}) => {
  const errors = await boot(page);
  const start = await page.evaluate(() => window.__game?.sim.player.position);
  if (!start) throw new Error('no player');

  await tapKey(page, 'Space');
  const log: Awaited<ReturnType<typeof step>>[] = [];
  // クリップを検証する F6 の前後だけ描画を待つ（バックステップの F1 は log[0]）。
  for (let i = 0; i < 30; i++) log.push(await step(page, log.length + 1 === 6));

  const back = log.filter((s) => s.state === 'backstep');
  expect(back.map((s) => s.frame)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
  expect(back.filter((s) => s.invulnerable).map((s) => s.frame)).toEqual(
    Array.from({ length: 8 }, (_, i) => i + 1),
  );
  expect(back.find((s) => s.frame === 6)?.clip).toBe('Sword_Dash');
  const end = log[log.length - 1];
  expect(end?.state).toBe('idle');
  expect(Math.hypot((end?.x ?? 0) - start.x, (end?.z ?? 0) - start.z)).toBeCloseTo(2.0, 1);
  expect(errors).toEqual([]);
});
