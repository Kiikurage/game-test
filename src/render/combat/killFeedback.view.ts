import { Vector3 } from 'three/webgpu';
import { KILL_FEEDBACK } from '../../game/data/killFeedback';
import type { Enemy } from '../../game/enemy/enemy';
import { registerViewPlugin } from '../viewPlugins';

/**
 * 雑魚敵の撃破のパーティクル（#281）。トドメの命中（F0）で命中点から放射状の灰と熾火（`ParticleSystem.killBurst`）、
 * ディゾルブの開始で体から灰が剥がれて舞い上がる（`deathAsh`）。体の閃光・眼の消灯・燃え尽き・ディゾルブは `EnemyViews`。
 * ボスは撃破演出（8.4 節、`render/boss/bossDefeatFx.ts`）に任せる。
 */
registerViewPlugin('enemy-kill-feedback', ({ game, view }) => {
  const position = new Vector3();
  const normal = new Vector3();
  const feet = new Vector3();
  const pending: Enemy[] = [];
  const enemyOf = (id: string): Enemy | undefined =>
    game.bossIds.has(id) ? undefined : game.enemies.enemies.find((e) => e.id === id);

  game.events.on('hitStop', (e) => {
    if (!e.killed || !e.fromPlayer) return;
    const enemy = enemyOf(e.targetId);
    if (!enemy) return;
    position.set(e.position.x, e.position.y, e.position.z);
    normal.set(e.normal.x, e.normal.y, e.normal.z);
    view.particles.killBurst(position, normal, e.kind === 'heavy' ? 1.25 : 1);
    if (!pending.includes(enemy)) pending.push(enemy);
  });

  return {
    update() {
      for (let i = pending.length - 1; i >= 0; i--) {
        const enemy = pending[i];
        if (!enemy) continue;
        if (enemy.alive) {
          pending.splice(i, 1);
          continue;
        }
        if (enemy.deadFrames >= KILL_FEEDBACK.dissolveStartFrames) {
          const p = enemy.position;
          view.particles.deathAsh(
            feet.set(p.x, p.y, p.z),
            0.45 * enemy.stats.bodyScale,
            1.1 * enemy.height,
          );
          pending.splice(i, 1);
        }
      }
    },
  };
});
