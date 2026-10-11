import type { GameEventBus } from '../core/gameEvents';
import type { AudioEngine } from './audioEngine';
import type { BgmController } from './bgmController';
import { framesToSeconds } from './volume';

/** 撃破の短い 1 曲（20s・非ループ）を流し始める節目（撃破テキストの表示）。 */
export const VICTORY_TRACK = 'bgm.victory';
export const VICTORY_FADE_IN_FRAMES = 60;
/** 台座の篝火が灯ったら撃破曲をフェードアウトし、エリアの曲があればそちらへ戻す（無ければ無音）。 */
export const VICTORY_FADE_OUT_FRAMES = 180;

/** エリア（フィールド）の曲。マニフェストにあれば `bgm.area` の戻り先として流し、無ければ停止する。 */
export const FIELD_TRACK = 'bgm.field';
/** フィールド曲のフェードイン / 前の曲のフェードアウトの最短（フレーム。ゆっくり入る）。 */
export const FIELD_FADE_FRAMES = 180;

/**
 * game の BGM 関連イベントを `BgmController` / bgm バスのダッキングへつなぐ。戻り値は購読解除。
 *
 * | イベント | 処理 |
 * | --- | --- |
 * | `bgmChange` boss | ボス BGM（フェーズ 1 ループ）を `frames` かけてフェードイン |
 * | `bgmChange` area | エリアの曲（`bgm.field`）へクロスフェード。マニフェストに無ければ `frames` かけて停止 |
 * | `bgmLayer` | 同期レイヤーを `frames`（360F = 6 秒）かけて重ねる |
 * | `bgmFadeOut` | `frames`（90F）かけてフェードアウト |
 * | `bgmDuck` | −x dB へダック（`db` が 0 で解除。`frames` かけて戻す） |
 * | `bossDefeatCue` text / bonfire | 撃破曲の開始 / 台座の篝火後はエリアの曲へ戻る（`bgm.field` が無ければ無音） |
 */
export function bindBgmEvents(
  bus: GameEventBus,
  bgm: Pick<BgmController, 'play' | 'stop' | 'addLayer'>,
  engine: Pick<AudioEngine, 'duckBgm' | 'releaseDuck'>,
  /** マニフェストに曲があるか（`SoundLibrary.get(id) !== undefined`）。 */
  hasTrack: (id: string) => boolean = () => false,
): () => void {
  let duckId: number | undefined;
  const toArea = (frames: number): void => {
    if (hasTrack(FIELD_TRACK)) {
      const f = Math.max(frames, FIELD_FADE_FRAMES);
      bgm.play(FIELD_TRACK, { fadeFrames: f, outFrames: f });
    } else {
      bgm.stop(frames);
    }
  };
  const offs = [
    bus.on('bgmChange', (e) => {
      if (e.track === 'bgm.area') toArea(e.frames);
      else bgm.play(e.track, { fadeFrames: e.frames });
    }),
    bus.on('bgmLayer', (e) => {
      bgm.addLayer(e.layer, e.frames);
    }),
    bus.on('bgmFadeOut', (e) => {
      bgm.stop(e.frames);
    }),
    bus.on('bgmDuck', (e) => {
      if (duckId !== undefined) {
        engine.releaseDuck(duckId, framesToSeconds(e.frames));
        duckId = undefined;
      }
      if (e.db < 0) duckId = engine.duckBgm({ db: e.db, fadeSeconds: framesToSeconds(e.frames) });
    }),
    bus.on('bossDefeatCue', (e) => {
      if (e.cue === 'text') {
        bgm.play(VICTORY_TRACK, { fadeFrames: VICTORY_FADE_IN_FRAMES, loop: false });
      } else if (e.cue === 'bonfire') {
        toArea(VICTORY_FADE_OUT_FRAMES);
      }
    }),
  ];
  return () => {
    for (const off of offs) off();
  };
}
