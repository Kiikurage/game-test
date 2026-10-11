import type { Action } from '../core/input';
import { registerDevHooks } from '../devHooks';

declare module '../devHooks' {
  interface DevHooks {
    /**
     * 入力注入（E2E 用。DOM イベント・Pointer Lock を経由しない）。注入した入力は次のシミュレーションステップで読まれる。
     * `dev.pause(true)` → 注入 → `dev.advance(n)` の順に使うと、実時間に依存せず決定的に進む。
     */
    input: {
      /** ボタンを押したままにする。 */
      press(action: Action): void;
      /** ボタンを離す。 */
      release(action: Action): void;
      /** 押して離す（次のステップで 1 回の押下。回避なら短押し = ロール）。 */
      tap(action: Action): void;
      /** 移動スティック（x: 右 +、y: 前 +。長さ 1 に丸める）。0, 0 で離す。 */
      move(x: number, y: number): void;
      /** カメラの回転量 [rad]（次のステップで 1 回だけ効く）。 */
      look(dx: number, dy: number): void;
      /** ロックオン中のターゲット切替（-1: 左 / 1: 右）。 */
      switchTarget(dir: -1 | 1): void;
      /** 注入中のボタン・移動をすべて離す。 */
      releaseAll(): void;
    };
  }
}

registerDevHooks('input', ({ input }) => ({
  input: {
    press: (a) => {
      input.injectButton(a, true);
    },
    release: (a) => {
      input.injectButton(a, false);
    },
    tap: (a) => {
      input.injectButton(a, true);
      input.injectButton(a, false);
    },
    move: (x, y) => {
      input.injectMove(x, y);
    },
    look: (dx, dy) => {
      input.injectLook(dx, dy);
    },
    switchTarget: (dir) => {
      input.injectTargetSwitch(dir);
    },
    releaseAll: () => {
      input.releaseInjected();
    },
  },
}));
