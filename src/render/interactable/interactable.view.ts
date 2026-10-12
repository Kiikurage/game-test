import { Vector3 } from 'three/webgpu';
import '../../game/interactable/worldEvents';
import { registerViewPlugin } from '../viewPlugins';

/** 崩壊の間、破片・粉塵を出す間隔（秒）。 */
const DEBRIS_INTERVAL = 0.08;
/** 祈りの間、灰を舞い上げる間隔（秒）。 */
const ASH_INTERVAL = 0.45;

// インタラクトの演出（#123）。新しいマテリアルは足さず、既存の `ParticleSystem` のプリセットだけを使う
// （性能危機中のため、実ライト・半透明・ポストエフェクトは追加しない）。
//  - 壊せる壁の崩壊（`wallCollapse`）: 60F の間、壁の面から破片と粉塵を断続的に出す。
//  - 祈り（`ambientDuck`）: 継続時間の間、プレイヤーの周りに灰を舞い上げる（風と灰の粒が増える）。
registerViewPlugin('interactableFx', ({ game, services }) => {
  const position = new Vector3();
  const normal = new Vector3();
  let collapse: { x: number; y: number; z: number; left: number; next: number } | null = null;
  let ash: { left: number; next: number; intensity: number } | null = null;

  game.events.on('wallCollapse', (e) => {
    collapse = { x: e.position.x, y: e.position.y, z: e.position.z, left: e.frames / 60, next: 0 };
  });
  game.events.on('ambientDuck', (e) => {
    ash = { left: e.frames / 60, next: 0, intensity: e.ashIntensity };
  });

  return {
    update: (dt) => {
      if (collapse) {
        collapse.left -= dt;
        collapse.next -= dt;
        if (collapse.next <= 0) {
          collapse.next = DEBRIS_INTERVAL;
          const k = collapse.left * 60; // 残りフレームで乱れを付ける（乱数を使わず決定的に）
          position.set(
            collapse.x + Math.sin(k * 1.7),
            collapse.y + 0.4 + (Math.sin(k * 0.9) * 0.5 + 0.5) * 1.8,
            collapse.z + Math.cos(k * 2.3),
          );
          normal.set(Math.sin(k), 0.5, Math.cos(k * 1.3)).normalize();
          services.fx.hit(position, normal, 1.6);
        }
        if (collapse.left <= 0) collapse = null;
      }
      if (ash) {
        ash.left -= dt;
        ash.next -= dt;
        if (ash.next <= 0) {
          ash.next = ASH_INTERVAL;
          const { feet } = game.player;
          position.set(feet.x, feet.y, feet.z);
          services.fx.deathAsh(position, 1.4, 2.4, 0.7 * ash.intensity);
        }
        if (ash.left <= 0) ash = null;
      }
    },
  };
});
