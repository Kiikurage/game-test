// デバッグ・テスト専用の集計（命中の記録・ヒットストップの回数・プレイヤーイベントの回数）。
// ゲームの進行には使わない。Game 本体に E2E 用のカウンタを持たせないため、登録式のシステムとして外から観測する。
// テスト・dev フックは `gameStats(game)` で読む。
import type { HitEvent } from '../combat';
import type { Game, GameDebugState } from '../game';
import type { PlayerEvent } from '../player/player';
import { registerGameSystem } from '../systems';

/** 命中記録の保持数（古いものから捨てる）。 */
const HIT_LOG_MAX = 32;

/** 集計するプレイヤーイベント。 */
type CountedEvent =
  | 'rollStart'
  | 'backstepStart'
  | 'attackStart'
  | 'healStart'
  | 'healApply'
  | 'healEmpty'
  | 'land'
  | 'staminaEmpty';

const COUNTED_EVENTS: readonly CountedEvent[] = [
  'rollStart',
  'backstepStart',
  'healStart',
  'healApply',
  'healEmpty',
  'attackStart',
  'land',
  'staminaEmpty',
];

export class GameStats {
  /** 直近の命中（最大 32 件）。 */
  readonly hitLog: HitEvent[] = [];
  /** 命中の累計。 */
  hitCount = 0;
  /** 凍結フレームが 1 以上だったヒットストップの累計回数。 */
  hitStopCount = 0;
  /** 直近の命中の凍結フレーム数。 */
  lastHitStopFrames = 0;
  /** プレイヤーイベントの累計回数（テストが 0 に戻してよい）。 */
  readonly eventCounts = Object.fromEntries(COUNTED_EVENTS.map((t) => [t, 0])) as Record<
    CountedEvent,
    number
  >;

  recordHit(e: HitEvent): void {
    this.hitCount++;
    this.hitLog.push(e);
    if (this.hitLog.length > HIT_LOG_MAX) this.hitLog.shift();
  }

  recordHitStop(frames: number): void {
    if (frames > 0) this.hitStopCount++;
    this.lastHitStopFrames = frames;
  }

  recordPlayerEvents(events: readonly PlayerEvent[]): void {
    for (const e of events) {
      if (e.type in this.eventCounts) this.eventCounts[e.type]++;
    }
  }
}

/** `window.__game.sim` の形（Game の状態 + この集計）。 */
export interface SimDebugState extends Omit<GameDebugState, 'combat'> {
  readonly events: Readonly<Record<CountedEvent, number>>;
  readonly combat: GameDebugState['combat'] & {
    readonly hits: number;
    readonly lastHitTarget: string | null;
    /** ヒットストップの累計回数・直近の凍結フレーム数。 */
    readonly hitStops: number;
    readonly lastHitStopFrames: number;
  };
}

const statsByGame = new WeakMap<Game, GameStats>();

/** `game` の集計（Game の生成時に作られる）。 */
export function gameStats(game: Game): GameStats {
  const s = statsByGame.get(game);
  if (!s) throw new Error('debug stats system is not registered for this game');
  return s;
}

/** Game の状態と集計をまとめる（`window.__game.sim` 用）。 */
export function simDebugState(game: Game): SimDebugState {
  const s = gameStats(game);
  const base = game.debugState;
  return {
    ...base,
    events: { ...s.eventCounts },
    combat: {
      ...base.combat,
      hits: s.hitCount,
      lastHitTarget: s.hitLog.at(-1)?.targetId ?? null,
      hitStops: s.hitStopCount,
      lastHitStopFrames: s.lastHitStopFrames,
    },
  };
}

registerGameSystem('debugStats', (game) => {
  const stats = new GameStats();
  statsByGame.set(game, stats);
  return {
    update: () => {
      stats.recordPlayerEvents(game.player.events);
    },
    onImpact: (e) => {
      stats.recordHit(e.hit);
      stats.recordHitStop(e.frames);
    },
  };
});
