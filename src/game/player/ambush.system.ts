import type { Enemy } from '../enemy/enemy';
import { AMBUSH } from '../data';
import { registerGameSystem } from '../systems';
import {
  inAmbushRange,
  isAmbushableState,
  type AmbushCandidate,
  type AmbushSource,
} from './ambush';

/**
 * 致命の一撃（仕様書 14.3.2 節）を Game に接続する。
 * - `Player.ambushSource` に、対象の探索（Idle / Suspicious の敵・ボスを除く・背面 ±60°・1.6m・高低差 1.0m）と
 *   拘束（`Enemy.restrained`）を差す。条件の評価は `Player` が軽攻撃入力の F1 に行う。
 * - 命中したら拘束を解く（盾持ちは強靭度崩しで崩れ、亡者兵は倒れる。以降は通常の被弾処理）。命中音は低い刺突音の cue
 *   を出す（`sfx.ambush-hit`。戦闘音として 8m の敵に聞こえるのは、通常の命中と同じ経路 = `hit` イベント）。
 * - 空振り・被弾での中断は `Player` が `end` を呼んで拘束を解く。
 */
registerGameSystem('ambush', (game) => {
  const enemyOf = (id: string): Enemy | undefined => game.enemies.enemies.find((e) => e.id === id);
  const source: AmbushSource = {
    find(feet) {
      let best: Enemy | null = null;
      let bestDistance = Infinity;
      for (const enemy of game.enemies.enemies) {
        if (!enemy.alive || enemy.restrained || game.bossIds.has(enemy.id)) continue;
        if (!isAmbushableState(enemy.state)) continue;
        if (!inAmbushRange(feet, enemy.position, enemy.yaw)) continue;
        const d = Math.hypot(feet.x - enemy.position.x, feet.z - enemy.position.z);
        if (d < bestDistance) {
          bestDistance = d;
          best = enemy;
        }
      }
      return best;
    },
    begin(target: AmbushCandidate) {
      const enemy = enemyOf(target.id);
      if (enemy) enemy.restrained = true;
    },
    end(target: AmbushCandidate) {
      const enemy = enemyOf(target.id);
      if (enemy) enemy.restrained = false;
    },
  };
  game.player.ambushSource = source;
  return {
    onImpact(e) {
      if (e.attackerId !== 'player' || e.attackId !== 'backstab') return;
      const enemy = enemyOf(e.targetId);
      if (enemy) enemy.restrained = false;
      game.events.emit('sound', {
        cue: AMBUSH.hitCue,
        source: 'player',
        position: { x: e.position.x, y: e.position.y, z: e.position.z },
      });
    },
  };
});
