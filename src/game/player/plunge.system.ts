import { PLUNGE } from '../data';
import { cameraEffectsOf } from '../camera/cameraEffects.system';
import { deathOf } from '../death/death.system';
import { registerGameSystem } from '../systems';

/** 落下攻撃の着地衝撃の SE の cue（素材は E7-3 で接続。未登録の cue は無音で捨てられる）。 */
export const PLUNGE_LAND_CUE = 'sfx.plunge-land';

/**
 * 落下攻撃（Drop Strike。仕様書 14.3.3 節）の Game への接続。状態遷移は `Player`、判定は `PlayerAttackDriver`。
 * - 「下に敵がいるか」（水路の床板などで下に敵がいないときは落下攻撃を出さない）を `Player.plungeTargetNear` に差し込む。
 *   対象は生きている雑魚とテストシーンのダミー。ボスは対象外（闘技場に段差がない）。
 * - 未発見（Idle / Suspicious）の敵への倍率 ×1.5 を `PlayerAttackDriver.isUnaware` に差し込む。
 * - 着地（`attackStart` の `plunge`）で、砂塵（`plungeLand` イベント → 描画）・SE・カメラ振動 0.3° を出す。
 *   命中時のヒットストップ 10F・Alert・周囲 8m への通知は標準の命中処理（`Game` の `combat.onHit`）が行う。
 */
registerGameSystem('plunge', (game) => {
  const { player } = game;
  player.plungeTargetNear = (x, z, radius) => {
    const below = player.feet.y - 0.3;
    const near = (t: { position: { x: number; y: number; z: number }; alive: boolean }): boolean =>
      t.alive && t.position.y < below && Math.hypot(t.position.x - x, t.position.z - z) <= radius;
    return game.enemies.enemies.some(near) || game.dummies.some(near);
  };
  game.attackDriver.isUnaware = (targetId) => {
    const enemy = game.enemies.enemies.find((e) => e.id === targetId);
    return enemy !== undefined && (enemy.state === 'idle' || enemy.state === 'suspicious');
  };
  return {
    update() {
      for (const e of player.events) {
        if (e.type !== 'attackStart' || e.id !== 'plunge') continue;
        const f = player.feet;
        const position = { x: f.x, y: f.y, z: f.z };
        game.events.emit('plungeLand', { position, radius: PLUNGE.radius });
        game.events.emit('sound', { cue: PLUNGE_LAND_CUE, source: 'player', position });
        if (!deathOf(game).active) cameraEffectsOf(game).plungeLand();
      }
    },
  };
});
