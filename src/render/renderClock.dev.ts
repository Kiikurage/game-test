import { registerDevHooks } from '../devHooks';
import { renderClock } from './renderClock';

const FRAME_MS = 1000 / 60;

declare module '../devHooks' {
  interface DevHooks {
    /**
     * 描画側の時間（パーティクル・揺らぎ・ミキサー）を止める（撮影用）。以降は `renderFrames` で進めた分だけ進み、
     * rAF の描画では進まない。`false` で実時間に戻す。
     */
    freezeRenderTime(frozen: boolean): void;
    /** 描画を `n` 枚、1/60 秒ずつ時間を進めながら同期的に描く（`freezeRenderTime(true)` と併用）。 */
    renderFrames(n: number): void;
  }
}

registerDevHooks('renderClock', ({ loop }) => ({
  freezeRenderTime: (frozen) => {
    if (frozen) renderClock.freeze();
    else renderClock.unfreeze();
  },
  renderFrames: (n) => {
    for (let i = 0; i < n; i++) {
      renderClock.tick(FRAME_MS);
      loop.step(0, { render: true });
    }
  },
}));
