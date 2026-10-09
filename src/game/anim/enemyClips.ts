import { indexClipEvents, lookupClipEvents, parseClipEventTable } from './eventMarkers';
import undeadClipsJson from './data/undeadClips.json';

/** 亡者兵の攻撃のイベントマーカー表（読み込み時に検証される）。動作 ID は `enemy.undead.<攻撃 ID>`。 */
export const undeadClipEvents = parseClipEventTable(undeadClipsJson);

export const getUndeadClipEvents = indexClipEvents(undeadClipEvents);

/** 動作 ID（`enemy.undead.a1` など）から表を引く。なければ undefined。 */
export const findEnemyClipEvents = lookupClipEvents(undeadClipEvents);
