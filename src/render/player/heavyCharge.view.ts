import { Box3, Vector3, type Object3D } from 'three/webgpu';
import { HEAVY_CHARGE_FULL_CUE } from '../../game/player/heavyChargeCue.system';
import { registerViewPlugin } from '../viewPlugins';

/**
 * 強攻撃のフル溜め到達の閃き（#200）。刃の発光そのものは `PlayerView` が `heavyChargeGlow` で駆動し、
 * ここでは到達の瞬間（game の `sound` イベント = SE と同じ契機）に刃先から小さな火花を散らす。
 * パーティクルは既存のバーストレイヤ（`particles.chargeGlint`）を使い、追加の描画パスは無い。
 */
registerViewPlugin('heavy-charge', ({ game, view }) => {
  let pending = false;
  game.events.on('sound', (e) => {
    if (e.cue === HEAVY_CHARGE_FULL_CUE) pending = true;
  });
  const box = new Box3();
  const center = new Vector3();
  const hand = new Vector3();
  const tip = new Vector3();

  /** 剣の刃先のワールド座標（握り = 手のボーンから、剣の AABB の中心を通る向きへ 2 倍）。 */
  function swordTip(root: Object3D, out: Vector3): boolean {
    const sword = root.getObjectByName('attach:sword');
    if (!sword) return false;
    sword.parent?.getWorldPosition(hand);
    box.setFromObject(sword);
    if (box.isEmpty()) return false;
    box.getCenter(center);
    out.copy(center).sub(hand).multiplyScalar(2).add(hand);
    return true;
  }

  return {
    update() {
      if (!pending) return;
      pending = false;
      const root = view.shadowFocusTarget;
      if (!root || !root.visible) return;
      root.updateWorldMatrix(true, true);
      if (swordTip(root, tip)) view.particles.chargeGlint(tip);
    },
  };
});
