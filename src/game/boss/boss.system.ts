import { HitReactor, BOSS_REACTOR, UprightTarget, uprightHeartbox, type HitEvent } from '../combat';
import type { Game } from '../game';
import { seededRandom } from '../enemy/enemyManager';
import { registerGameSystem } from '../systems';
import { Boss } from './boss';
import { BOSS_STATS } from './bossData';
import { BOSS_MOVES, BossMoveRegistry } from './bossMove';
import { createStubMoves } from './stubMoves';
import './moves';

/** ボスの ID（`game.bossIds` にも入る）。 */
export const BOSS_ID = 'boss';

export interface BossSpawnOptions {
  readonly x: number;
  readonly z: number;
  readonly yaw?: number;
  /** 足元の高さ（省略時はプレイヤーの足元の高さ）。 */
  readonly y?: number;
  /** 使う技のレジストリ（テスト用。省略時は登録済みの技 + スタブ）。 */
  readonly moves?: BossMoveRegistry;
  /** 未実装の技をスタブで埋める（E5-3〜E5-5 が揃うまでの確認用。既定 true）。 */
  readonly stubs?: boolean;
  /** 乱数のシード（省略時は固定の既定値）。 */
  readonly seed?: string;
  /** 生成と同時に戦闘を始める（既定 true。入場演出は E5-6）。 */
  readonly engage?: boolean;
  /** アリーナの円。省略時は制限なし。 */
  readonly arena?: { readonly x: number; readonly z: number; readonly radius: number };
}

/**
 * ボスのゲームシステム。ボスは `spawn` で出す（アリーナ・入場演出は E5-6 が呼ぶ。確認用は `boss.dev.ts`）。
 * 被弾側（ハートボックス・強靭度・ヒットストップ・ロックオン）への登録と、毎ステップの更新を担う。
 */
export class BossSystem {
  boss: Boss | null = null;
  private heart: UprightTarget | null = null;

  constructor(private readonly game: Game) {}

  spawn(options: BossSpawnOptions): Boss {
    this.remove();
    const { game } = this;
    const y = options.y ?? game.player.feet.y;
    const reactor = new HitReactor(BOSS_REACTOR);
    const moves =
      options.moves ??
      (options.stubs === false
        ? BOSS_MOVES
        : BossMoveRegistry.merged(BOSS_MOVES, createStubMoves()));
    const boss = new Boss(
      { id: BOSS_ID, x: options.x, y, z: options.z, yaw: options.yaw ?? 0 },
      {
        combat: game.combat,
        moves,
        random: seededRandom(options.seed ?? 'boss'),
        poise: reactor.poise,
        ...(options.arena && { arena: options.arena }),
      },
    );
    const heart = new UprightTarget(BOSS_ID, 'enemy', boss.maxHp, [
      uprightHeartbox(BOSS_STATS.radius, BOSS_STATS.height),
    ]);
    heart.place(boss.position.x, boss.position.y, boss.position.z, boss.yaw);
    game.combat.addTarget(heart);
    game.addReactor(BOSS_ID, reactor, heart);
    game.registerFreezable(BOSS_ID, boss);
    game.bossIds.add(BOSS_ID);
    game.lockOnTargets.push(boss);
    this.boss = boss;
    this.heart = heart;
    if (options.engage ?? true) boss.engage();
    return boss;
  }

  /** ボスを取り除く（リスポーン・デバッグ）。 */
  remove(): void {
    const { boss } = this;
    if (!boss) return;
    const { game } = this;
    game.combat.removeTarget(BOSS_ID);
    game.removeReactor(BOSS_ID);
    game.unregisterFreezable(BOSS_ID);
    game.bossIds.delete(BOSS_ID);
    const i = game.lockOnTargets.indexOf(boss);
    if (i >= 0) game.lockOnTargets.splice(i, 1);
    boss.kill();
    this.boss = null;
    this.heart = null;
  }

  update(dt: number): void {
    const { boss, heart, game } = this;
    if (!boss || !heart) return;
    const { player } = game;
    boss.update(
      dt,
      {
        x: player.feet.x,
        z: player.feet.z,
        healing: player.state === 'heal' || player.state === 'healEmpty',
        rolling: player.state === 'roll',
      },
      player.feet.y,
    );
    heart.place(boss.position.x, boss.position.y, boss.position.z, boss.yaw);
    boss.hp = heart.health.current;
  }

  onHit(e: HitEvent): void {
    const { boss, heart, game } = this;
    if (!boss || !heart || e.targetId !== BOSS_ID) return;
    boss.hp = heart.health.current;
    if (heart.health.dead) {
      boss.kill();
      return;
    }
    // 崩し（強靭度が尽きた）だけが技を打ち切る。通常攻撃では中断しない
    const reactor = game.reactors.get(BOSS_ID);
    const reaction = reactor?.lastReaction;
    if (reaction?.kind === 'stagger') boss.stagger(reaction.frames);
  }
}

const systems = new WeakMap<Game, BossSystem>();

/** `game` のボスシステム。 */
export function bossSystemOf(game: Game): BossSystem {
  const system = systems.get(game);
  if (!system) throw new Error('boss system is not registered for this game');
  return system;
}

registerGameSystem('boss', (game) => {
  const system = new BossSystem(game);
  systems.set(game, system);
  return {
    update: (dt) => {
      system.update(dt);
    },
    onHit: (e) => {
      system.onHit(e);
    },
  };
});
