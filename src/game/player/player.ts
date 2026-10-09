import { Quaternion, Vector3 } from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import { InterpolatedTransform } from '../../core/interpolated';
import type { InputReader, InputSnapshot } from '../../core/input';
import {
  MOVEMENT,
  PLAYER_ACTIONS,
  PLAYER_STATS,
  STAMINA,
  totalFrames,
  type CancelWindow,
} from '../data';
import {
  Health,
  HitReactor,
  PLAYER_REACTOR,
  knockdownInvulnerable,
  type HitEvent,
  type HitReaction,
} from '../combat';
import { CharacterFsm, type StateKind } from '../anim/characterFsm';
import { GaitClock } from '../anim/locomotion';
import { MarkerDispatcher, type AnimMarkerEvent } from '../anim/markerDispatcher';
import { findPlayerClipEvents } from '../anim/playerClips';
import type { LockOnTarget } from '../lockOn/targets';
import type { Physics } from '../physics';
import { tuning } from '../tuning';
import { PLAYER_GROUPS } from '../world/groups';
import {
  approachVelocity,
  cameraRelativeMove,
  dashProfile,
  lockOnTargetVelocity,
  speedForMagnitude,
  turnToward,
  wrapAngle,
  yawOf,
  type Vec2Like,
} from './movement';
import { Flask } from './flask';
import {
  PLAYER_STATE_GRAPH,
  isDodgeState,
  isHealState,
  isReactionState,
  type PlayerStateId,
} from './playerStates';
import { Stamina, type StaminaContext } from './stamina';

export { PLAYER_STATE_GRAPH, isDodgeState, isHealState, isReactionState, type PlayerStateId };

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
  | { readonly type: 'land'; readonly fallHeight: number }
  | { readonly type: 'staminaEmpty' };

/** アニメーション側（`CharacterAnimator`）が読む、状態に依存しない描画用の情報。 */
export interface PlayerAnimationState {
  readonly state: PlayerStateId;
  /** 状態の共通分類（Idle / Move / Action / Stagger / Dead）。 */
  readonly kind: StateKind;
  /** `kind: 'action'` の間の動作 ID（マーカー表は `player.<動作 ID>`）。 */
  readonly actionId: string | null;
  /** 動作の全体フレーム数がマーカー表にない状態（着地など）の長さ。なければ 0。 */
  readonly totalFrames: number;
  /** 歩行サイクルの共通位相（0..1）と、直近 1 ステップでの変化量（逆回しなら負）。 */
  readonly gaitPhase: number;
  readonly gaitPhaseStep: number;
  /** ヒットストップ中（直近のステップが凍結だった）。アニメーションも止める。 */
  readonly frozen: boolean;
  /** 現在の状態に入ってからのフレーム数（F1 起点）。 */
  readonly stateFrame: number;
  /** 水平速度の大きさ（m/s）。 */
  readonly speed: number;
  /** 水平速度を向きの座標系で表したもの。x: 右が正, z: 前が正（m/s）。 */
  readonly localVelocity: { readonly x: number; readonly z: number };
  readonly lockedOn: boolean;
  /** 向き（ヨー）。 */
  readonly yaw: number;
}

interface ActionCancels {
  readonly cancels: readonly CancelWindow[];
}

const CAPSULE_RADIUS = PLAYER_STATS.hurtCapsule.radius;
const CAPSULE_HEIGHT = PLAYER_STATS.hurtCapsule.height;
/** カプセル中心の足元からの高さ。 */
const CENTER_Y = CAPSULE_HEIGHT / 2;
const DEG = Math.PI / 180;
/** 登れる最大傾斜（rad）。これ以上の斜面は滑る（仕様書 2.2 節）。 */
const MAX_SLOPE_RAD = MOVEMENT.maxSlopeDeg * DEG;
const Y_AXIS = new Vector3(0, 1, 0);

const ROLL_PROFILE = dashProfile(
  PLAYER_ACTIONS.roll.moveDistance,
  PLAYER_ACTIONS.roll.startup + PLAYER_ACTIONS.roll.recovery,
  { ramp: 3, hold: 15, end: 28 },
);
const BACKSTEP_PROFILE = dashProfile(
  PLAYER_ACTIONS.backstep.moveDistance,
  PLAYER_ACTIONS.backstep.startup + PLAYER_ACTIONS.backstep.recovery,
  { ramp: 2, hold: 8, end: 20 },
);
const ROLL_FRAMES = ROLL_PROFILE.length;
const BACKSTEP_FRAMES = BACKSTEP_PROFILE.length;

function cancelStart(
  cancels: readonly { to: string; start: number }[],
  to: string,
  fallback: number,
): number {
  return cancels.find((c) => c.to === to)?.start ?? fallback;
}
const ROLL_MOVE_CANCEL = cancelStart(PLAYER_ACTIONS.roll.cancels, 'move', 26);

/**
 * プレイヤー: Rapier のキャラクターコントローラ（カプセル・kinematic）で動く本体。
 * 位置・向き・状態は game 層が持ち、render 層は `transform`（補間用）と `animation` を読んで描くだけ。
 *
 * 座標: `position` は足元。向き `yaw` は前方 = (sin yaw, cos yaw)。
 */
export class Player {
  /** 足元の位置と向き（補間描画用）。 */
  readonly transform = new InterpolatedTransform();
  readonly stamina = new Stamina();
  /** 回復瓶の残数（#48）。 */
  readonly flask = new Flask();
  /** 強靭度・被弾後無敵・押し戻し（#50）。敵と共通の `HitReactor`。 */
  readonly reactor = new HitReactor(PLAYER_REACTOR);

  /** 状態機械（遷移の検証・状態フレーム・キャンセル窓・ヒットストップ）。 */
  readonly fsm = new CharacterFsm<PlayerStateId>(PLAYER_STATE_GRAPH, 'idle', {
    cancelsOf: (id) => (PLAYER_ACTIONS as Readonly<Record<string, ActionCancels>>)[id]?.cancels,
  });
  /** このステップに発火したイベントマーカー（足音・当たり窓・無敵窓など）。1 ステップごとにクリアされる。 */
  readonly markerEvents: AnimMarkerEvent[] = [];
  private readonly markers = new MarkerDispatcher();
  private readonly gait = new GaitClock();
  yaw = 0;
  grounded = true;
  /** 水平速度（x, z）。 */
  readonly velocity: Vec2Like = { x: 0, y: 0 };
  verticalVelocity = 0;
  readonly events: PlayerEvent[] = [];

  private readonly body: RAPIER.RigidBody;
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  private readonly position = new Vector3();
  /** 実際の水平移動速度（壁で止められた分を反映して平滑化）。 */
  private readonly actualVelocity: Vec2Like = { x: 0, y: 0 };
  private readonly worldMove: Vec2Like = { x: 0, y: 0 };
  private readonly tmpVelocity: Vec2Like = { x: 0, y: 0 };
  /** このステップの被弾による押し戻し変位（m）。 */
  private readonly slide = { x: 0, z: 0 };
  /** 仰け反り・転倒の長さ（フレーム）。 */
  private reactionFrames = 0;
  private visualY = 0;
  private lockedOn = false;
  private moveMagnitude = 0;
  private toTargetYaw = 0;
  private dodgeDirYaw = 0;
  private airFrames = 0;
  private lastGroundY = 0;
  private fallStartY = 0;
  private landFrames = 0;
  /** ロール終了時にボタンが押されていたら、押している間ダッシュを続ける。 */
  private dashLatch = false;
  /** スタミナ切れでダッシュが止まったら、ボタンを離すまで再開しない。 */
  private dashLocked = false;
  private dashing = false;
  private turnRate = 0;
  private turnResponse = 0;

  constructor(
    physics: Physics,
    spawn: Vector3,
    yaw: number,
    /** HP（回復の加算先）。Game は被弾側（`playerTarget`）の Health を渡す。 */
    readonly health: Health = new Health(PLAYER_STATS.hp),
  ) {
    const { rapier, world } = physics;
    this.position.copy(spawn);
    this.yaw = yaw;
    // スタミナが 0 に達した瞬間（動作開始の消費・ダッシュの継続消費・ガード被弾のどれでも）を通知する
    this.stamina.onEmpty(() => {
      this.events.push({ type: 'staminaEmpty' });
    });
    this.lastGroundY = spawn.y;
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

    const c = world.createCharacterController(tuning.player.controllerOffset);
    c.setUp({ x: 0, y: 1, z: 0 });
    c.enableAutostep(MOVEMENT.stepHeight, tuning.player.autostepMinWidth, false);
    c.enableSnapToGround(tuning.player.snapToGround);
    c.setMaxSlopeClimbAngle(MAX_SLOPE_RAD);
    c.setMinSlopeSlideAngle(MAX_SLOPE_RAD);
    c.setSlideEnabled(true);
    c.setApplyImpulsesToDynamicBodies(false);
    this.controller = c;

    this.syncTransform();
    this.transform.snap();
  }

  get state(): PlayerStateId {
    return this.fsm.state;
  }

  /** 現在の状態に入ってからのフレーム数（F1 起点）。 */
  get stateFrame(): number {
    return this.fsm.stateFrame;
  }

  /**
   * ヒットストップ: `frames` ステップのあいだ、状態フレーム・移動・アニメーションを凍結する（4.1 節）。
   * 呼ぶのは命中判定側（#40 以降）。次の `update` から効く。
   */
  hitStop(frames: number): void {
    this.fsm.freeze(frames);
  }

  /**
   * 自分宛ての命中（`HitEvent`）を受け取り、強靭度・押し戻し・仰け反り / 転倒・被弾後無敵を処理する（4.3 / 4.4 節）。
   * `(awayX, awayZ)` は攻撃側から自分へ向かう水平方向。命中判定の直後（同じステップ内）に呼ぶ。
   * 反応は即座に状態へ反映する（ヒットストップ中は反応の姿勢で凍結する）。
   */
  receiveHit(event: HitEvent, awayX: number, awayZ: number): HitReaction {
    const reaction = this.reactor.react(event, awayX, awayZ);
    if (reaction.kind === 'flinch' || reaction.kind === 'knockdown') {
      // 転倒中の軽い追撃は転倒を中断しない（被弾後無敵の切れた F37 以降）
      if (!(this.state === 'knockdown' && reaction.kind === 'flinch')) {
        this.enterReaction(reaction.kind, reaction.frames);
      }
    }
    return reaction;
  }

  private enterReaction(kind: 'flinch' | 'knockdown', frames: number): void {
    if (this.state === kind) this.fsm.restart();
    else this.fsm.transition(kind);
    this.markers.begin(undefined);
    this.reactionFrames = frames;
    this.dashing = false;
    this.dashLatch = false;
  }

  /** 物理ボディ（カメラ衝突の問い合わせから除外するのに使う）。 */
  get rigidBody(): RAPIER.RigidBody {
    return this.body;
  }

  /** 指令された水平速度の大きさ（m/s）。壁で止められていても入力どおりの値。 */
  get speed(): number {
    return Math.hypot(this.velocity.x, this.velocity.y);
  }

  /** 足元の位置（読み取り専用として扱う）。 */
  get feet(): Vector3 {
    return this.position;
  }

  /** 無敵フレーム中か（被ダメージ判定を持たない。2.3 節）。窓はイベントマーカー（`invulnStart` / `invulnEnd`）が決める。 */
  get invulnerable(): boolean {
    return (
      this.markers.invulnerable ||
      this.reactor.invulnerable ||
      (this.state === 'knockdown' && knockdownInvulnerable(this.stateFrame))
    );
  }

  /** アニメーション・デバッグ用の描画情報。 */
  get animation(): PlayerAnimationState {
    const v = this.actualVelocity;
    const speed = Math.hypot(v.x, v.y);
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    return {
      state: this.state,
      kind: this.fsm.kind,
      actionId: this.fsm.actionId,
      totalFrames: this.state === 'land' ? this.landFrames : 0,
      gaitPhase: this.gait.phase,
      gaitPhaseStep: this.gait.lastDelta,
      frozen: this.fsm.isFrozenStep,
      stateFrame: this.stateFrame,
      speed,
      localVelocity: {
        x: -cos * v.x + sin * v.y,
        z: sin * v.x + cos * v.y,
      },
      lockedOn: this.lockedOn,
      yaw: this.yaw,
    };
  }

  /** スポーン・リスポーン・テレポート。補間もスナップする。 */
  teleport(position: Vector3, yaw: number): void {
    this.position.copy(position);
    this.yaw = yaw;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.actualVelocity.x = 0;
    this.actualVelocity.y = 0;
    this.verticalVelocity = 0;
    this.airFrames = 0;
    this.lastGroundY = position.y;
    this.fsm.reset('idle');
    this.reactor.reset();
    this.slide.x = 0;
    this.slide.z = 0;
    this.markers.begin(undefined);
    this.gait.reset();
    this.body.setTranslation({ x: position.x, y: position.y + CENTER_Y, z: position.z }, true);
    this.body.setNextKinematicTranslation({
      x: position.x,
      y: position.y + CENTER_Y,
      z: position.z,
    });
    this.syncTransform();
    this.transform.snap();
  }

  /** 1 固定ステップ進める。物理ステップ（`physics.step`）の前に呼ぶ。 */
  update(dt: number, frame: PlayerFrame): void {
    this.transform.beginStep();
    this.events.length = 0;
    this.markerEvents.length = 0;
    // ヒットストップ中は状態フレーム・移動・スタミナ回復を含めて丸ごと止める
    if (this.fsm.consumeFreeze()) {
      this.syncTransform();
      return;
    }
    this.reactor.step();
    this.reactor.consumeSlide(this.slide);
    const snap = frame.input.snapshot;

    cameraRelativeMove(snap.move, frame.cameraYaw, this.worldMove);
    this.moveMagnitude = Math.min(1, Math.hypot(snap.move.x, snap.move.y));
    this.lockedOn = frame.lockTarget !== null;
    if (frame.lockTarget) {
      this.toTargetYaw = yawOf(
        frame.lockTarget.position.x - this.position.x,
        frame.lockTarget.position.z - this.position.z,
      );
    }
    this.turnRate = tuning.player.turnDegPerSecond * DEG;
    this.turnResponse = tuning.player.turnResponse;
    this.dashing = false;

    // ダッシュのラッチ解除
    if (!snap.sprint && !snap.buttons.dodge.held) {
      this.dashLatch = false;
      this.dashLocked = false;
    }

    // 状態更新。遷移した場合は新しい状態の F1 を同じステップ内で実行する（入力から動き出しまで 0 フレーム）。
    for (let i = 0; i < 3; i++) {
      this.fsm.advance();
      const next = this.updateState(dt, snap, frame);
      if (next === null) break;
      this.enterState(next);
    }
    // イベントマーカーは、最終的に落ち着いた状態のフレームで発火する（途中で捨てた状態の分は出さない）
    this.markers.advance(this.fsm.stateFrame, this.markerEvents);
    this.applyHealMarkers();
    this.stampFootstepGait();

    this.applyFacing(frame, dt);
    this.stamina.update(dt, this.staminaContext());
    this.moveBody(dt);
    this.advanceGait(dt);
    this.syncTransform(dt);
  }

  // ---- 状態 ----

  private updateState(dt: number, snap: InputSnapshot, frame: PlayerFrame): PlayerStateId | null {
    switch (this.state) {
      case 'idle':
      case 'move':
      case 'dash':
        return this.updateGround(dt, snap, frame);
      case 'roll':
        return this.updateRoll(snap, frame);
      case 'backstep':
        return this.updateBackstep();
      case 'fall':
        return this.updateFall(dt, snap, frame);
      case 'land':
        return this.updateLand(dt, snap, frame);
      case 'heal':
      case 'healEmpty':
        return this.updateDrinking(this.state, dt, frame);
      case 'flinch':
      case 'knockdown':
        return this.updateReaction();
    }
  }

  private enterState(next: PlayerStateId): void {
    this.fsm.transition(next);
    this.markers.begin(
      this.fsm.actionId ? findPlayerClipEvents(`player.${this.fsm.actionId}`) : undefined,
    );
    switch (next) {
      case 'roll': {
        this.stamina.consume(PLAYER_ACTIONS.roll.staminaCost);
        // 入力方向（カメラ基準）へ。向きは以降の更新で素早く合わせる。
        this.dodgeDirYaw = yawOf(this.worldMove.x, this.worldMove.y);
        this.events.push({ type: 'rollStart' });
        break;
      }
      case 'backstep':
        this.stamina.consume(PLAYER_ACTIONS.backstep.staminaCost);
        this.dodgeDirYaw = wrapAngle(this.yaw + Math.PI);
        this.events.push({ type: 'backstepStart' });
        break;
      case 'fall':
        this.fallStartY = this.lastGroundY;
        break;
      case 'heal':
        // 消費は動作開始（F1）。F26 より前に仰け反ると HP は増えず、瓶だけ失われる。
        this.flask.use();
        this.events.push({ type: 'healStart' });
        break;
      case 'healEmpty':
        this.events.push({ type: 'healEmpty' });
        break;
      default:
        break;
    }
  }

  /** idle / move / dash 共通。 */
  private updateGround(dt: number, snap: InputSnapshot, frame: PlayerFrame): PlayerStateId | null {
    if (!this.grounded && this.airFrames > tuning.player.coyoteFrames) return 'fall';

    // 回避（先行入力を含む）。ボタンを離した瞬間に確定した入力が対象。スタミナ 0 では開始できない。
    const dodge = this.tryDodge(frame);
    if (dodge) return dodge;

    const heal = this.tryHeal(frame);
    if (heal) return heal;

    this.computeLocomotion(dt, snap, frame, 1);
    return null;
  }

  /**
   * 回復瓶（先行入力 6F）。HP が満タンなら入力だけ消費して何もしない（瓶は減らない）。
   * 残数 0 なら空振り動作（20F）。スタミナは不要。
   */
  private tryHeal(frame: PlayerFrame): 'heal' | 'healEmpty' | null {
    if (!frame.input.hasBuffered('item')) return null;
    frame.input.consumeBuffered('item');
    if (this.health.current >= this.health.max || this.health.dead) return null;
    return this.flask.available ? 'heal' : 'healEmpty';
  }

  /** `healApply` マーカー（F26）で HP を加算する。窓は最大 HP でクランプ。 */
  private applyHealMarkers(): void {
    for (const e of this.markerEvents) {
      if (e.type !== 'healApply' || e.actionId !== 'player.heal') continue;
      const before = this.health.current;
      this.health.heal(PLAYER_ACTIONS.heal.healAmount);
      this.events.push({ type: 'healApply', amount: this.health.current - before });
    }
  }

  /**
   * 回復（54F）/ 空振り（20F）。移動 1.0 m/s・向きは通常どおり。回復は F30 からロールへキャンセル可
   * （F1–F25 はロール・攻撃・ガードへ不可。攻撃・ガードは F36 から。各チケットが窓を使って繋ぐ）。
   */
  private updateDrinking(
    id: 'heal' | 'healEmpty',
    dt: number,
    frame: PlayerFrame,
  ): PlayerStateId | null {
    if (this.fsm.canCancelTo('dodge')) {
      const dodge = this.tryDodge(frame);
      if (dodge) return dodge;
    }
    if (this.stateFrame > totalFrames(PLAYER_ACTIONS[id])) return this.afterDrinkState();
    this.driftVelocity(dt);
    return null;
  }

  private afterDrinkState(): PlayerStateId {
    if (!this.grounded && this.airFrames > tuning.player.coyoteFrames) return 'fall';
    return this.moveMagnitude > 0 ? 'move' : 'idle';
  }

  /** 回復中の移動: 入力方向へ 1.0 m/s（強さに比例）。ロックオン中も同じ（ストレイフはしない）。 */
  private driftVelocity(dt: number): void {
    const m = this.moveMagnitude;
    const speed = MOVEMENT.heal * Math.min(1, m / 0.6);
    this.tmpVelocity.x = m > 0 ? (this.worldMove.x / m) * speed : 0;
    this.tmpVelocity.y = m > 0 ? (this.worldMove.y / m) * speed : 0;
    const accel = tuning.player.run / (tuning.player.accelFrames / 60);
    const decel = tuning.player.run / (tuning.player.stopFrames / 60);
    approachVelocity(this.velocity, this.tmpVelocity, accel, decel, dt);
  }

  private tryDodge(frame: PlayerFrame): PlayerStateId | null {
    if (!frame.input.hasBuffered('dodge')) return null;
    const next = this.moveMagnitude > 0.001 ? 'roll' : 'backstep';
    if (!this.stamina.canStart(PLAYER_ACTIONS[next].staminaCost)) return null;
    frame.input.consumeBuffered('dodge');
    return next;
  }

  /**
   * 通常移動（走り・歩き・ダッシュ・ロックオンのストレイフ）の目標速度を決めて速度へ反映する。
   * `speedFactor` は着地硬直などの減速係数。
   */
  private computeLocomotion(
    dt: number,
    snap: InputSnapshot,
    frame: PlayerFrame,
    speedFactor: number,
    mode: 'ground' | 'air' | 'land' = 'ground',
  ): void {
    const airborne = mode === 'air';
    const p = tuning.player;
    const m = this.moveMagnitude;
    const wantsDash =
      (snap.sprint || this.dashLatch) &&
      m > 0.1 &&
      !this.dashLocked &&
      this.stamina.canStartAction &&
      !airborne &&
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

  /** ロール・バックステップの足音は歩様 `roll`（それ以外はマーカーを書いた側の歩様 = 走り）。 */
  private stampFootstepGait(): void {
    if (!isDodgeState(this.state)) return;
    for (let i = 0; i < this.markerEvents.length; i++) {
      const e = this.markerEvents[i];
      if (e && e.type === 'footstep' && e.gait === undefined) {
        this.markerEvents[i] = { ...e, gait: 'roll' };
      }
    }
  }

  /** 歩行サイクルの位相を進める（移動系の状態だけ）。足の接地で `footstep` を発火する。 */
  private advanceGait(dt: number): void {
    const locomoting = this.state === 'idle' || this.state === 'move' || this.state === 'dash';
    if (!locomoting) {
      this.gait.lastDelta = 0;
      return;
    }
    const v = this.actualVelocity;
    const speed = Math.hypot(v.x, v.y);
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const localZ = sin * v.x + cos * v.y;
    const localX = -cos * v.x + sin * v.y;
    const reverse = this.lockedOn && localZ < -0.5 && Math.abs(localZ) > Math.abs(localX);
    this.gait.advance(speed, dt, { reverse, out: this.markerEvents });
  }

  private updateRoll(snap: InputSnapshot, frame: PlayerFrame): PlayerStateId | null {
    const f = this.stateFrame;
    // 向きは入力方向へ素早く合わせる（ロックオン中も、終了後に対象方向へ戻す）
    this.turnRate = tuning.player.rollTurnDegPerSecond * DEG;
    this.turnResponse = 40;

    const dist = ROLL_PROFILE[f - 1] ?? 0;
    this.velocity.x = Math.sin(this.dodgeDirYaw) * dist * 60;
    this.velocity.y = Math.cos(this.dodgeDirYaw) * dist * 60;

    // F26 から回復へキャンセル可（先行入力 6F）。
    if (this.fsm.canCancelTo('heal')) {
      const heal = this.tryHeal(frame);
      if (heal) return heal;
    }

    // F26 から移動へキャンセル可（移動入力があるとき）。入力がなければ F32 まで硬直。
    if (f >= ROLL_FRAMES || (f >= ROLL_MOVE_CANCEL && this.moveMagnitude > 0.001)) {
      return this.afterDodgeState(snap);
    }
    return null;
  }

  private updateBackstep(): PlayerStateId | null {
    const f = this.stateFrame;
    const dist = BACKSTEP_PROFILE[f - 1] ?? 0;
    this.velocity.x = Math.sin(this.dodgeDirYaw) * dist * 60;
    this.velocity.y = Math.cos(this.dodgeDirYaw) * dist * 60;
    // 向きは変えない（ロックオン中は対象を向いたまま）
    this.turnRate = 0;
    if (f >= BACKSTEP_FRAMES) return this.moveMagnitude > 0 ? 'move' : 'idle';
    return null;
  }

  /** ロール終了・キャンセル時の遷移先。ボタンが押されていればダッシュへ（2.3 節）。 */
  private afterDodgeState(snap: InputSnapshot): PlayerStateId {
    if (!this.grounded && this.airFrames > tuning.player.coyoteFrames) return 'fall';
    if (snap.buttons.dodge.held && this.moveMagnitude > 0.1) this.dashLatch = true;
    return this.moveMagnitude > 0 ? (this.dashLatch ? 'dash' : 'move') : 'idle';
  }

  private updateFall(dt: number, snap: InputSnapshot, frame: PlayerFrame): PlayerStateId | null {
    if (this.grounded) {
      const height = this.fallStartY - this.position.y;
      const p = tuning.player;
      if (height >= p.landMinHeight) {
        this.landFrames = height >= p.hardLandHeight ? p.hardLandFrames : p.landFrames;
        this.events.push({ type: 'land', fallHeight: height });
        return 'land';
      }
      this.events.push({ type: 'land', fallHeight: height });
      return this.moveMagnitude > 0 ? 'move' : 'idle';
    }
    this.computeLocomotion(dt, snap, frame, 1, 'air');
    return null;
  }

  private updateLand(dt: number, snap: InputSnapshot, frame: PlayerFrame): PlayerStateId | null {
    if (!this.grounded && this.airFrames > tuning.player.coyoteFrames) return 'fall';
    // 着地の途中からロールで抜けられる
    if (this.stateFrame >= 4) {
      const dodge = this.tryDodge(frame);
      if (dodge) return dodge;
    }
    if (this.stateFrame > this.landFrames) return this.moveMagnitude > 0 ? 'move' : 'idle';
    this.computeLocomotion(dt, snap, frame, tuning.player.landSpeedFactor, 'land');
    return null;
  }

  /** 仰け反り・転倒: 行動不能。押し戻しは `slide` が担う。終わったら移動・待機・落下へ。 */
  private updateReaction(): PlayerStateId | null {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.turnRate = 0;
    if (this.stateFrame > this.reactionFrames) {
      if (!this.grounded && this.airFrames > tuning.player.coyoteFrames) return 'fall';
      return this.moveMagnitude > 0 ? 'move' : 'idle';
    }
    return null;
  }

  // ---- 向き・スタミナ・移動 ----

  private applyFacing(frame: PlayerFrame, dt: number): void {
    if (this.state === 'roll') {
      this.yaw = turnToward(this.yaw, this.dodgeDirYaw, this.turnRate, this.turnResponse, dt);
      return;
    }
    if (this.state === 'backstep' || isReactionState(this.state)) return;

    let target: number | null = null;
    let rate = this.turnRate;
    let response = this.turnResponse;
    if (frame.lockTarget) {
      target = this.toTargetYaw;
      rate = tuning.player.lockOnTurnDegPerSecond * DEG;
      response = tuning.player.lockOnTurnResponse;
    } else if (this.moveMagnitude > 0.001 && this.state !== 'land') {
      target = yawOf(this.worldMove.x, this.worldMove.y);
    }
    if (target !== null) {
      this.yaw = turnToward(this.yaw, target, rate, response, dt);
    }
  }

  /** スタミナ回復に影響する行動。走り・ダッシュ中は回復しない（歩き以下は回復する）。 */
  private staminaContext(): StaminaContext {
    const sprinting =
      this.dashing ||
      (this.state === 'move' &&
        Math.hypot(this.velocity.x, this.velocity.y) > tuning.player.walk + 0.3);
    return { sprinting };
  }

  private moveBody(dt: number): void {
    const p = tuning.player;
    if (this.grounded) {
      // 接地中は下向きの移動量を与えない（与えるとオートステップが働かない）。地面への吸着は snapToGround が担う。
      this.verticalVelocity = 0;
    } else {
      this.verticalVelocity = Math.max(-45, this.verticalVelocity - p.gravity * dt);
    }

    this.controller.setOffset(p.controllerOffset);
    this.controller.computeColliderMovement(
      this.collider,
      {
        x: this.velocity.x * dt + this.slide.x,
        y: this.verticalVelocity * dt,
        z: this.velocity.y * dt + this.slide.z,
      },
      undefined,
      PLAYER_GROUPS,
    );
    const move = this.controller.computedMovement();
    this.position.x += move.x;
    this.position.y += move.y;
    this.position.z += move.z;

    // 実際に動けた速度（壁に押し付けても走りアニメが空回りしないよう、描画側はこちらを読む）
    if (dt > 0) {
      const k = 1 - Math.exp(-dt / 0.04);
      this.actualVelocity.x += (move.x / dt - this.actualVelocity.x) * k;
      this.actualVelocity.y += (move.z / dt - this.actualVelocity.y) * k;
    }

    const wasGrounded = this.grounded;
    this.grounded = this.controller.computedGrounded();
    if (this.grounded) {
      this.airFrames = 0;
      this.lastGroundY = this.position.y;
      if (!wasGrounded) this.verticalVelocity = 0;
    } else {
      this.airFrames++;
    }

    this.body.setNextKinematicTranslation({
      x: this.position.x,
      y: this.position.y + CENTER_Y,
      z: this.position.z,
    });
  }

  /**
   * 描画用の Transform を更新する。段差を自動で乗り越えたときの足元の跳ね上がりは、
   * 見た目だけ短い時定数でならす（物理の位置・カメラの注視点は実位置のまま）。
   */
  private syncTransform(dt = 0): void {
    const dy = this.position.y - this.visualY;
    if (dt > 0 && this.grounded && Math.abs(dy) < 0.6) {
      this.visualY += dy * (1 - Math.exp(-dt / 0.05));
    } else {
      this.visualY = this.position.y;
    }
    this.transform.position.set(this.position.x, this.visualY, this.position.z);
    this.transform.quaternion.copy(yawQuaternion(this.yaw));
  }

  /** 回避確定と同様、後続の戦闘用に外部から行動不能にできる口。 */
  get isActionable(): boolean {
    return (
      this.state !== 'roll' &&
      this.state !== 'backstep' &&
      this.state !== 'land' &&
      !isHealState(this.state) &&
      !isReactionState(this.state)
    );
  }
}

const tmpQuat = new Quaternion();
function yawQuaternion(yaw: number): Quaternion {
  return tmpQuat.setFromAxisAngle(Y_AXIS, yaw);
}
