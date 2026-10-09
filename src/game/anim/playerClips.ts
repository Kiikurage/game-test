import { indexClipEvents, parseClipEventTable } from './eventMarkers';
import playerClipsJson from './data/playerClips.json';

/** プレイヤー動作のイベントマーカー表（読み込み時に検証される）。 */
export const playerClipEvents = parseClipEventTable(playerClipsJson);

export const getPlayerClipEvents = indexClipEvents(playerClipEvents);
