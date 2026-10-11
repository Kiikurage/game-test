import { expect, test, type Page } from '@playwright/test';
import { bootGame, holdKey, waitSteps, walkThrough } from './helpers';

/** 脇道 side_waterway（#111: 腐った床板 → 地下水路 → 墓室 → 鉄格子 → D の通路）を、入力（前進 + 向き）だけで走破する。 */

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する。敵は置かない（地形の検証）。シミュレーションは止めたまま進める。 */
const boot = (page: Page) => bootGame(page, { enemies: false });

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

/** カメラをプレイヤーの向き + offset の背後へ置き直す（前進は常にカメラ前方へ進む）。 */
const aimCamera = (page: Page, yawOffset: number) =>
  page.evaluate((o) => {
    window.__game?.dev.view(o, 4.2, 15);
  }, yawOffset);

const TUNNEL: [number, number][] = [
  [50, 28],
  [64, 28],
  [66, 30],
  [66, 38],
  [66, 41.5],
  [66, 43.5],
  [68, 44],
  [71, 44],
  [72.2, 44],
  [72.2, 44.5],
];

const WATER_FLOOR = 1.0;
const EXIT_Y = 5.9;

test('the player can step on the rotten floorboard, drop into the waterway, run to the iron grate, and get out into the D corridor once it is opened', async ({
  page,
}) => {
  await boot(page);
  const hooks = () => page.evaluate(() => window.__game?.dev.waterway());

  // 礼拝堂の祭壇裏から床板へ歩く。踏むと割れて 2.4m 落ちる（ダメージなし）
  await teleport(page, 41, 28, Math.PI / 2);
  await waitSteps(page, 20);
  expect(await hooks()).toEqual({ hatchBroken: false, grateOpen: false });
  const hp0 = (await sim(page)).combat.playerHp;
  await walkThrough(page, [[44, 28]], 0.4);
  await waitSteps(page, 90);
  expect((await hooks())?.hatchBroken).toBe(true);
  let p = (await sim(page)).player;
  expect(p.position.y).toBeGreaterThan(WATER_FLOOR - 0.3);
  expect(p.position.y).toBeLessThan(WATER_FLOOR + 0.3);
  expect(p.grounded).toBe(true);
  expect((await sim(page)).combat.playerHp).toBe(hp0);

  // 水路を東へ → 北へ → 階段を上って鉄格子の手前まで
  await walkThrough(page, TUNNEL);
  p = (await sim(page)).player;
  expect(Math.abs(p.position.y - EXIT_Y)).toBeLessThan(0.3);
  expect(p.grounded).toBe(true);

  // 開通前は鉄格子が塞ぐ
  // 許容 0.3m だと階段の上で回り込んで段を下りることがある（向きの補正が 4 ステップごとのため）
  await walkThrough(page, [[72, 44.5]], 0.5);
  // 北（+z）へ押し当てる。aimCamera はプレイヤー相対なので、絶対方位 0 にするには自分の向きを引く
  // （遅い CI ではプレイヤーが水路側を向いていることがあり、相対 0 で W を押すと階段を戻って壁際に嵌まる）
  await aimCamera(page, 0 - (await sim(page)).player.yaw);
  await holdKey(page, 'KeyW', 90);
  p = (await sim(page)).player;
  expect(p.position.z).toBeLessThan(45);

  // 開通 → D の通路の側面へ出る
  await page.evaluate(() => window.__game?.dev.openGrate());
  expect((await hooks())?.grateOpen).toBe(true);
  await walkThrough(page, [
    [72, 46.5],
    [72, 48.5],
  ]);
  p = (await sim(page)).player;
  expect(p.position.z).toBeGreaterThan(47.5);
  expect(Math.abs(p.position.y - EXIT_Y)).toBeLessThan(0.3);
  expect(p.grounded).toBe(true);
  expect(p.state).not.toBe('dead');
});

test('the burial chamber branch can be walked and the way back from D leads into the waterway', async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.breakHatch();
    window.__game?.dev.openGrate();
  });
  // 墓室（60..65, 33..37）へ入って戻る
  await teleport(page, 66, 32, Math.PI, WATER_FLOOR + 0.02);
  await waitSteps(page, 30);
  await walkThrough(page, [
    [66, 35],
    [63, 35],
    [61.5, 36],
    [66, 35],
  ]);
  let p = (await sim(page)).player;
  expect(p.position.y).toBeLessThan(WATER_FLOOR + 0.3);

  // D の通路から水路へ戻る（開通後の逆行）
  await teleport(page, 72, 49, Math.PI, EXIT_Y);
  await waitSteps(page, 30);
  await walkThrough(page, [
    [72, 46.5],
    [72.2, 44.5],
    [71, 44],
    [68, 44],
    [66, 43.5],
    [66, 38],
  ]);
  p = (await sim(page)).player;
  expect(p.position.y).toBeLessThan(WATER_FLOOR + 0.35);
});

test('the waterway water is built and drawn only while the player is down there, and skipped under nodraw (#270)', async ({
  page,
}) => {
  await boot(page);
  const render = () => page.evaluate(() => window.__game?.dev.waterwayRender());
  const start = (await sim(page)).player.position;
  await expect.poll(async () => (await render())?.built).toBe(true);
  // 地上（開始位置）では水路を描かない
  await expect.poll(async () => (await render())?.visible).toBe(false);

  await page.evaluate(() => window.__game?.dev.breakHatch());
  await teleport(page, 47, 28, Math.PI / 2, WATER_FLOOR + 0.02);
  await aimCamera(page, 0);
  await expect.poll(async () => (await render())?.visible).toBe(true);
  await expect.poll(async () => (await render())?.moodWeight ?? 0).toBeGreaterThan(0.99);
  // low は平面反射を描かない
  expect((await render())?.reflection).toBe(false);

  // ?nodraw では GPU の波のシミュレーションを作らない（歩いても進まない）
  await holdKey(page, 'KeyW', 30);
  expect((await render())?.simSteps).toBe(0);

  // 地上へ戻ると描かない・霧の調子も戻る
  await teleport(page, start.x, start.z, 0, start.y);
  await expect.poll(async () => (await render())?.visible).toBe(false);
  await expect.poll(async () => (await render())?.moodWeight ?? 1).toBeLessThan(0.01);
});
