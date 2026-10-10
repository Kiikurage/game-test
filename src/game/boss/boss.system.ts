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
  /** 柱（円）。攻撃は柱を貫通し、触れると `bossPillarHit` を発行する（破片の演出用）。 */
  readonly pillars?: readonly { readonly x: number; readonly z: number; readonly radius: number }[];
}

/**
 * ボスのゲームシステム。ボスは `spawn` で出す（アリーナ・入場演出は E5-6 が呼ぶ。確認用は `boss.dev.ts`）。
 * 被弾側（ハートボックス・強靭度・ヒットストップ・ロックオン）への登録と、毎ステップの更新を担う。
 */
export class BossSystem {
  boss: Boss | null = null;
  private heart: UprightTarget | null = null;

  constructor(private readonly game: Game) {
    // プレイヤーの死亡（演出の開始）・篝火の休憩でボスを戻す（撃破済みのボスは戻さない）
    game.events.on('death', (e) => {
      if (e.phase === 'start') this.reset('death');
    });
    game.events.on('rest', (e) => {
      this.reset(e.cause === 'rest' ? 'rest' : 'death');
    });
  }

  /**
   * ボスを HP 満タン・フェーズ 1・待機位置へ戻す（`engage()` するまで動かない。E5-8a が使う）。撃破済み（`dead`）なら何もしない。
   * 交戦中だったら `bossReset` を発行する。
   */
  reset(cause: 'death' | 'rest' = 'death'): void {
    const { boss, heart, game } = this;
    if (!boss || !heart || !boss.alive) return;
    boss.reset(cause);
    heart.health.refill();
    heart.invulnerable = false;
    heart.staggered = false;
    game.reactors.get(BOSS_ID)?.reset();
    heart.place(boss.position.x, boss.position.y, boss.position.z, boss.yaw);
  }

  /** 撃破済み（セーブの `bosses`）か。撃破済みのボスは出さない（`spawnUnlessDefeated`）。 */
  get isDefeated(): boolean {
    return this.game.save.get().bosses.includes(BOSS_ID);
  }

  /**
   * 撃破済み（セーブ）でなければボスを出す。撃破済みなら何も出さず null（以降ボスは復活しない。仕様書 8.4 節）。
   * ゲーム本編の配置（入場演出 E5-6・待機位置 E5-8a）はこちらを呼ぶ。確認用の `spawn` はセーブを見ない。
   */
  spawnUnlessDefeated(options: BossSpawnOptions): Boss | null {
    return this.isDefeated ? null : this.spawn(options);
  }

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
        events: game.events,
        ...(options.arena && { arena: options.arena }),
        ...(options.pillars && { pillars: options.pillars }),
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
    boss.dispose();
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
    heart.invulnerable = boss.invulnerable;
    boss.setHp(heart.health.current);
  }

  /** ボスに直接ダメージを与える（確認・E2E 用の dev フックから。通常の命中処理は `onHit`）。 */
  damage(amount: number): void {
    const { boss, heart } = this;
    if (!boss || !heart || !boss.alive) return;
    heart.health.damage(amount);
    boss.setHp(heart.health.current);
    if (heart.health.dead) boss.kill();
  }

  onHit(e: HitEvent): void {
    const { boss, heart, game } = this;
    if (!boss || !heart || e.targetId !== BOSS_ID) return;
    boss.setHp(heart.health.current);
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
