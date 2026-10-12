import { expect, test, type Page } from '@playwright/test';
import { bootGame, stepUntil, tapKey } from './helpers';

const boot = (page: Page) => bootGame(page, { enemies: false });

const entry = (page: Page) =>
  page.evaluate(() => {
    const dev = window.__game?.dev;
    if (!dev) throw new Error('dev hooks unavailable');
    return dev.bossEntry();
  });

const gate = (page: Page) =>
  page.evaluate(() => {
    const g = window.__game?.dev.fogGate();
    if (!g) throw new Error('no fog gate');
    return g;
  });

test('enters the fog gate: the boss is invulnerable during its intro, then engages; death resets it', async ({
  page,
}) => {
  await boot(page);
  // 入る前: ボスは闘技場で待機（戦闘前・無敵ではない）
  const before = await entry(page);
  expect(before).toMatchObject({ exists: true, state: 'dormant', engaged: false });

  // 中庭側の門の前から霧へ入る
  await page.evaluate(() => {
    window.__game?.dev.teleport(102.4, 66.4, (45 * Math.PI) / 180);
  });
  await stepUntil(
    page,
    async () => (await gate(page)).prompt,
    (v) => v === '霧へ入る',
  );
  await tapKey(page, 'KeyE');
  // 闘技場へ着くと入場演出（無敵）が始まり、HP バーはまだ出ない
  await stepUntil(
    page,
    async () => (await entry(page)).intros,
    (v) => v === 1,
    { chunk: 1 },
  );
  const intro = await entry(page);
  expect(intro.invulnerable).toBe(true);
  expect(intro.engaged).toBe(false);
  expect(intro.bgm).toBe('bgm.boss');
  expect((await gate(page)).state).toBe('sealed');

  // 約 90F 後に戦闘開始（bossEngaged = HP バー）。無敵が解ける
  await stepUntil(
    page,
    async () => (await entry(page)).engages,
    (v) => v === 1,
  );
  const fight = await entry(page);
  expect(fight.engaged).toBe(true);
  expect(fight.invulnerable).toBe(false);
  expect(fight.hp).toBe(fight.maxHp);

  // 死亡: ボスは満タン・フェーズ 1・待機へ。霧の門は閉じ直し、篝火で再開する
  await page.evaluate(() => {
    window.__game?.dev.bossDamage(1000);
    window.__game?.dev.damage(10_000);
  });
  await stepUntil(
    page,
    async () => (await entry(page)).engaged,
    (v) => !v,
  );
  await stepUntil(
    page,
    async () => (await gate(page)).state,
    (v) => v === 'closed',
    {
      maxSteps: 1200,
    },
  );
  await stepUntil(
    page,
    async () => (await page.evaluate(() => window.__game?.dev.death()))?.active,
    (v) => v === false,
    { maxSteps: 1200 },
  );
  const reset = await entry(page);
  expect(reset).toMatchObject({ state: 'dormant', engaged: false, phase: 1 });
  expect(reset.hp).toBe(reset.maxHp);
  expect(reset.bgm).toBe('bgm.area');
});
