import { slamAt } from '../camera/cameraEffects.system';
import { registerGameSystem } from '../systems';
import { bossSystemOf } from './boss.system';
import { ashWaveStateOf } from './moves/ashWave.move';
import { spinStateOf } from './moves/spin.move';

/** 灰の波で斧が地面へ入る点（ボスの前方 m）と、衝撃の円の半径（m）。 */
export const ASH_SLAM_FORWARD = 2.6;
export const ASH_SLAM_RADIUS = 1.6;

/**
 * ボスの技 6・7（回転斬り・灰の波）の演出の発火。技の状態（`spinStateOf` / `ashWaveStateOf`）の立ち上がりを見て 1 回ずつ出す。
 *
 * - 回転斬り（技 6）: 各回転の判定が始まるステップに SE（`sfx.boss.axe-swing`）。
 * - 灰の波（技 7）: 斧が地面へ入るステップ（段 F51）に画面振動（`slamAt`）・`bossSlam`（描画の砂塵）・SE（`sfx.boss.slam`）。
 *   各本の棘が走り出すステップに SE（`sfx.boss.ash-wave`）。
 */
registerGameSystem('boss-moves-67', (game) => {
  let swings = 0;
  let slammed = false;
  let lines = 0;
  return {
    update() {
      const boss = bossSystemOf(game).boss;
      if (!boss) {
        swings = 0;
        slammed = false;
        lines = 0;
        return;
      }
      const at = { x: boss.position.x, y: boss.position.y, z: boss.position.z };

      const spin = spinStateOf(boss);
      if (!spin) swings = 0;
      else if (spin.swings > swings) {
        swings = spin.swings;
        game.events.emit('sound', { cue: 'sfx.boss.axe-swing', source: 'boss', position: at });
      }

      const ash = ashWaveStateOf(boss);
      if (!ash) {
        slammed = false;
        lines = 0;
        return;
      }
      if (ash.slammed && !slammed) {
        slammed = true;
        const position = {
          x: ash.origin.x + Math.sin(ash.yaw) * ASH_SLAM_FORWARD,
          y: ash.origin.y,
          z: ash.origin.z + Math.cos(ash.yaw) * ASH_SLAM_FORWARD,
        };
        slamAt(game, position);
        game.events.emit('bossSlam', { position, radius: ASH_SLAM_RADIUS });
        game.events.emit('sound', { cue: 'sfx.boss.slam', source: 'boss', position });
      }
      if (ash.linesStarted > lines) {
        lines = ash.linesStarted;
        game.events.emit('sound', { cue: 'sfx.boss.ash-wave', source: 'boss', position: at });
      }
    },
  };
});
