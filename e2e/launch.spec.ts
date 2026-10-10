import { expect, test, type Page } from '@playwright/test';
import { waitFrames, waitSteps } from './helpers';

// 起動体験（ローディング → 開始画面 → タップで全画面・横向きロック → 一時停止と復帰）。
// ヘッドレスではフルスクリーン・向きロック・Pointer Lock が検証できないので、API をモックして呼び出しを記録する。

interface LaunchMock {
  calls: string[];
  fullscreenOptions: unknown[];
  lockArgs: unknown[];
}
interface MockWindow {
  __launch: LaunchMock;
  __exitFullscreen: () => void;
  __failImmersive: boolean;
}

async function installMocks(page: Page, failImmersive = false): Promise<void> {
  await page.addInitScript((fail: boolean) => {
    const w = window as unknown as MockWindow;
    w.__launch = { calls: [], fullscreenOptions: [], lockArgs: [] };
    w.__failImmersive = fail;
    let current: Element | null = null;
    Object.defineProperty(document, 'fullscreenElement', {
      get: () => current,
      configurable: true,
    });
    Element.prototype.requestFullscreen = function requestFullscreen(options) {
      w.__launch.calls.push('requestFullscreen');
      w.__launch.fullscreenOptions.push(options);
      if (w.__failImmersive) return Promise.reject(new Error('denied'));
      current = document.documentElement;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    };
    w.__exitFullscreen = () => {
      current = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    };
    ScreenOrientation.prototype.lock = function lock(orientation) {
      w.__launch.calls.push('orientation.lock');
      w.__launch.lockArgs.push(orientation);
      if (w.__failImmersive) return Promise.reject(new Error('NotSupportedError'));
      return Promise.resolve();
    };
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const origLock = Element.prototype.requestPointerLock;
    Element.prototype.requestPointerLock = function requestPointerLock(options) {
      w.__launch.calls.push('requestPointerLock');
      return origLock.call(this, options);
    };
  }, failImmersive);
}

const launch = (page: Page) => page.evaluate(() => (window as unknown as MockWindow).__launch);
const simFrame = (page: Page) => page.evaluate(() => window.__game?.sim.player.stateFrame ?? 0);

async function openAndWaitReady(page: Page): Promise<void> {
  await page.goto('./?quality=low&scale=0.25&nodraw');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
}

test.describe('mobile', () => {
  test.use({
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  test('tap on the start screen enters landscape fullscreen and starts the game', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await installMocks(page);
    await openAndWaitReady(page);

    await expect(page.getByTestId('start-screen')).toContainText('画面をタッチしてはじめる');
    // 開始前はシミュレーションを進めない・何も要求しない
    expect((await launch(page)).calls).toEqual([]);
    expect(await page.evaluate(() => window.__game?.steps)).toBe(0);

    await page.touchscreen.tap(450, 200);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    await expect(page.getByTestId('start-screen')).toHaveCount(0);

    const l = await launch(page);
    expect(l.calls).toEqual(['requestFullscreen', 'orientation.lock']); // 全画面 → 向きロックの順
    expect(l.fullscreenOptions).toEqual([{ navigationUI: 'hide' }]);
    expect(l.lockArgs).toEqual(['landscape']);
    await expect.poll(() => simFrame(page), { timeout: 30_000 }).toBeGreaterThan(5);
    expect(errors).toEqual([]);
  });

  test('starts even if fullscreen and orientation lock are rejected', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await installMocks(page, true);
    await openAndWaitReady(page);

    await page.touchscreen.tap(450, 200);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    expect((await launch(page)).calls).toEqual(['requestFullscreen', 'orientation.lock']);
    await expect.poll(() => simFrame(page), { timeout: 30_000 }).toBeGreaterThan(5);

    // 全画面に入れていない端末では、全画面解除を理由に止めない
    await page.evaluate(() => {
      (window as unknown as MockWindow).__exitFullscreen();
    });
    await waitSteps(page, 120); // 全画面解除の判定後もシミュレーションが進み続ける
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    expect(errors).toEqual([]);
  });

  test('pauses when fullscreen is left, and a tap restores it', async ({ page }) => {
    await installMocks(page);
    await openAndWaitReady(page);
    await page.touchscreen.tap(450, 200);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    await expect.poll(() => simFrame(page), { timeout: 30_000 }).toBeGreaterThan(5);

    await page.evaluate(() => {
      (window as unknown as MockWindow).__exitFullscreen();
    });
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'paused', {
      timeout: 10_000,
    });
    await expect(page.getByTestId('resume-screen')).toContainText('画面をタッチして再開');
    const frozen = await simFrame(page);
    await waitFrames(page, 5); // 停止中も描画ループは回る
    expect(await simFrame(page)).toBe(frozen);

    await page.touchscreen.tap(450, 200);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    expect((await launch(page)).calls.filter((c) => c === 'requestFullscreen')).toHaveLength(2);
    await expect.poll(() => simFrame(page)).toBeGreaterThan(frozen);
  });

  test('pauses when rotated to portrait and resumes after rotating back and tapping', async ({
    page,
  }) => {
    await installMocks(page);
    await openAndWaitReady(page);
    await page.touchscreen.tap(450, 200);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    await expect.poll(() => simFrame(page), { timeout: 30_000 }).toBeGreaterThan(5);

    await page.setViewportSize({ width: 412, height: 915 });
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'paused', {
      timeout: 10_000,
    });
    // 縦持ちでは「タッチして横画面にする」の案内が出る
    await expect(page.locator('.orientation-hint')).toBeVisible();

    await page.setViewportSize({ width: 915, height: 412 });
    await expect(page.locator('.orientation-hint')).toBeHidden();
    await page.touchscreen.tap(450, 200);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
  });

  test('portrait: tapping the hint on the start screen enters landscape fullscreen once', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await installMocks(page);
    await page.setViewportSize({ width: 412, height: 915 });
    await openAndWaitReady(page);
    await expect(page.getByTestId('start-screen')).toBeVisible();
    const hint = page.getByTestId('orientation-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('タッチして横画面にする');

    await page.touchscreen.tap(200, 450);
    await expect
      .poll(async () => (await launch(page)).calls)
      .toEqual(['requestFullscreen', 'orientation.lock']);
    expect((await launch(page)).lockArgs).toEqual(['landscape']);
    // 案内のタップでは開始しない（横向きになってから開始画面をタップする）
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
    await expect(hint).toContainText('タッチして横画面にする');

    // すでにフルスクリーンなら再度呼ばない
    await page.touchscreen.tap(200, 450);
    await page.waitForTimeout(200);
    expect((await launch(page)).calls).toEqual(['requestFullscreen', 'orientation.lock']);

    // 横向きになったら案内は消え、開始タップでは没入化を繰り返さない
    await page.setViewportSize({ width: 915, height: 412 });
    await expect(hint).toBeHidden();
    await page.touchscreen.tap(450, 200);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    expect((await launch(page)).calls).toEqual(['requestFullscreen', 'orientation.lock']);
    expect(errors).toEqual([]);
  });

  test('portrait: tapping the hint while loading enters landscape fullscreen', async ({ page }) => {
    await installMocks(page);
    await page.setViewportSize({ width: 412, height: 915 });
    // 本体チャンクの配信を遅らせてローディング中の状態を保つ
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    await page.route(/\/assets\/(?!index-).*\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('./?quality=low&scale=0.25&nodraw');
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'loading');
    await page.touchscreen.tap(200, 450);
    await expect
      .poll(async () => (await launch(page)).calls)
      .toEqual(['requestFullscreen', 'orientation.lock']);
    release();
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await page.setViewportSize({ width: 915, height: 412 });
    await page.touchscreen.tap(450, 200);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    expect((await launch(page)).calls).toEqual(['requestFullscreen', 'orientation.lock']);
  });

  test('portrait: switches to "rotate your device" when landscape fails and taps pass through', async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    await installMocks(page, true);
    await page.setViewportSize({ width: 412, height: 915 });
    await openAndWaitReady(page);
    const hint = page.getByTestId('orientation-hint');
    await page.touchscreen.tap(200, 450);
    await expect(hint).toContainText('端末を横向きにしてください');
    expect((await launch(page)).calls).toEqual(['requestFullscreen', 'orientation.lock']);
    expect(warnings.some((w) => w.includes('[immersive] orientation failed'))).toBe(true);
    // 失敗後のタップは開始画面に届き、縦のままでも開始できる
    await page.touchscreen.tap(200, 450);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    // 縦のまま「開始 → 一時停止 → 開始…」のループに入らない（判定タイミングを十分に待つ）
    await page.waitForTimeout(3000);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    await expect(page.getByTestId('resume-screen')).toHaveCount(0);
    await expect(hint).toContainText('端末を横向きにしてください');
    // 横向きにして縦へ戻せば通常どおり一時停止する
    await page.setViewportSize({ width: 915, height: 412 });
    await expect(hint).toBeHidden();
    await page.waitForTimeout(300); // 横向きを確認させる
    await page.setViewportSize({ width: 412, height: 915 });
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'paused', {
      timeout: 10_000,
    });
  });

  test('portrait: switches to "rotate" when the lock resolves but the device stays portrait', async ({
    page,
  }) => {
    await installMocks(page);
    await page.setViewportSize({ width: 412, height: 915 });
    await openAndWaitReady(page);
    const hint = page.getByTestId('orientation-hint');
    await page.touchscreen.tap(200, 450); // 没入化は成功するが端末は回らない
    await expect(hint).toContainText('端末を横向きにしてください', { timeout: 10_000 });
    await page.touchscreen.tap(200, 450); // 透過して開始画面へ
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    await page.waitForTimeout(3000);
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    expect((await launch(page)).calls).toEqual(['requestFullscreen', 'orientation.lock']);
  });
});

test.describe('desktop', () => {
  test('click starts the game with pointer lock and does not force fullscreen', async ({
    page,
  }) => {
    await installMocks(page);
    await openAndWaitReady(page);
    await expect(page.getByTestId('start-screen')).toContainText('クリックしてはじめる');

    await page.getByTestId('start-screen').click();
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
    const l = await launch(page);
    expect(l.calls).toContain('requestPointerLock');
    expect(l.calls).not.toContain('requestFullscreen');
    expect(l.calls).not.toContain('orientation.lock');
  });

  test('Enter key also starts the game', async ({ page }) => {
    await openAndWaitReady(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'running');
  });
});
