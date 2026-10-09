import { Vector3 } from 'three/webgpu';
import { InterpolatedTransform } from '../../core/interpolated';
import type { StateKind } from '../anim/characterFsm';
import { CharacterFsm } from '../anim/characterFsm';
import { GaitClock } from '../anim/locomotion';
import type { AnimMarkerEvent } from '../anim/markerDispatcher';
import {
  ENEMY_AI,
  ENEMY_GAUGE,
  ENEMY_LOCOMOTION,
  ENEMY_STATS,
  ENEMY_VISION,
  type EnemyTypeId,
  type EnemyTypeStats,
  type PlayerMotion,
} from '../data';
import type { LockOnTarget } from '../lockOn/targets';
import { angleDelta, turnToward, yawOf } from '../player/movement';
import type { EnemyBody } from './enemyBody';
import { ENEMY_STATE_GRAPH, isCombatState, type EnemyStateId } from './enemyStates';
import type { Navigator, NavPoint } from './navigation';
import {
  bearing,
  hearingGainPerSecond,
  inVisionCone,
  loudestAudible,
  visualGainPerSecond,
  type LineOfSight,
  type NoiseField,
} from './perception';

const DEG = Math.PI / 180;
const Y_AXIS = new Vector3(0, 1, 0);
/** 向きの合わせ込みの強さ（旋回は角速度の上限で決まるので大きめ）。 */
const TURN_RESPONSE = 40;

/** 敵が毎ステップ見る、追う対象（プレイヤー）。 */
export interface AiTarget {
  /** 足元の位置。 */
  readonly position: Vector3;
  /** 動作の分類（視覚の倍率）。 */
  readonly motion: PlayerMotion;
}

/** 敵の生成情報（レベルデータの `EnemySpawn` から作る）。 */
export interface EnemyInit {
  readonly id: string;
  readonly type: EnemyTypeId;
  /** 出発地点（リーシュと Return の基準）と初期の向き。 */
  readonly x: number;
  readonly z: number;
  readonly yaw: number;
  /** `idle_back` / `wait`: その場で立つ。`patrol`: 向いている方向へ往復する。 */
  readonly behavior: 'idle_back' | 'patrol' | 'wait';
  readonly patrolRadius?: number;
}

/** 敵が外の世界へ頼るもの。 */
export interface EnemyDeps {
  /** 視線が通るか（地形・静的物による遮蔽）。 */
  readonly lineOfSight: LineOfSight;
  readonly navigator: Navigator;
  readonly noises: NoiseField;
  /** (x, z) が暗所か（視覚の倍率 ×0.7）。省略時は常に明るい。 */
  readonly darkness?: (x: number, z: number) => boolean;
  /** 気付いた敵が呼ぶ。味方へ Alert を伝える（`EnemyManager` が実装）。 */
  readonly alertAllies: (source: Enemy) => void;
  /** 乱数（0 以上 1 未満）。テストで固定できる。 */
  readonly random: () => number;
}

/** 攻撃の実行（#54）の差し込み口。既定は何もしない（Approach で待機するだけ）。 */
export interface EnemyAttackBehavior {
  /** Approach で攻撃を選ぶ番になったら呼ばれる。始めるなら true（状態は Attack へ）。 */
  tryStart(enemy: Enemy, ctx: EnemyAttackContext): boolean;
  /** Attack の間、毎ステップ呼ばれる。動作が終わったら true（状態は Recover へ）。 */
  update(enemy: Enemy, dt: number, ctx: EnemyAttackContext): boolean;
}

export interface EnemyAttackContext {
  readonly target: AiTarget;
  /** 対象との水平距離（m）。 */
  readonly distance: number;
}

export const NO_ATTACK: EnemyAttackBehavior = {
  tryStart: () => false,
  update: () => true,
};

/** アニメーション側（`CharacterAnimator`）が読む描画用の状態。 */
export interface EnemyAnimationState {
  readonly state: EnemyStateId;
  readonly kind: StateKind;
  readonly actionId: string | null;
  readonly totalFrames: number;
  readonly gaitPhase: number;
  readonly gaitPhaseStep: number;
  readonly frozen: boolean;
  readonly stateFrame: number;
  readonly speed: number;
  readonly localVelocity: { readonly x: number; readonly z: number };
  /** 戦闘の構え（Sword_Idle）か。 */
  readonly lockedOn: boolean;
  readonly yaw: number;
}

/** デバッグ表示・E2E 用の状態。 */
export interface EnemyDebugInfo {
  readonly id: string;
  readonly state: EnemyStateId;
  readonly stateFrame: number;
  readonly gauge: number;
  readonly lostFrames: number;
  readonly hp: number;
  readonly x: number;
  readonly z: number;
  readonly yaw: number;
  readonly speed: number;
  readonly homeDistance: number;
  readonly lastKnown: { readonly x: number; readonly z: number } | null;
}

interface Sense {
  /** 視認できている（距離・FOV・視線）。 */
  visible: boolean;
  /** 聞こえている音がある。 */
  heard: boolean;
  /** 気付きゲージの増加量（毎秒。視覚と聴覚の大きい方）。 */
  gain: number;
  /** 感知源の位置（見えていればプレイヤー、聞こえただけなら音源）。 */
  sourceX: number;
  sourceZ: number;
}

const tmpEye = new Vector3();
const tmpTarget = new Vector3();
const tmpNav: NavPoint = { x: 0, z: 0 };

/**
 * 雑魚敵の本体: 位置・向き・HP、共通 AI ステートマシン（`ENEMY_STATE_GRAPH`）と知覚。
 * 描画（three のシーン）は知らず、render 側が `transform`（補間用）と `animation` を読んで描く。
 * ロックオン対象（`LockOnTarget`）でもある。
 *
 * 座標: `position` は足元。向き `yaw` は前方 = (sin yaw, cos yaw)。
 *
 * 後続チケットへの口:
 *  - 攻撃（#54）: `attackBehavior` を差し替える（Approach で `tryStart`、Attack 中は `update`）。
 *  - 経路（#43）: `EnemyDeps.navigator` を差し替える。
 *  - 被弾（#50）: `stagger(frames)` / `kill()` / `hp`、プレイヤーへの反応は `provoke()`。
 */
export class Enemy implements LockOnTarget {
  readonly id: string;
  readonly type: EnemyTypeId;
  readonly stats: EnemyTypeStats;
  readonly transform = new InterpolatedTransform();
  readonly fsm = new CharacterFsm<EnemyStateId>(ENEMY_STATE_GRAPH, 'idle');
  /** このステップに発火した足音など（1 ステップごとにクリアされる）。 */
  readonly markerEvents: AnimMarkerEvent[] = [];
  attackBehavior: EnemyAttackBehavior = NO_ATTACK;

  readonly homeX: number;
  readonly homeZ: number;
  readonly homeYaw: number;
  yaw: number;
  hp: number;
  readonly maxHp: number;
  /** 気付きゲージ（0〜100）。 */
  gauge = 0;
  /** 視線（感知）を失ってからのフレーム数。 */
  lostFrames = 0;
  /** 死亡してからのフレーム数。 */
  deadFrames = 0;

  private readonly gait = new GaitClock();
  private readonly lastKnown: NavPoint = { x: 0, z: 0 };
  private hasLastKnown = false;
  private speedNow = 0;
  private desiredSpeed = 0;
  private actualSpeed = 0;
  private readonly worldVelocity = { x: 0, z: 0 };
  private readonly patrolRoute: readonly NavPoint[];
  private patrolIndex = 0;
  private patrolDir = 1;
  private pauseFrames = 0;
  private holdFrames = 0;
  private cooldownFrames = 0;
  private staggerFrames = 0;
  private lastTarget: AiTarget | null = null;
  // Suspicious
  private suspicionOriginX = 0;
  private suspicionOriginZ = 0;
  private investigationDone = false;
  private lookFrames = 0;
  private lookBaseYaw = 0;
  private readonly sense: Sense = { visible: false, heard: false, gain: 0, sourceX: 0, sourceZ: 0 };

  constructor(
    init: EnemyInit,
    readonly body: EnemyBody,
    private readonly deps: EnemyDeps,
  ) {
    this.id = init.id;
    this.type = init.type;
    this.stats = ENEMY_STATS[init.type];
    this.maxHp = this.stats.hp;
    this.hp = this.maxHp;
    this.homeX = init.x;
    this.homeZ = init.z;
    this.homeYaw = init.yaw;
    this.yaw = init.yaw;
    this.patrolRoute = createPatrolRoute(init);
    this.syncTransform();
    this.transform.snap();
  }

  // ---- LockOnTarget ----

  get position(): Vector3 {
    return this.body.feet;
  }

  get height(): number {
    return this.stats.height;
  }

  get alive(): boolean {
    return this.fsm.state !== 'dead';
  }

  get state(): EnemyStateId {
    return this.fsm.state;
  }

  /** 出発地点からの水平距離。 */
  get homeDistance(): number {
    return Math.hypot(this.position.x - this.homeX, this.position.z - this.homeZ);
  }

  /** 描画・アニメーション用の状態。 */
  get animation(): EnemyAnimationState {
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const v = this.worldVelocity;
    return {
      state: this.state,
      kind: this.fsm.kind,
      actionId: this.fsm.actionId,
      totalFrames: 0,
      gaitPhase: this.gait.phase,
      gaitPhaseStep: this.gait.lastDelta,
      frozen: this.fsm.isFrozenStep,
      stateFrame: this.fsm.stateFrame,
      speed: this.actualSpeed,
      localVelocity: { x: -cos * v.x + sin * v.z, z: sin * v.x + cos * v.z },
      lockedOn: isCombatState(this.state),
      yaw: this.yaw,
    };
  }

  /** 最後に感知した位置（なければ null。読み取り専用として扱う）。 */
  get knownPosition(): Readonly<NavPoint> | null {
    return this.hasLastKnown ? this.lastKnown : null;
  }

  get debugInfo(): EnemyDebugInfo {
    return {
      id: this.id,
      state: this.state,
      stateFrame: this.fsm.stateFrame,
      gauge: this.gauge,
      lostFrames: this.lostFrames,
      hp: this.hp,
      x: this.position.x,
      z: this.position.z,
      yaw: this.yaw,
      speed: this.actualSpeed,
      homeDistance: this.homeDistance,
      lastKnown: this.hasLastKnown ? { x: this.lastKnown.x, z: this.lastKnown.z } : null,
    };
  }

  // ---- 外からの操作（後続チケット・味方） ----

  /**
   * 位置が分かった状態で Alert にする（味方の Alert・被弾・ボスの号令など）。
   * Idle / Suspicious のときだけ効く。Alert 以降・Return 中・行動不能では何もしない。
   */
  provoke(x: number, z: number): void {
    if (this.state !== 'idle' && this.state !== 'suspicious') return;
    this.setLastKnown(x, z);
    this.gauge = ENEMY_GAUGE.max;
    this.enterAlert();
  }

  /** `frames` ステップ行動不能にする（ひるみ。#50 が呼ぶ）。 */
  stagger(frames: number): void {
    if (!this.alive) return;
    this.staggerFrames = frames;
    this.fsm.transition('staggered');
  }

  /** 倒す（#40 / #50 が呼ぶ）。衝突体を取り除き、ロックオンは対象を失う。 */
  kill(): void {
    if (!this.alive) return;
    this.hp = 0;
    this.fsm.transition('dead');
    this.desiredSpeed = 0;
    this.body.dispose();
  }

  heal(amount: number): void {
    if (this.alive) this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** 位置・状態を出発地点へ戻す（リスポーン・デバッグ）。 */
  reset(): void {
    this.body.teleport(this.homeX, this.position.y, this.homeZ);
    this.yaw = this.homeYaw;
    this.hp = this.maxHp;
    this.gauge = 0;
    this.lostFrames = 0;
    this.hasLastKnown = false;
    this.speedNow = 0;
    this.actualSpeed = 0;
    this.patrolIndex = 0;
    this.fsm.reset('idle');
    this.syncTransform();
    this.transform.snap();
  }

  // ---- 1 ステップ ----

  /** 1 固定ステップ進める。物理ステップの前に呼ぶ。 */
  update(dt: number, target: AiTarget): void {
    this.transform.beginStep();
    this.markerEvents.length = 0;
    this.lastTarget = target;
    this.desiredSpeed = 0;

    if (this.state === 'dead') {
      this.deadFrames++;
      this.syncTransform();
      return;
    }
    // ヒットストップ中は状態フレーム・移動を含めて止める
    if (this.fsm.consumeFreeze()) {
      this.syncTransform();
      return;
    }
    this.fsm.advance();
    this.perceive(target);

    switch (this.state) {
      case 'idle':
        this.updateIdle(dt);
        break;
      case 'suspicious':
        this.updateSuspicious(dt);
        break;
      case 'alert':
        this.updateAlert(dt);
        break;
      case 'chase':
        this.updateChase(dt, target);
        break;
      case 'approach':
        this.updateApproach(dt, target);
        break;
      case 'attack':
        this.updateAttack(dt, target);
        break;
      case 'recover':
        this.updateRecover(dt, target);
        break;
      case 'return':
        this.updateReturn(dt);
        break;
      case 'staggered':
        if (this.fsm.stateFrame >= this.staggerFrames) this.enterChase();
        break;
    }
    this.integrate(dt);
    this.syncTransform();
  }

  // ---- 知覚 ----

  private perceive(target: AiTarget): void {
    const s = this.sense;
    const feet = this.position;
    const b = bearing(feet, this.yaw, target.position);
    let visualGain = 0;
    s.visible = false;
    const fov = isCombatState(this.state) ? ENEMY_VISION.combatFovDeg : ENEMY_VISION.fovDeg;
    if (inVisionCone(b.distance, b.angleDeg, fov)) {
      tmpEye.set(feet.x, feet.y + ENEMY_VISION.eyeHeight, feet.z);
      tmpTarget.set(
        target.position.x,
        target.position.y + ENEMY_VISION.targetHeight,
        target.position.z,
      );
      const los = this.deps.lineOfSight(tmpEye, tmpTarget);
      s.visible = los;
      visualGain = visualGainPerSecond({
        distance: b.distance,
        angleDeg: b.angleDeg,
        motion: target.motion,
        lineOfSight: los,
        dark: this.deps.darkness?.(feet.x, feet.z) ?? false,
        suspicious: this.state === 'suspicious',
      });
    }
    // 聴覚: 壁越しでも 3D 距離で判定する（足音は足元から鳴るので、基準は敵の足元）
    const audible = loudestAudible(this.deps.noises.active, feet);
    s.heard = audible !== null;
    const hearGain = hearingGainPerSecond(audible);

    // 視覚と聴覚のうち大きい方（加算しない）。感知源は視覚が勝てばプレイヤー、聴覚が勝てば音源。
    s.gain = Math.max(visualGain, hearGain);
    if (s.visible && visualGain >= hearGain) {
      s.sourceX = target.position.x;
      s.sourceZ = target.position.z;
    } else if (audible) {
      s.sourceX = audible.x;
      s.sourceZ = audible.z;
    } else if (s.visible) {
      s.sourceX = target.position.x;
      s.sourceZ = target.position.z;
    }
  }

  private setLastKnown(x: number, z: number): void {
    this.lastKnown.x = x;
    this.lastKnown.z = z;
    this.hasLastKnown = true;
  }

  /** 戦闘中の感知（視認 or 聴取）。感知できていれば最後に知っている位置を更新し、できていなければ見失いを数える。 */
  private trackTarget(): boolean {
    const s = this.sense;
    const sensed = s.visible || s.heard;
    if (sensed) {
      this.lostFrames = 0;
      this.setLastKnown(s.sourceX, s.sourceZ);
    } else {
      this.lostFrames++;
    }
    return sensed;
  }

  /** 戦闘中の共通判定: リーシュ超過と見失いで Return。遷移したら true。 */
  private checkGiveUp(): boolean {
    if (this.homeDistance > ENEMY_AI.leashRadius || this.lostFrames >= ENEMY_AI.lostSightFrames) {
      this.enterReturn();
      return true;
    }
    return false;
  }

  // ---- 状態 ----

  private updateIdle(dt: number): void {
    if (this.updateGauge(dt)) return;
    this.patrol(dt);
  }

  /** ゲージを更新する。遷移（Suspicious / Alert）したら true。 */
  private updateGauge(dt: number): boolean {
    const s = this.sense;
    if (s.gain > 0) {
      this.gauge = Math.min(ENEMY_GAUGE.max, this.gauge + s.gain * dt);
      this.setLastKnown(s.sourceX, s.sourceZ);
      this.investigationDone = false;
      this.lookFrames = 0;
    } else if (this.state !== 'suspicious' || this.investigationDone) {
      // 調べている間は下げない（歩いて到着し、見回し終えてから下がり始める）
      this.gauge = Math.max(0, this.gauge - ENEMY_GAUGE.decayPerSecond * dt);
    }
    if (this.gauge >= ENEMY_GAUGE.max) {
      this.enterAlert();
      return true;
    }
    if (this.state === 'idle' && this.gauge >= ENEMY_GAUGE.suspicious) {
      this.enterSuspicious();
      return true;
    }
    if (this.state === 'suspicious' && this.gauge < ENEMY_GAUGE.suspicious) {
      this.fsm.transition('idle');
      return true;
    }
    return false;
  }

  private enterSuspicious(): void {
    this.fsm.transition('suspicious');
    this.suspicionOriginX = this.position.x;
    this.suspicionOriginZ = this.position.z;
    this.investigationDone = false;
    this.lookFrames = 0;
    this.lookBaseYaw = this.yaw;
  }

  private updateSuspicious(dt: number): void {
    if (this.updateGauge(dt)) return;
    // 感知源へ向かう。歩く距離は最大 6m（出発した位置から）
    let tx = this.lastKnown.x;
    let tz = this.lastKnown.z;
    const ox = this.suspicionOriginX;
    const oz = this.suspicionOriginZ;
    const d = Math.hypot(tx - ox, tz - oz);
    if (d > ENEMY_AI.suspiciousMaxWalk) {
      const k = ENEMY_AI.suspiciousMaxWalk / d;
      tx = ox + (tx - ox) * k;
      tz = oz + (tz - oz) * k;
    }
    const turn = ENEMY_AI.suspiciousTurnDegPerSecond * DEG;
    const remaining = Math.hypot(tx - this.position.x, tz - this.position.z);
    if (remaining > 0.3 && !this.investigationDone) {
      this.lookFrames = 0;
      this.steerTo(tx, tz, ENEMY_AI.suspiciousSpeed, dt, turn);
      this.lookBaseYaw = yawOf(
        this.lastKnown.x - this.position.x,
        this.lastKnown.z - this.position.z,
      );
      return;
    }
    // 到着: 見回す（感知源の方を中心に首を振る）
    this.lookFrames++;
    const sweep =
      Math.sin((this.lookFrames / ENEMY_AI.suspiciousLookPeriodFrames) * Math.PI * 2) *
      ENEMY_AI.suspiciousLookSweepDeg *
      DEG;
    this.yaw = turnToward(this.yaw, this.lookBaseYaw + sweep, turn, TURN_RESPONSE, dt);
    if (this.lookFrames >= ENEMY_AI.suspiciousLookFrames) this.investigationDone = true;
  }

  private enterAlert(): void {
    this.fsm.transition('alert');
    this.gauge = ENEMY_GAUGE.max;
    this.lostFrames = 0;
    this.deps.alertAllies(this);
  }

  private updateAlert(dt: number): void {
    this.trackTarget();
    if (this.hasLastKnown) this.faceToward(this.lastKnown.x, this.lastKnown.z, dt);
    if (this.fsm.stateFrame >= ENEMY_AI.alertFrames) this.enterChase();
  }

  private enterChase(resetLost = true): void {
    this.fsm.transition('chase');
    if (resetLost) this.lostFrames = 0;
    // 不意打ちなどで位置を知らないまま追跡に入るときは、いまの対象の位置を知っていることにする
    if (!this.hasLastKnown && this.lastTarget) {
      this.setLastKnown(this.lastTarget.position.x, this.lastTarget.position.z);
    }
  }

  private updateChase(dt: number, target: AiTarget): void {
    const sensed = this.trackTarget();
    if (this.checkGiveUp()) return;
    const distance = this.distanceTo(target);
    if (sensed && this.sense.visible && distance <= ENEMY_AI.approachRange) {
      this.enterApproach();
      return;
    }
    if (!this.hasLastKnown) return;
    // 見えているあいだは本人へ、見失ったら最後に知っている位置へ（着いたら立ち止まって探す）
    this.steerTo(this.lastKnown.x, this.lastKnown.z, ENEMY_AI.chaseSpeed, dt, this.turnRate);
  }

  private enterApproach(): void {
    this.fsm.transition('approach');
    this.holdFrames = this.randomFrames(ENEMY_AI.holdFrames);
  }

  private updateApproach(dt: number, target: AiTarget): void {
    this.trackTarget();
    if (this.checkGiveUp()) return;
    const distance = this.distanceTo(target);
    if (this.lostFrames > 30 || distance > ENEMY_AI.approachExitRange) {
      this.enterChase(false);
      return;
    }
    if (distance > ENEMY_AI.holdRange) {
      // 近づく（間合いに入るまで）
      this.steerTo(target.position.x, target.position.z, ENEMY_AI.approachSpeed, dt, this.turnRate);
      return;
    }
    // ペースを止めて旋回し、間を取ってから攻撃を選ぶ
    this.faceToward(target.position.x, target.position.z, dt);
    if (this.holdFrames > 0) {
      this.holdFrames--;
      return;
    }
    const ctx: EnemyAttackContext = { target, distance };
    if (this.attackBehavior.tryStart(this, ctx)) {
      this.fsm.transition('attack');
    } else {
      this.holdFrames = this.randomFrames(ENEMY_AI.holdFrames);
    }
  }

  private updateAttack(dt: number, target: AiTarget): void {
    const ctx: EnemyAttackContext = { target, distance: this.distanceTo(target) };
    this.trackTarget();
    if (this.attackBehavior.update(this, dt, ctx)) {
      this.fsm.transition('recover');
      // HP 25% 以下は焦って短い（5.2 節）
      this.cooldownFrames = this.randomFrames(
        this.hp <= this.maxHp * 0.25 ? ENEMY_AI.cooldownFramesDesperate : ENEMY_AI.cooldownFrames,
      );
    }
  }

  private updateRecover(dt: number, target: AiTarget): void {
    this.trackTarget();
    if (this.checkGiveUp()) return;
    this.faceToward(target.position.x, target.position.z, dt);
    if (this.fsm.stateFrame < this.cooldownFrames) return;
    if (this.distanceTo(target) > ENEMY_AI.approachExitRange) this.enterChase(false);
    else this.enterApproach();
  }

  private enterReturn(): void {
    this.fsm.transition('return');
    this.gauge = 0;
    this.lostFrames = 0;
    this.hasLastKnown = false;
  }

  private updateReturn(dt: number): void {
    // Return 中は何にも気付かない（リーシュ境界での往復を防ぐ）。HP は毎秒 20% 回復する。
    this.heal(this.maxHp * ENEMY_AI.returnHealPerSecond * dt);
    const reached = this.steerTo(
      this.homeX,
      this.homeZ,
      ENEMY_AI.returnSpeed,
      dt,
      this.turnRate,
      ENEMY_AI.homeArrivalRadius,
    );
    if (reached) {
      this.fsm.transition('idle');
      this.patrolIndex = 0;
      this.patrolDir = 1;
      this.pauseFrames = 0;
    }
  }

  private patrol(dt: number): void {
    // 向きを出発時へ戻しつつ（帰還直後）、巡回経路があれば歩く
    const route = this.patrolRoute;
    if (route.length < 2) {
      // 調べものなどで持ち場を離れていたら、歩いて戻って元の向きに立つ
      const home = ENEMY_AI.homeArrivalRadius;
      if (this.homeDistance > home) {
        this.steerTo(this.homeX, this.homeZ, ENEMY_AI.patrolSpeed, dt, this.turnRate, home);
      } else {
        this.yaw = turnToward(this.yaw, this.homeYaw, this.turnRate, TURN_RESPONSE, dt);
      }
      return;
    }
    if (this.pauseFrames > 0) {
      this.pauseFrames--;
      return;
    }
    const p = route[this.patrolIndex] as NavPoint;
    const reached = this.steerTo(p.x, p.z, ENEMY_AI.patrolSpeed, dt, this.turnRate, 0.25);
    if (reached) {
      this.pauseFrames = ENEMY_AI.patrolPauseFrames;
      const next = this.patrolIndex + this.patrolDir;
      if (next < 0 || next >= route.length) this.patrolDir = -this.patrolDir;
      this.patrolIndex += this.patrolDir;
    }
  }

  // ---- 移動 ----

  private get turnRate(): number {
    return this.stats.turnDegPerSecond * DEG;
  }

  private distanceTo(target: AiTarget): number {
    return Math.hypot(target.position.x - this.position.x, target.position.z - this.position.z);
  }

  /** 向きだけ対象へ合わせる（立ち止まって旋回）。 */
  private faceToward(x: number, z: number, dt: number, rate = this.turnRate): void {
    const dx = x - this.position.x;
    const dz = z - this.position.z;
    if (Math.hypot(dx, dz) < 1e-3) return;
    this.yaw = turnToward(this.yaw, yawOf(dx, dz), rate, TURN_RESPONSE, dt);
  }

  /**
   * `(x, z)` へ向かう。経路は `Navigator` に問い合わせ、次の点へ向きを合わせながら進む。
   * 向きが大きくずれている間は速度を落とす。着いたら（`arrival` 以内）true。
   */
  private steerTo(
    x: number,
    z: number,
    speed: number,
    dt: number,
    turnRate: number,
    arrival = 0.3,
  ): boolean {
    const dx = x - this.position.x;
    const dz = z - this.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= arrival) return true;
    const next = this.deps.navigator.nextPoint(this.position, { x, z }, tmpNav);
    if (!next) return false;
    const nx = next.x - this.position.x;
    const nz = next.z - this.position.z;
    if (Math.hypot(nx, nz) < 1e-4) return false;
    const heading = yawOf(nx, nz);
    this.yaw = turnToward(this.yaw, heading, turnRate, TURN_RESPONSE, dt);
    const errDeg = Math.abs(angleDelta(this.yaw, heading)) / DEG;
    const full = ENEMY_AI.moveYawFullSpeedDeg;
    const stop = ENEMY_AI.moveYawStopDeg;
    const k = errDeg <= full ? 1 : errDeg >= stop ? 0 : 1 - (errDeg - full) / (stop - full);
    // 目標を行き過ぎない速度に抑える
    this.desiredSpeed = Math.min(speed * k, distance / Math.max(dt, 1e-4));
    return false;
  }

  /** 目標速度へ加減速し、向いている方向へ動かす。 */
  private integrate(dt: number): void {
    const accel = ENEMY_AI.acceleration * dt;
    if (this.speedNow < this.desiredSpeed) {
      this.speedNow = Math.min(this.desiredSpeed, this.speedNow + accel);
    } else {
      this.speedNow = Math.max(this.desiredSpeed, this.speedNow - accel * 2);
    }
    const x0 = this.position.x;
    const z0 = this.position.z;
    if (this.speedNow > 1e-4) {
      this.body.moveBy(
        Math.sin(this.yaw) * this.speedNow * dt,
        Math.cos(this.yaw) * this.speedNow * dt,
      );
    } else {
      this.body.moveBy(0, 0);
    }
    // 実際に動けた速度（壁に押し付けても足が空回りしないよう、描画はこちらを読む）
    const vx = (this.position.x - x0) / dt;
    const vz = (this.position.z - z0) / dt;
    const k = 1 - Math.exp(-dt / 0.04);
    this.worldVelocity.x += (vx - this.worldVelocity.x) * k;
    this.worldVelocity.z += (vz - this.worldVelocity.z) * k;
    this.actualSpeed = Math.hypot(this.worldVelocity.x, this.worldVelocity.z);
    this.gait.advance(this.actualSpeed, dt, {
      profile: ENEMY_LOCOMOTION,
      out: this.markerEvents,
      actionId: 'enemy.locomotion',
    });
  }

  private syncTransform(): void {
    this.transform.position.copy(this.position);
    this.transform.quaternion.setFromAxisAngle(Y_AXIS, this.yaw);
  }

  private randomFrames(range: readonly [number, number]): number {
    const [min, max] = range;
    return min + Math.floor(this.deps.random() * (max - min + 1));
  }
}

/** 配置データから巡回経路を作る。`patrol` は出発地点から向いている方向へ `patrolRadius` だけ往復する。 */
export function createPatrolRoute(init: EnemyInit): readonly NavPoint[] {
  if (init.behavior !== 'patrol') return [];
  const r = init.patrolRadius ?? ENEMY_AI.patrolRadius;
  return [
    { x: init.x, z: init.z },
    { x: init.x + Math.sin(init.yaw) * r, z: init.z + Math.cos(init.yaw) * r },
  ];
}
