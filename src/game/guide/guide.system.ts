// 操作ヒント（HintModel）と取得・開通通知（NoticeModel）を更新する。表示は render/hud/guide.view.ts → ui/hud/guide.ts。
import type { Action } from '../../core/input';
import { GUIDE, HINTS, NOTICE } from '../data/guide';
import { registerGameSystem } from '../systems';
import { HintModel } from './hintModel';
import { NoticeModel } from './noticeModel';

export interface GuideState {
  readonly hints: HintModel;
  readonly notices: NoticeModel;
}

const WATCHED: readonly Action[] = ['dodge', 'lightAttack', 'lockOn'];

/** 操作ヒント・通知の状態（`game.systems.get(guideSystem)`。描画側が読む）。 */
export const guideSystem = registerGameSystem(
  'guide',
  (game) => {
    const hints = new HintModel(HINTS, GUIDE.openingDelaySeconds);
    const notices = new NoticeModel();
    const state: GuideState = { hints, notices };

    game.events.on('itemPicked', (e) => {
      notices.push(e.message, e.noticeSeconds);
    });
    game.events.on('shortcutOpened', () => {
      notices.push(NOTICE.shortcutOpened);
    });

    const pressed = new Set<Action>();
    return {
      state,
      update: (dt) => {
        const snap = game.inputSnapshot;
        pressed.clear();
        for (const a of WATCHED) if (snap.buttons[a].pressed) pressed.add(a);
        const feet = game.player.feet;
        let enemyNear = false;
        for (const enemy of game.enemies.enemies) {
          if (!enemy.alive) continue;
          const p = enemy.position;
          if (Math.hypot(p.x - feet.x, p.z - feet.z) <= GUIDE.enemyNearM) {
            enemyNear = true;
            break;
          }
        }
        hints.step({
          dt,
          moveMagnitude: Math.hypot(snap.move.x, snap.move.y),
          lookMagnitude: Math.hypot(snap.look.x, snap.look.y),
          pressed,
          lockedOn: game.lockOn.target !== null,
          enemyNear,
          suppressed: game.player.dead || game.player.resting,
        });
        notices.step(dt);
      },
    };
  },
  // 死亡処理・篝火の休憩が同じステップで立てた状態（dead / resting）でヒントを抑える
  { after: ['death', 'bonfire'] },
);
