import { expect, test, type Page } from '@playwright/test';
import { startGame, tapKey, waitSteps } from './helpers';

test.describe.configure({ timeout: 120_000 });

async function boot(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__game?.sim.player.grounded)).toBe(true);
}

const panelState = (page: Page) => page.evaluate(() => window.__game?.dev.textPanel() ?? null);

test('read: the stele shows a context button, E opens the panel, walking away closes it', async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.teleport(-4.6, 2.2, 0);
  });
  const prompt = page.getByTestId('guide-prompt');
  await expect(prompt).toHaveClass(/is-visible/);
  await expect(prompt).toContainText('読む');
  await expect(prompt.locator('.guide-prompt-key')).toHaveText('E');

  const panel = page.getByTestId('text-panel');
  await expect(panel).not.toHaveClass(/is-visible/);
  await tapKey(page, 'KeyE');
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
  await page.evaluate(() => {
    window.__game?.dev.teleport(-4.6, 2.2, 0);
  });
  await page.evaluate(() => {
    window.__game?.dev.showText(
      ['npc_knight.1', 'npc_knight.2', 'npc_knight.3', 'npc_knight.4'],
      'conversation',
    );
  });
  await expect(panel).toHaveClass(/is-visible/);
  await expect(panel).toContainText('生きた者の足音');
  // 会話中の状況ボタンは「次へ」
  await expect(page.getByTestId('guide-prompt')).toContainText('次へ');

  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await panelState(page))?.index).toBe(1);
  await expect(panel).toContainText('誓いに、食われた');
  // 同じステップ内の 2 回押しは 1 回に畳まれるので、1 行ずつ反映を待つ
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await panelState(page))?.index).toBe(2);
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await panelState(page))?.index).toBe(3);
  await expect(page.getByTestId('guide-prompt')).toContainText('閉じる');
  await tapKey(page, 'KeyE');
  await expect.poll(() => panelState(page)).toBeNull();

  // 動いたら閉じる。次に話すと 1 行目から
  await page.evaluate(() => {
    window.__game?.dev.showText(
      ['npc_knight.1', 'npc_knight.2', 'npc_knight.3', 'npc_knight.4'],
      'conversation',
    );
  });
  await tapKey(page, 'KeyE');
  await expect.poll(async () => (await panelState(page))?.index).toBe(1);
  await page.evaluate(() => {
    window.__game?.dev.teleport(-1.6, 2.2, 0);
  });
  await expect.poll(() => panelState(page)).toBeNull();
  await page.evaluate(() => {
    window.__game?.dev.showText(
      ['npc_knight.1', 'npc_knight.2', 'npc_knight.3', 'npc_knight.4'],
      'conversation',
    );
  });
  expect((await panelState(page))?.index).toBe(0);
});
