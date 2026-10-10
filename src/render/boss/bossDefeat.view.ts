import { BOSS_DEFEAT, defeatFogDensity } from '../../game/boss/bossDefeat';
import { bossDefeatOf } from '../../game/boss/bossDefeat.system';
import { registerViewPlugin } from '../viewPlugins';
import { advanceShownFrame } from './bossDefeatFx';

/**
 * ボス撃破のフォグ（#86 / 8.4 節）: 崩壊の灰で空気が濃くなり（0.015 → 0.04）、F300 から 60F かけて 0.015 へ晴れる。
 * 密度は「晴れた密度（0.015）に対する比」として、ムードのフォグに掛ける（`Environment.setFogScale`）ので、
 * 闘技場のムードの密度（0.0115）を基準に最大 約 2.7 倍まで濃くなり、元へ戻る。霧の門の `unseal()` は
 * `bossDefeatCue` の `fogClear`（F300）で呼ばれる（`bossDefeat.system.ts`）。
 */
registerViewPlugin('boss-defeat-fog', ({ game, view }) => {
  let shown = -1;
  let scale = 1;
  return {
    update: (dt) => {
      shown = advanceShownFrame(shown, bossDefeatOf(game).frame, dt, game.timeScale.current);
      const next = defeatFogDensity(shown) / BOSS_DEFEAT.fogDensityClear;
      if (Math.abs(next - scale) < 1e-4) return;
      scale = next;
      view.environment.setFogScale(scale);
    },
  };
});
