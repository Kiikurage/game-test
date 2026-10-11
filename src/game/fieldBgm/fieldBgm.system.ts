// フィールドの静かな BGM（#255）。ゲーム開始（最初のステップ）・篝火での休憩・死亡からの復帰で
// `bgmChange: bgm.area` を出し、audio 層が `bgm.field` をゆっくりフェードインする（bgmEvents.ts）。
// ボス戦への切替は bossEntry.system、撃破後に戻すのは bgmEvents の `bossDefeatCue: bonfire` が受け持つ。
// 同じ曲が鳴っている間の再要求は BgmController が無視するので、他のシステムと重ねて出してもよい。
import { registerGameSystem } from '../systems';

/** フィールド曲のフェードイン（フレーム。5 秒）。 */
export const FIELD_BGM_FADE_FRAMES = 300;

registerGameSystem('fieldBgm', (game) => {
  const toField = (): void => {
    game.events.emit('bgmChange', { track: 'bgm.area', frames: FIELD_BGM_FADE_FRAMES });
  };
  game.events.on('rest', toField);
  let started = false;
  return {
    update() {
      if (started) return;
      started = true;
      toField();
    },
  };
});
