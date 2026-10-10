import { expect, test, type Page } from '@playwright/test';
import { startGame } from './helpers';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test('renders with the WebGPU backend and no console errors', async ({ page }) => {
  test.setTimeout(120_000); // ソフトウェア描画ではフレームが遅いので長めにとる
  const errors = collectErrors(page);
  await page.goto('./?quality=low&scale=0.25&env=0');

  await startGame(page);
  await expect(page.locator('#app canvas')).toBeVisible();

  const backend = await page.evaluate(() => window.__game?.backend);
  expect(backend).toBe('webgpu');

  // メインループが回り、固定ステップのシミュレーションが進んでいる
  await expect
    .poll(() => page.evaluate(() => window.__game?.frames ?? 0), { timeout: 90_000 })
    .toBeGreaterThan(2);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 90_000 })
    .toBeGreaterThan(5);

  expect(errors).toEqual([]);
});

test('creates an AudioContext that stays suspended until the start screen is tapped', async ({
  page,
}) => {
  const errors = collectErrors(page);
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
  // ヘッドレス Chromium は環境により自動再生制限が効いたり効かなかったりするため、
  // モバイル相当の制限（ユーザー操作の resume までは suspended）をシムで決定的に再現する。
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    // 注: init script は関数の文字列としてページへ渡るため、private フィールド等のトランスパイル補助が必要な構文は避ける
    const unlocked = new WeakSet<object>();
    window.AudioContext = class extends Native {
      override get state(): AudioContextState {
        return unlocked.has(this) ? super.state : 'suspended';
      }
      override resume(): Promise<void> {
        if (navigator.userActivation.isActive && !unlocked.has(this)) {
          unlocked.add(this);
          this.dispatchEvent(new Event('statechange'));
        }
        return unlocked.has(this) ? super.resume() : Promise.resolve();
      }
    };
  });
  await page.goto('./');
  // 開始画面（ready）の間は、AudioContext はユーザー操作がないので suspended のまま
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });

  // 失敗時に原因が分かるよう、例外も文字列として返す
  const readAudioState = (): Promise<string> =>
    page.evaluate(() => {
      try {
        return String(window.__game?.audio?.state);
      } catch (e) {
        return `throw: ${String(e)}`;
      }
    });
  let state = await readAudioState();
  for (let i = 0; i < 50 && state !== 'suspended'; i++) {
    await page.waitForTimeout(200);
    state = await readAudioState();
  }
  expect(state, `console: ${logs.join(' | ')}`).toBe('suspended');
  await page.waitForTimeout(500);
  expect(await readAudioState()).toBe('suspended');

  // 開始画面のタップ（ユーザー操作）で resume される
  await page.getByTestId('start-screen').click();
  await expect.poll(readAudioState).toBe('running');
  expect(errors).toEqual([]);
});

test('shows the unsupported screen when WebGPU is unavailable', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'gpu', { value: undefined, configurable: true });
  });
  await page.goto('./');

  await expect(page.locator('#app')).toHaveAttribute('data-state', 'unsupported');
  await expect(page.locator('.overlay.unsupported')).toContainText('WebGPU');
  await expect(page.locator('#app canvas')).toHaveCount(0);
  expect(await page.evaluate(() => window.__game)).toBeUndefined();
  expect(errors).toEqual([]);
});
