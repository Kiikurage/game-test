import { Color } from 'three/webgpu';
import { registerViewPlugin } from '../viewPlugins';
import { localLightsOf } from './localLights';

/**
 * プレイヤーの照り返し（#322）。カメラ側（プレイヤーとカメラの間、胸より少し上）に置く弱い実点光源。
 * 地下水路・墓所の暗部でもプレイヤーの輪郭と外衣が読めるようにする。マテリアルへの自己発光（偽の補正）ではなく、
 * 周囲の壁・床も同じ光を受ける。屋外では太陽・環境光に埋もれて目立たない。
 */
const FILL = {
  color: new Color(1, 0.72, 0.48),
  intensity: 0.45,
  distance: 4.5,
  /** プレイヤーの足元からカメラ方向へ寄せる割合（0 = プレイヤー、1 = カメラ）。 */
  towardCamera: 0.3,
  height: 1.6,
} as const;

registerViewPlugin('player-fill-light', ({ game, view }) => {
  const light = localLightsOf(view.scene).add({
    position: [0, -1000, 0],
    color: FILL.color,
    intensity: FILL.intensity,
    distance: FILL.distance,
  });
  return {
    update: () => {
      const { x, y, z } = game.player.feet;
      const c = view.camera.position;
      const k = FILL.towardCamera;
      light.setPosition(x + (c.x - x) * k, y + FILL.height, z + (c.z - z) * k);
    },
  };
});
