import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { holdKey, startGame, tapKey, waitSteps } from './helpers';

test.describe.configure({ timeout: 120_000 });

async function boot(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__game?.sim.player.grounded)).toBe(true);
}

const guide = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.guide();
  });

const bonfire = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.bonfire();
  });

test('PC: context button shows the key, runs with E; the move hint goes away on moving', async ({
  page,
}) => {
  await boot(page);
  // 開始時のヒント（移動）が出て、移動すると次（カメラ）へ
  await expect.poll(async () => (await guide(page)).hint).toBe('move');
  await expect(page.getByTestId('guide-hint')).toHaveText('WASD で移動');
  await expect(page.getByTestId('guide-hint')).toHaveClass(/is-visible/);
  await holdKey(page, 'KeyW', 60);
  await expect.poll(async () => (await guide(page)).hint).toBe('camera');
  expect((await guide(page)).doneHints).toEqual(['move']);

  // 篝火の近くで状況ボタン「E 火を灯す」
  await page.evaluate(() => {
    window.__game?.dev.teleport(0, -1.2, 0);
  });
  const prompt = page.getByTestId('guide-prompt');
  await expect(prompt).toHaveClass(/is-visible/);
  await expect(prompt).toContainText('火を灯す');
  await expect(prompt.locator('.guide-prompt-key')).toHaveText('E');
  // タッチのボタンは出ていない（二重にならない）
  await expect(page.locator('.touch-btn--interact')).toBeHidden();

  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await bonfire(page)).playerState).toBe('interact');
  await expect(prompt).not.toHaveClass(/is-visible/);
});

test('notice: queued notices show one at a time for 3 seconds', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.pushNotice('回復瓶を手に入れた');
    window.__game?.dev.pushNotice('近道が開いた');
  });
  const notice = page.getByTestId('guide-notice');
  await expect(notice).toHaveText('回復瓶を手に入れた');
  await expect(notice).toHaveClass(/is-visible/);
  expect((await guide(page)).pendingNotices).toBe(1);
  await waitSteps(page, 200);
  await expect(notice).toHaveText('近道が開いた');
});

test.describe('touch', () => {
  test.use({
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  test('the 調査 button is the context pill: hidden without a target, tap runs it', async ({
    page,
  }) => {
    await boot(page);
    await expect(page.locator('html')).toHaveAttribute('data-input-device', 'touch');
    const btn = page.locator('.touch-btn[data-action="interact"]');
    await expect(btn).not.toHaveClass(/is-available/);
    await expect(page.getByTestId('guide-prompt')).toBeHidden();

    await page.evaluate(() => {
      window.__game?.dev.teleport(0, -1.2, 0);
    });
    await expect(btn).toHaveClass(/is-available/);
    await expect(btn).toHaveText('タップ：火を灯す');
    const box = await btn.boundingBox();
    if (!box) throw new Error('button not found');
    const cdp: CDPSession = await page.context().newCDPSession(page);
    const point = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => (await bonfire(page)).playerState).toBe('interact');
    await expect(btn).not.toHaveClass(/is-available/);
  });
});
