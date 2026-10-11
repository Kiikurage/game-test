import { expect, test, type Page } from '@playwright/test';
import { startGame, waitSteps } from './helpers';

/**
 * 霊廟の屋根（高さ 2.2m。脇道 side_roof）の南縁から歩いて降り、落下 → 着地の状態遷移が破綻しないことを確かめる（#116）。
 * 敵は置かない（`enemies=0`）ので、落下中に攻撃を入力しても落下攻撃は出ず（下に敵がいない）、通常の着地になる。
 * 落下攻撃そのものの数値・判定は Vitest（src/game/player/plunge.test.ts）で検証している。
 */

const ROOF_Y = 5.0;

async function boot(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./?quality=low&scale=0.25&nodraw&enemies=0');
  await startGame(page);
  await expect
    .poll(() => page.evaluate(() => window.__game?.steps ?? 0), { timeout: 30_000 })
    .toBeGreaterThan(30);
  expect(errors).toEqual([]);
}

const sim = (page: Page) =>
  page.evaluate(() => {
    const s = window.__game?.sim;
    if (!s) throw new Error('sim state unavailable');
    return s;
  });

/**
 * 屋根の南縁から歩いて降りる。ページ内の描画フレームごとに状態を記録し、落下中（足元が屋根から 0.8m 以上下）に
 * `attack` が true なら攻撃入力（左クリック）を 1 回発火する。接地して落ち着くまでの状態の並びを返す。
 */
function descend(page: Page, attack: boolean): Promise<{ states: string[]; landDelta: number }> {
  return page.evaluate(
    ({ roofY, doAttack }) =>
      new Promise<{ states: string[]; landDelta: number }>((resolve) => {
        const game = window.__game;
        if (!game) throw new Error('no game');
        const landBefore = game.sim.events.land;
        const states: string[] = [];
        let clicked = false;
        let settled = 0;
        const tick = () => {
          const p = game.sim.player;
          if (states.at(-1) !== p.state) states.push(p.state);
          if (doAttack && !clicked && p.state === 'fall' && p.position.y < roofY - 0.8) {
            clicked = true;
            const target = document.pointerLockElement;
            if (!target) throw new Error('pointer lock is not held');
            const init = { pointerType: 'mouse', button: 0, bubbles: true, cancelable: true };
            target.dispatchEvent(new PointerEvent('pointerdown', init));
            window.dispatchEvent(new PointerEvent('pointerup', init));
          }
          const onGround = p.grounded && p.position.y < roofY - 1.5;
          settled = onGround && (p.state === 'idle' || p.state === 'move') ? settled + 1 : 0;
          if (settled > 30) {
            resolve({ states, landDelta: game.sim.events.land - landBefore });
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    { roofY: ROOF_Y, doAttack: attack },
  );
}

for (const attack of [false, true]) {
  test(`walking off the mausoleum roof ${attack ? 'with an attack input in the air ' : ''}falls and lands cleanly`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await boot(page);
    // 屋根の南縁の手前に立つ（南 = -Z を向く）。カメラも背後（北）に置いて W で南へ進む
    await page.evaluate(
      ([y]) => {
        window.__game?.dev.teleport(29, 15.6, Math.PI, y);
        window.__game?.dev.view(0, 4.2, 15);
      },
      [ROOF_Y] as const,
    );
    await waitSteps(page, 30);
    const before = await sim(page);
    expect(before.player.grounded).toBe(true);
    expect(before.player.position.y).toBeGreaterThan(4.7);

    await page.keyboard.down('KeyW');
    let result: { states: string[]; landDelta: number };
    try {
      result = await descend(page, attack);
    } finally {
      await page.keyboard.up('KeyW');
    }

    // 並びは 移動 → 落下 → 着地（高さ 2m 以上は硬直あり）→ 移動 / 待機。落下攻撃は出ない（下に敵がいない）
    const { states } = result;
    expect(states).toContain('fall');
    expect(states.indexOf('land')).toBeGreaterThan(states.indexOf('fall'));
    expect(states).not.toContain('plungeFall');
    expect(states).not.toContain('plunge');
    expect(states).not.toContain('dead');
    expect(result.landDelta).toBe(1);

    const after = await sim(page);
    expect(after.player.grounded).toBe(true);
    expect(after.player.position.y).toBeLessThan(before.player.position.y - 1.8);
    expect(after.combat.playerHp).toBe(before.combat.playerHp);
  });
}
