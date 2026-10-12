import { expect, test, type Page } from '@playwright/test';
import { bootGame, stepUntil, tapKey, waitSteps } from './helpers';

/**
 * インタラクト動作の拡張（#123）のテストシーン。配置データにない対象は `dev.placeInteractable` でその場に置く。
 * 待ちはシミュレーション基準（ステップ数）にする。案内・テキスト表示（DOM）を見るものだけをここに置き、
 * 床板・壊せる壁などロジックだけのものは src/game/interactable/worldActionsHeadless.test.ts で検証している。
 */
const boot = (page: Page, enemies = false) => bootGame(page, { enemies });

const flags = (page: Page) =>
  page.evaluate(() => window.__game?.dev.interactables().flags ?? ([] as readonly string[]));

test('bell: ringing makes an idle soldier suspicious and walk toward the bell (not alert)', async ({
  page,
}) => {
  await boot(page, true);
  // b-undead-1 は (22, 6) で西を向く。その真後ろ 9m（視界の外）に鐘を置く
  await page.evaluate(() => {
    const g = window.__game;
    if (!g) throw new Error('no game');
    g.dev.placeInteractable({
      id: 'bell_test',
      kind: 'bell',
      x: 31,
      z: 6,
      site: 'main',
      prompt: 'bell',
      cooldownF: 1800,
      actionF: 90,
      effectF: 20,
      effects: [
        { type: 'emitSound', radiusM: 15, kind: 'bell' },
        { type: 'showText', textId: 'bell_first', firstOnly: true },
      ],
    });
    g.dev.teleport(31, 5, 0);
    g.dev.advance(5);
  });
  const soldier = () =>
    page.evaluate(() => {
      const e = window.__game?.sim.enemies.find((x) => x.id === 'b-undead-1');
      if (!e) throw new Error('enemy not found');
      return { state: e.state, x: e.x, z: e.z };
    });
  expect((await soldier()).state).toBe('idle');
  await expect(page.getByTestId('guide-prompt')).toContainText('鐘');
  await tapKey(page, 'KeyE');
  const states = new Set<string>();
  const startX = (await soldier()).x;
  // 鐘の方（東）へ歩き出すまで進める。到着前（鐘のそばのプレイヤーを見つける前）に確かめる
  for (let i = 0; i < 150 && (await soldier()).x < startX + 0.5; i++) {
    await page.evaluate(() => {
      window.__game?.dev.advance(3);
    });
    states.add((await soldier()).state);
  }
  expect(states.has('suspicious')).toBe(true);
  expect(states.has('alert')).toBe(false);
  expect((await soldier()).x).toBeGreaterThan(startX + 0.5); // 鐘（東）の方へ歩いている
  await expect(page.getByTestId('text-panel')).toContainText('鐘の音が、霧の向こうまで響いた。');
});

test('grate: pushing the iron grate from the inside opens it and saves world.grateDOpen', async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.teleport(72, 44, 0, 5.9);
  });
  await waitSteps(page, 2);
  await expect(page.getByTestId('guide-prompt')).toContainText('押す');
  await tapKey(page, 'KeyE');
  await stepUntil(
    page,
    () => flags(page),
    (f) => f.includes('world.grateDOpen'),
  );
  await stepUntil(
    page,
    () => page.evaluate(() => window.__game?.dev.waterway().grateOpen),
    (open) => open === true,
  );
  await stepUntil(
    page,
    () => page.evaluate(() => window.__game?.dev.interactables().usable ?? []),
    (usable) => !usable.includes('grate_d'),
  ); // 開いたら状況ボタンは出ない
});
