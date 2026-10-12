import { expect, test, type Page } from '@playwright/test';
import { bootGame, tapKey, waitSteps } from './helpers';

const boot = (page: Page) => bootGame(page, { enemies: false });

const panelState = (page: Page) => page.evaluate(() => window.__game?.dev.textPanel() ?? null);

test('read: the stele shows a context button, E opens the panel, walking away closes it', async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.teleport(-4.6, 2.2, 0);
  });
  await waitSteps(page, 2);
  const prompt = page.getByTestId('guide-prompt');
  await expect(prompt).toHaveClass(/is-visible/);
  await expect(prompt).toContainText('読む');
  await expect(prompt.locator('.guide-prompt-key')).toHaveText('E');

  const panel = page.getByTestId('text-panel');
  await expect(panel).not.toHaveClass(/is-visible/);
  await tapKey(page, 'KeyE');
  await waitSteps(page, 2);
  await expect(panel).toHaveClass(/is-visible/);
  await expect(panel).toContainText('火を継ぐ者');
  expect((await panelState(page))?.mode).toBe('read');

  // 2m 離れると閉じる
  await page.evaluate(() => {
    window.__game?.dev.teleport(-4.6, 5.8, 0);
  });
  await waitSteps(page, 2);
  await expect(panel).not.toHaveClass(/is-visible/);
  expect(await panelState(page)).toBeNull();
});

test('conversation: the decision button advances line by line, moving closes it', async ({
  page,
}) => {
  await boot(page);
  const panel = page.getByTestId('text-panel');
  // スポーン位置（石碑から離れた所）で話す。石碑のそばだと、会話を閉じた押下が先行入力に残り石碑を読み直す
  const spawn = await page.evaluate(() => {
    const p = window.__game?.sim.player.position;
    if (!p) throw new Error('no player');
    return { x: p.x, z: p.z };
  });
  await page.evaluate(() => {
    window.__game?.dev.showText(
      ['npc_knight.1', 'npc_knight.2', 'npc_knight.3', 'npc_knight.4'],
      'conversation',
    );
  });
  await waitSteps(page, 2);
  await expect(panel).toHaveClass(/is-visible/);
  await expect(panel).toContainText('生きた者の足音');
  // 会話中の状況ボタンは「次へ」
  await expect(page.getByTestId('guide-prompt')).toContainText('次へ');

  await tapKey(page, 'KeyE');
  await waitSteps(page, 2);
  expect((await panelState(page))?.index).toBe(1);
  await expect(panel).toContainText('誓いに、食われた');
  // 同じステップ内の 2 回押しは 1 回に畳まれるので、1 行ずつ反映を待つ
  await tapKey(page, 'KeyE');
  await waitSteps(page, 2);
  expect((await panelState(page))?.index).toBe(2);
  await tapKey(page, 'KeyE');
  await waitSteps(page, 2);
  expect((await panelState(page))?.index).toBe(3);
  await expect(page.getByTestId('guide-prompt')).toContainText('閉じる');
  await tapKey(page, 'KeyE');
  await waitSteps(page, 2);
  expect(await panelState(page)).toBeNull();

  // 動いたら閉じる。次に話すと 1 行目から
  await page.evaluate(() => {
    window.__game?.dev.showText(
      ['npc_knight.1', 'npc_knight.2', 'npc_knight.3', 'npc_knight.4'],
      'conversation',
    );
  });
  await waitSteps(page, 2);
  await tapKey(page, 'KeyE');
  await waitSteps(page, 2);
  expect((await panelState(page))?.index).toBe(1);
  await page.evaluate(({ x, z }) => {
    window.__game?.dev.teleport(x + 3, z, 0);
  }, spawn);
  await waitSteps(page, 2);
  expect(await panelState(page)).toBeNull();
  await page.evaluate(() => {
    window.__game?.dev.showText(
      ['npc_knight.1', 'npc_knight.2', 'npc_knight.3', 'npc_knight.4'],
      'conversation',
    );
  });
  await waitSteps(page, 2);
  expect((await panelState(page))?.index).toBe(0);
});
