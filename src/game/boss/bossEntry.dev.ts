import { registerDevHooks } from '../../devHooks';
import { bossSystemOf } from './boss.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** ボス入場（#85）の状態（E2E・撮影用）。ボスがいなければ `exists: false`。 */
    bossEntry(): {
      exists: boolean;
      state: string;
      engaged: boolean;
      invulnerable: boolean;
      /** 入場演出の経過フレーム（演出中でなければ -1）。 */
      introFrame: number;
      hp: number;
      maxHp: number;
      phase: number;
      /** `bossIntro` の発行回数・`bossEngaged` の発行回数・直近の `bgmChange`。 */
      intros: number;
      engages: number;
      bgm: string | null;
    };
  }
}

registerDevHooks('bossEntry', ({ game }) => {
  let intros = 0;
  let engages = 0;
  let bgm: string | null = null;
  game.events.on('bossIntro', () => {
    intros++;
  });
  game.events.on('bossEngaged', () => {
    engages++;
  });
  game.events.on('bgmChange', (e) => {
    bgm = e.track;
  });
  return {
    bossEntry: () => {
      const boss = bossSystemOf(game).boss;
      return {
        exists: !!boss,
        state: boss?.state ?? 'none',
        engaged: boss?.isEngaged ?? false,
        invulnerable: boss?.invulnerable ?? false,
        introFrame: boss?.introFrame ?? -1,
        hp: boss?.hp ?? 0,
        maxHp: boss?.maxHp ?? 0,
        phase: boss?.phase ?? 0,
        intros,
        engages,
        bgm,
      };
    },
  };
});
