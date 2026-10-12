import { registerDevHooks } from './devHooks';

/** `dev.advance` のオプション。 */
export interface AdvanceOptions {
  /**
   * `steps` をステップ数ではなく、実時間 1/60 秒のフレーム数として扱う（rAF と同じく `timeScale` を掛ける。
   * 撃破スロー中は進むステップ数が減る）。既定 false。
   */
  readonly frames?: boolean;
  /** 進めた後に 1 回描画する（撮影用）。既定 false。 */
  readonly render?: boolean;
}

declare module './devHooks' {
  interface DevHooks {
    /**
     * 開始画面を経ずにゲームを開始する（開始画面のクリックと同じ開始。Pointer Lock を取らない）。
     * 以降の入力は dev モード（ロックなしのクリックも攻撃・押下時間はシミュレーション時刻）。
     * 開始画面（`#app[data-state=ready]`）が出てから呼ぶ。
     * `paused: true` なら一時停止のまま開始する（`pause(false)` で再開。撮影で、開始直後に実時間でステップが進まないようにする）。
     */
    start(options?: { paused?: boolean }): Promise<void>;
    /** シミュレーションの一時停止（撮影用）。状態は `window.__game.paused` で読める。 */
    pause(paused: boolean): void;
    /**
     * シミュレーションを進める（撮影・E2E 用。`pause(true)` と併用する）。メインループと同じ経路
     * （入力の確定 → `Game.update`、`steps` の加算。ヒットストップは Game 内で効く）を通る。
     */
    advance(steps: number, options?: AdvanceOptions): void;
  }
}

registerDevHooks('loop', ({ loop, start }) => ({
  start,
  pause: (p) => {
    loop.paused = p;
  },
  advance: (steps, options = {}) => {
    if (options.frames) {
      for (let i = 0; i < steps; i++) loop.frame(1 / 60, { render: false });
      if (options.render) loop.step(0, { render: true });
    } else {
      loop.step(steps, { render: options.render ?? false });
    }
  },
}));
