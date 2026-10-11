import { Mesh, MeshBasicNodeMaterial, OctahedronGeometry } from 'three/webgpu';
import { itemsOf } from '../../game/item/item';
import { registerViewPlugin } from '../viewPlugins';

/** 置かれたアイテムの目印の高さ（地面から、m）と上下の揺れ。 */
const HOVER = 0.55;
const BOB = 0.07;
/** この距離（m）より遠いプレイヤーからは描かない。 */
const FAR = 60;

// 取得アイテムの目印（#67）: 淡く光る小さな菱形 1 つ。ゆっくり回って上下に揺れる。
// コスト: メッシュ 1 つ・不透明の MeshBasic（実ライト・半透明・パーティクルなし）。取得済み（未配置）は隠す。
registerViewPlugin('item', ({ game, view, level }) => {
  if (!level) return {};
  const items = itemsOf(game);
  const spawns = level.data.interactables.filter((i) => i.kind === 'item');
  if (spawns.length === 0) return {};
  const geometry = new OctahedronGeometry(0.18, 0).scale(1, 1.5, 1);
  const material = new MeshBasicNodeMaterial({ color: 0xffe9a8 });
  const marks = spawns.map((spawn) => {
    const mesh = new Mesh(geometry, material);
    mesh.name = `item:${spawn.id}`;
    const base = level.heightAt(spawn.x, spawn.z) + HOVER;
    mesh.position.set(spawn.x, base, spawn.z);
    view.scene.add(mesh);
    return { spawn, mesh, base };
  });
  let time = 0;
  return {
    update: (dt) => {
      time += dt;
      const placed = new Set(items.ids);
      const { x, z } = game.player.feet;
      for (const { spawn, mesh, base } of marks) {
        mesh.visible = placed.has(spawn.id) && Math.hypot(spawn.x - x, spawn.z - z) < FAR;
        if (!mesh.visible) continue;
        mesh.rotation.y = time * 1.2;
        mesh.position.y = base + Math.sin(time * 2) * BOB;
      }
    },
  };
});
