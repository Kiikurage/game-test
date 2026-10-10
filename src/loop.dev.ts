import { registerDevHooks } from './devHooks';

declare module './devHooks' {
  interface DevHooks {
    /** シミュレーションの一時停止（撮影用）。 */
    pause(paused: boolean): void;
    /** シミュレーションを指定ステップ（60Hz）だけ進める（撮影・E2E 用。`pause(true)` と併用する）。 */
    advance(steps: number): void;
  }
}

registerDevHooks('loop', ({ game, input, setPaused }) => ({
  pause: (p) => {
    setPaused(p);
  },
  advance: (steps) => {
    for (let i = 0; i < steps; i++) {
      input.step(1 / 60); // ループと同じく、入力スナップショットを確定してから game が読む
      game.update(1 / 60);
    }
  },
}));
