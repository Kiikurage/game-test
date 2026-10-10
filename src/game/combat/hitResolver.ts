import type { HitKind } from '../../core/gameEvents';
import { GUARD, STAGGERED_DAMAGE_MULTIPLIER, guardChipDamage, isHeavyHit } from '../data';
import { vec3, type Capsule, type Vec3 } from './geometry';
import { cloneShape, shapeHitsHeart, type HitShape } from './shapes';

/**
 * 判定・ダメージ解決（仕様書 2.3 / 4.2 節）。プレイヤー・雑魚・ボスの全攻撃がここを通る。
 *
 * 使い方:
 * 1. 被弾側は `HitTarget` を実装して `addTarget` する（`UprightTarget` が標準実装）。
 * 2. 攻撃側は動作開始時に `startAttack` で攻撃インスタンスを作り、持続中（`hitStart`〜`hitEnd`、
 *    `MarkerDispatcher.hitActive`）の毎ステップ `resolve(attack, shape)` を呼ぶ。`shape` は現在の姿勢。
 *    前回の姿勢は攻撃インスタンスが覚えていて、前回 → 今回をスイープする（高速でもすり抜けない）。
 *    最初のステップの前に `prime(attack, shape)` で判定開始直前の姿勢を教えると、初回もスイープになる。
 *    ヒットストップ中は呼ばない（状態を凍結するので前回の姿勢のまま再開する）。
 * 3. 動作が終わったら `endAttack`。
 *
 * 1 スイング 1 ヒット: 攻撃インスタンスごとの命中済み対象集合。無敵中の素通りは集合に入れない
 * （無敵が切れた後のフレームでは当たる）。
 */

export type Team = 'player' | 'enemy';

/** ガード判定の結果（E2-6 が `HitTarget.guard` で返す）。 */
export type GuardOutcome = 'none' | 'guard' | 'just';

export interface GuardQuery {
  /** 攻撃者の位置（足元）と、命中位置。正面 120° の判定は E2-6 がこれで行う。 */
  readonly attackerPosition: Vec3;
  readonly hitPosition: Vec3;
  readonly attack: AttackProfile;
}

/** 被弾側。 */
export interface HitTarget {
  readonly id: string;
  readonly team: Team;
  readonly health: Health;
  /** 被弾判定を持たない（無敵 F・被弾後無敵・起き上がり無敵など）。 */
  readonly invulnerable: boolean;
  /** 強靭度崩し中・ガード崩し中か（被ダメージ 1.5 倍）。 */
  readonly staggered: boolean;
  /** ハートボックス（ワールド座標）。毎ステップ最新の姿勢に更新された参照を返す。 */
  readonly heartboxes: readonly Capsule[];
  /** ガード判定（E2-6 が実装）。なければ常にガードしない。 */
  guard?(query: GuardQuery): GuardOutcome;
}

export class Health {
  current: number;
  constructor(readonly max: number) {
    this.current = max;
  }
  get dead(): boolean {
    return this.current <= 0;
  }
  damage(amount: number): void {
    this.current = Math.max(0, this.current - amount);
  }
  heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }
  refill(): void {
    this.current = this.max;
  }
}

/** 攻撃 1 種の判定上の数値（攻撃定義 `AttackDef` / `EnemyAttackDef` から作る）。 */
export interface AttackProfile {
  readonly id: string;
  /** ダメージ値（整数、乱数なし）。プレイヤーは `attackDamage(攻撃力, 倍率)`、敵は表の値。 */
  readonly damage: number;
  readonly poiseDamage: number;
  /** ガードされたときに防御側が失うスタミナ。 */
  readonly guardStaminaCost?: number;
  /** ガード不能（落下攻撃・強い攻撃など）。 */
  readonly unblockable?: boolean;
  /**
   * 未ガードで命中したときの後退距離（m）の上書き（ボスの盾打ち 3m など）。省略すると被弾側のリアクションの既定
   * （`KNOCKBACK`）。重い被弾（強靭度削り 50 以上）のプレイヤーの転倒にだけ効く。
   */
  readonly knockback?: number;
}

/** 攻撃インスタンス（1 スイング）。命中済み集合と前フレームの姿勢を持つ。 */
export interface ActiveAttack {
  readonly instanceId: number;
  readonly attackerId: string;
  readonly team: Team;
  readonly profile: AttackProfile;
  /** 命中済みの対象 ID。 */
  readonly hitTargets: Set<string>;
  /** 直近に判定した姿勢（デバッグ表示用）。 */
  lastShape: HitShape | null;
  /** 直近に命中したステップからの経過（デバッグ表示用）。 */
  hitFlash: number;
  prevShape: HitShape | null;
}

/** 判定結果。ヒットストップ・被弾リアクション・SE・パーティクルが購読する。 */
export interface HitEvent {
  readonly attackerId: string;
  readonly targetId: string;
  readonly attackId: string;
  readonly attackInstanceId: number;
  /** 実際に HP から引いた値（倍率・ガード削りを反映）。 */
  readonly damage: number;
  /** 攻撃の元のダメージ値。 */
  readonly baseDamage: number;
  /** 被ダメージ倍率（崩し中 1.5、通常 1）。 */
  readonly multiplier: number;
  /** 強靭度削り（ガード成功・ジャストガードでは 0）。 */
  readonly poiseDamage: number;
  /** 攻撃の元の強靭度削り（ガードされても元の値。ガード時の軽・重のノックバック判定に使う）。 */
  readonly attackPoiseDamage: number;
  /** 攻撃側の位置（足元。扇形・カプセルの原点）。ノックバックの方向（攻撃側から被弾側へ）の計算に使う。 */
  readonly attackerPosition: Vec3;
  /** 攻撃定義の後退距離の上書き（`AttackProfile.knockback`）。なければ既定。 */
  readonly knockback?: number;
  readonly guard: GuardOutcome;
  /** ガード成功時に防御側が失うスタミナ（ジャストガードは 50%）。ガードされなければ 0。E2-6 が消費する。 */
  readonly guardStaminaCost: number;
  readonly position: Vec3;
  /** 命中したハートボックスの番号。 */
  readonly hurtboxIndex: number;
  readonly targetHp: number;
  /** この命中で HP が 0 になった（死亡確定。ヒットストップ中でも死亡処理を始める）。 */
  readonly killed: boolean;
  readonly kind: HitKind;
}

export interface HitResolverOptions {
  /** 攻撃者の体から命中位置までを地形・静的物が遮っているか（壁越しに当てない。Rapier のレイキャスト）。 */
  readonly isBlocked?: (from: Vec3, to: Vec3) => boolean;
}

/** ダメージ倍率を掛けた整数ダメージ（四捨五入）。 */
export function scaledDamage(damage: number, multiplier: number): number {
  return Math.round(damage * multiplier);
}

/** ジャストガード時にガード側が失うスタミナ（50%）。 */
export function justGuardStamina(cost: number): number {
  return Math.round((cost * GUARD.justStaminaPercent) / 100);
}

/** 終了した攻撃の残像を残すステップ数（デバッグ表示）。 */
const RECENT_FRAMES = 40;

export class HitResolver {
  private readonly targets = new Map<string, HitTarget>();
  private readonly attacks = new Set<ActiveAttack>();
  private readonly listeners = new Set<(event: HitEvent) => void>();
  private readonly recent: { attack: ActiveAttack; age: number }[] = [];
  private nextInstanceId = 1;
  private readonly contact: Vec3 = vec3();

  constructor(private readonly options: HitResolverOptions = {}) {}

  addTarget(target: HitTarget): void {
    this.targets.set(target.id, target);
  }

  removeTarget(id: string): void {
    this.targets.delete(id);
  }

  /** 登録済みの被弾側（デバッグ表示用）。 */
  get allTargets(): ReadonlyMap<string, HitTarget> {
    return this.targets;
  }

  /** 判定中の攻撃（デバッグ表示用）。 */
  get activeAttacks(): ReadonlySet<ActiveAttack> {
    return this.attacks;
  }

  /** 命中イベントを購読する。戻り値は購読解除。 */
  onHit(listener: (event: HitEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  startAttack(attackerId: string, team: Team, profile: AttackProfile): ActiveAttack {
    const attack: ActiveAttack = {
      instanceId: this.nextInstanceId++,
      attackerId,
      team,
      profile,
      hitTargets: new Set(),
      lastShape: null,
      hitFlash: Number.POSITIVE_INFINITY,
      prevShape: null,
    };
    this.attacks.add(attack);
    return attack;
  }

  endAttack(attack: ActiveAttack): void {
    if (this.attacks.delete(attack) && attack.lastShape) {
      this.recent.push({ attack, age: 0 });
    }
  }

  /** 毎ステップ 1 回呼ぶ。終了した攻撃のデバッグ表示用の残像を古い順に消す。 */
  step(): void {
    for (const r of this.recent) r.age++;
    while (this.recent.length > 0 && (this.recent[0]?.age ?? 0) > RECENT_FRAMES)
      this.recent.shift();
  }

  /** 終了して間もない攻撃（デバッグ表示用。判定には使わない）。 */
  get recentAttacks(): readonly { readonly attack: ActiveAttack; readonly age: number }[] {
    return this.recent;
  }

  /** 判定開始直前の姿勢を教える（最初の `resolve` から前フレーム → 現在のスイープにする）。 */
  prime(attack: ActiveAttack, shape: HitShape): void {
    attack.prevShape = cloneShape(shape);
  }

  /**
   * 現在の姿勢 `shape` で 1 ステップ判定し、新たに命中したぶんの `HitEvent` を返す（購読者にも通知する）。
   * 命中済みの対象・無敵中の対象・死亡済みの対象・同じ陣営の対象・壁の向こうの対象は当たらない。
   */
  resolve(attack: ActiveAttack, shape: HitShape): HitEvent[] {
    const events: HitEvent[] = [];
    const prev = attack.prevShape;
    attack.hitFlash++;
    for (const target of this.targets.values()) {
      if (target.team === attack.team) continue;
      if (attack.hitTargets.has(target.id)) continue;
      if (target.health.dead || target.invulnerable) continue;
      const index = this.findHurtbox(prev, shape, target);
      if (index < 0) continue;
      if (this.options.isBlocked && this.options.isBlocked(rayOrigin(shape), this.contact))
        continue;
      attack.hitTargets.add(target.id);
      attack.hitFlash = 0;
      const event = this.applyHit(attack, shape, target, index);
      events.push(event);
      for (const l of [...this.listeners]) l(event);
    }
    attack.prevShape = cloneInto(attack.prevShape, shape);
    attack.lastShape = attack.prevShape;
    return events;
  }

  private findHurtbox(prev: HitShape | null, shape: HitShape, target: HitTarget): number {
    const boxes = target.heartboxes;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box && shapeHitsHeart(prev, shape, box, this.contact)) return i;
    }
    return -1;
  }

  private applyHit(
    attack: ActiveAttack,
    shape: HitShape,
    target: HitTarget,
    hurtboxIndex: number,
  ): HitEvent {
    const profile = attack.profile;
    const position: Vec3 = { ...this.contact };
    const guard: GuardOutcome = profile.unblockable
      ? 'none'
      : (target.guard?.({
          attackerPosition: shape.origin,
          hitPosition: position,
          attack: profile,
        }) ?? 'none');
    const guardCost = profile.guardStaminaCost ?? 0;
    let multiplier = 1;
    let damage: number;
    let poiseDamage: number;
    let guardStaminaCost = 0;
    if (guard === 'guard') {
      damage = guardChipDamage(profile.damage);
      poiseDamage = 0;
      guardStaminaCost = guardCost;
    } else if (guard === 'just') {
      damage = 0;
      poiseDamage = 0;
      guardStaminaCost = justGuardStamina(guardCost);
    } else {
      multiplier = target.staggered ? STAGGERED_DAMAGE_MULTIPLIER : 1;
      damage = scaledDamage(profile.damage, multiplier);
      poiseDamage = profile.poiseDamage;
    }
    const wasAlive = !target.health.dead;
    target.health.damage(damage);
    return {
      attackerId: attack.attackerId,
      targetId: target.id,
      attackId: profile.id,
      attackInstanceId: attack.instanceId,
      damage,
      baseDamage: profile.damage,
      multiplier,
      poiseDamage,
      attackPoiseDamage: profile.poiseDamage,
      attackerPosition: { x: shape.origin.x, y: shape.origin.y, z: shape.origin.z },
      ...(profile.knockback !== undefined && { knockback: profile.knockback }),
      guard,
      guardStaminaCost,
      position,
      hurtboxIndex,
      targetHp: target.health.current,
      killed: wasAlive && target.health.dead,
      kind: guard === 'none' ? (isHeavyHit(poiseDamage) ? 'heavy' : 'light') : 'guard',
    };
  }
}

/** 壁越し判定の始点。扇形の原点は足元なので胸の高さへ持ち上げる（地面に当たらないように）。 */
const CHEST_Y = 1.0;
const RAY_ORIGIN: Vec3 = vec3();
function rayOrigin(shape: HitShape): Vec3 {
  RAY_ORIGIN.x = shape.origin.x;
  RAY_ORIGIN.y = shape.origin.y + (shape.kind === 'sector' ? CHEST_Y : 0);
  RAY_ORIGIN.z = shape.origin.z;
  return RAY_ORIGIN;
}

/** `into`（なければ複製）へ `shape` の値を写す。種類が変わったら複製し直す。 */
function cloneInto(into: HitShape | null, shape: HitShape): HitShape {
  if (!into || into.kind !== shape.kind) return cloneShape(shape);
  if (into.kind === 'capsule' && shape.kind === 'capsule') {
    into.capsule.a.x = shape.capsule.a.x;
    into.capsule.a.y = shape.capsule.a.y;
    into.capsule.a.z = shape.capsule.a.z;
    into.capsule.b.x = shape.capsule.b.x;
    into.capsule.b.y = shape.capsule.b.y;
    into.capsule.b.z = shape.capsule.b.z;
    into.capsule.radius = shape.capsule.radius;
    into.origin.x = shape.origin.x;
    into.origin.y = shape.origin.y;
    into.origin.z = shape.origin.z;
    return into;
  }
  if (into.kind === 'sector' && shape.kind === 'sector') {
    into.origin.x = shape.origin.x;
    into.origin.y = shape.origin.y;
    into.origin.z = shape.origin.z;
    into.yaw = shape.yaw;
    into.arcDeg = shape.arcDeg;
    into.range = shape.range;
    into.yMin = shape.yMin;
    into.yMax = shape.yMax;
    return into;
  }
  return cloneShape(shape);
}
