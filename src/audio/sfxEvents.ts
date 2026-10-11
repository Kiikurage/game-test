import type {
  GameEventBus,
  GameEventMap,
  GameEventName,
  HitKind,
  SoundSource,
  Vec3Like,
} from '../core/gameEvents';
import { footstepPlayRequest } from './footstep';
import type { PlayRequest, SfxPlayer } from './sfxPlayer';

/** 発生源ごとの優先度（仕様書 10.2 節: プレイヤー被弾・ガード > ボス > 敵 > 足音 > 環境）。 */
export const SOURCE_PRIORITY: Readonly<Record<SoundSource, number>> = {
  player: 90,
  boss: 70,
  enemy: 50,
  world: 10,
};

/** 命中（`impact`）の種別 → cue（素材 ID またはバリエーショングループ名）。 */
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
 * 命中（`impact`）の SE。ガードが崩されたときは崩しの音を先に、続けて命中・ガードの音を鳴らす（純粋関数）。
 */
export function impactPlayRequests(p: GameEventMap['impact']): PlayRequest[] {
  const position = spatialPosition(p.source, p.position);
  const req = (kind: HitKind): PlayRequest => ({
    cue: HIT_CUE[kind],
    priority: SOURCE_PRIORITY[p.source],
    ...(position && { position }),
  });
  return p.guardBroken ? [req('guardBreak'), req(p.kind)] : [req(p.kind)];
}

/**
 * game のイベントを再生要求へ変換する（純粋関数。`impact` は最後の 1 つ。全部は `impactPlayRequests`）。
 * cue の命名: 足音は `footstep.ts`（`sfx.footstep-<surface>`。`sfx.footstep-stone1..4` のように連番でバリエーション）、
 * 命中 `HIT_CUE`、汎用 `sound` は cue をそのまま使う。
 */
export function toPlayRequest<K extends GameEventName>(
  name: K,
  payload: GameEventMap[K],
): PlayRequest | undefined {
  switch (name) {
    case 'footstep':
      return footstepPlayRequest(payload as GameEventMap['footstep']);
    case 'impact':
      return impactPlayRequests(payload as GameEventMap['impact']).at(-1);
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
  const offs = (['footstep', 'sound'] as const).map((name) =>
    bus.on(name, (payload) => {
      const req = toPlayRequest(name, payload as never);
      if (req) player.play(req);
    }),
  );
  offs.push(
    bus.on('impact', (payload) => {
      for (const req of impactPlayRequests(payload)) player.play(req);
    }),
  );
  return () => {
    for (const off of offs) off();
  };
}
