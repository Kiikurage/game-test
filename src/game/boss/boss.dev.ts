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
    /** ボスの HP を `amount` 減らす（確認・E2E 用。HP バーの残像・境界の発光の確認など。0 になれば撃破）。 */
    bossDamage(amount: number): void;
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
  if (new URLSearchParams(location.search).has('boss')) {
    spawn();
    // プレイヤーの死亡でボスは待機へ戻る（`BossSystem`）。確認シーンは入場演出がないので、復活の時点で再び交戦させる
    game.events.on('death', (e) => {
      if (e.phase === 'respawn') bossSystemOf(game).boss?.engage();
    });
  }
  return {
    bossSpawn: spawn,
    bossRemove: () => {
      bossSystemOf(game).remove();
    },
    bossDebug: () => bossSystemOf(game).boss?.debugInfo ?? null,
    bossDamage: (amount) => {
      bossSystemOf(game).damage(amount);
    },
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
