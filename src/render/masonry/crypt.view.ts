import { Color, type Mesh } from 'three/webgpu';
import type { GameView } from '../gameView';
import { loadBakedScene, worldSphereOf } from '../levelMeshes/bakedScene';
import { registerViewPlugin } from '../viewPlugins';
import { assembleCrypt, type CryptProps } from './buildCrypt';

/** たいまつの光（実ライト）。`torchLights` の強さの目安（1.7〜2.5）にこの光度（cd）を掛ける。 */
const TORCH_CANDELA_PER_UNIT = 4;
/** リニアの色。 */
const TORCH_LIGHT_COLOR = new Color(1, 0.5, 0.17);
const TORCH_LIGHT_DISTANCE = 9;

/**
 * 地下墓所（D）・中庭（E）・鉄門 G1 の環境（石積みの壁・柱・噴水・石棺・たいまつ・蜘蛛の巣・門とレバー）。
 * グレーボックスの代わりに描く（`LevelView` は `cryptLayout.isMasonryProp` の id を描かない）。
 * 形状はベイク済みの glb（`level_crypt`。`buildCryptScene` から生成、#329）。
 * 動かせるパーツ（石棺の蓋・鉄門の扉・レバー）は `cryptPropsOf(view)` で取る（読み込み後）。
 */
const propsByView = new WeakMap<GameView, CryptProps>();

/** 石棺の蓋・鉄門の扉・レバーのピボットを返す（レベルを描いていない・読み込み前は undefined）。 */
export function cryptPropsOf(view: GameView): CryptProps | undefined {
  return propsByView.get(view);
}

/** 球の表面からこの距離（m）より遠いメッシュは描かない（遠景の A〜C の視点でドローコール・三角形を食わない）。 */
const CULL_DISTANCE = 42;

registerViewPlugin('crypt', ({ game, view, level, gameRenderer, services }) => {
  if (!level) return {};
  const meshes: { mesh: Mesh; x: number; z: number; r: number }[] = [];
  return {
    load: async () => {
      const scene = await loadBakedScene('level_crypt');
      const crypt = assembleCrypt(scene, gameRenderer.quality.preset.materialDetail);
      view.scene.add(crypt.root);
      propsByView.set(view, crypt);
      for (const [x, y, z, strength, phase] of crypt.torchLights) {
        services.lights.add({
          position: [x, y, z],
          color: TORCH_LIGHT_COLOR,
          intensity: strength * TORCH_CANDELA_PER_UNIT,
          distance: TORCH_LIGHT_DISTANCE,
          flickerPhase: phase,
        });
      }
      for (const o of crypt.root.children) {
        const mesh = o as Mesh;
        // ピボットで動く可動パーツ（extras 配下）は対象外（小さく、位置が動く）
        if ((o as { isMesh?: boolean }).isMesh !== true || !mesh.name.startsWith('env:crypt'))
          continue;
        const sphere = worldSphereOf(mesh);
        meshes.push({ mesh, x: sphere.center.x, z: sphere.center.z, r: sphere.radius });
      }
    },
    update: () => {
      const { x, z } = game.player.feet;
      for (const m of meshes) m.mesh.visible = Math.hypot(m.x - x, m.z - z) - m.r < CULL_DISTANCE;
    },
  };
});
