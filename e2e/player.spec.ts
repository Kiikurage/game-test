import { expect, test, type Page } from '@playwright/test';
import { webgpuCompatInit } from '../scripts/webgpuCompat.mjs';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(webgpuCompatInit);
});

/** ソフトウェア描画でもシミュレーションが回るよう、最小品質・低解像度で起動する。 */
async function boot(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
  // 起動直後は着地・スポーン直後。落ち着くまで待つ
  await expect.poll(async () => (await sim(page)).player.grounded).toBe(true);
  expect(errors).toEqual([]);
}

const sim = (page: Page) =>
  page.evaluate(() => {
    const s = window.__game?.sim;
    if (!s) throw new Error('sim state unavailable');
    return s;
  });

const teleport = (page: Page, x: number, z: number, yaw: number) =>
  page.evaluate(
    ([px, pz, pyaw]) => {
      window.__game?.dev.teleport(px as number, pz as number, pyaw as number);
    },
    [x, z, yaw],
  );

test('WASD moves the character relative to the camera and it stops when released', async ({
  page,
}) => {
  await boot(page);
  const start = (await sim(page)).player.position;

  await page.keyboard.down('KeyW');
  await expect.poll(async () => (await sim(page)).player.speed).toBeGreaterThan(4);
  const running = await sim(page);
  expect(running.player.state).toBe('move');
  // 初期のカメラは -Z を向いているので、W は -Z へ進む
  await expect.poll(async () => (await sim(page)).player.position.z).toBeLessThan(start.z - 2);
  expect(Math.abs((await sim(page)).player.position.x - start.x)).toBeLessThan(0.1);

  await page.keyboard.up('KeyW');
  await expect.poll(async () => (await sim(page)).player.speed).toBeLessThan(0.05);
  expect((await sim(page)).player.state).toBe('idle');
});

test('the knight model plays locomotion animations that follow the movement speed', async ({
  page,
}) => {
  await boot(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.playerView?.clip), { timeout: 30_000 })
    .toBe('Idle_Loop');
  expect(await page.evaluate(() => window.__game?.playerView?.triangles ?? 0)).toBeGreaterThan(
    10_000,
  );
  await page.keyboard.down('KeyW');
  await expect
    .poll(() => page.evaluate(() => window.__game?.playerView?.clip), { timeout: 30_000 })
    .toBe('Jog_Fwd_Loop');
  await page.keyboard.up('KeyW');
  await expect
    .poll(() => page.evaluate(() => window.__game?.playerView?.clip), { timeout: 30_000 })
    .toBe('Idle_Loop');
});

test('a short Space press rolls toward the stick direction and costs stamina', async ({ page }) => {
  await boot(page);
  const start = (await sim(page)).player;

  await page.keyboard.down('KeyD');
  await page.keyboard.press('Space'); // 短押し = 離した時点でロール確定
  await expect.poll(async () => (await sim(page)).events.rollStart).toBe(1);
  expect((await sim(page)).player.stamina).toBeLessThan(start.stamina - 10);

  // 画面右（+X）へ 3m 以上動く
  await expect
    .poll(async () => (await sim(page)).player.position.x - start.position.x)
    .toBeGreaterThan(3);
  await page.keyboard.up('KeyD');
  await expect.poll(async () => (await sim(page)).player.state).toBe('idle');
  expect((await sim(page)).events.rollStart).toBe(1);
});

test('Space without a direction does a backstep, and holding Space sprints', async ({ page }) => {
  await boot(page);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await sim(page)).events.backstepStart).toBe(1);
  await expect.poll(async () => (await sim(page)).player.state).toBe('idle');

  await page.keyboard.down('KeyW');
  await page.keyboard.down('Space'); // 長押し = ダッシュ
  await expect.poll(async () => (await sim(page)).player.state).toBe('dash');
  await expect.poll(async () => (await sim(page)).player.speed).toBeGreaterThan(6.3);
  const before = (await sim(page)).player.stamina;
  await expect.poll(async () => (await sim(page)).player.stamina).toBeLessThan(before - 1);
  await page.keyboard.up('Space');
  await page.keyboard.up('KeyW');
  expect((await sim(page)).events.rollStart).toBe(0);
});

test('lock-on: Q locks the nearest dummy, strafing keeps facing it, arrows switch, Q releases', async ({
  page,
}) => {
  await boot(page);
  await page.keyboard.press('KeyQ');
  await expect.poll(async () => (await sim(page)).lockOn.targetId).toBe('dummy-a');

  // 右へストレイフ。対象を向いたまま、約 3.8 m/s で横へ動く
  const before = (await sim(page)).player;
  await page.keyboard.down('KeyD');
  await expect.poll(async () => (await sim(page)).player.speed).toBeGreaterThan(3.5);
  const moving = await sim(page);
  expect(moving.player.state).toBe('move');
  const dx = 0 - moving.player.position.x;
  const dz = -6 - moving.player.position.z;
  const toTarget = Math.atan2(dx, dz);
  let diff = moving.player.yaw - toTarget;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  expect(Math.abs(diff)).toBeLessThan(0.4);
  await expect
    .poll(async () => Math.abs((await sim(page)).player.position.x - before.position.x))
    .toBeGreaterThan(1.5);
  await page.keyboard.up('KeyD');

  // ターゲット切替（矢印キー）
  const first = (await sim(page)).lockOn.targetId;
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await sim(page)).lockOn.targetId).not.toBe(first);

  // トグルで解除
  await page.keyboard.press('KeyQ');
  await expect.poll(async () => (await sim(page)).lockOn.targetId).toBeNull();
});

test('the camera never goes into a wall behind the player', async ({ page }) => {
  await boot(page);
  // 壁（x=-6.5, 厚 0.7。東面は x=-6.15）に背をつけて立つ。カメラは壁側（西）にある
  await teleport(page, -5.7, 2, Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    await expect
      .poll(async () => (await sim(page)).camera.armLength, { timeout: 10_000 })
      .toBeLessThan(1.2);
    const s = await sim(page);
    expect(s.camera.position.x).toBeGreaterThan(-6.15);
  }
  // 壁から離れるとアームが元の距離へ戻る
  await teleport(page, 0, 3.5, Math.PI);
  await expect
    .poll(async () => (await sim(page)).camera.armLength, { timeout: 10_000 })
    .toBeGreaterThan(4.0);
});

test('the character auto-steps up the stairs', async ({ page }) => {
  await boot(page);
  // 階段（x=4.75..7.45）の手前（西側）で東（+X）を向かせ、前進する
  await teleport(page, 3.2, 5.2, Math.PI / 2);
  await page.keyboard.down('KeyW');
  await expect
    .poll(async () => (await sim(page)).player.position.y, { timeout: 15_000 })
    .toBeGreaterThan(0.5);
  await page.keyboard.up('KeyW');
});

test.describe('gamepad', () => {
  test('the left stick moves the character, holding B dashes and R3 locks on', async ({ page }) => {
    type FakePad = { axes: number[]; buttons: { pressed: boolean; value: number }[] };
    await page.addInitScript(() => {
      const pad = {
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
      };
      Object.assign(window, { __pad: pad });
      navigator.getGamepads = () => [pad as unknown as Gamepad];
    });
    await boot(page);
    const setAxes = (axes: number[]) =>
      page.evaluate((a) => {
        (window as unknown as { __pad: FakePad }).__pad.axes = a;
      }, axes);
    const setButton = (index: number, pressed: boolean) =>
      page.evaluate(
        ([i, p]) => {
          (window as unknown as { __pad: FakePad }).__pad.buttons[i as number] = {
            pressed: p as boolean,
            value: p ? 1 : 0,
          };
        },
        [index, pressed],
      );

    const start = (await sim(page)).player.position;
    // 左スティックを半分前へ（軸 1 は前が負）= 歩き、全部倒す = 走り
    await setAxes([0, -0.5, 0, 0]);
    await expect.poll(async () => (await sim(page)).player.speed).toBeGreaterThan(1.5);
    expect((await sim(page)).player.speed).toBeLessThan(3);
    await setAxes([0, -1, 0, 0]);
    await expect.poll(async () => (await sim(page)).player.speed).toBeGreaterThan(4.3);
    await expect.poll(async () => (await sim(page)).player.position.z).toBeLessThan(start.z - 2);

    // B（長押し）= ダッシュ。短押し（ロール）は実時間 0.25 秒で判定するため、描画が重いとフレーム間隔だけで
    // 長押し扱いになる。ここでは時間に左右されない長押しを検証する（ロールはキーボードのテストで検証）。
    await setButton(1, true);
    await expect.poll(async () => (await sim(page)).player.state).toBe('dash');
    await expect.poll(async () => (await sim(page)).player.speed).toBeGreaterThan(6.3);
    await setButton(1, false);

    // R3 = ロックオン
    await setAxes([0, 0, 0, 0]);
    await setButton(11, true);
    await expect.poll(async () => (await sim(page)).lockOn.targetId).not.toBeNull();
  });
});

test.describe('touch (mobile landscape)', () => {
  test.use({
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  test('the virtual stick moves the character and the lock-on button locks on', async ({
    page,
  }) => {
    await boot(page);
    await expect(page.locator('html')).toHaveAttribute('data-input-device', 'touch');
    const cdp = await page.context().newCDPSession(page);
    const start = (await sim(page)).player.position;

    // 左半分のフローティングスティックを前へ倒す
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, x: 150, y: 250 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 1, x: 150, y: 190 }],
    });
    await expect.poll(async () => (await sim(page)).player.speed).toBeGreaterThan(4);
    await expect.poll(async () => (await sim(page)).player.position.z).toBeLessThan(start.z - 2);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => (await sim(page)).player.speed).toBeLessThan(0.05);

    // 「固定」ボタン（トグル）
    await page.locator('.touch-btn[data-action="lockOn"]').tap();
    await expect.poll(async () => (await sim(page)).lockOn.targetId).not.toBeNull();
    await page.locator('.touch-btn[data-action="lockOn"]').tap();
    await expect.poll(async () => (await sim(page)).lockOn.targetId).toBeNull();
  });
});
