import { slamAt } from '../camera/cameraEffects.system';
import { registerGameSystem } from '../systems';
import { bossSystemOf } from './boss.system';
import { LEAP_RADIUS, leapStateOf } from './moves/leap.move';
import { stagesOf, BOSS_MOVES } from './bossMove';

/**
 * ボスの技の「衝撃」の演出の発火（技 4・5）。
 *
 * - 跳躍叩きつけ（技 5）の着地: 画面振動（`slamAt`。仕様書 3.3 節の 1.2°・24F、距離で減衰）、`bossSlam` イベント
 *   （描画のパーティクル・破片）、SE（`sfx.boss.slam` グループ）を、判定が出るステップ（段 F73）に 1 回出す。
 * - 盾打ち（技 4）: 判定が出るステップ（段 F27）に SE（`sfx.boss.shield-bash`）。
 *
 * 技のフレームデータは `BOSS_MOVES`（本物の技）から読む。
 */
registerGameSystem('boss-impact', (game) => {
  let slammed = false;
  let bashed = false;
  return {
    update() {
      const boss = bossSystemOf(game).boss;
      if (!boss) {
        slammed = false;
        bashed = false;
        return;
      }
      const info = boss.debugInfo;

      const leap = leapStateOf(boss);
      if (!leap) slammed = false;
      else if (leap.landed && !slammed) {
        slammed = true;
        const position = { x: leap.landing.x, y: boss.position.y, z: leap.landing.z };
        slamAt(game, position);
        game.events.emit('bossSlam', { position, radius: LEAP_RADIUS });
        game.events.emit('sound', { cue: 'sfx.boss.slam', source: 'boss', position });
      }

      if (info.move === 'shieldBash' && info.stage === 1 && boss.state === 'attack') {
        const def = BOSS_MOVES.get('shieldBash');
        const stage = def ? stagesOf(def, boss.phase)[0] : undefined;
        if (stage && !bashed && info.stageFrame > stage.startup) {
          bashed = true;
          game.events.emit('sound', {
            cue: 'sfx.boss.shield-bash',
            source: 'boss',
            position: { x: boss.position.x, y: boss.position.y, z: boss.position.z },
          });
        }
      } else {
        bashed = false;
      }
    },
  };
});
