import { Vector3 } from 'three/webgpu';
import { registerViewPlugin } from '../viewPlugins';

/**
 * 落下攻撃の着地の砂塵（仕様書 14.3.3 節）。判定の円の縁に沿って既存のヒット用バースト（砂塵・火花）を散らす。
 * 実ライト・半透明の新規レイヤーは足さない（既存パーティクルの流用）。
 */
registerViewPlugin('plunge-land', ({ game, view }) => {
  const position = new Vector3();
  const normal = new Vector3();
  game.events.on('plungeLand', (e) => {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = e.radius * 0.6;
      position.set(
        e.position.x + Math.sin(a) * r,
        e.position.y + 0.1,
        e.position.z + Math.cos(a) * r,
      );
      normal.set(Math.sin(a), 0.5, Math.cos(a)).normalize();
      view.particles.hit(position, normal, 1.0);
    }
  });
  return {};
});
