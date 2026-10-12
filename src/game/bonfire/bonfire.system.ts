import { hudSystem } from '../hud/hud.system';
import { isSeatedState } from '../player/playerStates';
import { registerGameSystem } from '../systems';
import { BonfireController } from './bonfire';

// 篝火（点火・休憩・リスポーン）。ロジックは bonfire.ts。篝火の登録はインタラクション基盤（interaction/）へ。
// 休憩中（座り込み・保持・立ち上がり。リスポーン含む）と死亡中（死亡演出 #64）は HUD をフェードアウトする（9 章）。
/** 篝火（`game.systems.get(bonfireSystem)`。死亡処理（#64）・ボス・HUD・描画が読む）。 */
export const bonfireSystem = registerGameSystem(
  'bonfire',
  (game) => {
    const bonfires = new BonfireController(game);
    return {
      state: bonfires,
      update: () => {
        bonfires.update();
        game.systems
          .get(hudSystem)
          .setVisible(!isSeatedState(game.player.state) && !game.player.dead);
      },
    };
  },
  // HUD の表示可否は、同じステップの HUD の更新（フェード）より前に決める
  { before: ['hud'] },
);
