import type { FootstepGait, FootstepSurface, GameEventMap, SoundSource } from '../core/gameEvents';
import type { PlayRequest } from './sfxPlayer';

/** 足音の歩き方ごとの音量倍率（素材は共通。歩き / 走り / ロールで音量を変える。仕様書 10.1 節）。 */
export const GAIT_VOLUME: Readonly<Record<FootstepGait, number>> = {
  walk: 0.55,
  run: 0.85,
  roll: 0.7,
};

/**
 * 発生源ごとの足音の鳴らし方。敵・ボスの足音（後続チケット）は、ここの該当エントリを差し替えるだけで
 * 同じ仕組み（`footstep` イベント → 素材 → 再生要求）に乗せられる。
 */
export interface FootstepProfile {
  /** 素材 → cue（素材 ID またはバリエーショングループ名。連番のバリエーションは `variantGroupOf` でまとまる）。 */
  readonly cue: (surface: FootstepSurface) => string;
  /** 音量の倍率（歩き方の倍率に掛ける。既定 1）。 */
  readonly volume?: number;
  /** 再生レートの倍率（音程。ボスは低く。既定 1）。 */
  readonly rate?: number;
  /** マニフェストの優先度を上書きする。省略時は素材側（足音 30）。 */
  readonly priority?: number;
}

/** プレイヤー・世界の足音: `sfx.footstep-<素材>`（草 / 石 / 木 / 地下 = crypt の 4 素材 × 4 バリエーション）。 */
export const surfaceFootstepCue = (surface: FootstepSurface): string => `sfx.footstep-${surface}`;

const SURFACE_PROFILE: FootstepProfile = { cue: surfaceFootstepCue };

export const FOOTSTEP_PROFILES: Readonly<Record<SoundSource, FootstepProfile>> = {
  player: SURFACE_PROFILE,
  // 敵 / ボスは暫定でプレイヤーと同じ素材別の音。専用素材（`sfx.enemy.step` / `sfx.boss.step`）への切替と
  // 音量・音程の調整は、敵 / ボス SE 接続のチケットでここを差し替える。
  enemy: SURFACE_PROFILE,
  boss: SURFACE_PROFILE,
  world: SURFACE_PROFILE,
};

/** `footstep` イベント → 再生要求（純粋関数）。敵・ボスは位置つきで空間化、プレイヤーは非定位。 */
export function footstepPlayRequest(
  p: GameEventMap['footstep'],
  profiles: Readonly<Record<SoundSource, FootstepProfile>> = FOOTSTEP_PROFILES,
): PlayRequest {
  const profile = profiles[p.source];
  const position = p.source === 'player' ? undefined : p.position;
  return {
    cue: profile.cue(p.surface),
    volume: GAIT_VOLUME[p.gait] * (profile.volume ?? 1),
    ...(profile.rate !== undefined && { rate: profile.rate }),
    ...(profile.priority !== undefined && { priority: profile.priority }),
    ...(position && { position }),
  };
}
