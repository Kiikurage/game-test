import { Vector3 } from 'three/webgpu';
import { bossSystemOf } from '../../game/boss/boss.system';
import {
  LEAP_AIR_FRAMES,
  LEAP_CROUCH_FRAMES,
  LEAP_RADIUS,
  leapStateOf,
  leapTelegraphVisible,
} from '../../game/boss/moves/leap.move';
import type { Telegraph } from '../telegraph';
import { registerViewPlugin } from '../viewPlugins';

/**
 * 跳躍叩きつけ（技 5）の描画: 着地予告の円（E5-0 の `GroundTelegraphs`。赤橙の円 + 点滅）と、滞空中の影の円、
 * 着地の衝撃のパーティクル。ゲーム側の状態（`leapStateOf`）を毎フレーム読むだけで、状態は持たない。
 *
 * - 円は発生 F18（`leapTelegraphVisible`）から着地まで。着地点が固定されるまでは対象に追従して置き直す。
 * - 影の円は滞空に入ってから（progress 0 → 1 で着地が近いほど濃く締まる）。
 * - 着地（`bossSlam`）: 円の縁に沿って砂塵・火花を散らす。柱の破片は `bossPillarHit`（#78）の購読側が担当する。
 */
registerViewPlugin('boss-leap', ({ game, view }) => {
  let ring: Telegraph | null = null;
  let shadow: Telegraph | null = null;
  const position = new Vector3();
  const normal = new Vector3();

  game.events.on('bossSlam', (e) => {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = e.radius * 0.7;
      position.set(
        e.position.x + Math.sin(a) * r,
        e.position.y + 0.15,
        e.position.z + Math.cos(a) * r,
      );
      normal.set(Math.sin(a), 0.7, Math.cos(a)).normalize();
      view.particles.hit(position, normal, 1.3);
    }
  });

  const release = (t: Telegraph | null): null => {
    if (t) view.telegraphs.release(t);
    return null;
  };

  return {
    update() {
      const boss = bossSystemOf(game).boss;
      const state = boss?.alive ? leapStateOf(boss) : undefined;
      const { x, z } = state?.landing ?? { x: 0, z: 0 };
      if (state && leapTelegraphVisible(state)) {
        if (!ring) {
          ring = view.telegraphs.circle(x, z, LEAP_RADIUS);
          ring.show();
        } else if (!state.locked) {
          ring.placeCircle(x, z, LEAP_RADIUS);
        }
        if (state.airborne) {
          if (!shadow) {
            shadow = view.telegraphs.shadowCircle(x, z, LEAP_RADIUS);
            shadow.show();
          } else if (!state.locked) {
            shadow.placeCircle(x, z, LEAP_RADIUS);
          }
          shadow.setProgress((state.frame - LEAP_CROUCH_FRAMES) / LEAP_AIR_FRAMES);
        }
        return;
      }
      ring = release(ring);
      shadow = release(shadow);
    },
  };
});
