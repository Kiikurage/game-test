import { Vector3 } from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { InterpolatedTransform } from '../../core/interpolated';
import type { InputReader, InputSnapshot } from '../../core/input';
import {
  MOVEMENT,
  PLAYER_ACTIONS,
  PLAYER_STATS,
  PLUNGE,
  RUN_ATTACK_MIN_SPEED_RATIO,
  STAMINA,
  inWindow,
  type CancelWindow,
} from '../data';
import { PLAYER_CONTROL } from '../data/playerControl';
import type { Health } from '../combat';
import { HitReactor, PLAYER_REACTOR } from '../combat';
import { CharacterFsm } from '../anim/characterFsm';
import { GaitClock } from '../anim/locomotion';
import { MarkerDispatcher, type AnimMarkerEvent } from '../anim/markerDispatcher';
import type { LockOnTarget } from '../lockOn/targets';
import type { Physics } from '../physics';
import type { Tuning } from '../tuning';
import { PLAYER_GROUPS, SIGHT_QUERY_GROUPS } from '../world/groups';
import {
  approachVelocity,
  cameraRelativeMove,
  yawOf,
  lockOnTargetVelocity,
  speedForMagnitude,
  type Vec2Like,
} from './movement';
import { airCorrection, landStiffnessFrames } from './plunge';
import type { AmbushCandidate, AmbushSource } from './ambush';
import { Flask } from './flask';
import { ForcedWalkInput } from './forcedWalk';
import { DEFAULT_GUARD_PARAMS, GuardCounterWindow, type GuardParams } from './guard';
import {
  PLAYER_STATE_GRAPH,
  type LightAttackId,
  type PlayerAttackId,
  type PlayerStateId,
} from './playerStates';
import { Stamina } from './stamina';

/** プレイヤーが 1 ステップに受け取るもの。 */
export interface PlayerFrame {
  readonly input: InputReader;
  /** カメラのヨー（移動入力の基準方向）。 */
  readonly cameraYaw: number;
  /** ロックオン中の対象（なければ null）。 */
  readonly lockTarget: LockOnTarget | null;
}

/** 状態遷移などの通知（SE・エフェクト・ログ用）。1 ステップごとにクリアされる。 */
export type PlayerEvent =
  | { readonly type: 'rollStart' }
  | { readonly type: 'backstepStart' }
  /** 回復瓶を飲み始めた（F1。瓶 1 本消費済み）。 */
  | { readonly type: 'healStart' }
  /** HP が加算された（F26）。`amount` は実際に増えた HP（最大 HP でクランプ後）。 */
  | { readonly type: 'healApply'; readonly amount: number }
  /** 瓶 0 本での空振り（回復なし・SE のみ）。 */
  | { readonly type: 'healEmpty' }
  | { readonly type: 'attackStart'; readonly id: PlayerAttackId }
  | { readonly type: 'land'; readonly fallHeight: number }
  | { readonly type: 'staminaEmpty' };

/** 状態ごとの更新ハンドラ。遷移先（なければ null）を返す。 */
export type PlayerStateHandler = (
  c: PlayerCore,
  dt: number,
  snap: InputSnapshot,
  frame: PlayerFrame,
) => PlayerStateId | null;

interface ActionCancels {
  readonly cancels: readonly CancelWindow[];
}

const CAPSULE_RADIUS = PLAYER_STATS.hurtCapsule.radius;
const CAPSULE_HEIGHT = PLAYER_STATS.hurtCapsule.height;
/** カプセル中心の足元からの高さ。 */
export const CENTER_Y = CAPSULE_HEIGHT / 2;
export const DEG = Math.PI / 180;
/** 登れる最大傾斜（rad）。これ以上の斜面は滑る（仕様書 2.2 節）。 */
const MAX_SLOPE_RAD = MOVEMENT.maxSlopeDeg * DEG;

/** 軽攻撃の次段（コンボ順）。軽 3 はコンボ終点。 */
export const NEXT_LIGHT: Readonly<Record<LightAttackId, LightAttackId | null>> = {
  light1: 'light2',
  light2: 'light3',
  light3: null,
};

/**
 * プレイヤーの内部状態と、状態ハンドラが共有する処理（`Player` の中身）。
 * 状態ごとの更新は `states/*.ts` のハンドラが、このオブジェクトを読み書きして行う。外からは `Player` 経由で使う。
 */
export class PlayerCore {
  /** 足元の位置と向き（補間描画用）。 */
  readonly transform = new InterpolatedTransform();
  readonly stamina = new Stamina();
  readonly flask = new Flask();
  readonly reactor: HitReactor;
  readonly fsm = new CharacterFsm<PlayerStateId>(PLAYER_STATE_GRAPH, 'idle', {
    cancelsOf: (id) => (PLAYER_ACTIONS as Readonly<Record<string, ActionCancels>>)[id]?.cancels,
  });
  readonly markerEvents: AnimMarkerEvent[] = [];
  readonly markers = new MarkerDispatcher();
  readonly gait = new GaitClock();
  yaw = 0;
  grounded = true;
  /** 水平速度（x, z）。 */
  readonly velocity: Vec2Like = { x: 0, y: 0 };
  verticalVelocity = 0;
  readonly events: PlayerEvent[] = [];

  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  readonly controller: RAPIER.KinematicCharacterController;
  readonly position = new Vector3();
  /** 実際の水平移動速度（壁で止められた分を反映して平滑化）。 */
  readonly actualVelocity: Vec2Like = { x: 0, y: 0 };
  readonly worldMove: Vec2Like = { x: 0, y: 0 };
  readonly tmpVelocity: Vec2Like = { x: 0, y: 0 };
  /** このステップの被弾による押し戻し変位（m）。 */
  readonly slide = { x: 0, z: 0 };
  /** 外から押し出す残りの変位（m）と、残りのステップ数（`shove`。ボスの着地などでめり込みを解く）。 */
  readonly shoveLeft = { x: 0, z: 0, frames: 0 };
  /** 仰け反り・転倒の長さ（フレーム）。 */
  reactionFrames = 0;
  visualY = 0;
  lockedOn = false;
  moveMagnitude = 0;
  toTargetYaw = 0;
  dodgeDirYaw = 0;
  airFrames = 0;
  lastGroundY = 0;
  fallStartY = 0;
  /**
   * 直近の接地中の足元の高さ（8F 分）。縁を踏み出すとき、カプセルの丸みで縁を数 cm〜20cm ほど滑り降りてから
   * 接地が切れるので、落下の始点は「滑り始める前」の最大値とする（`fallStartY`。仕様の高さは踏み出した足場から）。
   */
  readonly groundHistory = new Float64Array(8);
  groundHistoryIndex = 0;
  landFrames = 0;
  /** 落下に入った（踏み出した）ときの水平速度。空中ではこれに入力の補正（±1.5 m/s）を足した速度で動く。 */
  readonly airBase: Vec2Like = { x: 0, y: 0 };
  readonly airTarget: Vec2Like = { x: 0, y: 0 };
  readonly airFix: Vec2Like = { x: 0, y: 0 };
  /** 足元から真下の地面までの距離（m）。地面がなければ null。 */
  readonly groundClearanceProbe: (x: number, y: number, z: number) => number | null;
  /** 落下攻撃の倍率（着地の瞬間に落下高さから決まる。`plunge` の間だけ有効）。 */
  plungeMult = 0;
  /** `Player.plungeTargetNear` を参照。 */
  plungeTargetNear: ((x: number, z: number, radius: number) => boolean) | null = null;
  /** `Player.airLockOnSpeed` を参照。 */
  airLockOnSpeed: number = PLUNGE.airLockCorrection;
  /** ロール終了時にボタンが押されていたら、押している間ダッシュを続ける。 */
  dashLatch = false;
  /** スタミナ切れでダッシュが止まったら、ボタンを離すまで再開しない。 */
  dashLocked = false;
  dashing = false;
  turnRate = 0;
  turnResponse = 0;
  /** 更新した（ヒットストップで凍結されなかった）ステップ数。コンボ窓の経過時間に使う。 */
  stepCount = 0;
  /** 直近に出した軽攻撃と、その開始ステップ（コンボ窓の判定。ロール等で途切れたら null）。 */
  lastAttack: LightAttackId | null = null;
  lastAttackStartStep = 0;
  attackSerial = 0;
  /** 強攻撃のスーパーアーマー（強靭度の加算）を付与中か。窓の頭で 1 回付与し、窓を出たら外す。 */
  armorActive = false;
  /** 溜めがフル（30F）に達して、追加のスタミナ（34 − 28）を消費済みか。 */
  chargeExtraPaid = false;
  /** 状況アクションの長さ（フレーム）と、向ける先（`beginScripted`）。 */
  scriptedFrames = 0;
  scriptedFaceYaw: number | null = null;
  /** 致命の一撃（#115）: 対象の探索と拘束の口。 */
  ambushSource: AmbushSource | null = null;
  ambushReady = false;
  /** 致命の一撃の発動中の対象と、吸着の始点・目標・始点のヨー。 */
  ambushTarget: AmbushCandidate | null = null;
  pendingAmbush: AmbushCandidate | null = null;
  readonly snapStart = { x: 0, z: 0 };
  readonly snapOffset = { x: 0, z: 0 };
  snapYawStart = 0;
  snapYawDelta = 0;
  /** 演出による強制歩行（`beginForcedWalk`）。 */
  forcedWalk: { frames: number; yaw: () => number } | null = null;
  readonly forcedInput = new ForcedWalkInput();

  guardParams: GuardParams = DEFAULT_GUARD_PARAMS;
  /** 構えに入ってからのフレーム（F1 起点）。解除から復帰した場合は構えをやり直さず、ジャストガード窓の後から続く。 */
  guardAge = 0;
  /** ガード被弾のスタンの残り（歩行・解除ができない。ロール・ガードカウンターは可）。 */
  guardStun = 0;
  /** 解除の硬直中に、ボタンを一度離したか（押しっぱなしでの攻撃入力による解除では復帰しない）。 */
  releaseSawUp = false;
  /** 解除からの復帰で入る構えか（構えをやり直さない）。 */
  guardResume = false;
  readonly counterWindow = new GuardCounterWindow(() => this.guardParams.counterWindowFrames);
  guardBreakCount = 0;

  constructor(
    physics: Physics,
    spawn: Vector3,
    yaw: number,
    readonly health: Health,
    readonly tuning: Tuning,
  ) {
    this.reactor = new HitReactor(PLAYER_REACTOR, tuning);
    const { rapier, world } = physics;
    this.groundClearanceProbe = (x, y, z) => {
      // 足元の少し上から真下へ。地形・静的物だけを見る（敵・ターゲットは足場にしない）
      const lift = 0.1;
      const hit = world.castRay(
        new rapier.Ray({ x, y: y + lift, z }, { x: 0, y: -1, z: 0 }),
        PLUNGE.maxHeight + 3,
        true,
        undefined,
        SIGHT_QUERY_GROUPS,
      );
      return hit ? Math.max(0, hit.timeOfImpact - lift) : null;
    };
    this.position.copy(spawn);
    this.yaw = yaw;
    // スタミナが 0 に達した瞬間（動作開始の消費・ダッシュの継続消費・ガード被弾のどれでも）を通知する
    this.stamina.onEmpty(() => {
      this.events.push({ type: 'staminaEmpty' });
    });
    this.lastGroundY = spawn.y;
    this.groundHistory.fill(spawn.y);
    this.visualY = spawn.y;

    this.body = world.createRigidBody(
      rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(
        spawn.x,
        spawn.y + CENTER_Y,
        spawn.z,
      ),
    );
    this.collider = world.createCollider(
      rapier.ColliderDesc.capsule(
        CAPSULE_HEIGHT / 2 - CAPSULE_RADIUS,
        CAPSULE_RADIUS,
      ).setCollisionGroups(PLAYER_GROUPS),
      this.body,
    );

    const c = world.createCharacterController(this.tuning.player.controllerOffset);
    c.setUp({ x: 0, y: 1, z: 0 });
    c.enableAutostep(MOVEMENT.stepHeight, this.tuning.player.autostepMinWidth, false);
    c.enableSnapToGround(this.tuning.player.snapToGround);
    c.setMaxSlopeClimbAngle(MAX_SLOPE_RAD);
    c.setMinSlopeSlideAngle(MAX_SLOPE_RAD);
    c.setSlideEnabled(true);
    c.setApplyImpulsesToDynamicBodies(false);
    this.controller = c;
  }

  get state(): PlayerStateId {
    return this.fsm.state;
  }

  get stateFrame(): number {
    return this.fsm.stateFrame;
  }

  /** 接地が切れてコヨーテ時間を過ぎた（落下へ移る）。 */
  get airborne(): boolean {
    return !this.grounded && this.airFrames > this.tuning.player.coyoteFrames;
  }

  /** 入力の有無で移動系の状態（move / idle）を選ぶ。 */
  idleOrMove(): 'move' | 'idle' {
    return this.moveMagnitude > 0 ? 'move' : 'idle';
  }

  // ---- 動作の開始入力 ----

  /** ガードボタンが押されていて、構えを始められるなら 'guard'（スタミナ 0 では新規に構えられない。2.1 節）。 */
  tryGuard(frame: PlayerFrame, snap: InputSnapshot): 'guard' | null {
    if (!snap.buttons.guard.held || !this.stamina.canStart()) return null;
    // 構え前の古い攻撃入力が残っていて、構えた瞬間に解除されないようにする
    frame.input.clearBuffer('lightAttack');
    frame.input.clearBuffer('heavyAttack');
    return 'guard';
  }

  /** 地上で軽攻撃入力を受けたときに出す動作。前の攻撃のコンボ窓（持続終了 + 4F 〜 全体 + 12F）の中なら次段。 */
  nextComboAttack(): LightAttackId {
    const last = this.lastAttack;
    if (!last) return 'light1';
    const next = NEXT_LIGHT[last];
    const window = PLAYER_ACTIONS[last].cancels.find((c) => c.to === 'lightAttack');
    if (!next || !window) return 'light1';
    const age = this.stepCount - this.lastAttackStartStep + 1;
    return inWindow(age, window) ? next : 'light1';
  }

  /**
   * 地上の軽攻撃入力で出す動作。コンボ窓が残っていれば次段、なければ、ダッシュまたは走り中は走り攻撃、
   * それ以外は軽 1（2.3 節）。
   */
  groundLightAttack(): LightAttackId | 'runAttack' {
    const combo = this.nextComboAttack();
    if (combo !== 'light1') return combo;
    return this.running ? 'runAttack' : 'light1';
  }

  /** ダッシュ中、または走りの速さ（走り最高速の 75% 以上）で動いている。走り攻撃の発動条件。 */
  get running(): boolean {
    if (this.state === 'dash') return true;
    if (this.state !== 'move') return false;
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    return speed >= this.tuning.player.run * RUN_ATTACK_MIN_SPEED_RATIO;
  }

  /** 先行入力（攻撃 10F）を消費して `id` を始める。スタミナ 0 では開始できない（入力は残り、期限で消える）。 */
  tryLightAttack(
    frame: PlayerFrame,
    id: LightAttackId | 'runAttack',
  ): LightAttackId | 'runAttack' | 'backstab' | null {
    if (!frame.input.hasBuffered('lightAttack')) return null;
    // 致命の一撃: 軽 1・走り攻撃になる入力で、動作の開始（F1）に条件を評価する（先行入力でも同じ）。
    // 次段のコンボ（軽 2・3）は対象外。条件を外していれば通常の軽攻撃のまま。
    let actual: LightAttackId | 'runAttack' | 'backstab' = id;
    let ambush: AmbushCandidate | null = null;
    if (id === 'light1' || id === 'runAttack') {
      ambush = this.ambushSource?.find(this.position) ?? null;
      if (ambush) actual = 'backstab';
    }
    if (!this.stamina.canStart(PLAYER_ACTIONS[actual].staminaCost)) return null;
    frame.input.consumeBuffered('lightAttack');
    this.pendingAmbush = ambush;
    return actual;
  }

  /** 先行入力（攻撃 10F）を消費して強攻撃の溜めを始める。スタミナ 0 では開始できない。 */
  tryHeavyAttack(frame: PlayerFrame): 'heavyCharge' | null {
    if (!frame.input.hasBuffered('heavyAttack')) return null;
    if (!this.stamina.canStart(PLAYER_ACTIONS.heavy.staminaCost)) return null;
    frame.input.consumeBuffered('heavyAttack');
    return 'heavyCharge';
  }

  /**
   * 回復瓶（先行入力 6F）。HP が満タンなら入力だけ消費して何もしない（瓶は減らない）。
   * 残数 0 なら空振り動作（20F）。スタミナは不要。
   */
  tryHeal(frame: PlayerFrame): 'heal' | 'healEmpty' | null {
    if (!frame.input.hasBuffered('item')) return null;
    frame.input.consumeBuffered('item');
    if (this.health.current >= this.health.max || this.health.dead) return null;
    return this.flask.available ? 'heal' : 'healEmpty';
  }

  tryDodge(frame: PlayerFrame): PlayerStateId | null {
    if (!frame.input.hasBuffered('dodge')) return null;
    const next = this.moveMagnitude > 0.001 ? 'roll' : 'backstep';
    if (!this.stamina.canStart(PLAYER_ACTIONS[next].staminaCost)) return null;
    frame.input.consumeBuffered('dodge');
    return next;
  }

  afterAttackState(): PlayerStateId {
    if (this.airborne) return 'fall';
    return this.idleOrMove();
  }

  /**
   * 着地。高さ 2.0m 以上は硬直 10F（`Jump_Land` 圧縮）、2.0m 未満は硬直なし（落下ダメージなし）。
   * 高さ 2m 以上の着地は音（半径 6m）を出す（`land` イベント → Game が敵へ）。
   */
  landed(height: number): PlayerStateId {
    this.events.push({ type: 'land', fallHeight: height });
    const frames = landStiffnessFrames(height);
    if (frames > 0) {
      this.landFrames = frames;
      return 'land';
    }
    return this.idleOrMove();
  }

  // ---- 移動 ----

  /** 回復中の移動: 入力方向へ 1.0 m/s（強さに比例）。ロックオン中も同じ（ストレイフはしない）。 */
  driftVelocity(dt: number, maxSpeed: number = MOVEMENT.heal): void {
    const m = this.moveMagnitude;
    const speed = maxSpeed * Math.min(1, m / PLAYER_CONTROL.driftFullInput);
    this.tmpVelocity.x = m > 0 ? (this.worldMove.x / m) * speed : 0;
    this.tmpVelocity.y = m > 0 ? (this.worldMove.y / m) * speed : 0;
    const accel = this.tuning.player.run / (this.tuning.player.accelFrames / 60);
    const decel = this.tuning.player.run / (this.tuning.player.stopFrames / 60);
    approachVelocity(this.velocity, this.tmpVelocity, accel, decel, dt);
  }

  /** 水平速度を止める（行動不能の状態）。旋回もしない。 */
  halt(): void {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.turnRate = 0;
  }

  /**
   * 通常移動（走り・歩き・ダッシュ・ロックオンのストレイフ）の目標速度を決めて速度へ反映する。
   * `speedFactor` は着地硬直などの減速係数。
   */
  computeLocomotion(
    dt: number,
    snap: InputSnapshot,
    frame: PlayerFrame,
    speedFactor: number,
    mode: 'ground' | 'air' | 'land' | 'guard' = 'ground',
  ): void {
    const airborne = mode === 'air';
    const guarding = mode === 'guard';
    const p = this.tuning.player;
    const m = this.moveMagnitude;
    const wantsDash =
      (snap.sprint || this.dashLatch) &&
      m > PLAYER_CONTROL.dashMinInput &&
      !this.dashLocked &&
      this.stamina.canStartAction &&
      !airborne &&
      !guarding &&
      speedFactor >= 1;

    let tx = 0;
    let tz = 0;
    if (m > 0) {
      if (frame.lockTarget) {
        const dashSpeed = p.lockOnDash;
        const scale = wantsDash ? 1 : speedForMagnitude(m, p) / p.run;
        lockOnTargetVelocity(
          this.worldMove,
          this.toTargetYaw,
          wantsDash
            ? { side: dashSpeed, back: dashSpeed }
            : { side: p.lockOnSide, back: p.lockOnBack },
          scale,
          this.tmpVelocity,
        );
        tx = this.tmpVelocity.x;
        tz = this.tmpVelocity.y;
      } else {
        const speed = wantsDash ? p.dash * Math.min(1, m / p.runMinInput) : speedForMagnitude(m, p);
        tx = (this.worldMove.x / m) * speed;
        tz = (this.worldMove.y / m) * speed;
      }
    }
    tx *= speedFactor;
    tz *= speedFactor;
    if (guarding) {
      // ガード中の移動は 1.8 m/s（ロックオン中 1.4 m/s）まで
      const cap = frame.lockTarget ? MOVEMENT.guardLockOn : MOVEMENT.guard;
      const sp = Math.hypot(tx, tz);
      if (sp > cap) {
        tx *= cap / sp;
        tz *= cap / sp;
      }
    }

    const topSpeed = p.run;
    const accel = airborne ? p.airAccel : topSpeed / (p.accelFrames / 60);
    const decel = airborne ? p.airAccel * 0.5 : topSpeed / (p.stopFrames / 60);
    this.tmpVelocity.x = tx;
    this.tmpVelocity.y = tz;
    approachVelocity(this.velocity, this.tmpVelocity, accel, decel, dt);

    if (wantsDash) {
      this.dashing = true;
      if (this.stamina.drain(STAMINA.dashCostPerSecond, dt)) {
        this.dashLocked = true;
        this.dashLatch = false;
      }
    }
    if (mode === 'ground') {
      this.setLocomotionLabel(m <= 0 ? 'idle' : this.dashing ? 'dash' : 'move');
    }
  }

  private setLocomotionLabel(label: 'idle' | 'move' | 'dash'): void {
    if (this.state === label) return;
    this.fsm.transition(label, { frame: 1 });
    this.markers.begin(undefined);
  }

  /**
   * 空中の水平速度: 踏み出し時の速度を保ち、入力で ±1.5 m/s まで補正する。ロックオン対象へは最大
   * `airLockOnSpeed`（2.5 m/s）で寄せる（着地点で敵を捉えやすく）。
   */
  driveAir(dt: number, frame: PlayerFrame): void {
    const lock = frame.lockTarget
      ? {
          dx: frame.lockTarget.position.x - this.position.x,
          dz: frame.lockTarget.position.z - this.position.z,
        }
      : null;
    airCorrection(this.worldMove, lock, this.airLockOnSpeed, this.airFix);
    this.airTarget.x = this.airBase.x + this.airFix.x;
    this.airTarget.y = this.airBase.y + this.airFix.y;
    const accel = this.tuning.player.airAccel;
    approachVelocity(this.velocity, this.airTarget, accel, accel, dt);
  }

  // ---- 状態の後始末 ----

  /** 動作を中断する状態（被弾・ガード崩し・死亡・状況アクション）に入ったときの共通処理。 */
  interrupt(): void {
    this.markers.begin(undefined);
    this.guardStun = 0;
    this.dashing = false;
    this.dashLatch = false;
  }

  /** スポーン・リスポーン・テレポート（`Player.teleport`）。状態・速度・物理ボディを置き直す。 */
  reset(position: Vector3, yaw: number): void {
    this.position.copy(position);
    this.yaw = yaw;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.actualVelocity.x = 0;
    this.actualVelocity.y = 0;
    this.verticalVelocity = 0;
    this.airFrames = 0;
    this.lastGroundY = position.y;
    this.groundHistory.fill(position.y);
    this.fsm.reset('idle');
    this.scriptedFrames = 0;
    this.scriptedFaceYaw = null;
    this.forcedWalk = null;
    this.guardStun = 0;
    this.guardAge = 0;
    this.guardResume = false;
    this.counterWindow.close();
    this.reactor.reset();
    this.armorActive = false;
    this.slide.x = 0;
    this.slide.z = 0;
    this.shoveLeft.frames = 0;
    this.markers.begin(undefined);
    this.gait.reset();
    this.body.setTranslation({ x: position.x, y: position.y + CENTER_Y, z: position.z }, true);
    this.body.setNextKinematicTranslation({
      x: position.x,
      y: position.y + CENTER_Y,
      z: position.z,
    });
  }

  /** 1 ステップの状態更新の前処理（凍結されなかったステップだけ）: 被弾の押し戻し・入力の読み取り・旋回速度の既定値。 */
  beginStep(snap: InputSnapshot, frame: PlayerFrame): void {
    this.stepCount++;
    this.reactor.step();
    this.counterWindow.step();
    this.reactor.consumeSlide(this.slide);
    const shove = this.shoveLeft;
    if (shove.frames > 0) {
      const k = 1 / shove.frames;
      this.slide.x += shove.x * k;
      this.slide.z += shove.z * k;
      shove.x -= shove.x * k;
      shove.z -= shove.z * k;
      shove.frames--;
    }
    cameraRelativeMove(snap.move, frame.cameraYaw, this.worldMove);
    this.moveMagnitude = Math.min(1, Math.hypot(snap.move.x, snap.move.y));
    this.lockedOn = frame.lockTarget !== null;
    if (frame.lockTarget) {
      this.toTargetYaw = yawOf(
        frame.lockTarget.position.x - this.position.x,
        frame.lockTarget.position.z - this.position.z,
      );
    }
    this.turnRate = this.tuning.player.turnDegPerSecond * DEG;
    this.turnResponse = this.tuning.player.turnResponse;
    this.dashing = false;

    // ダッシュのラッチ解除
    if (!snap.sprint && !snap.buttons.dodge.held) {
      this.dashLatch = false;
      this.dashLocked = false;
    }
  }
}
