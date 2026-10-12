import type { EventBus, FootstepSurface, GameEventMap } from '../../core/gameEvents';
import {
  HOLLOW_SOLDIER_REACTOR,
  SHIELDBEARER_REACTOR,
  HitReactor,
  UprightTarget,
  uprightHeartbox,
  type HitEvent,
  type HitReaction,
  type HitResolver,
} from '../combat';
import type { ReactorRegistry } from '../combat/reactorRegistry';
import { ENEMY_STATS, UNDEAD_ATTACK_RULES } from '../data';
import type { LockOnTarget } from '../lockOn/targets';
import type { Physics } from '../physics';
import type { Player } from '../player/player';
import type { Tuning } from '../tuning';
import type { EnemySpawn } from '../world/level';
import type { AttackTokens } from './attackRunner';
import { NO_ATTACK, type Enemy } from './enemy';
import { RapierEnemyBody } from './enemyBody';
import { EnemyManager } from './enemyManager';
import { directNavigator, type Navigator } from './navigation';
import { motionNoise, playerMotion } from './perception';
import { createUndeadAttack } from './undeadAttack';

type Point = { readonly x: number; readonly y: number; readonly z: number };

export interface EnemyRosterDeps {
  readonly physics: Physics;
  readonly combat: HitResolver;
  readonly reactors: ReactorRegistry;
  readonly attackTokens: AttackTokens;
  readonly tuning: Tuning;
  readonly events: EventBus<GameEventMap>;
  readonly lockOnTargets: LockOnTarget[];
  readonly heightAt: (x: number, z: number) => number;
  readonly hasLineOfSight: (from: Point, to: Point) => boolean;
  /** 足音の地面の種類（Game 側で差し替えられるので毎回読む）。 */
  readonly footstepSurface: (x: number, z: number, y?: number) => FootstepSurface;
  readonly navigator?: Navigator;
  readonly darkness?: (x: number, z: number) => boolean;
  readonly hearingScale?: (x: number, y: number, z: number) => number;
}

/**
 * 雑魚敵の生成と、Game の他の部分（被弾側・強靭度・ロックオン・ヒットストップ・足音）へのつなぎ。
 * 敵 AI 本体は `EnemyManager`。
 */
export class EnemyRoster {
  readonly manager: EnemyManager;
  /** 敵 AI 本体とその被弾側（ハートボックス）の対応（id → 敵）。 */
  private readonly hearts = new Map<string, { enemy: Enemy; heart: UprightTarget }>();
  /** プレイヤーのロール中・ロール終了からの経過ステップ（敵の攻撃選択が「ロール直後」を見る）。 */
  private stepsSinceRoll = Number.POSITIVE_INFINITY;

  constructor(
    private readonly deps: EnemyRosterDeps,
    spawns: readonly EnemySpawn[],
  ) {
    const { physics, combat, attackTokens, reactors, heightAt } = deps;
    this.manager = new EnemyManager({
      lineOfSight: (from, to) => deps.hasLineOfSight(from, to),
      navigator: deps.navigator ?? directNavigator,
      ...(deps.darkness && { darkness: deps.darkness }),
      ...(deps.hearingScale && { hearingScale: deps.hearingScale }),
      // 亡者兵の攻撃（A1〜A3）。盾持ちの攻撃は別チケット（それまでは攻撃しない）
      createAttack: (init, random) =>
        init.type === 'undead_soldier'
          ? createUndeadAttack({
              combat,
              tokens: attackTokens,
              random,
              poiseOf: (id) => reactors.reactors.get(id)?.poise,
            })
          : NO_ATTACK,
      createBody: (init) => {
        const stats = ENEMY_STATS[init.type];
        return new RapierEnemyBody(
          physics,
          init.x,
          heightAt(init.x, init.z) + 0.02,
          init.z,
          stats.height,
          stats.radius,
        );
      },
    });
    for (const spawnPoint of spawns) this.register(this.manager.spawn(spawnPoint));
  }

  /** 敵をロックオン対象・被弾側（ハートボックスと強靭度）として登録する。 */
  private register(enemy: Enemy): void {
    const { combat, reactors, tuning, lockOnTargets } = this.deps;
    if (!lockOnTargets.includes(enemy)) lockOnTargets.push(enemy);
    const stats = ENEMY_STATS[enemy.type];
    const heart = new UprightTarget(enemy.id, 'enemy', enemy.maxHp, [
      uprightHeartbox(stats.radius, stats.height),
    ]);
    heart.place(enemy.position.x, enemy.position.y, enemy.position.z, enemy.yaw);
    combat.addTarget(heart);
    const profile = enemy.type === 'undead_shield' ? SHIELDBEARER_REACTOR : HOLLOW_SOLDIER_REACTOR;
    reactors.add(enemy.id, new HitReactor(profile, tuning), heart);
    // ヒットストップ（攻撃側・被弾側）で状態フレーム・移動を凍結する（Enemy.update が先頭で consumeFreeze する）
    reactors.registerFreezable(enemy.id, enemy.fsm);
    this.hearts.set(enemy.id, { enemy, heart });
    reactors.setSlideSink(enemy.id, (dx, dz) => {
      enemy.pushBy(dx, dz);
    });
  }

  /** 命中の結果を敵 AI へ反映する: HP、気付き（被弾で Alert）、崩しの行動不能、死亡。 */
  react(id: string, reaction: HitReaction, e: HitEvent): void {
    const entry = this.hearts.get(id);
    if (!entry) return;
    const { enemy, heart } = entry;
    enemy.hp = heart.health.current;
    if (heart.health.dead) {
      enemy.kill();
      this.deps.combat.removeTarget(id);
      this.deps.reactors.remove(id);
      this.hearts.delete(id);
      this.deps.reactors.setSlideSink(id, null);
      return;
    }
    enemy.provoke(e.attackerPosition.x, e.attackerPosition.z);
    if (reaction.blocksAction) enemy.stagger(reaction.frames);
  }

  /** 敵のハートボックスを現在位置へ追従させる。 */
  private syncHearts(): void {
    for (const { enemy, heart } of this.hearts.values()) {
      if (!enemy.alive) continue;
      heart.place(enemy.position.x, enemy.position.y, enemy.position.z, enemy.yaw);
      enemy.hp = heart.health.current;
    }
  }

  /** 全敵を出発地点へ戻して復活させる。倒れていた敵は被弾側・強靭度を登録し直す。 */
  respawnAll(): void {
    const revived = new Set(this.manager.respawnAll());
    for (const enemy of this.manager.enemies) {
      if (revived.has(enemy)) {
        this.register(enemy);
      } else {
        this.hearts.get(enemy.id)?.heart.health.refill();
        this.deps.reactors.reactors.get(enemy.id)?.reset();
      }
    }
    this.syncHearts();
  }

  /**
   * 敵を 1 ステップ進める。プレイヤーの足音（歩き・走り・ダッシュ/ロール）をこのステップ分の音として出し、
   * 敵はそれと視覚から気付く。
   */
  update(dt: number, player: Player): void {
    if (this.manager.enemies.length === 0) return;
    const motion = playerMotion(player.state, player.speed);
    const kind = motionNoise(motion);
    if (kind) this.manager.noises.emit(player.feet, kind, { duration: dt });
    // ロール中とロール終了から 20F 以内は「ロール直後」（ロール連打を咎める攻撃選択の入力）
    this.stepsSinceRoll = player.state === 'roll' ? 0 : this.stepsSinceRoll + 1;
    this.manager.update(dt, {
      position: player.feet,
      motion,
      recentRoll: this.stepsSinceRoll <= UNDEAD_ATTACK_RULES.rollPunishFrames,
    });
    this.syncHearts();
    this.publishFootsteps();
  }

  /** 敵の足音（位置つき）をイベントバスへ流す。 */
  private publishFootsteps(): void {
    for (const enemy of this.manager.enemies) {
      for (const m of enemy.markerEvents) {
        if (m.type !== 'footstep') continue;
        const f = enemy.position;
        this.deps.events.emit('footstep', {
          surface: this.deps.footstepSurface(f.x, f.z, f.y),
          gait: m.gait ?? 'run',
          source: 'enemy',
          position: { x: f.x, y: f.y, z: f.z },
        });
      }
    }
  }
}
