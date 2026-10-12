import { cryptPropsOf } from '../masonry/crypt.view';
import { registerViewPlugin } from '../viewPlugins';
import { shortcutSystem } from '../../game/shortcut/shortcut.system';

// ショートカット（#65）の描画: 鉄門 G1 の扉とレバーの持ち手を、ゲームの状態（進み具合）に合わせて動かす。
// メッシュは `masonry/crypt.view.ts` が作る。ここはピボットを回すだけ（追加の描画コストなし）。
registerViewPlugin('shortcut', ({ game, view }) => {
  const shortcut = game.systems.get(shortcutSystem);
  if (!shortcut) return {};
  let lastGate = -1;
  let lastLever = -1;
  return {
    update: () => {
      const props = cryptPropsOf(view);
      if (!props) return;
      const gate = shortcut.gateProgress;
      if (gate !== lastGate) {
        lastGate = gate;
        for (const leaf of props.gateLeaves) {
          leaf.pivot.rotation.y = leaf.closedRotationY + leaf.openDelta * 0.95 * gate;
        }
      }
      const lever = shortcut.leverProgress;
      if (lever !== lastLever && props.leverHandle) {
        lastLever = lever;
        const { pivot, closedRotationZ, openRotationZ } = props.leverHandle;
        pivot.rotation.z = closedRotationZ + (openRotationZ - closedRotationZ) * lever;
      }
    },
  };
});
