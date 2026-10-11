import { expect, test } from '@playwright/test';
import { startGame } from './helpers';

// ベンチマークモード（#261）: `?bench` で自動計測が完走し、全区間の行が並んだ結果テキストとパネルが出る。
// `?bench=quick` は区間を時間ではなくフレーム数だけで進める（SwiftShader でも短時間で終わる。時間依存にしない）。
test('?bench runs every section and shows a copyable report', async ({ page }) => {
  test.setTimeout(600_000);
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?bench=quick&quality=low&scale=0.25');
  await startGame(page);

  await expect
    .poll(() => page.evaluate(() => window.__game?.dev.bench().state), { timeout: 540_000 })
    .toBe('done');
  const status = await page.evaluate(() => window.__game?.dev.bench());
  if (!status) throw new Error('bench status is not available');

  const names = status.rows.map((r) => r.name);
  expect(names).toEqual([
    'bonfire',
    'graveyard',
    'chapel-gate',
    'chapel-interior',
    'graveyard:base',
    'graveyard:noshadow',
    'graveyard:nobloom',
    'graveyard:nomsaa',
    'graveyard:nograss',
    'graveyard:noparticles',
    'graveyard:nolights',
    'graveyard:flatmat',
    'graveyard:scale=0.5',
    'combat',
  ]);
  const lines = status.text.split('\n');
  expect(status.text).toContain('ua: ');
  expect(status.text).toContain('quality: low');
  for (const name of names) {
    expect(lines.some((l) => l.startsWith(`${name} | `))).toBe(true);
  }
  // 計測した区間は draws と frame ms が入る（low では bloom / msaa / 草が無いので skipped）
  for (const row of status.rows) {
    if (row.skipped !== undefined) continue;
    expect(row.draws, row.name).toBeGreaterThan(0);
    expect(row.frameMedMs, row.name).toBeGreaterThan(0);
  }
  expect(status.rows.find((r) => r.name === 'graveyard:nobloom')?.skipped).toBeDefined();
  // scale=0.5 の区間だけ内部解像度が変わり、終わったら元（0.25）に戻る
  expect(status.rows.find((r) => r.name === 'graveyard:scale=0.5')?.scale).toBe(0.5);
  expect(status.rows.find((r) => r.name === 'combat')?.scale).toBe(0.25);
  // 戦闘区間で敵 3 体を倒している
  const dead = await page.evaluate(
    () => window.__game?.sim.enemies.filter((e) => e.hp <= 0).length ?? 0,
  );
  expect(dead).toBeGreaterThanOrEqual(3);

  await expect(page.getByTestId('bench-result')).toBeVisible();
  await expect(page.getByTestId('bench-result').locator('textarea')).toHaveValue(/combat \| /);
  await expect(page.getByRole('button', { name: 'コピー' })).toBeVisible();
  expect(errors).toEqual([]);
});
