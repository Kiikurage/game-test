import type { Mesh } from 'three/webgpu';
import type { GameView } from '../gameView';
import { registerViewPlugin } from '../viewPlugins';
import { buildCrypt, type CryptProps } from './buildCrypt';

/**
 * 地下墓所（D）・中庭（E）・鉄門 G1 の環境（石積みの壁・柱・噴水・石棺・たいまつ・蜘蛛の巣・門とレバー）。
 * グレーボックスの代わりに描く（`LevelView` は `cryptLayout.isMasonryProp` の id を描かない）。
 * 動かせるパーツ（石棺の蓋・鉄門の扉・レバー）は `cryptPropsOf(view)` で取る。
 */
const propsByView = new WeakMap<GameView, CryptProps>();

/** 石棺の蓋・鉄門の扉・レバーのピボットを返す（レベルを描いていないときは undefined）。 */
export function cryptPropsOf(view: GameView): CryptProps | undefined {
  return propsByView.get(view);
}

/** 球の表面からこの距離（m）より遠いメッシュは描かない（遠景の A〜C の視点でドローコール・三角形を食わない）。 */
const CULL_DISTANCE = 42;

registerViewPlugin('crypt', ({ game, view, level, gameRenderer }) => {
  if (!level) return {};
  const { level: quality } = gameRenderer.quality.preset;
  const detail = quality === 'low' ? 0 : quality === 'medium' ? 1 : 2;
  const crypt = buildCrypt(level, detail);
  view.scene.add(crypt.root);
  propsByView.set(view, crypt);
  const meshes: { mesh: Mesh; x: number; z: number; r: number }[] = [];
  crypt.root.traverse((o) => {
    const mesh = o as Mesh;
    // ピボットで動く可動パーツ（extras 配下）は対象外（小さく、位置が動く）
    if ((mesh as { isMesh?: boolean }).isMesh !== true || !mesh.name.startsWith('env:crypt'))
      return;
    if (mesh.parent !== crypt.root) return;
    const sphere = mesh.geometry.boundingSphere;
    if (sphere) meshes.push({ mesh, x: sphere.center.x, z: sphere.center.z, r: sphere.radius });
  });
  return {
    update: () => {
      const { x, z } = game.player.feet;
      for (const m of meshes) m.mesh.visible = Math.hypot(m.x - x, m.z - z) - m.r < CULL_DISTANCE;
    },
  };
});
