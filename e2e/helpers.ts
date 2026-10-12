import { expect, type Page } from '@playwright/test';

/** ローディング完了 → 開始画面をクリックしてゲームを開始する（`#app[data-state=running]` まで待つ）。 */
export async function startGame(page: Page): Promise<void> {
  const app = page.locator('#app');
  await expect(app).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
  await page.getByTestId('start-screen').click();
  await expect(app).toHaveAttribute('data-state', 'running');
}

/**
 * ローディング完了 → `dev.start()` で開始する（開始画面をクリックしない。Pointer Lock を取らず、実マウスに触れない）。
 * 以降の入力は `window.__game.dev.input.*` で注入する（ロックなしのクリックも攻撃として扱われる）。
 */
export async function startGameDev(page: Page): Promise<void> {
  const app = page.locator('#app');
  await expect(app).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
  await page.evaluate(() => window.__game?.dev.start());
  await expect(app).toHaveAttribute('data-state', 'running');
}

/**
 * キーの短押し（keydown → keyup を同一タスクで発火する）。
 * `page.keyboard.press` は keydown と keyup の間に CDP の往復が入り、遅い CI では 0.5 秒近く空くことがある。
 * 回避の短押し判定（実時間 0.25 秒）に影響するため、短押しの検証にはこちらを使う。
 */
export async function tapKey(page: Page, code: string): Promise<void> {
  await page.evaluate((c) => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: c, bubbles: true, cancelable: true }),
    );
    window.dispatchEvent(new KeyboardEvent('keyup', { code: c, bubbles: true, cancelable: true }));
  }, code);
}

/** 現在のシミュレーションステップ数（60Hz 固定ステップ）。 */
export const stepCount = (page: Page): Promise<number> =>
  page.evaluate(() => window.__game?.steps ?? 0);

/**
 * シミュレーションを `steps` ステップ進める（壁時計ではなくシミュレーション基準）。
 * ページ内で「一時停止 → `dev.advance(steps)` → 一時停止の状態を戻す」を同期実行するので、実時間・CI の描画速度に依存しない。
 * 直前に注入・発火した入力（キー・クリック・`dev.input.*`）は最初のステップで読まれる。
 * メインループ自体が回っていることを確かめたいときは `waitLoopSteps` を使う。
 */
export async function waitSteps(page: Page, steps: number): Promise<void> {
  await page.evaluate((n) => {
    const g = window.__game;
    if (!g) throw new Error('game is not ready');
    const was = g.paused;
    g.dev.pause(true);
    try {
      g.dev.advance(n);
    } finally {
      g.dev.pause(was);
    }
  }, steps);
}

/**
 * メインループ（rAF）が自力でシミュレーションを `steps` ステップ進めるまで待つ（ループの動作そのものの検証用）。
 * 実時間で待つので、ロジックの検証には `waitSteps` を使う。
 */
export async function waitLoopSteps(page: Page, steps: number): Promise<void> {
  await page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        const target = (window.__game?.steps ?? 0) + n;
        const tick = (): void => {
          if ((window.__game?.steps ?? 0) >= target) resolve();
          else requestAnimationFrame(tick);
        };
        tick();
      }),
    steps,
  );
}

/**
 * 描画フレームが `frames` 枚進むまで待つ（シミュレーションを止めている / ショーケース表示用）。
 * 描画ループ（rAF）を待つので、ページ内の rAF で数える（CDP の往復でポーリングしない）。
 */
export async function waitFrames(page: Page, frames: number): Promise<void> {
  await page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        const target = (window.__game?.frames ?? 0) + n;
        const tick = (): void => {
          if ((window.__game?.frames ?? 0) >= target) resolve();
          else requestAnimationFrame(tick);
        };
        tick();
      }),
    frames,
  );
}

/** キーを押したまま、シミュレーションを `steps` ステップ進める（実時間ではなくステップ基準。`waitSteps` と同じく同期実行）。 */
export async function holdKey(page: Page, code: string, steps: number): Promise<void> {
  await page.keyboard.down(code);
  try {
    await waitSteps(page, steps);
  } finally {
    await page.keyboard.up(code);
  }
}

/**
 * 左クリック（pointerdown → pointerup）を同一タスクで発火する。`page.mouse.click` 相当。
 * Pointer Lock を取っていればロック要素へ、取っていなければ（`dev.start()` で開始）キャンバスへ送る。
 * 入力は collector のラッチに溜まり、次のシミュレーションステップで 1 回の押下として消費される。
 */
export async function clickInPage(page: Page): Promise<void> {
  await page.evaluate(() => {
    const target = document.pointerLockElement ?? document.querySelector('canvas');
    if (!target) throw new Error('no click target (pointer lock / canvas)');
    const init = { pointerType: 'mouse', button: 0, bubbles: true, cancelable: true };
    target.dispatchEvent(new PointerEvent('pointerdown', init));
    window.dispatchEvent(new PointerEvent('pointerup', init));
  });
}

/**
 * プレイヤーが `state` の `frame` フレーム目以降に達した時点で左クリックを発火する。
 * - 一時停止中（`bootGame` の既定）: ページ内で 1 ステップずつ `dev.advance` し、達したステップの直後に発火する（決定的）。
 * - 進行中（開始画面のクリックで開始）: 到達した最初の描画フレームの rAF コールバック内で発火する
 *   （「ポーリング → CDP 経由で入力」だと往復中にシミュレーションが進み、コンボの入力窓を過ぎるため）。
 * クリック先は `clickInPage` と同じ（Pointer Lock 要素、無ければキャンバス）。
 * `maxFrame` を超えて到達した場合は窓を逃したとみなして reject する（既定: 無制限）。
 */
export async function clickWhenPlayerFrame(
  page: Page,
  state: string,
  frame: number,
  maxFrame = Number.POSITIVE_INFINITY,
): Promise<void> {
  await page.evaluate(
    ({ state, frame, maxFrame }) =>
      new Promise<void>((resolve, reject) => {
        const g = window.__game;
        if (!g) {
          reject(new Error('game is not ready'));
          return;
        }
        /** 到達していれば発火して true。窓を逃していれば例外。 */
        const tryClick = (): boolean => {
          const p = g.sim.player;
          if (p.state !== state || p.stateFrame < frame) return false;
          if (p.stateFrame > maxFrame)
            throw new Error(`missed the input window: ${state} F${p.stateFrame} > F${maxFrame}`);
          const target = document.pointerLockElement ?? document.querySelector('canvas');
          if (!target) throw new Error('no click target (pointer lock / canvas)');
          const init = { pointerType: 'mouse', button: 0, bubbles: true, cancelable: true };
          target.dispatchEvent(new PointerEvent('pointerdown', init));
          window.dispatchEvent(new PointerEvent('pointerup', init));
          return true;
        };
        try {
          if (g.paused) {
            // 一時停止中: シミュレーション 10 秒分まで 1 ステップずつ進める
            for (let i = 0; i <= 600; i++) {
              if (tryClick()) {
                resolve();
                return;
              }
              g.dev.advance(1);
            }
            throw new Error(`${state} F${frame} was not reached within 600 steps`);
          }
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
          return;
        }
        const deadlineSteps = g.steps + 600;
        const tick = (): void => {
          try {
            if (tryClick()) {
              resolve();
              return;
            }
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
            return;
          }
          if (g.steps > deadlineSteps) {
            reject(new Error(`${state} F${frame} was not reached within 600 steps`));
            return;
          }
          requestAnimationFrame(tick);
        };
        tick();
      }),
    { state, frame, maxFrame },
  );
}

/** `bootGame` のオプション。 */
export interface BootOptions {
  /** `?scene=`（test / combat / boss）。省略時は既定のレベル（灰の礎）。 */
  readonly scene?: 'test' | 'combat' | 'boss';
  /** false なら敵を置かない（`?enemies=0`）。既定 true。 */
  readonly enemies?: boolean;
  /** 開始後にプレイヤーを置く位置（`dev.teleport`）。省略時はスポーン位置。 */
  readonly at?: {
    readonly x: number;
    readonly z: number;
    readonly yaw?: number;
    readonly y?: number;
  };
  /**
   * 開始後もシミュレーションを止めたままにする（既定 true）。止めている間は `waitSteps` / `holdKey` /
   * `dev.advance` でだけ進むので、実時間に依存せず決定的になる。false なら rAF で進み続ける。
   */
  readonly paused?: boolean;
  /** `?quality=`。既定 low。 */
  readonly quality?: 'low' | 'medium' | 'high';
  /** 描画する（既定 false = `?nodraw&scale=0.25` のロジック検証用）。true なら解像度スケールも既定のまま。 */
  readonly draw?: boolean;
  /** そのほかのクエリ（例: `{ debug: '' }`）。 */
  readonly params?: Readonly<Record<string, string>>;
}

/**
 * 共通の起動 fixture。ロジック用の軽量 URL で開き、`dev.start()` で開始する（開始画面をクリックせず、Pointer Lock を取らない）。
 * 着地するまでシミュレーションを進め、`at` があればそこへ置く。戻り値は起動後も溜まり続けるコンソールエラーの配列
 * （起動時点で空であることはここで確かめる）。入力は `dev.input.*` かキー（`holdKey` / `tapKey`）、クリックは `clickInPage` で与える。
 */
export async function bootGame(page: Page, options: BootOptions = {}): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  const q = new URLSearchParams();
  if (options.scene) q.set('scene', options.scene);
  q.set('quality', options.quality ?? 'low');
  if (!options.draw) {
    q.set('scale', '0.25');
    q.set('nodraw', '');
  }
  if (options.enemies === false) q.set('enemies', '0');
  for (const [k, v] of Object.entries(options.params ?? {})) q.set(k, v);
  await page.goto(`./?${q.toString().replace(/=(&|$)/g, '$1')}`);
  await startGameDev(page);

  const grounded = await page.evaluate(
    ({ at, paused }) => {
      const g = window.__game;
      if (!g) throw new Error('game is not ready');
      g.dev.pause(true);
      // スポーン直後の着地を待つ（最大 10 秒分）
      g.dev.advance(30);
      for (let i = 0; i < 600 && !g.sim.player.grounded; i++) g.dev.advance(1);
      const ok = g.sim.player.grounded;
      if (at) {
        g.dev.teleport(at.x, at.z, at.yaw ?? 0, at.y);
        g.dev.advance(1);
      }
      g.dev.pause(paused);
      return ok;
    },
    { at: options.at, paused: options.paused ?? true },
  );
  expect(grounded, 'the player did not land after spawning').toBe(true);
  expect(errors).toEqual([]);
  return errors;
}

/**
 * `read` の値が `ok` を満たすまで `chunk` ステップずつシミュレーションを進め、満たした値を返す（`expect.poll` のステップ基準版）。
 * `maxSteps` ステップ進めても満たさなければ失敗する。
 */
export async function stepUntil<T>(
  page: Page,
  read: () => Promise<T>,
  ok: (value: T) => boolean,
  { maxSteps = 600, chunk = 5 }: { maxSteps?: number; chunk?: number } = {},
): Promise<T> {
  let value = await read();
  for (let n = 0; !ok(value); n += chunk) {
    if (n >= maxSteps)
      throw new Error(`condition not met within ${maxSteps} steps: ${JSON.stringify(value)}`);
    await waitSteps(page, chunk);
    value = await read();
  }
  return value;
}

/**
 * 入力（前進の注入）だけで経由点を順に歩く。各経由点の `tol` m 以内で次へ向きを変える。
 * 4 ステップごとに向きを補正する。ページ内で `dev.advance` を同期実行する（実時間に依存しない）。
 * 時間切れはシミュレーション時間（`maxSeconds`）で判定する。
 */
export async function walkThrough(
  page: Page,
  waypoints: readonly (readonly [number, number])[],
  tol = 0.6,
  maxSeconds = 30,
) {
  const failure = await page.evaluate(
    ({ waypoints, tol, maxSeconds }) => {
      const g = window.__game;
      if (!g) throw new Error('game is not ready');
      const was = g.paused;
      g.dev.pause(true);
      g.dev.input.move(0, 1);
      try {
        for (const [wx, wz] of waypoints) {
          const deadline = g.steps + maxSeconds * 60;
          for (;;) {
            const s = g.sim;
            const p = s.player;
            const dx = wx - p.position.x;
            const dz = wz - p.position.z;
            if (Math.hypot(dx, dz) < tol) break;
            if (g.steps >= deadline)
              return `timed out before (${wx}, ${wz}) at ${JSON.stringify(p.position)}`;
            const want = Math.atan2(dx, dz);
            const diff = Math.atan2(Math.sin(want - s.camera.yaw), Math.cos(want - s.camera.yaw));
            if (Math.abs(diff) > 0.04) g.dev.view(want - p.yaw, 4.2, 15);
            g.dev.advance(4);
          }
        }
        return null;
      } finally {
        g.dev.input.move(0, 0);
        g.dev.pause(was);
      }
    },
    { waypoints, tol, maxSeconds },
  );
  expect(failure).toBeNull();
}
