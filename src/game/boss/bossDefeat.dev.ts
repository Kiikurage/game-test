import { registerDevHooks } from '../../devHooks';
import { bonfiresOf } from '../bonfire/bonfire';
import { ARENA_BONFIRE_ID } from '../data/bonfire';
import { bossSystemOf } from './boss.system';
import { bossDefeatOf } from './bossDefeat.system';

declare module '../../devHooks' {
  interface DevHooks {
    /**
     * ボス撃破演出の状態（E2E・撮影用）。撃破は `bossDamage(大きな値)` で起こす。
     * `frame` は撃破からのステップ数（撃破していなければ -1）。
     */
    bossDefeat(): {
      frame: number;
      dissolve: number;
      fogDensity: number;
      controlRestored: boolean;
      bossAlive: boolean | null;
      /** セーブの `bosses`。 */
      saved: readonly string[];
      /** 台座の篝火が現れて灯っているか。 */
      arenaBonfireLit: boolean;
    };
  }
}

registerDevHooks('bossDefeat', ({ game }) => ({
  bossDefeat: () => {
    const d = bossDefeatOf(game);
    const bonfires = bonfiresOf(game);
    return {
      frame: d.frame,
      dissolve: d.dissolve,
      fogDensity: d.fogDensity,
      controlRestored: d.controlRestored,
      bossAlive: bossSystemOf(game).boss?.alive ?? null,
      saved: game.save.get().bosses,
      arenaBonfireLit: bonfires.ids.includes(ARENA_BONFIRE_ID) && bonfires.isLit(ARENA_BONFIRE_ID),
    };
  },
}));
