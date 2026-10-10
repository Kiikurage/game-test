import { registerDevHooks } from '../../devHooks';
import type { TelegraphKind } from '../../game/data';
import { setTelegraphPreview } from './weaponTelegraph';

declare module '../../devHooks' {
  interface DevHooks {
    /** 攻撃中の敵の武器の発光を種別のピークに固定する（撮影用）。null で解除。 */
    telegraphPreview(kind: TelegraphKind | null): void;
  }
}

registerDevHooks('weapon-telegraph', () => ({
  telegraphPreview: (kind) => {
    setTelegraphPreview(kind);
  },
}));
