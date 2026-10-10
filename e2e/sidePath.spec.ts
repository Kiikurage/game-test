import { expect, test, type Page } from '@playwright/test';
import { holdKey, startGame, stepCount, waitSteps } from './helpers';

/** 脇道の地形（#110: 霊廟の屋根・北崖の岩棚・北壁の上）を、入力（W 押しっぱなし + 向き）だけで走破する。 */

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する。敵は置かない（地形の検証）。 */
async function boot(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
  await expect.poll(async () => (await sim(page)).player.grounded).toBe(true);
  expect(errors).toEqual([]);
}

const sim = (page: Page) =>
  page.evaluate(() => {
    const s = window.__game?.sim;
    if (!s) throw new Error('sim state unavailable');
    return s;
  });

const teleport = (page: Page, x: number, z: number, yaw: number, y?: number) =>
  page.evaluate(
    ([px, pz, pyaw, py]) => {
      window.__game?.dev.teleport(px, pz, pyaw, py);
    },
    [x, z, yaw, y] as const,
  );

/** カメラをプレイヤーの向き + offset の背後へ置き直す（W は常にカメラ前方へ進む）。 */
const aimCamera = (page: Page, yawOffset: number) =>
  page.evaluate((o) => {
    window.__game?.dev.view(o, 4.2, 15);
  }, yawOffset);

/**
 * 入力（W 押しっぱなし）だけで経由点を順に歩く。各経由点の `tol` m 以内で次へ向きを変える。
 * 時間切れはシミュレーション時間（`maxSeconds`）で判定する。
 */
async function walkThrough(
  page: Page,
  waypoints: readonly (readonly [number, number])[],
  tol = 0.6,
  maxSeconds = 30,
) {
  await page.keyboard.down('KeyW');
  try {
    for (const [wx, wz] of waypoints) {
      const deadline = (await stepCount(page)) + maxSeconds * 60;
      for (;;) {
        const p = (await sim(page)).player;
        const dx = wx - p.position.x;
        const dz = wz - p.position.z;
        if (Math.hypot(dx, dz) < tol) break;
        expect(
          await stepCount(page),
          `timed out before (${wx}, ${wz}) at ${JSON.stringify(p.position)}`,
        ).toBeLessThan(deadline);
        const camYaw = (await sim(page)).camera.yaw;
        const want = Math.atan2(dx, dz);
        const diff = Math.atan2(Math.sin(want - camYaw), Math.cos(want - camYaw));
        if (Math.abs(diff) > 0.04) await aimCamera(page, want - p.yaw);
        await waitSteps(page, 4);
      }
    }
  } finally {
    await page.keyboard.up('KeyW');
  }
}

// 岩棚の中心線（崖の足元 → 倒れた柵の隙間 → 礼拝堂の西の外壁沿い → 北壁の上）
const LEDGE: [number, number][] = [
  [35, 19],
  [33, 22],
  [33, 25],
  [35.5, 27.5],
  [38, 29.8],
  [39.6, 32],
  [44, 32],
  [50, 32],
  [53, 32],
];

test('the player can run from B up the mausoleum roof, along the cliff ledge to the chapel wall top, and drop into the chapel at three points', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await boot(page);
  const alive = async () => (await sim(page)).player.state !== 'dead';

  // B の小径の北端から、霊廟の裏の石段を上って屋根へ
  await teleport(page, 33, 14, Math.PI);
  await waitSteps(page, 20);
  const trail: number[] = [];
  await walkThrough(page, [
    [33, 17],
    [32, 20.5],
    [31, 22.5],
  ]);
  // 石段は幅 1.2m（カプセルは 0.7m）。中央に合わせてから上る
  await walkThrough(page, [[29, 22.5]], 0.25);
  await walkThrough(
    page,
    [
      [29, 19.5],
      [29, 16],
    ],
    0.35,
  );
  let p = (await sim(page)).player;
  trail.push(p.position.y);
  // 屋根の上（高さ 2.2m 付近 = 約 4.96m）に立っている
  expect(p.position.y).toBeGreaterThan(4.7);
  expect(p.position.y).toBeLessThan(5.2);
  expect(p.grounded).toBe(true);

  // 屋根から石段を戻り、崖の足元から岩棚へ。北壁の上の回廊まで
  await walkThrough(page, [[29, 19.5]], 0.35);
  await walkThrough(page, [[29, 22.5]], 0.35);
  await walkThrough(page, [[31, 22.5], [32, 20.5], [34.5, 18], ...LEDGE]);
  p = (await sim(page)).player;
  expect(Math.hypot(p.position.x - 53, p.position.z - 32)).toBeLessThan(1.2);
  // 回廊の床は礼拝堂の床（3.4m）+ 2.8m
  expect(p.position.y).toBeGreaterThan(6.1);
  expect(p.position.y).toBeLessThan(6.4);
  expect(p.grounded).toBe(true);

  // 壁上から来た道を戻れる（岩棚の途中まで）
  await walkThrough(page, [
    [44, 32],
    [39.6, 32],
    [38, 29.8],
    [35.5, 27.5],
  ]);
  p = (await sim(page)).player;
  expect(p.position.y).toBeGreaterThan(4.3);
  expect(p.position.y).toBeLessThan(5.6);
  trail.push(p.position.y);

  // 三つの落下ポイント（西・中・東）から礼拝堂内へ降りる。落下ダメージなし
  for (const x of [47, 50, 53]) {
    await teleport(page, x, 32, Math.PI, 6.3);
    await waitSteps(page, 20);
    await aimCamera(page, 0);
    await holdKey(page, 'KeyW', 120);
    p = (await sim(page)).player;
    expect(p.position.z, `drop at x=${x}`).toBeLessThan(31.3);
    expect(Math.abs(p.position.y - 3.4), `drop at x=${x}`).toBeLessThan(0.35);
    expect(p.grounded).toBe(true);
    expect(await alive()).toBe(true);
  }
  expect(Math.min(...trail)).toBeGreaterThan(2);
});

test('the mausoleum roof south edge and the ledge edges do not let the player fall to death', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await boot(page);
  // 屋根の南縁から降りる
  await teleport(page, 29, 14.4, Math.PI, 5);
  await waitSteps(page, 20);
  await aimCamera(page, 0);
  await holdKey(page, 'KeyW', 120);
  let p = (await sim(page)).player;
  expect(p.position.z).toBeLessThan(13.4);
  expect(p.position.y).toBeLessThan(3.3);
  expect(p.state).not.toBe('dead');

  // 岩棚の途中（北向きの区間）から横（東）へ押し続けても落ちない（透明壁）
  await teleport(page, 33, 23.5, Math.PI / 2, 3.9);
  await waitSteps(page, 20);
  await aimCamera(page, 0);
  await holdKey(page, 'KeyW', 150);
  p = (await sim(page)).player;
  expect(p.position.y).toBeGreaterThan(3.5);
  expect(p.position.x).toBeLessThan(34);
  expect(p.state).not.toBe('dead');
});
