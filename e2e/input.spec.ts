import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { startGame, tapKey, waitSteps } from './helpers';

async function boot(page: Page): Promise<void> {
  // ソフトウェア描画（SwiftShader）でも入力ステップが回るよう、描画を最小品質・低解像度にする
  await page.goto('./?quality=low&scale=0.25&nodraw');
  await startGame(page);
  // 初回のパイプラインコンパイルで最初のフレームが重いので、ループが安定して回り出すまで待つ
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
}

const input = (page: Page) => page.evaluate(() => window.__game?.input);

test.describe('keyboard', () => {
  test('WASD moves, Space taps roll and holds sprint, other keys map to actions', async ({
    page,
  }) => {
    await boot(page);
    await expect.poll(async () => (await input(page))?.device).toBe('kbm');
    // タッチ UI は PC では表示されない
    await expect(page.getByTestId('touch-controls')).toBeHidden();

    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyD');
    await expect.poll(async () => (await input(page))?.move.x).toBeCloseTo(Math.SQRT1_2, 3);
    expect((await input(page))?.move.y).toBeCloseTo(Math.SQRT1_2, 3);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyD');
    await expect.poll(async () => (await input(page))?.move).toEqual({ x: 0, y: 0 });

    // 短押し = 回避（離した時点で確定）
    await tapKey(page, 'Space');
    await expect.poll(async () => (await input(page))?.pressCounts.dodge).toBe(1);
    expect((await input(page))?.sprint).toBe(false);

    // 長押し = ダッシュ（回避は出ない）
    await page.keyboard.down('Space');
    await expect.poll(async () => (await input(page))?.sprint).toBe(true);
    await page.keyboard.up('Space');
    await expect.poll(async () => (await input(page))?.sprint).toBe(false);
    expect((await input(page))?.pressCounts.dodge).toBe(1);

    await page.keyboard.down('ShiftLeft');
    await expect.poll(async () => (await input(page))?.held).toContain('guard');
    await page.keyboard.up('ShiftLeft');
    await expect.poll(async () => (await input(page))?.held).not.toContain('guard');

    for (const [key, action] of [
      ['KeyE', 'interact'],
      ['KeyR', 'item'],
      ['KeyQ', 'lockOn'],
    ] as const) {
      await page.keyboard.press(key);
      await expect.poll(async () => (await input(page))?.pressCounts[action]).toBe(1);
    }

    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await input(page))?.targetSwitches.right).toBe(1);
  });
});

test.describe('gamepad', () => {
  test('standard mapping, deadzone and look', async ({ page }) => {
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

    // デッドゾーン内は 0
    await page.evaluate(() => {
      (window as unknown as { __pad: FakePad }).__pad.axes = [0.1, -0.1, 0, 0];
    });
    await waitSteps(page, 10);
    expect((await input(page))?.move).toEqual({ x: 0, y: 0 });
    expect((await input(page))?.device).toBe('kbm');

    // 左スティック前 + 右スティック右 + RB
    await page.evaluate(() => {
      const pad = (window as unknown as { __pad: FakePad }).__pad;
      pad.axes = [0, -1, 1, 0];
      pad.buttons[5] = { pressed: true, value: 1 };
    });
    await expect.poll(async () => (await input(page))?.device).toBe('gamepad');
    await expect.poll(async () => (await input(page))?.move.y).toBeCloseTo(1);
    await expect.poll(async () => (await input(page))?.held).toContain('lightAttack');
    await expect.poll(async () => (await input(page))?.lookTotal.x).toBeGreaterThan(0.5);
    await expect(page.getByTestId('touch-controls')).toBeHidden();
  });
});

test.describe('touch (mobile landscape)', () => {
  test.use({
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  interface TouchPoint {
    id: number;
    x: number;
    y: number;
  }
  async function dispatch(
    cdp: CDPSession,
    type: 'touchStart' | 'touchMove' | 'touchEnd',
    points: TouchPoint[],
  ): Promise<void> {
    await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  }

  async function center(page: Page, action: string): Promise<{ x: number; y: number }> {
    const box = await page.locator(`.touch-btn[data-action="${action}"]`).boundingBox();
    if (!box) throw new Error(`button ${action} not found`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  test('layout fits the viewport and nothing overlaps', async ({ page }) => {
    await boot(page);
    await expect(page.locator('html')).toHaveAttribute('data-input-device', 'touch');
    await expect(page.getByTestId('touch-controls')).toBeVisible();

    const boxes = await page.locator('.touch-btn').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          action: (el as HTMLElement).dataset.action ?? '',
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
        };
      }),
    );
    expect(boxes).toHaveLength(7);
    const vp = { w: 915, h: 412 };
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(vp.w / 2); // 右半分
      expect(b.x + b.w).toBeLessThanOrEqual(vp.w);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + b.h).toBeLessThanOrEqual(vp.h);
      expect(b.w).toBeGreaterThanOrEqual(44); // 最小タップサイズ
    }
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.action >= b.action) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.action} overlaps ${b.action}`).toBe(false);
      }
    }
  });

  test('multi-touch: stick + buttons + camera drag + flick', async ({ page }) => {
    // ソフトウェア描画では CDP の往復とフレーム進行が遅く、描画が重いと 60 秒に収まらないことがある
    test.setTimeout(180_000);
    await boot(page);
    const cdp = await page.context().newCDPSession(page);

    // 左半分: フローティングスティック（触れた位置が中心）。右上へ倒す
    await dispatch(cdp, 'touchStart', [{ id: 1, x: 150, y: 250 }]);
    await dispatch(cdp, 'touchMove', [{ id: 1, x: 190, y: 210 }]);
    await expect.poll(async () => (await input(page))?.move.x).toBeGreaterThan(0.3);
    expect((await input(page))?.move.y).toBeGreaterThan(0.3); // 画面の上 = 前進

    // スティックを保持したまま別の指でボタン（マルチタッチ）
    const light = await center(page, 'lightAttack');
    await dispatch(cdp, 'touchStart', [
      { id: 1, x: 190, y: 210 },
      { id: 2, ...light },
    ]);
    await expect.poll(async () => (await input(page))?.held).toContain('lightAttack');
    expect((await input(page))?.move.y).toBeGreaterThan(0.3);
    await dispatch(cdp, 'touchEnd', []);
    await expect.poll(async () => (await input(page))?.held).not.toContain('lightAttack');
    expect((await input(page))?.move).toEqual({ x: 0, y: 0 });
    expect((await input(page))?.pressCounts.lightAttack).toBe(1);

    // 回避ボタン: 短押し = 回避, 長押し = ダッシュ
    const dodge = await center(page, 'dodge');
    // 短押しは、CDP の往復が遅いと実時間で長押しになってしまうため、evaluate 内で同一タスクの押下→離上（実時間ほぼ 0ms）として再現する
    await page.evaluate(() => {
      const el = document.querySelector('.touch-btn[data-action="dodge"]');
      if (!el) throw new Error('dodge button not found');
      const fire = (type: string): void => {
        el.dispatchEvent(
          new PointerEvent(type, { pointerId: 8, pointerType: 'touch', bubbles: true }),
        );
      };
      fire('pointerdown');
      fire('pointerup');
    });
    await expect.poll(async () => (await input(page))?.pressCounts.dodge).toBe(1);
    await dispatch(cdp, 'touchStart', [{ id: 4, ...dodge }]);
    await expect.poll(async () => (await input(page))?.sprint).toBe(true);
    await dispatch(cdp, 'touchEnd', []);
    await expect.poll(async () => (await input(page))?.sprint).toBe(false);
    expect((await input(page))?.pressCounts.dodge).toBe(1);

    // 右半分ドラッグ: カメラ（ボタンの無い空きエリアで、ゆっくり）
    const before = (await input(page))?.lookTotal ?? { x: 0, y: 0 };
    await dispatch(cdp, 'touchStart', [{ id: 5, x: 520, y: 150 }]);
    for (let i = 1; i <= 8; i++) {
      await dispatch(cdp, 'touchMove', [{ id: 5, x: 520 + i * 10, y: 150 - i * 4 }]);
      await page.waitForTimeout(60); // ドラッグ速度（実時間）でフリックと区別されるため、実時間の間隔が仕様
    }
    await dispatch(cdp, 'touchEnd', []);
    await expect
      .poll(async () => (await input(page))?.lookTotal.x ?? 0, { timeout: 30_000 })
      .toBeGreaterThan(before.x + 0.3);
    expect((await input(page))?.lookTotal.y).toBeGreaterThan(before.y); // 上へドラッグ = 上を向く
    // ゆっくりのドラッグはターゲット切替にならない
    expect((await input(page))?.targetSwitches).toEqual({ left: 0, right: 0 });

    // 右側フリック: 素早い横スワイプでターゲット切替。
    // CDP 経由の入力はソフトウェア描画では 1 イベントに秒単位かかり「素早さ」を再現できないため、
    // 1 回の evaluate 内で PointerEvent を連続発火させる。
    await page.evaluate(() => {
      const zone = document.querySelector('.touch-zone--right');
      if (!zone) throw new Error('camera zone not found');
      const fire = (type: string, x: number, y: number): void => {
        zone.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 9,
            pointerType: 'touch',
            isPrimary: true,
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
      };
      fire('pointerdown', 480, 100);
      fire('pointermove', 530, 101);
      fire('pointermove', 570, 102);
      fire('pointerup', 570, 102);
    });
    await expect.poll(async () => (await input(page))?.targetSwitches.right).toBe(1);
  });
});
