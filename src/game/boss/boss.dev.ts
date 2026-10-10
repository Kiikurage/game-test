import { registerDevHooks } from '../../devHooks';
import type { BossDebugInfo } from './boss';
import type { BossPhase } from './bossData';
import { bossSystemOf } from './boss.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** ボスを出して戦闘を始める（確認・E2E 用。未実装の技はスタブで埋める）。省略時はプレイヤーの北 7m で南向き。 */
    bossSpawn(options?: {
      x?: number;
      z?: number;
      yaw?: number;
      seed?: string;
      engage?: boolean;
    }): void;
    /** ボスを取り除く。 */
    bossRemove(): void;
    /** ボスの状態（距離帯・選択重み・直前の技など）。いなければ null。 */
    bossDebug(): BossDebugInfo | null;
    /** ボスのフェーズを切り替える（確認用。移行の演出なしで即時。崩しは 1 回使えるように戻る）。 */
    bossPhase(phase: BossPhase): void;
  }
}

registerDevHooks('boss', ({ game }) => {
  const spawn: DevHooksSpawn = (options = {}) => {
    const p = game.player.feet;
    bossSystemOf(game).spawn({
      x: options.x ?? p.x,
      z: options.z ?? p.z - 7,
      yaw: options.yaw ?? 0,
      ...(options.seed !== undefined && { seed: options.seed }),
      ...(options.engage !== undefined && { engage: options.engage }),
    });
  };
  // `?boss` で起動すると、開始時にボスを出す（`?scene=test&boss` がボスの確認シーン）
  if (new URLSearchParams(location.search).has('boss')) spawn();
  return {
    bossSpawn: spawn,
    bossRemove: () => {
      bossSystemOf(game).remove();
    },
    bossDebug: () => bossSystemOf(game).boss?.debugInfo ?? null,
    bossPhase: (phase) => {
      bossSystemOf(game).boss?.setPhase(phase);
    },
  };
});

type DevHooksSpawn = (options?: {
  x?: number;
  z?: number;
  yaw?: number;
  seed?: string;
  engage?: boolean;
}) => void;
