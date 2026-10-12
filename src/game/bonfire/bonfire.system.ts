import { registerGameSystem } from '../systems';
import { BonfireController } from './bonfire';

// 篝火（点火・休憩・リスポーン）。ロジックは bonfire.ts。篝火の登録はインタラクション基盤（interaction/）へ。
/** 篝火（`game.systems.get(bonfireSystem)`。死亡処理（#64）・ボス・HUD・描画が読む）。 */
export const bonfireSystem = registerGameSystem(
  'bonfire',
  (game) => {
    const bonfires = new BonfireController(game);
    return {
      state: bonfires,
      update: () => {
        bonfires.update();
      },
    };
  },
  // 従来の実行順を保つ（#314 で HUD の表示状態を game から出す前は、HUD の更新の後＝ここに並んでいた）
  { after: ['heavy-charge-cue'] },
);
