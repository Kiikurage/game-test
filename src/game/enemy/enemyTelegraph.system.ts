import { enemyAttackByAction, telegraphKindOf } from '../data';
import { registerGameSystem } from '../systems';

/** 予備動作の SE の cue。実際の音の素材は E7-3c で接続する（未登録の cue は無音で捨てられる）。 */
export const TELEGRAPH_CUE = {
  normal: 'sfx.enemy-telegraph',
  heavy: 'sfx.enemy-telegraph-heavy',
  unblockable: 'sfx.enemy-telegraph-heavy',
} as const;

/**
 * 敵の攻撃の予備動作が始まった瞬間（Attack 状態の F1 / 連続攻撃の 2 発目の頭）に、種別に応じた
 * 予備動作の SE を `sound` イベントで出す。描画の発光（`render/enemyView`）と同じ種別（`telegraphKindOf`）を使う。
 */
registerGameSystem('enemy-telegraph', (game) => {
  const lastFrame = new Map<string, number>();
  return {
    update() {
      for (const enemy of game.enemies.enemies) {
        const attacking = enemy.state === 'attack';
        const frame = enemy.fsm.stateFrame;
        const prev = lastFrame.get(enemy.id);
        if (!attacking) {
          lastFrame.delete(enemy.id);
          continue;
        }
        lastFrame.set(enemy.id, frame);
        // 状態に入った直後、または動作が最初から始まり直した（連続攻撃）ステップ
        if (prev !== undefined && frame >= prev) continue;
        const def = enemyAttackByAction(enemy.fsm.actionId);
        if (!def) continue;
        game.events.emit('sound', {
          cue: TELEGRAPH_CUE[telegraphKindOf(def)],
          source: 'enemy',
          position: { x: enemy.position.x, y: enemy.position.y, z: enemy.position.z },
        });
      }
    },
  };
});
