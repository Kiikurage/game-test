import { createFootstepSurfaceResolver } from '../../game/world/footstepSurface';
import { registerViewPlugin } from '../viewPlugins';

// 足音の地表素材をレベルの地表素材（エリア定義）へ繋ぐ（E7-3a）。
// `Game.footstepSurface` を差し替えるだけ。プレイヤー・敵（今後はボスも）の足音がこの関数で素材を引く。
// 音の再生は audio 層（`src/audio/footstep.ts`）が `footstep` イベントを購読して行う。
registerViewPlugin('footstep', ({ game, level }) => {
  if (level) game.footstepSurface = createFootstepSurfaceResolver(level);
  return {};
});
