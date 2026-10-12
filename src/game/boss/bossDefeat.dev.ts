import { registerDevHooks } from '../../devHooks';
import { ARENA_BONFIRE_ID } from '../data/bonfire';
import { bonfireSystem } from '../bonfire/bonfire.system';
import { bossDefeatSystem } from './bossDefeat.system';
import { bossSystem } from './boss.system';

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
    const d = game.systems.get(bossDefeatSystem);
    const bonfires = game.systems.get(bonfireSystem);
    return {
      frame: d.frame,
      dissolve: d.dissolve,
      fogDensity: d.fogDensity,
      controlRestored: d.controlRestored,
      bossAlive: game.systems.get(bossSystem).boss?.alive ?? null,
      saved: game.save.get().bosses,
      arenaBonfireLit: bonfires.ids.includes(ARENA_BONFIRE_ID) && bonfires.isLit(ARENA_BONFIRE_ID),
    };
  },
}));
