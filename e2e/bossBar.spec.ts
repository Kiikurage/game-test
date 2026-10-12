import { expect, test, type Page } from '@playwright/test';
import { bootGame } from './helpers';

const boot = (page: Page) => bootGame(page, { scene: 'test', params: { boss: '' } });

const scaleX = (page: Page, id: string) =>
  page.getByTestId(id).evaluate((e) => {
    const m = /scaleX\(([\d.]+)\)/.exec(e.style.transform);
    return m ? Number(m[1]) : NaN;
  });

const advance = (page: Page, steps: number) =>
  page.evaluate((n) => {
    window.__game?.dev.advance(n);
  }, steps);

test('boss HP bar appears on engage, drops on damage and the ghost follows', async ({ page }) => {
  const errors = await boot(page);
  await advance(page, 40);
  const bar = page.getByTestId('boss-bar');
  await expect(bar).toBeVisible();
  await expect(page.getByTestId('boss-bar-name')).toHaveText('門番の骸 オルグ');
  expect(await scaleX(page, 'boss-bar-fill')).toBe(1);

  // 目盛りは 50% の位置
  const tick = await page.locator('.boss-bar-tick').evaluateAll((els) =>
    els.map((e) => {
      const track = e.parentElement?.getBoundingClientRect();
      const r = e.getBoundingClientRect();
      return track ? (r.left + r.width / 2 - track.left) / track.width : NaN;
    }),
  );
  expect(tick).toHaveLength(1);
  expect(tick[0]).toBeCloseTo(0.5, 1);

  // 600 ダメージ → バーは 75%、残像は 100% のまま 60F 待つ
  await page.evaluate(() => {
    window.__game?.dev.bossDamage(600);
  });
  await advance(page, 2);
  await expect.poll(() => scaleX(page, 'boss-bar-fill')).toBeCloseTo(0.75, 3);
  expect(await scaleX(page, 'boss-bar-ghost')).toBe(1);

  await advance(page, 30);
  await expect.poll(() => scaleX(page, 'boss-bar-ghost')).toBe(1);

  // 遅延（60F）を過ぎると残像が縮み、最後は HP に一致する
  await advance(page, 40);
  await expect
    .poll(async () => {
      const g = await scaleX(page, 'boss-bar-ghost');
      return g < 1 && g > 0.75;
    })
    .toBe(true);
  await advance(page, 40);
  await expect.poll(() => scaleX(page, 'boss-bar-ghost')).toBeCloseTo(0.75, 3);
  expect(errors).toEqual([]);
});

test('boss HP bar flashes at the phase boundary and hides on defeat', async ({ page }) => {
  const errors = await boot(page);
  await advance(page, 40);
  await expect(page.getByTestId('boss-bar')).toBeVisible();
  const flash = (): Promise<number> =>
    page.getByTestId('boss-bar-glow').evaluate((e) => Number(e.style.opacity));
  expect(await flash()).toBe(0);

  // HP を 1200（50%）にするとフェーズ境界へ向かう。発光は 20F だけ
  await page.evaluate(() => {
    window.__game?.dev.bossDamage(1200);
  });
  // 移行は「いまの技が終わったところ」で始まる（技の最中は待つ）。`transition` になるまで 1 ステップずつ進める
  await page.evaluate(() => {
    const g = window.__game;
    if (!g) throw new Error('no game');
    for (let i = 0; i < 900 && g.dev.bossDebug()?.state !== 'transition'; i++) g.dev.advance(1);
  });
  await advance(page, 3);
  // シミュレーションは停止中なので、発光は描画フレームで DOM に反映されるまで保たれる
  await expect.poll(flash).toBeGreaterThan(0.5);
  await advance(page, 30);
  await expect.poll(flash).toBe(0);

  // 撃破でバーが消える
  await page.evaluate(() => {
    window.__game?.dev.bossDamage(10_000);
  });
  await advance(page, 40);
  await expect(page.getByTestId('boss-bar')).toBeHidden();
  expect(errors).toEqual([]);
});
