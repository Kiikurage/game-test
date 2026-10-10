import { registerDevHooks } from '../../devHooks';
import { BOSS_ID, bossSystemOf } from './boss.system';
import { bossTransitionOf } from './bossTransition.system';

declare module '../../devHooks' {
  interface DevHooks {
    /**
     * ボスの HP を設定する（確認・撮影用。フェーズ 2 の閾値 1200 以下にすると、次の硬直でフェーズ移行の演出が始まる）。
     * ボスがいなければ何もしない。`?debug&scene=boss` では先に `bossTool().set('ai', true)` で AI をオンにする。
     */
    bossHp(hp: number): void;
    /** フェーズ移行の演出の移行 F（演出中でなければ -1）。 */
    bossTransitionFrame(): number;
  }
}

registerDevHooks('bossTransition', ({ game }) => ({
  bossHp: (hp) => {
    const boss = bossSystemOf(game).boss;
    const heart = game.combat.allTargets.get(BOSS_ID);
    if (!boss || !heart) return;
    heart.health.current = Math.max(1, Math.min(heart.health.max, hp));
    boss.setHp(heart.health.current);
  },
  bossTransitionFrame: () => bossTransitionOf(game).frame,
}));
