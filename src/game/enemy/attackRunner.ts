import { MarkerDispatcher } from '../anim/markerDispatcher';
import type { AnimMarkerEvent } from '../anim/markerDispatcher';
import type { ClipEventEntry } from '../anim/eventMarkers';
import type { ActiveAttack, HitResolver, Poise } from '../combat';
import { sectorShape } from '../combat';
import {
  ENEMY_ATTACK_RULES,
  ENEMY_AI,
  POISE,
  totalFrames,
  trackEndFrame,
  type EnemyAttackDef,
} from '../data';
import { turnToward, yawOf } from '../player/movement';
import type { Enemy, EnemyAttackBehavior, EnemyAttackContext } from './enemy';

const DEG = Math.PI / 180;
/** 向きの合わせ込みの強さ（旋回は角速度の上限で決まるので大きめ。`Enemy` と同じ）。 */
const TURN_RESPONSE = 40;

// ---- 攻撃トークン ----

/**
 * 攻撃トークン（5.1 節）。同時に Attack 状態に入れる敵を `max` 体までに制限する。
 * 持てなかった敵は Approach で対象の周りを回って待つ（`Enemy.orbit`）。
 * 攻撃が終わる・打ち切られる（崩し・撃破）と `release` する。
 */
export class AttackTokens {
  private readonly holders = new Set<string>();

  constructor(readonly max: number = ENEMY_AI.maxAttackers) {}

  /** 取れれば true。すでに持っていれば true。 */
  tryAcquire(id: string): boolean {
    if (this.holders.has(id)) return true;
    if (this.holders.size >= this.max) return false;
    this.holders.add(id);
    return true;
  }

  release(id: string): void {
    this.holders.delete(id);
  }

  has(id: string): boolean {
    return this.holders.has(id);
  }

  get count(): number {
    return this.holders.size;
  }
}

// ---- 攻撃選択 ----

export interface WeightedChoice<T extends string> {
  readonly id: T;
  readonly weight: number;
}

export interface PickOptions<T extends string> {
  /** 直近に選んだ攻撃（古い順）。 */
  readonly history?: readonly T[];
  /** 同じ攻撃を連続で選べる最大回数（超える選択肢は除く。既定は無制限）。 */
  readonly maxConsecutive?: number;
  /** 「何も選ばない」重み（選択条件を満たさず接近を続ける確率など）。 */
  readonly idleWeight?: number;
}

/** 同じ攻撃が `maxConsecutive` 回続いていて、`id` を選ぶとそれを超えるか。 */
function exceedsRepeat<T extends string>(
  id: T,
  history: readonly T[],
  maxConsecutive: number,
): boolean {
  if (history.length < maxConsecutive) return false;
  for (let i = 1; i <= maxConsecutive; i++) {
    if (history[history.length - i] !== id) return false;
  }
  return true;
}

/**
 * 重み付き乱択。連続使用の上限を超える選択肢は除外する。何も残らない（または `idleWeight` が当たった）
 * ときは null。乱数は注入できる（決定的テスト用）。
 */
export function pickWeighted<T extends string>(
  choices: readonly WeightedChoice<T>[],
  random: () => number,
  options: PickOptions<T> = {},
): T | null {
  const history = options.history ?? [];
  const maxConsecutive = options.maxConsecutive ?? Number.POSITIVE_INFINITY;
  const eligible = choices.filter(
    (c) => c.weight > 0 && !exceedsRepeat(c.id, history, maxConsecutive),
  );
  const idle = Math.max(0, options.idleWeight ?? 0);
  let total = idle;
  for (const c of eligible) total += c.weight;
  if (total <= 0) return null;
  let r = random() * total;
  for (const c of eligible) {
    r -= c.weight;
    if (r < 0) return c.id;
  }
  return null;
}

/** 攻撃を選ぶ側（敵の種別ごと。亡者兵は `undeadAttack.ts`）。 */
export interface AttackPlanner {
  /** 次の攻撃（攻撃 ID）を選ぶ。選ばない（接近を続ける）なら null。 */
  choose(ctx: {
    readonly distance: number;
    readonly recentRoll: boolean;
    readonly history: readonly string[];
    readonly random: () => number;
  }): string | null;
  /** 攻撃が終わったとき、そのまま続けて出す攻撃（連続攻撃）。なければ null。`chain` はすでに続けた回数。 */
  followUp?(ctx: {
    readonly lastId: string;
    readonly chain: number;
    readonly random: () => number;
  }): string | null;
  /** 待ちを飛ばして選んでよいか。 */
  skipHold?(ctx: { readonly distance: number; readonly recentRoll: boolean }): boolean;
}

// ---- 攻撃の実行 ----

export interface AttackRunnerOptions {
  readonly combat: HitResolver;
  readonly tokens: AttackTokens;
  readonly random: () => number;
  readonly planner: AttackPlanner;
  /** 攻撃 ID → 定義。 */
  readonly attacks: Readonly<Record<string, EnemyAttackDef>>;
  /** 動作 ID の接頭辞（`enemy.undead.`）。動作 ID = 接頭辞 + 攻撃 ID。 */
  readonly actionPrefix: string;
  /** 動作 ID → マーカー表（`hitStart` / `hitEnd`）。 */
  readonly entryOf: (actionId: string) => ClipEventEntry | undefined;
  /** 敵の強靭度（攻撃中の +30 を与える）。なければ強靭度は触らない。 */
  readonly poiseOf?: (enemyId: string) => Poise | undefined;
}

interface Run {
  readonly id: string;
  readonly def: EnemyAttackDef;
  readonly actionId: string;
  readonly attack: ActiveAttack;
  readonly markers: MarkerDispatcher;
  /** 判定開始直前の姿勢を教えたか。 */
  primed: boolean;
  /** ここまでに続けた連続攻撃の回数。 */
  readonly chain: number;
}

const markerScratch: AnimMarkerEvent[] = [];

/**
 * 敵 1 体の攻撃の実行（`Enemy.attackBehavior`）。予備動作（発生まで）→ 判定（`hitStart`〜`hitEnd`）→ 硬直。
 *
 * - 旋回追尾: 予備動作の前半（発生の 60%）だけ 120°/s で対象へ向き、以降は向き固定（ロールで躱せる）。
 * - 判定: マーカー表の `hitStart`〜`hitEnd` の間だけ、前方の扇形（`arcDeg` / `range`）を毎ステップ判定する。
 *   突進（`moveDistance`）は持続の間に均等に進む。ヒットストップ中は `Enemy` が呼ばないので状態ごと止まる。
 * - 強靭度: 発生〜持続の間 +30（持続が終わる / 打ち切られると戻す）。
 * - トークン: 開始時に取り、硬直が終わる（Recover へ移る）か打ち切られると返す。取れなければ待機（`isWaiting`）。
 * - 連続攻撃: 終わったときに `planner.followUp` が返せば、Attack 状態のまま次の攻撃を始める。
 */
export class AttackRunner implements EnemyAttackBehavior {
  private run: Run | null = null;
  private waiting = false;
  private readonly history: string[] = [];

  constructor(private readonly options: AttackRunnerOptions) {}

  /** 実行中の攻撃 ID（なければ null）。デバッグ・テスト用。 */
  get currentId(): string | null {
    return this.run?.id ?? null;
  }

  isWaiting(): boolean {
    return this.waiting;
  }

  skipHold(_enemy: Enemy, ctx: EnemyAttackContext): boolean {
    return (
      this.options.planner.skipHold?.({
        distance: ctx.distance,
        recentRoll: ctx.target.recentRoll ?? false,
      }) ?? false
    );
  }

  tryStart(enemy: Enemy, ctx: EnemyAttackContext): boolean {
    const { planner, tokens, random } = this.options;
    const id = planner.choose({
      distance: ctx.distance,
      recentRoll: ctx.target.recentRoll ?? false,
      history: this.history,
      random,
    });
    if (id === null) {
      this.waiting = false;
      return false;
    }
    if (!tokens.tryAcquire(enemy.id)) {
      this.waiting = true;
      return false;
    }
    this.waiting = false;
    this.history.push(id);
    if (this.history.length > 8) this.history.shift();
    this.begin(enemy, id, 0, false);
    return true;
  }

  update(enemy: Enemy, dt: number, ctx: EnemyAttackContext): boolean {
    const run = this.run;
    if (!run) return true;
    const { def, markers } = run;
    const f = enemy.fsm.stateFrame;

    // マーカー（hitStart / hitEnd）。このフレームの判定状態になる
    markerScratch.length = 0;
    markers.advance(f, markerScratch);

    // 予備動作の前半だけ対象へ向きを追う（以降は向き固定）
    if (f <= trackEndFrame(def)) {
      const dx = ctx.target.position.x - enemy.position.x;
      const dz = ctx.target.position.z - enemy.position.z;
      if (Math.hypot(dx, dz) > 1e-3) {
        const rate = (def.trackDegPerSecond ?? ENEMY_ATTACK_RULES.trackDegPerSecond) * DEG;
        enemy.yaw = turnToward(enemy.yaw, yawOf(dx, dz), rate, TURN_RESPONSE, dt);
      }
    }

    const shape = () => sectorShape(enemy.position, enemy.yaw, def.arcDeg, def.range);
    // 発生の最終フレームを判定開始直前の姿勢にして、持続の最初のフレームから前フレームとの間をスイープする
    if (!run.primed && f >= def.startup) {
      this.options.combat.prime(run.attack, shape());
      run.primed = true;
    }
    if (markers.hitActive) {
      this.options.combat.resolve(run.attack, shape());
      // 突進: 持続の間に `moveDistance` を均等に進む（向きは固定されたまま）
      if (def.moveDistance > 0 && def.active > 0) {
        const step = def.moveDistance / def.active;
        enemy.pushBy(Math.sin(enemy.yaw) * step, Math.cos(enemy.yaw) * step);
      }
    }
    // 持続が終わったら強靭度の加算を戻す
    if (f >= def.startup + def.active) this.clearPoise(enemy);

    if (f < totalFrames(def)) return false;

    // 動作の終わり。連続攻撃があれば Attack のまま続ける
    this.options.combat.endAttack(run.attack);
    const next = this.options.planner.followUp?.({
      lastId: run.id,
      chain: run.chain,
      random: this.options.random,
    });
    if (next) {
      this.begin(enemy, next, run.chain + 1, true);
      return false;
    }
    this.run = null;
    this.options.tokens.release(enemy.id);
    return true;
  }

  cancel(enemy: Enemy): void {
    const run = this.run;
    if (run) this.options.combat.endAttack(run.attack);
    this.clearPoise(enemy);
    this.run = null;
    this.options.tokens.release(enemy.id);
  }

  private begin(enemy: Enemy, id: string, chain: number, restart: boolean): void {
    const def = this.options.attacks[id];
    if (!def) throw new RangeError(`未定義の攻撃です: ${id}`);
    const actionId = this.options.actionPrefix + id;
    const markers = new MarkerDispatcher();
    markers.begin(this.options.entryOf(actionId));
    const attack = this.options.combat.startAttack(enemy.id, 'enemy', {
      id: actionId,
      damage: def.damage,
      poiseDamage: def.poiseDamage,
      guardStaminaCost: def.guardStaminaCost,
    });
    this.run = { id, def, actionId, attack, markers, primed: false, chain };
    enemy.currentAttackId = actionId;
    if (restart) enemy.fsm.restart(actionId);
    this.options.poiseOf?.(enemy.id)?.grant(def.poiseBonus ?? POISE.enemyAttackingBonus);
  }

  private clearPoise(enemy: Enemy): void {
    this.options.poiseOf?.(enemy.id)?.clearBonus();
  }
}
