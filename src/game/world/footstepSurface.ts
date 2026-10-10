import type { FootstepSurface } from '../../core/gameEvents';
import type { Level, SurfaceKind } from './level';

/** レベルデータの地表素材 → 足音の素材（audio の cue `sfx.footstep-<素材>` の素材名）。地下は「石 + 反響」の `crypt`。 */
export const FOOTSTEP_SURFACE_OF: Readonly<Record<SurfaceKind, FootstepSurface>> = {
  grass: 'grass',
  stone: 'stone',
  wood: 'wood',
  underground: 'crypt',
};

export function footstepSurfaceOf(kind: SurfaceKind): FootstepSurface {
  return FOOTSTEP_SURFACE_OF[kind];
}

/**
 * 足元の座標から足音の素材を引く関数。エリア定義（`Level.surfaceAt`。エリアの境界で切り替わる）を使う。
 * `Game.footstepSurface` に代入する。プレイヤー・敵・ボスの足音が同じ関数を共有する。
 */
export function createFootstepSurfaceResolver(
  level: Pick<Level, 'surfaceAt'>,
): (x: number, z: number) => FootstepSurface {
  return (x, z) => footstepSurfaceOf(level.surfaceAt(x, z));
}
