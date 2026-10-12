import { registerDevHooks } from '../../devHooks';
import { waterwaySystem } from './waterway.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** 脇道 side_waterway の仕掛けの状態（E2E・撮影用）。 */
    waterway(): { hatchBroken: boolean; grateOpen: boolean };
    /** 腐った床板を割る（踏む代わり）。割れていなければ true。 */
    breakHatch(): boolean;
    /** 水路の鉄格子を開通させる（状況ボタン「押す」の代わり）。開いていなければ true。 */
    openGrate(): boolean;
  }
}

registerDevHooks('waterway', ({ game }) => ({
  waterway: () => {
    const s = game.systems.get(waterwaySystem);
    return { hatchBroken: s.hatchBroken, grateOpen: s.grateOpen };
  },
  breakHatch: () => game.systems.get(waterwaySystem).breakHatch(),
  openGrate: () => game.systems.get(waterwaySystem).openGrate(),
}));
