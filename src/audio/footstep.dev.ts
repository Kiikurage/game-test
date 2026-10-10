import { registerDevHooks } from '../devHooks';
import { footstepPlayRequest } from './footstep';

/** E2E 用の足音ログ 1 件（`footstep` イベントと、audio 層が SfxPlayer へ出す再生要求）。 */
export interface FootstepLogEntry {
  readonly surface: string;
  readonly gait: string;
  readonly source: string;
  /** 再生要求の cue と音量（`toPlayRequest` と同じ変換）。 */
  readonly cue: string;
  readonly volume: number;
}

declare module '../devHooks' {
  interface DevHooks {
    /** 足音イベントの履歴（新しい順に最大 64 件。E2E で素材の切替を検証する）。 */
    footstepLog(): readonly FootstepLogEntry[];
  }
}

const MAX_LOG = 64;

registerDevHooks('footstep', ({ game }) => {
  const log: FootstepLogEntry[] = [];
  game.events.on('footstep', (p) => {
    const req = footstepPlayRequest(p);
    log.unshift({
      surface: p.surface,
      gait: p.gait,
      source: p.source,
      cue: req.cue,
      volume: req.volume ?? 1,
    });
    if (log.length > MAX_LOG) log.length = MAX_LOG;
  });
  return { footstepLog: () => [...log] };
});
