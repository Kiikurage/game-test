import { registerGameSystem } from '../systems';
import type { EnemyStateId } from './enemyStates';

/** 気付きの前兆（小さなうめき声）の SE の cue。素材は E7-3c で接続する（未登録の cue は無音で捨てられる）。 */
export const SUSPICIOUS_GROAN_CUE = 'sfx.enemy-suspicious';

/**
 * 索敵の音まわり（仕様書 14.3.1 節）。
 * - 敵が Idle から Suspicious になった瞬間に、うめき声の SE（`sound` イベント）を出す。
 * - 回復瓶を飲む音（半径 3m）を敵に聞かせる。
 * 足音・戦闘音・着地音は `Game` が出す。鐘・壁の崩壊は `Game.emitSound`（#123 の `emitSound` Effect）から。
 */
registerGameSystem('detection', (game) => {
  const previous = new Map<string, EnemyStateId>();
  game.events.on('heal', (e) => {
    if (e.position) game.emitNoise(e.position, 'flask');
  });
  return {
    update() {
      for (const enemy of game.enemies.enemies) {
        const before = previous.get(enemy.id);
        previous.set(enemy.id, enemy.state);
        if (before !== 'idle' || enemy.state !== 'suspicious') continue;
        game.events.emit('sound', {
          cue: SUSPICIOUS_GROAN_CUE,
          source: 'enemy',
          position: { x: enemy.position.x, y: enemy.position.y, z: enemy.position.z },
        });
      }
    },
  };
});
