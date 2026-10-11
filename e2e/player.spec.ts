import { expect, test, type Page } from '@playwright/test';
import {
  bootGame,
  clickInPage,
  clickWhenPlayerFrame,
  stepUntil,
  tapKey,
  waitSteps,
} from './helpers';

/**
 * 足場・ダミーのあるテストシーン（?scene=test）をロジック用の軽量 URL で起動する（描画の検証は他の spec）。
 * 一時停止のまま返るので、以降は `waitSteps` / `stepUntil` でだけ進む。
 */
async function boot(page: Page, params?: Record<string, string>): Promise<void> {
  await page.addInitScript(() => {
    const log: unknown[] = [];
    (window as unknown as { __keys: unknown[] }).__keys = log;
    for (const type of ['keydown', 'keyup'])
      window.addEventListener(
        type,
        (e) => {
          const k = e as KeyboardEvent;
          log.push([type, k.code, Math.round(k.timeStamp), Math.round(performance.now())]);
        },
        true,
      );
  });
  await bootGame(page, { scene: 'test', params });
}

// 失敗時の調査用: 入力・シミュレーション・フォーカスの状態を出す
test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus) return;
  const state = await page
    .evaluate(() => ({
      focus: document.hasFocus(),
      hidden: document.hidden,
      lock: document.pointerLockElement !== null,
      state: document.getElementById('app')?.dataset.state,
      steps: window.__game?.steps,
      frames: window.__game?.frames,
      input: window.__game?.input,
      player: window.__game?.sim.player,
      camera: window.__game?.sim.camera.yaw,
      keys: (window as unknown as { __keys?: unknown }).__keys,
    }))
    .catch((e: unknown) => String(e));
  console.log(`[diag] ${info.title}: ${JSON.stringify(state)}`);
});

const sim = (page: Page) =>
  page.evaluate(() => {
    const s = window.__game?.sim;
    if (!s) throw new Error('sim state unavailable');
    return s;
  });

/** キーを短押しし、入力システムがそのアクションの押下として数えるまで進める。 */
async function pressAccepted(page: Page, code: string, action: 'dodge' | 'lockOn'): Promise<void> {
  const count = () => page.evaluate((a) => window.__game?.input.pressCounts[a] ?? 0, action);
  const before = await count();
  await tapKey(page, code);
  await stepUntil(page, count, (n) => n > before, { maxSteps: 30, chunk: 1 });
}

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
  await stepUntil(
    page,
    async () => (await sim(page)).player.speed,
    (v) => v > 4,
  );
  const running = await sim(page);
  expect(running.player.state).toBe('move');
  // 初期のカメラは -Z を向いているので、W は -Z へ進む
  await stepUntil(
    page,
    async () => (await sim(page)).player.position.z,
    (v) => v < start.z - 2,
  );
  expect(Math.abs((await sim(page)).player.position.x - start.x)).toBeLessThan(0.1);

  await page.keyboard.up('KeyW');
  await stepUntil(
    page,
    async () => (await sim(page)).player.speed,
    (v) => v < 0.05,
  );
  expect((await sim(page)).player.state).toBe('idle');
});

test('the knight model plays locomotion animations that follow the movement speed', async ({
  page,
}) => {
  await boot(page);
  await expect.poll(() => page.evaluate(() => window.__game?.playerView?.clip)).toBe('Idle_Loop');
  expect(await page.evaluate(() => window.__game?.playerView?.triangles ?? 0)).toBeGreaterThan(
    10_000,
  );
  // クリップは描画側（rAF）で切り替わるので、シミュレーションを進めてから描画を待つ
  await page.keyboard.down('KeyW');
  await stepUntil(
    page,
    async () => (await sim(page)).player.speed,
    (v) => v > 4,
  );
  await expect
    .poll(() => page.evaluate(() => window.__game?.playerView?.clip))
    .toBe('Jog_Fwd_Loop');
  await page.keyboard.up('KeyW');
  await stepUntil(
    page,
    async () => (await sim(page)).player.speed,
    (v) => v < 0.05,
  );
  await expect.poll(() => page.evaluate(() => window.__game?.playerView?.clip)).toBe('Idle_Loop');
});

test('a short Space press rolls toward the stick direction and costs stamina', async ({ page }) => {
  await boot(page);
  const start = (await sim(page)).player;

  await page.keyboard.down('KeyD');
  await tapKey(page, 'Space'); // 短押し = 離した時点でロール確定
  await stepUntil(
    page,
    async () => (await sim(page)).events.rollStart,
    (v) => v === 1,
  );
  expect((await sim(page)).player.stamina).toBeLessThan(start.stamina - 10);

  // 画面右（+X）へ 3m 以上動く
  await stepUntil(
    page,
    async () => (await sim(page)).player.position.x - start.position.x,
    (v) => v > 3,
  );
  await page.keyboard.up('KeyD');
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'idle',
  );
  expect((await sim(page)).events.rollStart).toBe(1);
});

test('a roll plays the Roll clip and fires the invulnerability and footstep markers', async ({
  page,
}) => {
  await boot(page);
  await page.keyboard.down('KeyD');
  await tapKey(page, 'Space');
  await stepUntil(
    page,
    async () => (await sim(page)).events.rollStart,
    (v) => v === 1,
  );
  await stepUntil(
    page,
    async () => (await sim(page)).markers.invulnStart,
    (v) => v >= 1,
  );
  await stepUntil(
    page,
    async () => (await sim(page)).markers.footstep,
    (v) => v >= 1,
  );
  await page.keyboard.up('KeyD');
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'idle',
  );
  const m = (await sim(page)).markers;
  expect(m.invulnEnd).toBeGreaterThanOrEqual(1);
});

test('Space without a direction does a backstep, and holding Space sprints', async ({ page }) => {
  await boot(page);
  await pressAccepted(page, 'Space', 'dodge');
  await stepUntil(
    page,
    async () => (await sim(page)).events.backstepStart,
    (v) => v === 1,
  );
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'idle',
  );

  await page.keyboard.down('KeyW');
  await page.keyboard.down('Space'); // 長押し = ダッシュ
  // 長押しの判定は実時間 0.25 秒（入力の仕様）。1 ステップずつ進め、CDP の往復で実時間が経つのを待つ
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'dash',
    {
      chunk: 1,
    },
  );
  await stepUntil(
    page,
    async () => (await sim(page)).player.speed,
    (v) => v > 6.3,
  );
  const before = (await sim(page)).player.stamina;
  await stepUntil(
    page,
    async () => (await sim(page)).player.stamina,
    (v) => v < before - 1,
  );
  await page.keyboard.up('Space');
  await page.keyboard.up('KeyW');
  expect((await sim(page)).events.rollStart).toBe(0);
});

test('lock-on: Q locks the nearest dummy, strafing keeps facing it, arrows switch, Q releases', async ({
  page,
}) => {
  await boot(page);
  await pressAccepted(page, 'KeyQ', 'lockOn');
  await stepUntil(
    page,
    async () => (await sim(page)).lockOn.targetId,
    (v) => v === 'dummy-a',
  );

  // 右へストレイフ。対象を向いたまま、約 3.8 m/s で横へ動く
  const before = (await sim(page)).player;
  await page.keyboard.down('KeyD');
  await stepUntil(
    page,
    async () => (await sim(page)).player.speed,
    (v) => v > 3.5,
  );
  const moving = await sim(page);
  expect(moving.player.state).toBe('move');
  const dx = 0 - moving.player.position.x;
  const dz = -6 - moving.player.position.z;
  const toTarget = Math.atan2(dx, dz);
  let diff = moving.player.yaw - toTarget;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  expect(Math.abs(diff)).toBeLessThan(0.4);
  await stepUntil(
    page,
    async () => Math.abs((await sim(page)).player.position.x - before.position.x),
    (v) => v > 1.5,
  );
  await page.keyboard.up('KeyD');

  // ターゲット切替（矢印キー）
  const first = (await sim(page)).lockOn.targetId;
  await page.keyboard.press('ArrowRight');
  await stepUntil(
    page,
    async () => (await sim(page)).lockOn.targetId,
    (v) => v !== first,
  );

  // トグルで解除
  await page.keyboard.press('KeyQ');
  await stepUntil(
    page,
    async () => (await sim(page)).lockOn.targetId,
    (v) => v === null,
  );
});

test('the camera never goes into a wall behind the player', async ({ page }) => {
  await boot(page);
  // 壁（x=-6.5, 厚 0.7。東面は x=-6.15）に背をつけて立つ。カメラは壁側（西）にある
  await teleport(page, -5.7, 2, Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    await stepUntil(
      page,
      async () => (await sim(page)).camera.armLength,
      (v) => v < 1.2,
    );
    const s = await sim(page);
    expect(s.camera.position.x).toBeGreaterThan(-6.15);
  }
  // 壁から離れるとアームが元の距離へ戻る
  await teleport(page, 0, 3.5, Math.PI);
  await stepUntil(
    page,
    async () => (await sim(page)).camera.armLength,
    (v) => v > 4.0,
  );
});

test('the character auto-steps up the stairs', async ({ page }) => {
  await boot(page);
  // 階段（x=4.75..7.45）の手前（西側）で東（+X）を向かせ、前進する
  await teleport(page, 3.2, 5.2, Math.PI / 2);
  await page.keyboard.down('KeyW');
  await stepUntil(
    page,
    async () => (await sim(page)).player.position.y,
    (v) => v > 0.5,
  );
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
    await stepUntil(
      page,
      async () => (await sim(page)).player.speed,
      (v) => v > 1.5,
    );
    expect((await sim(page)).player.speed).toBeLessThan(3);
    await setAxes([0, -1, 0, 0]);
    await stepUntil(
      page,
      async () => (await sim(page)).player.speed,
      (v) => v > 4.3,
    );
    await stepUntil(
      page,
      async () => (await sim(page)).player.position.z,
      (v) => v < start.z - 2,
    );

    // B（長押し）= ダッシュ。短押し（ロール）は実時間 0.25 秒で判定するため、描画が重いとフレーム間隔だけで
    // 長押し扱いになる。ここでは時間に左右されない長押しを検証する（ロールはキーボードのテストで検証）。
    await setButton(1, true);
    await stepUntil(
      page,
      async () => (await sim(page)).player.state,
      (v) => v === 'dash',
      {
        chunk: 1,
      },
    );
    await stepUntil(
      page,
      async () => (await sim(page)).player.speed,
      (v) => v > 6.3,
    );
    await setButton(1, false);

    // R3 = ロックオン
    await setAxes([0, 0, 0, 0]);
    await setButton(11, true);
    await stepUntil(
      page,
      async () => (await sim(page)).lockOn.targetId,
      (v) => v !== null,
    );
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
    await stepUntil(
      page,
      async () => (await sim(page)).player.speed,
      (v) => v > 4,
    );
    await stepUntil(
      page,
      async () => (await sim(page)).player.position.z,
      (v) => v < start.z - 2,
    );
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await stepUntil(
      page,
      async () => (await sim(page)).player.speed,
      (v) => v < 0.05,
    );

    // 「固定」ボタン（トグル）
    await page.locator('.touch-btn[data-action="lockOn"]').tap();
    await stepUntil(
      page,
      async () => (await sim(page)).lockOn.targetId,
      (v) => v !== null,
    );
    await page.locator('.touch-btn[data-action="lockOn"]').tap();
    await stepUntil(
      page,
      async () => (await sim(page)).lockOn.targetId,
      (v) => v === null,
    );
  });
});

test('a swing hits the dummy in front exactly once (hit resolution, ?debug wireframes)', async ({
  page,
}) => {
  await boot(page, { debug: '' });

  // dummy-a (0, -6) の 1.5m 手前で北向き
  await teleport(page, 0, -4.5, Math.PI);
  expect((await sim(page)).combat.hits).toBe(0);
  await page.evaluate(() => {
    window.__game?.dev.swing();
  });
  await stepUntil(
    page,
    async () => (await sim(page)).combat.hits,
    (v) => v === 1,
  );
  // 持続が終わるまで待っても 2 回目は起きない
  await waitSteps(page, 40);
  const after = await sim(page);
  expect(after.combat.hits).toBe(1);
  expect(after.combat.lastHitTarget).toBe('dummy-a');
  // 命中でヒットストップ（軽攻撃 4F）が 1 回かかっている
  expect(after.combat.hitStops).toBe(1);
  expect(after.combat.lastHitStopFrames).toBe(4);
});

test('R drinks a flask: the drinking animation plays and HP is restored at F26', async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.damage(120);
  });
  const hp0 = (await sim(page)).combat.playerHp;
  expect(hp0).toBe(180);
  expect((await sim(page)).combat.flask).toBe(3);

  await page.keyboard.press('KeyR');
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'heal',
  );
  expect((await sim(page)).combat.flask).toBe(2);
  // 全身が回復モーション（Consume）で再生される
  await expect.poll(() => page.evaluate(() => window.__game?.playerView?.clip)).toBe('Consume');
  // F26 で +120（HP 300 が上限なので 300）
  await stepUntil(
    page,
    async () => (await sim(page)).combat.playerHp,
    (v) => v === 300,
  );
  expect((await sim(page)).events.healApply).toBe(1);
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'idle',
  );

  // HP 満タンでは飲まない（瓶は減らない）
  await page.keyboard.press('KeyR');
  await waitSteps(page, 30);
  expect((await sim(page)).player.state).toBe('idle');
  expect((await sim(page)).combat.flask).toBe(2);
});

test('left clicks chain the 3-hit light combo and each swing hits the dummy once', async ({
  page,
}) => {
  await boot(page);
  // dummy-a (0, -6) の 1.5m 手前で北向き
  await teleport(page, 0, -4.5, Math.PI);

  // dev.start() で開始しているので Pointer Lock は無い。クリックはキャンバスへ送る（攻撃になる）
  expect((await sim(page)).combat.hits).toBe(0);

  // 軽 1（先行入力は 10F・窓は F20〜F48）。F12 で命中するとヒットストップ（4F）の間も入力バッファの時計は進むため、
  // ヒットストップ明けの F15 以降に押せば F20 の窓まで先行入力が残り、次段へ繋がる。
  // 待機と入力はページ内の同一フレームで行う（CDP 往復の間にシミュレーションが進んで窓を逃すのを防ぐ）。
  await clickInPage(page);
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'light1',
  );
  expect((await sim(page)).events.attackStart).toBe(1);
  await clickWhenPlayerFrame(page, 'light1', 15, 40);
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'light2',
  );
  await clickWhenPlayerFrame(page, 'light2', 15, 40);
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'light3',
  );

  // 3 段それぞれが 1 回ずつ命中し、終わると待機へ戻る
  await stepUntil(
    page,
    async () => (await sim(page)).combat.hits,
    (v) => v === 3,
  );
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'idle',
  );
  const after = await sim(page);
  expect(after.combat.hits).toBe(3);
  expect(after.combat.lastHitTarget).toBe('dummy-a');
  expect(after.events.attackStart).toBe(3);
  expect(after.player.stamina).toBeLessThan(100); // 3 段で 48 消費（回復待ち 45F のあと戻り始める）
});

test('holding right click charges the heavy attack and releasing swings it (Sword_Heavy_Combo, super armor, one hit)', async ({
  page,
}) => {
  await boot(page);
  await teleport(page, 0, -4.5, Math.PI);

  await page.evaluate(() => {
    window.__game?.dev.input.press('heavyAttack');
  });
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'heavyCharge',
  );
  await expect
    .poll(() => page.evaluate(() => window.__game?.playerView?.clip))
    .toBe('Sword_Heavy_Combo');
  // 溜め 30F を超えても保持している間は溜めのまま（フル溜め）。溜め開始時に 28 消費。
  await waitSteps(page, 40);
  expect((await sim(page)).player.state).toBe('heavyCharge');
  // フル溜め到達でさらに 6 消費（計 34）。溜め中はスタミナが回復しないので、負荷で溜めが長引いても増えない（#206）。
  expect((await sim(page)).player.stamina).toBeLessThan(100 - 33);
  await waitSteps(page, 90);
  expect((await sim(page)).player.state).toBe('heavyCharge');
  expect((await sim(page)).player.stamina).toBeLessThan(100 - 33);

  await page.evaluate(() => {
    window.__game?.dev.input.release('heavyAttack');
  });
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'heavyCharged',
  );
  expect((await sim(page)).events.attackStart).toBe(1);
  // F6 以降はスーパーアーマー（強靭度 +40）
  await stepUntil(
    page,
    async () => (await sim(page)).player.stateFrame,
    (v) => v >= 8,
  );
  expect((await sim(page)).player.poiseBonus).toBe(40);

  await stepUntil(
    page,
    async () => (await sim(page)).combat.hits,
    (v) => v === 1,
  );
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'idle',
  );
  const after = await sim(page);
  expect(after.combat.hits).toBe(1);
  expect(after.combat.lastHitTarget).toBe('dummy-a');
  expect(after.player.poiseBonus).toBe(0);
});

test('a left click while running starts the run attack (Sword_Dash)', async ({ page }) => {
  await boot(page);
  await teleport(page, 0, -1, Math.PI);

  await page.keyboard.down('KeyW');
  try {
    await stepUntil(
      page,
      async () => (await sim(page)).player.speed,
      (v) => v > 4,
    );
    await clickInPage(page);
    await stepUntil(
      page,
      async () => (await sim(page)).player.state,
      (v) => v === 'runAttack',
    );
    await expect
      .poll(() => page.evaluate(() => window.__game?.playerView?.clip))
      .toBe('Sword_Dash');
  } finally {
    await page.keyboard.up('KeyW');
  }
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v !== 'runAttack',
  );
});

test('holding guard blocks a frontal hit (chip damage, stamina cost, 4F hit-stop) but not one from behind', async ({
  page,
}) => {
  await boot(page);
  await teleport(page, 0, -2, Math.PI);
  await page.keyboard.down('ShiftLeft');
  // 構え完了（F6）を過ぎて保持へ
  // ジャストガードの窓（F6–F15）を過ぎるまで待つ
  await stepUntil(
    page,
    async () => (await sim(page)).player.guard.frame,
    (v) => v > 16,
  );
  const before = await sim(page);
  expect(before.player.state).toBe('guard');

  await page.evaluate(() => {
    window.__game?.dev.hitPlayer({ from: 'front', damage: 30, guardStaminaCost: 20 });
  });
  const guarded = await sim(page);
  expect(guarded.combat.playerHp).toBe(before.combat.playerHp - 3); // 30 の 10%
  expect(guarded.player.stamina).toBeLessThanOrEqual(before.player.stamina - 20 + 1);
  expect(guarded.combat.lastHitStopFrames).toBe(4);
  expect(guarded.player.state).not.toBe('flinch');

  // 背面は通常ダメージ・仰け反り
  await page.keyboard.up('ShiftLeft');
  await stepUntil(
    page,
    async () => (await sim(page)).player.state,
    (v) => v === 'idle',
  );
  await page.keyboard.down('ShiftLeft');
  // ジャストガードの窓（F6–F15）を過ぎるまで待つ
  await stepUntil(
    page,
    async () => (await sim(page)).player.guard.frame,
    (v) => v > 16,
  );
  const hp = (await sim(page)).combat.playerHp;
  await page.evaluate(() => {
    window.__game?.dev.hitPlayer({ from: 'back', damage: 30 });
  });
  const back = await sim(page);
  expect(back.combat.playerHp).toBe(hp - 30);
  await page.keyboard.up('ShiftLeft');
});

test('guard break when stamina runs out while guarding', async ({ page }) => {
  await boot(page);
  await teleport(page, 0, -2, Math.PI);
  await page.keyboard.down('ShiftLeft');
  // ジャストガードの窓（F6–F15）を過ぎるまで待つ
  await stepUntil(
    page,
    async () => (await sim(page)).player.guard.frame,
    (v) => v > 16,
  );
  await page.evaluate(() => {
    window.__game?.dev.hitPlayer({ from: 'front', guardStaminaCost: 500 });
  });
  const s = await sim(page);
  expect(s.player.state).toBe('guardBreak');
  expect(s.player.guard.breaks).toBe(1);
  expect(s.player.stamina).toBe(0);
  await page.keyboard.up('ShiftLeft');
});
