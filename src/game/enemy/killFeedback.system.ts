import { KILL_FEEDBACK } from '../data/killFeedback';
import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import type { Enemy } from './enemy';

/** 撃破の命中で鳴らす SE（通常の命中 SE に重ねる、重く低い崩れ落ち）。 */
export const KILL_HIT_CUE = 'sfx.defeat-collapse';
/** ディゾルブ（灰化）の開始で鳴らす SE。 */
export const KILL_ASH_CUE = 'sfx.defeat-ash';

/**
 * 雑魚敵の撃破の SE（#281）。トドメの命中（F0）で `sfx.defeat-collapse`、
 * ディゾルブの開始（`KILL_FEEDBACK.dissolveStartFrames`）で `sfx.defeat-ash` を鳴らす。
 * 見た目（閃光・眼の消灯・燃え尽き・飛散・ディゾルブ）は render 側（`EnemyViews` / `killFeedback.view.ts`）が担当する。
 * ボス（`game.bossIds`）は撃破演出（8.4 節、`bossDefeat.system.ts`）に任せる。
 */
registerGameSystem('enemy-kill-feedback', (game: Game) => {
  const pending: Enemy[] = [];
  return {
    onImpact(e) {
      if (!e.killed || e.attackerId !== 'player' || game.bossIds.has(e.targetId)) return;
      const enemy = game.enemies.enemies.find((x) => x.id === e.targetId);
      if (!enemy) return;
      game.events.emit('sound', { cue: KILL_HIT_CUE, source: 'enemy', position: e.position });
      if (!pending.includes(enemy)) pending.push(enemy);
    },
    update() {
      for (let i = pending.length - 1; i >= 0; i--) {
        const enemy = pending[i];
        if (!enemy) continue;
        if (enemy.alive) {
          // 篝火の休憩で復活した
          pending.splice(i, 1);
          continue;
        }
        if (enemy.deadFrames >= KILL_FEEDBACK.dissolveStartFrames) {
          const p = enemy.position;
          game.events.emit('sound', {
            cue: KILL_ASH_CUE,
            source: 'enemy',
            position: { x: p.x, y: p.y, z: p.z },
          });
          pending.splice(i, 1);
        }
      }
    },
  };
});
