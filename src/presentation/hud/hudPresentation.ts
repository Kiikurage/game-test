// HUD（HP・スタミナ・瓶）・ボス HP バー・操作ヒント・取得通知の表示用状態。game の状態とイベントを読んで、
// 固定ステップの終わり（`stepEnd`）ごとに進める。描画（render/hud/*.view.ts → ui/hud/）と dev フックが読む。
// game はこの層を知らない（game は表示用の状態を持たない）。
import type { Action } from '../../core/input';
import type { Game } from '../../game/game';
import { isSeatedState } from '../../game/player/playerStates';
import { BossBarModel } from './bossBarModel';
import { GUIDE, HINTS, NOTICE } from './guideData';
import { HintModel } from './hintModel';
import { HudModel } from './hudModel';
import { NoticeModel } from './noticeModel';

export interface HudPresentation {
  readonly hud: HudModel;
  readonly bossBar: BossBarModel;
  readonly hints: HintModel;
  readonly notices: NoticeModel;
}

const WATCHED: readonly Action[] = ['dodge', 'lightAttack', 'lockOn'];

const byGame = new WeakMap<Game, HudPresentation>();

/**
 * `game` の表示用状態（`Game` ごとに 1 つ。初回の呼び出しで作り、以後のステップを購読する）。
 * イベント（ボス戦・拾得）を取りこぼさないよう、ステップを進める前（描画の組み立て時）に呼ぶ。
 */
export function hudPresentation(game: Game): HudPresentation {
  const existing = byGame.get(game);
  if (existing) return existing;
  const p = createHudPresentation(game);
  byGame.set(game, p);
  return p;
}

function createHudPresentation(game: Game): HudPresentation {
  const hud = new HudModel({
    hp: game.playerTarget.health,
    stamina: game.player.stamina,
    flask: game.player.flask,
  });
  const bossBar = new BossBarModel();
  bossBar.attach(game.events);
  const hints = new HintModel(HINTS, GUIDE.openingDelaySeconds);
  const notices = new NoticeModel();

  game.events.on('itemPicked', (e) => {
    notices.push(e.message, e.noticeSeconds);
  });
  game.events.on('shortcutOpened', () => {
    notices.push(NOTICE.shortcutOpened);
  });

  const pressed = new Set<Action>();
  game.events.on('stepEnd', ({ dt }) => {
    const { player } = game;
    // 戦闘 UI 以外（篝火の休憩中・死亡中）は HUD をフェードアウトする（9 章）
    hud.setVisible(!isSeatedState(player.state) && !player.dead);
    hud.step();
    bossBar.step();

    const snap = game.inputSnapshot;
    pressed.clear();
    for (const a of WATCHED) if (snap.buttons[a].pressed) pressed.add(a);
    const feet = player.feet;
    let enemyNear = false;
    for (const enemy of game.enemies.enemies) {
      if (!enemy.alive) continue;
      const pos = enemy.position;
      if (Math.hypot(pos.x - feet.x, pos.z - feet.z) <= GUIDE.enemyNearM) {
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
      suppressed: player.dead || player.resting,
    });
    notices.step(dt);
  });

  return { hud, bossBar, hints, notices };
}
