import { Color, Mesh, MeshBasicNodeMaterial, OctahedronGeometry, Vector3 } from 'three/webgpu';
import { itemsOf } from '../../game/item/item';
import { registerViewPlugin } from '../viewPlugins';

/** 置かれたアイテムの目印の高さ（地面から、m）と上下の揺れ。 */
const HOVER = 0.6;
const BOB = 0.08;
/** この距離（m）より遠いプレイヤーからは描かない。光の粒は `MOTE_NEAR` より近いときだけ。 */
const FAR = 60;
const MOTE_NEAR = 25;
/** 光の粒（既存の回復の粒のバースト）を出す間隔（秒）。 */
const MOTE_INTERVAL = 1.5;
/** 発光色。1 を超える値でブルームに拾わせる（半透明・ライトは使わない）。 */
const GLOW = new Color(0xffd27a).multiplyScalar(3.2);

// 取得アイテムの目印（#67）: 強く発光する小さな菱形 1 つ（ゆっくり回り、上下に揺れる）と、
// そこから立ち上る淡い光の粒（既存の `ParticleSystem.healGlow` を一定間隔で少量）。
// コスト: メッシュ 1 つ・MeshBasic。新しい半透明マテリアル・実ライトなし。取得済み（未配置）は隠す。
registerViewPlugin('item', ({ game, view, level }) => {
  if (!level) return {};
  const items = itemsOf(game);
  const spawns = level.data.interactables.filter((i) => i.kind === 'item');
  if (spawns.length === 0) return {};
  const geometry = new OctahedronGeometry(0.24, 0).scale(1, 1.5, 1);
  const material = new MeshBasicNodeMaterial({ color: GLOW });
  const feet = new Vector3();
  const marks = spawns.map((spawn) => {
    const mesh = new Mesh(geometry, material);
    mesh.name = `item:${spawn.id}`;
    const ground = level.heightAt(spawn.x, spawn.z);
    mesh.position.set(spawn.x, ground + HOVER, spawn.z);
    view.scene.add(mesh);
    return { spawn, mesh, ground };
  });
  let time = 0;
  let nextMote = 0;
  return {
    update: (dt) => {
      time += dt;
      const placed = new Set(items.ids);
      const { x, z } = game.player.feet;
      const emit = time >= nextMote;
      if (emit) nextMote = time + MOTE_INTERVAL;
      for (const { spawn, mesh, ground } of marks) {
        const dist = Math.hypot(spawn.x - x, spawn.z - z);
        mesh.visible = placed.has(spawn.id) && dist < FAR;
        if (!mesh.visible) continue;
        mesh.rotation.y = time * 1.2;
        mesh.position.y = ground + HOVER + Math.sin(time * 2) * BOB;
        if (emit && dist < MOTE_NEAR) {
          feet.set(spawn.x, ground + 0.1, spawn.z);
          view.particles.healGlow(feet, 0.18, 1.1);
        }
      }
    },
  };
});
