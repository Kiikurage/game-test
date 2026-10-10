import { expect, test, type Page } from '@playwright/test';
import { startGame } from './helpers';

/** 既定のレベル（灰の礎）を最小品質・低解像度で起動する（`?debug` で敵の可視化も確認）。 */
async function boot(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?debug&quality=low&scale=0.25&nodraw');
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 90_000 })
    .toBeGreaterThan(30);
  return errors;
}

/** シミュレーションを止めて、指定ステップずつ進める（SwiftShader の描画速度に左右されない）。 */
const advance = (page: Page, steps: number) =>
  page.evaluate((n) => {
    window.__game?.dev.advance(n);
  }, steps);

const enemy = (page: Page, id: string) =>
  page.evaluate((enemyId) => {
    const e = window.__game?.sim.enemies.find((x) => x.id === enemyId);
    if (!e) throw new Error(`enemy not found: ${enemyId}`);
    return e;
  }, id);

test('enemies are spawned from the level data and render without errors', async ({ page }) => {
  const errors = await boot(page);
  const count = await page.evaluate(() => window.__game?.sim.enemies.length ?? 0);
  expect(count).toBeGreaterThan(0); // レベルデータの敵の配置（`enemies`）の数だけ生成される
  // ?debug の可視化（状態ラベル）が出ている
  await expect(page.locator('.enemy-debug')).toHaveCount(1);
  await expect.poll(() => page.locator('.enemy-debug div').count()).toBe(count);
  expect(errors).toEqual([]);
});

test('an enemy notices the player, chases, loses sight, and returns to its post', async ({
  page,
}) => {
  const errors = await boot(page);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });

  // b-undead-1 は (22, 6) で西（-x）を向いて立っている。その正面 8m に立つ。
  await page.evaluate(() => {
    window.__game?.dev.teleport(14, 6, Math.PI / 2);
  });
  await advance(page, 5);
  expect((await enemy(page, 'b-undead-1')).state).toBe('idle');

  // 立ち止まっていても視界の中なら気付きゲージが溜まり、Suspicious → Alert → Chase
  const seen: string[] = [];
  for (let i = 0; i < 400 && !seen.includes('approach'); i++) {
    await advance(page, 3);
    const s = (await enemy(page, 'b-undead-1')).state;
    if (seen[seen.length - 1] !== s) seen.push(s);
  }
  expect(seen).toEqual(['idle', 'suspicious', 'alert', 'chase', 'approach']);
  await advance(page, 120); // Approach で 3m まで詰めて待つ
  const near = await enemy(page, 'b-undead-1');
  const player = (await page.evaluate(() => window.__game?.sim.player.position)) ?? { x: 0, z: 0 };
  expect(Math.hypot(near.x - player.x, near.z - player.z)).toBeLessThan(3.5);

  // 視界の外・聞こえない距離へ移ると、見失って Return し、持ち場へ戻って Idle になる
  await page.evaluate(() => {
    window.__game?.dev.teleport(100, 90, 0);
  });
  for (let i = 0; i < 600; i++) {
    await advance(page, 3);
    if ((await enemy(page, 'b-undead-1')).state === 'return') break;
  }
  expect((await enemy(page, 'b-undead-1')).state).toBe('return');
  for (let i = 0; i < 600; i++) {
    await advance(page, 3);
    if ((await enemy(page, 'b-undead-1')).state === 'idle') break;
  }
  const home = await enemy(page, 'b-undead-1');
  expect(home.state).toBe('idle');
  expect(home.homeDistance).toBeLessThan(0.5);
  expect(errors).toEqual([]);
});

/** 亡者兵の攻撃の発生フレーム（仕様書 5.2 節）。動作 ID → 発生。 */
const STARTUP: Record<string, number> = {
  'enemy.undead.a1': 24,
  'enemy.undead.a1b': 20,
  'enemy.undead.a2': 34,
  'enemy.undead.a3': 28,
};

/** b-undead-1（(22, 6) で西を向く）の正面 2m に、敵の方を向いて立たせ、攻撃に入るまで進める。 */
async function faceSoldierAndWaitForAttack(page: Page): Promise<{ id: string; startup: number }> {
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
    window.__game?.dev.teleport(20, 6, Math.PI / 2);
  });
  const id = await page.evaluate(() => {
    const g = window.__game;
    if (!g) throw new Error('no game');
    for (let i = 0; i < 1500; i++) {
      const e = g.sim.enemies.find((x) => x.id === 'b-undead-1');
      if (e?.state === 'attack' && e.attackId) return e.attackId;
      g.dev.advance(1);
    }
    throw new Error('the soldier never attacked');
  });
  return { id, startup: STARTUP[id] ?? 0 };
}

test('a soldier telegraphs, swings, and the hit damages the player and plays the hit reaction', async ({
  page,
}) => {
  const errors = await boot(page);
  const { id, startup } = await faceSoldierAndWaitForAttack(page);
  expect(startup).toBeGreaterThan(0);
  const hp0 = await page.evaluate(() => window.__game?.sim.combat.playerHp ?? 0);
  // 予備動作の間（発生まで）は当たらない
  await advance(page, startup);
  const mid = await page.evaluate(() => window.__game?.sim.combat);
  expect(mid?.playerHp).toBe(hp0);
  expect((await enemy(page, 'b-undead-1')).attackId).toBe(id);
  // 発生の次のフレームから判定が出て、立っているプレイヤーに命中する
  await advance(page, 12);
  const after = await page.evaluate(() => window.__game?.sim);
  expect(after?.combat.playerHp).toBeLessThan(hp0);
  expect(after?.combat.lastHitTarget).toBe('player');
  expect(after?.combat.lastHitStopFrames).toBe(6);
  expect(['flinch', 'knockdown']).toContain(after?.player.state);
  expect(errors).toEqual([]);
});

test('rolling at the right moment dodges a soldier attack (invulnerability frames)', async ({
  page,
}) => {
  const errors = await boot(page);
  const { startup } = await faceSoldierAndWaitForAttack(page);
  const hp0 = await page.evaluate(() => window.__game?.sim.combat.playerHp ?? 0);
  // 発生の 3F 前までは立ったまま。そこで右へロール（無敵 F4–F15 が判定を覆う）
  await advance(page, startup - 3);
  await page.keyboard.down('KeyD');
  await page.keyboard.press('Space'); // 短押し = 離した時点でロール確定
  await advance(page, 1);
  await page.keyboard.up('KeyD');
  const rolling = await page.evaluate(() => window.__game?.sim);
  expect(rolling?.player.state).toBe('roll');
  // 判定の持続が終わるまで（無敵の間に通過する）。ロールは無敵のあいだ当たらない
  let invulnerableSeen = false;
  for (let i = 0; i < 24; i++) {
    await advance(page, 1);
    if ((await page.evaluate(() => window.__game?.sim.player.invulnerable)) === true) {
      invulnerableSeen = true;
    }
  }
  expect(invulnerableSeen).toBe(true);
  const after = await page.evaluate(() => window.__game?.sim);
  expect(after?.combat.playerHp).toBe(hp0);
  expect(after?.combat.hits).toBe(0);
  expect(errors).toEqual([]);
});

test('the combat debug scene (?scene=combat) has exactly one soldier that comes to fight', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?scene=combat&quality=low&scale=0.25&nodraw');
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 90_000 })
    .toBeGreaterThan(30);
  await page.evaluate(() => {
    window.__game?.dev.pause(true);
  });
  const ids = await page.evaluate(() => window.__game?.sim.enemies.map((e) => e.id));
  expect(ids).toEqual(['combat-undead-1']);
  // 広場で待つと、亡者兵は気付き・接近し、攻撃を出す
  let attacked = false;
  for (let i = 0; i < 300 && !attacked; i++) {
    await advance(page, 10);
    attacked = (await enemy(page, 'combat-undead-1')).attackId !== null;
  }
  expect(attacked).toBe(true);
  expect(errors).toEqual([]);
});
