import { indexClipEvents, lookupClipEvents, parseClipEventTable } from './eventMarkers';
import bossClipsJson from './data/bossClips.json';

/**
 * ボスの技のイベントマーカー表（読み込み時に検証される）。動作 ID は `boss.<段の ID>.p1` / `.p2`（フェーズ別。
 * 例: `boss.overhead.1.p2`）。フェーズ 2 の「全技のアニメーション再生 1.15 倍」は、同じクリップ範囲・当たりフレームのまま
 * 仕様のフレーム数（P2 の発生・硬直）から `playbackRate` が決まることで表れる。
 *
 * クリップ内の当たりフレーム・再生範囲は実クリップの計測に合わせてある（#214。根拠と一覧は docs/boss-clip-sync.md）。
 */
export const bossClipEvents = parseClipEventTable(bossClipsJson);

export const getBossClipEvents = indexClipEvents(bossClipEvents);

/** 動作 ID（`boss.overhead.1.p1` など）から表を引く。なければ undefined。 */
export const findBossClipEvents = lookupClipEvents(bossClipEvents);
