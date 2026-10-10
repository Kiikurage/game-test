import { expect, test, type Page } from '@playwright/test';
import { startGame, tapKey } from './helpers';

test.describe.configure({ timeout: 120_000 });

async function boot(page: Page, query = ''): Promise<void> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(`./?scene=test&quality=low&scale=0.25&nodraw${query}`);
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
  expect(errors).toEqual([]);
}

const rect = (page: Page, id: string) =>
  page.getByTestId(id).evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });

const scaleX = (page: Page, id: string, which: 'main' | 'ghost') =>
  page.getByTestId(id).evaluate((e, w) => {
    const fill = e.querySelector<HTMLElement>(`.hud-fill--${w}`);
    const m = /scaleX\(([\d.]+)\)/.exec(fill?.style.transform ?? '');
    return m ? Number(m[1]) : NaN;
  }, which);

test.describe('mobile landscape 915x412 (Xperia 1 V)', () => {
  test.use({ viewport: { width: 915, height: 412 }, hasTouch: true, isMobile: true });

  test('HUD sits at the spec positions', async ({ page }) => {
    await boot(page);
    const hp = await rect(page, 'hud-hp');
    expect(hp).toMatchObject({ x: 16, y: 16, w: 240, h: 12 });
    const st = await rect(page, 'hud-stamina');
    expect(st).toMatchObject({ x: 16, y: 16 + 12 + 6, w: 180, h: 8 });
    const flask = await rect(page, 'hud-flask');
    expect(flask.x).toBe(16);
    expect(flask.y).toBe(st.y + 8 + 8);
    await expect(page.getByTestId('hud-flask')).toContainText('×3');
  });

  test('respects the safe area (notch on the left, 16px beyond it)', async ({ page }) => {
    await boot(page, '&safe=44,0,44,21');
    const hp = await rect(page, 'hud-hp');
    expect(hp.x).toBe(44 + 16);
    expect(hp.y).toBe(16);
  });

  test('does not overlap the touch buttons', async ({ page }) => {
    await boot(page);
    const stack = await page.getByTestId('hud-flask').evaluate((e) => {
      const r = e.getBoundingClientRect();
      return { right: r.right, bottom: r.bottom };
    });
    const buttons = await page.locator('.touch-btn').evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return { left: r.left, top: r.top };
      }),
    );
    for (const b of buttons) expect(b.left > 270 || b.top > stack.bottom).toBe(true);
  });
});

test.describe('PC 1280x720', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('scales by 1.3 and follows HP / flask values', async ({ page }) => {
    await boot(page);
    const hp = await rect(page, 'hud-hp');
    expect(hp.x).toBeCloseTo(16 * 1.3, 1);
    expect(hp.y).toBeCloseTo(16 * 1.3, 1);
    expect(hp.w).toBeCloseTo(240 * 1.3, 1);
    expect(hp.h).toBeCloseTo(10 * 1.3, 1);
    expect((await rect(page, 'hud-stamina')).w).toBeCloseTo(180 * 1.3, 1);

    expect(await scaleX(page, 'hud-hp', 'main')).toBe(1);
    await page.evaluate(() => {
      window.__game?.dev.damage(150);
    });
    await expect.poll(() => scaleX(page, 'hud-hp', 'main')).toBeCloseTo(0.5, 2);
    // 残像は遅れて減る（直後はまだ上端が高い）→ やがて HP に追いつく
    expect(await scaleX(page, 'hud-hp', 'ghost')).toBeGreaterThan(0.5);
    await expect
      .poll(() => scaleX(page, 'hud-hp', 'ghost'), { timeout: 60_000 })
      .toBeCloseTo(0.5, 2);

    await tapKey(page, 'KeyR');
    await expect(page.getByTestId('hud-flask')).toContainText('×2');
  });
});
