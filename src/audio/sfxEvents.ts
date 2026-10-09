import type {
  FootstepGait,
  GameEventBus,
  GameEventMap,
  GameEventName,
  HitKind,
  SoundSource,
  Vec3Like,
} from '../core/gameEvents';
import type { PlayRequest, SfxPlayer } from './sfxPlayer';

/** 発生源ごとの優先度（仕様書 10.2 節: プレイヤー被弾・ガード > ボス > 敵 > 足音 > 環境）。 */
export const SOURCE_PRIORITY: Readonly<Record<SoundSource, number>> = {
  player: 90,
  boss: 70,
  enemy: 50,
  world: 10,
};

/** 足音の歩き方ごとの音量倍率（素材は共通。歩き / 走り / ロールで音量を変える）。 */
export const GAIT_VOLUME: Readonly<Record<FootstepGait, number>> = {
  walk: 0.55,
  run: 0.85,
  roll: 0.7,
};

/** `hit` イベントの種別 → cue（素材 ID またはバリエーショングループ名）。 */
export const HIT_CUE: Readonly<Record<HitKind, string>> = {
  light: 'sfx.hit-light',
  heavy: 'sfx.hit-heavy',
  guard: 'sfx.guard',
  guardBreak: 'sfx.guard-break',
};

/** 空間化するのは敵・ボス・ワールド（位置つき）。プレイヤー自身の音はカメラ近傍なので非定位。 */
function spatialPosition(source: SoundSource, position?: Vec3Like): Vec3Like | undefined {
  return source === 'player' ? undefined : position;
}

/**
 * game のイベントを再生要求へ変換する（純粋関数）。
 * cue の命名: 足音 `sfx.footstep-<surface>`（`sfx.footstep-stone1..4` のように連番でバリエーション）、
 * ヒット `HIT_CUE`、汎用 `sound` は cue をそのまま使う。
 */
export function toPlayRequest<K extends GameEventName>(
  name: K,
  payload: GameEventMap[K],
): PlayRequest | undefined {
  switch (name) {
    case 'footstep': {
      const p = payload as GameEventMap['footstep'];
      const position = spatialPosition(p.source, p.position);
      return {
        cue: `sfx.footstep-${p.surface}`,
        volume: GAIT_VOLUME[p.gait],
        ...(position && { position }),
      };
    }
    case 'hit': {
      const p = payload as GameEventMap['hit'];
      const position = spatialPosition(p.source, p.position);
      return {
        cue: HIT_CUE[p.kind],
        priority: SOURCE_PRIORITY[p.source],
        ...(position && { position }),
      };
    }
    case 'sound': {
      const p = payload as GameEventMap['sound'];
      const position = spatialPosition(p.source ?? 'world', p.position);
      return {
        cue: p.cue,
        ...(p.volume !== undefined && { volume: p.volume }),
        ...(p.source && { priority: SOURCE_PRIORITY[p.source] }),
        ...(position && { position }),
      };
    }
    default:
      return undefined;
  }
}

/** game のイベントバスを購読して SE を鳴らす。戻り値は購読解除。 */
export function bindSfxEvents(bus: GameEventBus, player: Pick<SfxPlayer, 'play'>): () => void {
  const offs = (['footstep', 'hit', 'sound'] as const).map((name) =>
    bus.on(name, (payload) => {
      const req = toPlayRequest(name, payload as never);
      if (req) player.play(req);
    }),
  );
  return () => {
    for (const off of offs) off();
  };
}
