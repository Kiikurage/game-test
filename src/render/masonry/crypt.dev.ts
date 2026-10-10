import { registerDevHooks } from '../../devHooks';
import { cryptPropsOf } from './crypt.view';

declare module '../../devHooks' {
  interface DevHooks {
    /** 地下墓所・中庭の環境メッシュの統計と、可動パーツの有無（E2E・撮影用）。 */
    cryptInfo(): {
      triangles: number;
      meshes: number;
      lid: boolean;
      gateLeaves: number;
      lever: boolean;
    } | null;
    /**
     * 可動パーツを 0（閉）〜 1（開）で動かす（撮影・確認用。ゲームの状態は変えない）。
     * `lid` は蓋を横へずらして持ち上げる、`gate` は扉を北へ開く、`lever` は持ち手を倒す。
     */
    poseCrypt(pose: { lid?: number; gate?: number; lever?: number }): void;
  }
}

registerDevHooks('crypt', ({ view }) => ({
  cryptInfo: () => {
    const props = cryptPropsOf(view);
    if (!props) return null;
    return {
      ...props.stats,
      lid: props.sarcophagusLid !== null,
      gateLeaves: props.gateLeaves.length,
      lever: props.leverHandle !== null,
    };
  },
  poseCrypt: ({ lid, gate, lever }) => {
    const props = cryptPropsOf(view);
    if (!props) return;
    if (lid !== undefined && props.sarcophagusLid) {
      const { pivot, closed } = props.sarcophagusLid;
      pivot.position.set(closed.x + 0.55 * lid, closed.y + 0.3 * lid, closed.z + 0.2 * lid);
      pivot.rotation.y = closed.rotationY + 0.5 * lid;
    }
    if (gate !== undefined) {
      for (const leaf of props.gateLeaves) {
        leaf.pivot.rotation.y = leaf.closedRotationY + leaf.openDelta * 0.95 * gate;
      }
    }
    if (lever !== undefined && props.leverHandle) {
      const { pivot, closedRotationZ, openRotationZ } = props.leverHandle;
      pivot.rotation.z = closedRotationZ + (openRotationZ - closedRotationZ) * lever;
    }
  },
}));
