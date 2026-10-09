import { indexClipEvents, lookupClipEvents, parseClipEventTable } from './eventMarkers';
import playerClipsJson from './data/playerClips.json';

/** プレイヤー動作のイベントマーカー表（読み込み時に検証される）。 */
export const playerClipEvents = parseClipEventTable(playerClipsJson);

export const getPlayerClipEvents = indexClipEvents(playerClipEvents);

/** 動作 ID（`player.<状態 ID>`）から表を引く。なければ undefined。 */
export const findPlayerClipEvents = lookupClipEvents(playerClipEvents);
