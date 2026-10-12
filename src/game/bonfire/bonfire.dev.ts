import { registerDevHooks } from '../../devHooks';
import { interactionSystem } from '../interaction/interaction.system';
import { bonfireSystem } from './bonfire.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** 篝火・インタラクションの状態（E2E・撮影用）。 */
    bonfire(): {
      ids: readonly string[];
      lit: readonly string[];
      prompt: { id: string; kind: string; label: string } | null;
      igniting: boolean;
      resting: boolean;
      playerState: string;
      hp: number;
      flasks: number;
      save: { bonfires: readonly string[] };
    };
    /** 篝火へリスポーンする（死亡処理の代わり。撮影・E2E 用）。 */
    respawnAtBonfire(id?: string): boolean;
  }
}

registerDevHooks('bonfire', ({ game }) => ({
  bonfire: () => {
    const b = game.systems.get(bonfireSystem);
    return {
      ids: b.ids,
      lit: b.ids.filter((id) => b.isLit(id)),
      prompt: game.systems.get(interactionSystem).prompt,
      igniting: b.isIgniting,
      resting: game.player.resting,
      playerState: game.player.state,
      hp: game.playerTarget.health.current,
      flasks: game.player.flask.count,
      save: { bonfires: game.save.get().bonfires },
    };
  },
  respawnAtBonfire: (id) =>
    id === undefined
      ? game.systems.get(bonfireSystem).respawn()
      : game.systems.get(bonfireSystem).respawn(id),
}));
