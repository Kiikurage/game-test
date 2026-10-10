import { registerDevHooks } from '../../devHooks';
import { interactionOf } from '../interaction/interaction';
import { fogGateOf } from './fogGate.system';
import type { FogGateState } from './fogGate';

declare module '../../devHooks' {
  interface DevHooks {
    /** 霧の門の状態（E2E・撮影用）。霧の門がないレベルでは null。 */
    fogGate(): {
      state: FogGateState;
      blocked: boolean;
      entryProgress: number;
      veil: number;
      entered: number;
      prompt: string | null;
      playerState: string;
      player: { x: number; z: number };
    } | null;
    /** 封鎖 / 解除 / 入場演出の開始（ボス側の呼び出しの代わり。確認・撮影用）。 */
    fogGateControl(action: 'seal' | 'unseal' | 'enter'): boolean;
  }
}

registerDevHooks('fogGate', ({ game }) => {
  const gate = fogGateOf(game);
  let entered = 0;
  gate?.onEntered(() => {
    entered++;
  });
  return {
    fogGate: () =>
      gate && {
        state: gate.state,
        blocked: gate.blocked,
        entryProgress: gate.entryProgress,
        veil: gate.veil,
        entered,
        prompt: interactionOf(game).prompt?.id === gate.id ? '霧へ入る' : null,
        playerState: game.player.state,
        player: { x: game.player.feet.x, z: game.player.feet.z },
      },
    fogGateControl: (action) => {
      if (!gate) return false;
      return action === 'seal' ? gate.seal() : action === 'unseal' ? gate.unseal() : gate.enter();
    },
  };
});
