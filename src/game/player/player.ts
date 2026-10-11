import { Quaternion, Vector3 } from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { InterpolatedTransform } from '../../core/interpolated';
import type { InputReader, InputSnapshot } from '../../core/input';
import {
  AMBUSH,
  HEAVY_CHARGE_MOVE_SPEED,
  HEAVY_FULL_CHARGE_STAMINA_EXTRA,
  MOVEMENT,
  PLAYER_ACTIONS,
  PLAYER_STATS,
  PLUNGE,
  RUN_ATTACK_MIN_SPEED_RATIO,
  STAMINA,
  inWindow,
  totalFrames,
  type CancelWindow,
} from '../data';
import {
  Health,
  HitReactor,
  PLAYER_REACTOR,
  knockdownInvulnerable,
  type GuardOutcome,
  type GuardQuery,
  type HitEvent,
  type HitReaction,
} from '../combat';
import { CharacterFsm, type StateKind } from '../anim/characterFsm';
import { GaitClock } from '../anim/locomotion';
import { MarkerDispatcher, type AnimMarkerEvent } from '../anim/markerDispatcher';
import { findPlayerClipEvents } from '../anim/playerClips';
import type { PlayerAttackInfo } from '../combat/playerAttack';
import type { LockOnTarget } from '../lockOn/targets';
import type { Physics } from '../physics';
import { createTuning, type Tuning } from '../tuning';
import { PLAYER_GROUPS, SIGHT_QUERY_GROUPS } from '../world/groups';
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
import { airCorrection, canStartPlunge, landStiffnessFrames, plungeMultiplier } from './plunge';
import {
  snapDelta,
  snapGoal,
  snapProgress,
  type AmbushCandidate,
  type AmbushSource,
} from './ambush';
import { Flask } from './flask';
import { ForcedWalkInput } from './forcedWalk';
import {
  DEFAULT_GUARD_PARAMS,
  GuardCounterWindow,
  guardOutcomeAt,
  isWithinGuardArc,
  type GuardParams,
} from './guard';
import {
  PLAYER_STATE_GRAPH,
  isAttackState,
  isDodgeState,
  isGuardState,
  isHealState,
  isHeavyAttackState,
  isLightAttackState,
  isReactionState,
  type HeavyAttackId,
  isScriptedState,
  isSeatedState,
  type LightAttackId,
  type PlayerAttackId,
  type PlayerStateId,
} from './playerStates';
import { Stamina, type StaminaContext } from './stamina';

export {
  PLAYER_STATE_GRAPH,
  isAttackState,
  isDodgeState,
  isGuardState,
  isHealState,
  isHeavyAttackState,
  isLightAttackState,
  isReactionState,
  type HeavyAttackId,
  isScriptedState,
  isSeatedState,
  type LightAttackId,
  type PlayerAttackId,
  type PlayerStateId,
};

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

/** 状況アクションの状態（`Player.beginScripted`）。 */
export type ScriptedActionState = 'interact' | 'sitDown' | 'standUp';

export interface ScriptedOptions {
  /** 動作の長さ（フレーム）。この後に次の状態へ移る（interact / standUp は移動系、sitDown は rest）。 */
  readonly frames: number;
  /** この向き（ヨー）へ体を向ける（省略時は今の向きのまま）。 */
  readonly faceYaw?: number;
}

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
  /** ガードの見た目の段階（上半身の盾の構え。ガード系の状態でなければ none）。 */
  readonly guard: GuardPresentation;
}

/**
 * ガードの見た目: `raise` 構え中（F1–構え完了）、`hold` 保持、`hit` 被ガードのスタン中、`release` 解除の硬直、
 * `none` ガードしていない。`frame` は構えに入ってからのフレーム（`hit` では被ガードからのフレーム）。
 */
export interface GuardPresentation {
  readonly phase: 'none' | 'raise' | 'hold' | 'hit' | 'release';
  readonly frame: number;
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
/** 強攻撃の溜めの最大（フレーム）。ボタンをこの長さ以上保持して離すとフル溜め（`heavyCharged`）。 */
const HEAVY_CHARGE_FRAMES = PLAYER_ACTIONS.heavyCharged.chargeFrames;

/** 軽攻撃の次段（コンボ順）。軽 3 はコンボ終点。 */
const NEXT_LIGHT: Readonly<Record<LightAttackId, LightAttackId | null>> = {
  light1: 'light2',
  light2: 'light3',
  light3: null,
};

/**
 * 軽攻撃の前進量の配分（フレームごとの移動距離 m）。発生 + 持続の間に、中ほどを厚く（踏み込み）、
 * 振り終わり（硬直）では止まる。合計が仕様の前進量（0.5 / 0.5 / 1.0 m）になる。
 */
function attackLungeProfile(id: PlayerAttackId): number[] {
  const a = PLAYER_ACTIONS[id];
  const n = a.startup + a.active;
  const w: number[] = [];
  for (let f = 1; f <= n; f++) w.push(Math.sin((Math.PI * (f - 0.5)) / n) ** 1.5);
  const sum = w.reduce((x, y) => x + y, 0);
  return w.map((x) => (x / sum) * a.moveDistance);
}
const LUNGE: Readonly<Record<PlayerAttackId, readonly number[]>> = {
  light1: attackLungeProfile('light1'),
  light2: attackLungeProfile('light2'),
  light3: attackLungeProfile('light3'),
  heavy: attackLungeProfile('heavy'),
  heavyCharged: attackLungeProfile('heavyCharged'),
  runAttack: attackLungeProfile('runAttack'),
  // 致命の一撃は前進ではなく吸着（`updateAmbushSnap`）で動く。この表は使わない
  backstab: [],
  guardCounter: attackLungeProfile('guardCounter'),
  plunge: attackLungeProfile('plunge'),
};

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
  readonly reactor: HitReactor;

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
  /** 外から押し出す残りの変位（m）と、残りのステップ数（`shove`。ボスの着地などでめり込みを解く）。 */
  private readonly shoveLeft = { x: 0, z: 0, frames: 0 };
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
  /**
   * 直近の接地中の足元の高さ（8F 分）。縁を踏み出すとき、カプセルの丸みで縁を数 cm〜20cm ほど滑り降りてから
   * 接地が切れるので、落下の始点は「滑り始める前」の最大値とする（`fallStartY`。仕様の高さは踏み出した足場から）。
   */
  private readonly groundHistory = new Float64Array(8);
  private groundHistoryIndex = 0;
  private landFrames = 0;
  /** 落下に入った（踏み出した）ときの水平速度。空中ではこれに入力の補正（±1.5 m/s）を足した速度で動く。 */
  private readonly airBase: Vec2Like = { x: 0, y: 0 };
  private readonly airTarget: Vec2Like = { x: 0, y: 0 };
  private readonly airFix: Vec2Like = { x: 0, y: 0 };
  /** 足元から真下の地面までの距離（m）。地面がなければ null。 */
  private readonly groundClearanceProbe: (x: number, y: number, z: number) => number | null;
  /** 落下攻撃の倍率（着地の瞬間に落下高さから決まる。`plunge` の間だけ有効）。 */
  private plungeMult = 0;
  /**
   * 落下攻撃を出してよいか（下に敵がいるか）を水平位置と半径で問い合わせる口。`plunge.system.ts` が差し込む。
   * null なら常に可（Player 単体のテスト用）。水路の床板などで「下に敵がいない落下」では落下攻撃を出さない（仕様書 14.1.3 節）。
   */
  plungeTargetNear: ((x: number, z: number, radius: number) => boolean) | null = null;
  /** ロックオン対象への空中補正の上限（m/s）。標準 2.5、入力補助の強は 3.5（11.2 節。適用は E10-4）。 */
  airLockOnSpeed: number = PLUNGE.airLockCorrection;
  /** ロール終了時にボタンが押されていたら、押している間ダッシュを続ける。 */
  private dashLatch = false;
  /** スタミナ切れでダッシュが止まったら、ボタンを離すまで再開しない。 */
  private dashLocked = false;
  private dashing = false;
  private turnRate = 0;
  private turnResponse = 0;
  /** 更新した（ヒットストップで凍結されなかった）ステップ数。コンボ窓の経過時間に使う。 */
  private stepCount = 0;
  /** 直近に出した軽攻撃と、その開始ステップ（コンボ窓の判定。ロール等で途切れたら null）。 */
  private lastAttack: LightAttackId | null = null;
  private lastAttackStartStep = 0;
  private attackSerial = 0;
  /** 強攻撃のスーパーアーマー（強靭度の加算）を付与中か。窓の頭で 1 回付与し、窓を出たら外す。 */
  private armorActive = false;
  /** 溜めがフル（30F）に達して、追加のスタミナ（34 − 28）を消費済みか。 */
  private chargeExtraPaid = false;
  /** 状況アクションの長さ（フレーム）と、向ける先（`beginScripted`）。 */
  private scriptedFrames = 0;
  private scriptedFaceYaw: number | null = null;
  /** 致命の一撃（#115）: 対象の探索と拘束の口（`ambush.system.ts` が Game 起動時に差す）。 */
  ambushSource: AmbushSource | null = null;
  /** いまの入力で致命の一撃が出せる（条件成立中）。剣の縁の光（HUD 表示は出さない）。 */
  ambushReady = false;
  /** 致命の一撃の発動中の対象と、吸着の始点・目標・始点のヨー。 */
  private ambushTarget: AmbushCandidate | null = null;
  private pendingAmbush: AmbushCandidate | null = null;
  private readonly snapStart = { x: 0, z: 0 };
  private readonly snapOffset = { x: 0, z: 0 };
  private snapYawStart = 0;
  private snapYawDelta = 0;
  /** 演出による強制歩行（`beginForcedWalk`）。 */
  private forcedWalk: { frames: number; yaw: () => number } | null = null;
  private readonly forcedInput = new ForcedWalkInput();

  /** ガードのフレーム・窓（入力補助 11.2 節で差し替えられる。実際の差し替えは E10-1）。 */
  guardParams: GuardParams = DEFAULT_GUARD_PARAMS;
  /** 構えに入ってからのフレーム（F1 起点）。解除から復帰した場合は構えをやり直さず、ジャストガード窓の後から続く。 */
  private guardAge = 0;
  /** ガード被弾のスタンの残り（歩行・解除ができない。ロール・ガードカウンターは可）。 */
  private guardStun = 0;
  /** 解除の硬直中に、ボタンを一度離したか（押しっぱなしでの攻撃入力による解除では復帰しない）。 */
  private releaseSawUp = false;
  /** 解除からの復帰で入る構えか（構えをやり直さない）。 */
  private guardResume = false;
  private readonly counterWindow = new GuardCounterWindow(
    () => this.guardParams.counterWindowFrames,
  );
  /** ガードカウンターが出せる間 true（デバッグ・テスト用）。 */
  get guardCounterOpen(): boolean {
    return this.counterWindow.open;
  }
  /** ガードを崩された回数の累計（Game がガード崩しの SE を出す判定に使う）。 */
  guardBreakCount = 0;

  constructor(
    physics: Physics,
    spawn: Vector3,
    yaw: number,
    /** HP（回復の加算先）。Game は被弾側（`playerTarget`）の Health を渡す。 */
    readonly health: Health = new Health(PLAYER_STATS.hp),
    /** 調整値。Game は自分の `tuning` を渡す。 */
    private readonly tuning: Tuning = createTuning(),
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
    if (event.guard !== 'none') {
      this.receiveGuardedHit(event);
      return reaction;
    }
    if (reaction.kind === 'flinch' || reaction.kind === 'knockdown') {
      // 転倒中の軽い追撃は転倒を中断しない（被弾後無敵の切れた F37 以降）。
      // ガード崩し中は姿勢が崩れたまま（行動不能は崩しの 54F が決める。被ダメージ 1.5 倍は崩し中の対象が受ける）。
      if (this.state === 'guardBreak') return reaction;
      if (!(this.state === 'knockdown' && reaction.kind === 'flinch')) {
        this.enterReaction(reaction.kind, reaction.frames);
      }
    }
    return reaction;
  }

  /**
   * ガードされた命中（2.3 節）: スタミナを消費し、被ガードのスタンとカウンター窓を始める。
   * 消費でスタミナが 0 になればガード崩し。ジャストガードはスタンなし（すぐに反撃できる）。
   */
  private receiveGuardedHit(event: HitEvent): void {
    this.stamina.consume(event.guardStaminaCost);
    this.counterWindow.hit();
    if (event.guard === 'guard') this.guardStun = this.guardParams.stunFrames;
    if (this.stamina.empty && this.state === 'guard') this.enterGuardBreak();
  }

  private enterGuardBreak(): void {
    this.fsm.transition('guardBreak');
    this.markers.begin(undefined);
    this.guardStun = 0;
    this.counterWindow.close();
    this.dashing = false;
    this.dashLatch = false;
    this.guardBreakCount++;
  }

  /**
   * ガード判定（`HitTarget.guard`）。構え完了（F6）以降、正面 120° からの攻撃だけ防ぐ。構えに入ってから
   * 10F 以内（F6–F15）ならジャストガード。背面・側面・構え完了前・ガード以外の状態は `none`。
   */
  guardOutcome(query: GuardQuery): GuardOutcome {
    if (this.state !== 'guard') return 'none';
    const params = this.guardParams;
    const outcome = guardOutcomeAt(this.guardAge, params);
    if (outcome === 'none') return 'none';
    const a = query.attackerPosition;
    if (
      !isWithinGuardArc(this.position.x, this.position.z, this.yaw, a.x, a.z, params.frontArcDeg)
    ) {
      return 'none';
    }
    return outcome;
  }

  /** 構えに入ってからのフレーム（ガード系の状態のとき。デバッグ・テスト用）。 */
  get guardFrame(): number {
    return this.guardAge;
  }

  /** ガード被弾のスタンの残りフレーム（デバッグ・テスト用）。 */
  get guardStunRemaining(): number {
    return this.guardStun;
  }

  /** HP が 0 になった。以降は入力を受け付けず、リスポーン（`teleport`）まで動かない。 */
  die(): void {
    if (this.state === 'dead') return;
    this.fsm.transition('dead');
    this.markers.begin(undefined);
    this.reactor.poise.clearBonus();
    this.armorActive = false;
    this.guardStun = 0;
    this.counterWindow.close();
    this.dashing = false;
    this.dashLatch = false;
  }

  get dead(): boolean {
    return this.state === 'dead';
  }

  private enterReaction(kind: 'flinch' | 'knockdown', frames: number): void {
    if (this.state === kind) this.fsm.restart();
    else this.fsm.transition(kind);
    this.markers.begin(undefined);
    this.reactionFrames = frames;
    this.guardStun = 0;
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
      this.state === 'dead' ||
      isSeatedState(this.state) ||
      this.markers.invulnerable ||
      this.reactor.invulnerable ||
      (this.state === 'knockdown' && knockdownInvulnerable(this.stateFrame))
    );
  }

  /** ガード崩し中か（被ダメージ 1.5 倍。`HitTarget.staggered`）。 */
  get guardBroken(): boolean {
    return this.state === 'guardBreak';
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
      totalFrames: this.state === 'land' ? this.landFrames : this.scriptedTotalFrames(),
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
      guard: this.guardPresentation(),
    };
  }

  private scriptedTotalFrames(): number {
    return isScriptedState(this.state) ? this.scriptedFrames : 0;
  }

  /**
   * 状況アクションを始める（「調べる」の動作・座り込み・立ち上がり。インタラクション #55）。
   * 地上の移動系・休憩中から入れる（`rest` からは `standUp` だけ）。ロール・攻撃・被弾などの最中は入れず false。
   * 始めたら入力による移動・攻撃はできない（`frames` 後に自動で次の状態へ）。座っている間は被弾しない。
   * 立ち上がり（`standUp`）は `teleport` の直後（リスポーン）にも始められる。
   */
  beginScripted(state: ScriptedActionState, options: ScriptedOptions): boolean {
    if (this.state === state || !this.fsm.canTransition(state)) return false;
    if (!this.grounded && state !== 'standUp') return false;
    this.fsm.transition(state);
    this.markers.begin(undefined);
    this.scriptedFrames = Math.max(1, Math.floor(options.frames));
    this.scriptedFaceYaw = options.faceYaw ?? null;
    this.lastAttack = null;
    this.dashing = false;
    this.dashLatch = false;
    this.guardStun = 0;
    return true;
  }

  /**
   * 入力を奪って `frames` ステップだけ歩かせる（演出。霧の門の入場）。`yaw` は毎ステップ呼ばれ、歩く向き（ワールドのヨー）を返す。
   * 歩いている間は実入力（ボタン・先行入力）を読まない。死亡・`teleport`・`cancelForcedWalk` で終わる。
   */
  beginForcedWalk(frames: number, yaw: () => number): void {
    this.forcedWalk = { frames: Math.max(1, Math.floor(frames)), yaw };
  }

  cancelForcedWalk(): void {
    this.forcedWalk = null;
  }

  /** 強制歩行中か。 */
  get forcedWalking(): boolean {
    return this.forcedWalk !== null;
  }

  private applyForcedWalk(frame: PlayerFrame): PlayerFrame {
    const forced = this.forcedWalk;
    if (!forced) return frame;
    if (this.dead || forced.frames <= 0) {
      this.forcedWalk = null;
      return frame;
    }
    forced.frames--;
    frame.input.clearBuffer();
    return {
      input: this.forcedInput.aim(forced.yaw(), frame.cameraYaw),
      cameraYaw: frame.cameraYaw,
      lockTarget: null,
    };
  }

  /** 状況アクションの入力を受け付けられるか（地上の移動系、または篝火に座って保持している間）。 */
  get canInteract(): boolean {
    switch (this.state) {
      case 'idle':
      case 'move':
      case 'dash':
        return this.grounded;
      case 'rest':
        return true;
      default:
        return false;
    }
  }

  /** 篝火に座って保持している間（再入力で立ち上がる）。 */
  get resting(): boolean {
    return this.state === 'rest';
  }

  private guardPresentation(): GuardPresentation {
    const params = this.guardParams;
    if (this.state === 'guardRelease') return { phase: 'release', frame: this.stateFrame };
    if (this.state !== 'guard') return { phase: 'none', frame: 0 };
    if (this.guardStun > 0) {
      return { phase: 'hit', frame: params.stunFrames - this.guardStun + 1 };
    }
    return { phase: this.guardAge < params.raiseFrames ? 'raise' : 'hold', frame: this.guardAge };
  }

  /**
   * 水平方向に `(dx, dz)` m を `frames` ステップかけて押し出す（状態は変えない。壁・床の衝突は通常の移動と同じ）。
   * ボスの跳躍の着地でプレイヤーが体に重なったときなどに使う。残りがあれば足し合わせる。
   */
  shove(dx: number, dz: number, frames = 6): void {
    this.shoveLeft.x += dx;
    this.shoveLeft.z += dz;
    this.shoveLeft.frames = Math.max(this.shoveLeft.frames, Math.max(1, Math.round(frames)));
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
    this.syncTransform();
    this.transform.snap();
  }

  /** 1 固定ステップ進める。物理ステップ（`physics.step`）の前に呼ぶ。 */
  update(dt: number, inputFrame: PlayerFrame): void {
    const frame = this.applyForcedWalk(inputFrame);
    this.transform.beginStep();
    this.events.length = 0;
    this.markerEvents.length = 0;
    // ヒットストップ中は状態フレーム・移動・スタミナ回復を含めて丸ごと止める
    if (this.fsm.consumeFreeze()) {
      frame.input.holdBuffer?.(dt); // 先行入力の期限も凍結分だけ延ばす（4.1 節）
      this.syncTransform();
      return;
    }
    this.stepCount++;
    this.reactor.step();
    this.counterWindow.step();
    this.reactor.consumeSlide(this.slide);
    if (this.shoveLeft.frames > 0) {
      const k = 1 / this.shoveLeft.frames;
      this.slide.x += this.shoveLeft.x * k;
      this.slide.z += this.shoveLeft.z * k;
      this.shoveLeft.x -= this.shoveLeft.x * k;
      this.shoveLeft.z -= this.shoveLeft.z * k;
      this.shoveLeft.frames--;
    }
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
    this.turnRate = this.tuning.player.turnDegPerSecond * DEG;
    this.turnResponse = this.tuning.player.turnResponse;
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
    if (this.ambushTarget && this.state !== 'backstab') this.endAmbush();
    this.markers.advance(this.fsm.stateFrame, this.markerEvents);
    this.applyHealMarkers();
    this.applySuperArmor();
    this.stampFootstepGait();
    this.updateAmbushReady();

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
        return this.updateBackstep(frame);
      case 'fall':
        return this.updateFall(dt, snap, frame);
      case 'land':
        return this.updateLand(dt, snap, frame);
      case 'plungeFall':
        return this.updatePlungeFall(dt, frame);
      case 'plunge':
        return this.updatePlunge();
      case 'light1':
      case 'light2':
      case 'light3':
      case 'heavy':
      case 'heavyCharged':
      case 'runAttack':
      case 'guardCounter':
      case 'backstab':
        return this.updateAttack(this.state, frame);
      case 'heavyCharge':
        return this.updateHeavyCharge(dt, snap, frame);
      case 'heal':
      case 'healEmpty':
        return this.updateDrinking(this.state, dt, frame);
      case 'flinch':
      case 'knockdown':
        return this.updateReaction();
      case 'guard':
        return this.updateGuard(dt, snap, frame);
      case 'guardRelease':
        return this.updateGuardRelease(dt, snap, frame);
      case 'guardBreak':
        return this.updateGuardBreak();
      case 'interact':
      case 'sitDown':
      case 'rest':
      case 'standUp':
        return this.updateScripted(dt);
      case 'dead':
        // 倒れたまま動かない
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.turnRate = 0;
        return null;
    }
  }

  private enterState(next: PlayerStateId): void {
    this.fsm.transition(next);
    this.markers.begin(
      this.fsm.actionId ? findPlayerClipEvents(`player.${this.fsm.actionId}`) : undefined,
    );
    switch (next) {
      case 'roll': {
        this.lastAttack = null;
        this.stamina.consume(PLAYER_ACTIONS.roll.staminaCost);
        // 入力方向（カメラ基準）へ。向きは以降の更新で素早く合わせる。
        this.dodgeDirYaw = yawOf(this.worldMove.x, this.worldMove.y);
        this.events.push({ type: 'rollStart' });
        break;
      }
      case 'backstep':
        this.lastAttack = null;
        this.stamina.consume(PLAYER_ACTIONS.backstep.staminaCost);
        this.dodgeDirYaw = wrapAngle(this.yaw + Math.PI);
        this.events.push({ type: 'backstepStart' });
        break;
      case 'fall':
        this.fallStartY = Math.max(this.lastGroundY, ...this.groundHistory);
        this.airBase.x = this.velocity.x;
        this.airBase.y = this.velocity.y;
        break;
      case 'plungeFall':
        // 入力時にスタミナ 20 を消費する。踏み出しの速度（airBase）と落下の始点はそのまま引き継ぐ
        this.lastAttack = null;
        this.stamina.consume(PLUNGE.staminaMin);
        break;
      case 'plunge':
        this.lastAttack = null;
        this.attackSerial++;
        this.events.push({ type: 'attackStart', id: next });
        break;
      case 'heal':
        this.lastAttack = null;
        // 消費は動作開始（F1）。F26 より前に仰け反ると HP は増えず、瓶だけ失われる。
        this.flask.use();
        this.events.push({ type: 'healStart' });
        break;
      case 'healEmpty':
        this.events.push({ type: 'healEmpty' });
        break;
      case 'light1':
      case 'light2':
      case 'light3': {
        const data = PLAYER_ACTIONS[next];
        this.stamina.consume(data.staminaCost);
        this.lastAttack = next;
        this.lastAttackStartStep = this.stepCount;
        this.attackSerial++;
        this.events.push({ type: 'attackStart', id: next });
        break;
      }
      case 'heavyCharge':
        // スタミナは溜め開始時に 28（溜めなしの値）を消費し、フル溜めに達した時点で差分（+6 = 計 34）を消費する。
        this.lastAttack = null;
        this.stamina.consume(PLAYER_ACTIONS.heavy.staminaCost);
        this.chargeExtraPaid = false;
        break;
      case 'heavy':
      case 'heavyCharged':
        // 消費は溜め開始時（`heavyCharge`）に済んでいる。ここは発生（F1）。
        this.lastAttack = null;
        this.attackSerial++;
        this.events.push({ type: 'attackStart', id: next });
        break;
      case 'runAttack':
        this.lastAttack = null;
        this.stamina.consume(PLAYER_ACTIONS.runAttack.staminaCost);
        this.attackSerial++;
        this.events.push({ type: 'attackStart', id: next });
        break;
      case 'backstab':
        this.lastAttack = null;
        this.stamina.consume(PLAYER_ACTIONS.backstab.staminaCost);
        this.attackSerial++;
        this.beginAmbush();
        this.events.push({ type: 'attackStart', id: next });
        break;
      case 'guardCounter':
        this.lastAttack = null;
        this.stamina.consume(PLAYER_ACTIONS.guardCounter.staminaCost);
        this.counterWindow.close();
        this.guardStun = 0;
        this.attackSerial++;
        this.events.push({ type: 'attackStart', id: next });
        break;
      case 'guard':
        this.lastAttack = null;
        this.guardStun = 0;
        this.guardAge = this.guardResume ? this.guardParams.justWindow.end : 0;
        if (!this.guardResume) this.counterWindow.close();
        this.guardResume = false;
        break;
      case 'guardRelease':
        this.guardStun = 0;
        break;
      default:
        break;
    }
  }

  /** idle / move / dash 共通。 */
  private updateGround(dt: number, snap: InputSnapshot, frame: PlayerFrame): PlayerStateId | null {
    if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';

    // 回避（先行入力を含む）。ボタンを離した瞬間に確定した入力が対象。スタミナ 0 では開始できない。
    const dodge = this.tryDodge(frame);
    if (dodge) return dodge;

    // 軽攻撃（先行入力を含む）。コンボ窓が残っていれば次段、なければ（走り中なら走り攻撃、でなければ）軽 1。
    const attack = this.tryLightAttack(frame, this.groundLightAttack());
    if (attack) return attack;

    // 強攻撃（溜め開始。ボタンを離した時点で発生へ）
    const heavy = this.tryHeavyAttack(frame);
    if (heavy) return heavy;

    // ガード（保持入力。行動不能中に押していても、動作可能になった瞬間に構える）
    const guard = this.tryGuard(frame, snap);
    if (guard) return guard;

    const heal = this.tryHeal(frame);
    if (heal) return heal;

    this.computeLocomotion(dt, snap, frame, 1);
    return null;
  }

  /** ガードボタンが押されていて、構えを始められるなら 'guard'（スタミナ 0 では新規に構えられない。2.1 節）。 */
  private tryGuard(frame: PlayerFrame, snap: InputSnapshot): 'guard' | null {
    if (!snap.buttons.guard.held || !this.stamina.canStart()) return null;
    // 構え前の古い攻撃入力が残っていて、構えた瞬間に解除されないようにする
    frame.input.clearBuffer('lightAttack');
    frame.input.clearBuffer('heavyAttack');
    return 'guard';
  }

  /** 地上で軽攻撃入力を受けたときに出す動作。前の攻撃のコンボ窓（持続終了 + 4F 〜 全体 + 12F）の中なら次段。 */
  private nextComboAttack(): LightAttackId {
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
  private groundLightAttack(): LightAttackId | 'runAttack' {
    const combo = this.nextComboAttack();
    if (combo !== 'light1') return combo;
    return this.running ? 'runAttack' : 'light1';
  }

  /** ダッシュ中、または走りの速さ（走り最高速の 75% 以上）で動いている。走り攻撃の発動条件。 */
  private get running(): boolean {
    if (this.state === 'dash') return true;
    if (this.state !== 'move') return false;
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    return speed >= this.tuning.player.run * RUN_ATTACK_MIN_SPEED_RATIO;
  }

  /** 先行入力（攻撃 10F）を消費して `id` を始める。スタミナ 0 では開始できない（入力は残り、期限で消える）。 */
  private tryLightAttack(
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

  /** 致命の一撃の発動（F1）: 対象を拘束し、吸着の始点・向きを決める。 */
  private beginAmbush(): void {
    const target = this.pendingAmbush;
    this.pendingAmbush = null;
    this.ambushTarget = target;
    if (!target) return;
    this.ambushSource?.begin(target);
    this.snapStart.x = this.position.x;
    this.snapStart.z = this.position.z;
    snapGoal(target.position, target.yaw, this.snapOffset);
    snapDelta(this.snapStart, this.snapOffset, this.snapOffset);
    // 吸着後に対象の背中を向く
    const goalX = this.snapStart.x + this.snapOffset.x;
    const goalZ = this.snapStart.z + this.snapOffset.z;
    this.snapYawStart = this.yaw;
    this.snapYawDelta = wrapAngle(
      yawOf(target.position.x - goalX, target.position.z - goalZ) - this.yaw,
    );
  }

  private endAmbush(): void {
    const target = this.ambushTarget;
    this.ambushTarget = null;
    if (target) this.ambushSource?.end(target);
  }

  /** 条件が成立している間だけ true（地上で動作可能なとき）。剣の縁の光に使う。 */
  private updateAmbushReady(): void {
    const s = this.state;
    this.ambushReady =
      this.ambushSource !== null &&
      (s === 'idle' || s === 'move' || s === 'dash') &&
      this.stamina.canStart(PLAYER_ACTIONS.backstab.staminaCost) &&
      this.ambushSource.find(this.position) !== null;
  }

  /**
   * 吸着: 動作の最初の 6F で、対象の背後 0.9m へ（最大 1.2m の補正）寄り、対象の背中を向く。
   * 毎ステップ「進み具合に対応する位置」との差分を速度にして、壁・地形には衝突判定が従う。
   */
  private updateAmbushSnap(dt: number): void {
    const f = this.stateFrame;
    this.velocity.x = 0;
    this.velocity.y = 0;
    if (!this.ambushTarget || f > AMBUSH.snapFrames) return;
    const k = snapProgress(f);
    const wantX = this.snapStart.x + this.snapOffset.x * k;
    const wantZ = this.snapStart.z + this.snapOffset.z * k;
    this.velocity.x = (wantX - this.position.x) / dt;
    this.velocity.y = (wantZ - this.position.z) / dt;
    this.yaw = wrapAngle(this.snapYawStart + this.snapYawDelta * k);
  }

  /** 先行入力（攻撃 10F）を消費して強攻撃の溜めを始める。スタミナ 0 では開始できない。 */
  private tryHeavyAttack(frame: PlayerFrame): 'heavyCharge' | null {
    if (!frame.input.hasBuffered('heavyAttack')) return null;
    if (!this.stamina.canStart(PLAYER_ACTIONS.heavy.staminaCost)) return null;
    frame.input.consumeBuffered('heavyAttack');
    return 'heavyCharge';
  }

  /**
   * 強攻撃の溜め: ボタンを保持している間、歩き 1.0 m/s で動ける。離した時点で発生へ（保持したフレーム数が
   * 30 未満なら溜めなし `heavy`、30 以上ならフル溜め `heavyCharged`）。フル溜めに達した時点でスタミナの差分を消費する。
   * 溜め中もロール/バックステップで抜けられる（溜めはまだ攻撃の動作ではないため）。
   */
  private updateHeavyCharge(
    dt: number,
    snap: InputSnapshot,
    frame: PlayerFrame,
  ): PlayerStateId | null {
    if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';
    const dodge = this.tryDodge(frame);
    if (dodge) return dodge;
    // F1 = 入力のステップ。ボタンを保持したステップ数 = stateFrame − 1（離した時点のステップは数えない）
    if (!snap.buttons.heavyAttack.held) {
      return this.stateFrame - 1 >= HEAVY_CHARGE_FRAMES ? 'heavyCharged' : 'heavy';
    }
    if (this.stateFrame >= HEAVY_CHARGE_FRAMES && !this.chargeExtraPaid) {
      this.chargeExtraPaid = true;
      this.stamina.consume(HEAVY_FULL_CHARGE_STAMINA_EXTRA);
    }
    this.driftVelocity(dt, HEAVY_CHARGE_MOVE_SPEED);
    return null;
  }

  /** 溜めに入ってからのステップ数（デバッグ・テスト用。溜め中でなければ 0）。 */
  get chargeFrames(): number {
    return this.state === 'heavyCharge' ? this.stateFrame : 0;
  }

  /**
   * 強攻撃のスーパーアーマー（2.3 節）: 発生 F6 から持続終了まで、強靭度に `poiseBonus`（+40）を加える。
   * 窓の頭で 1 回 `grant`、窓を出たら（状態が変わって被弾で崩れた場合も含め）`clearBonus`。
   * 加算分は被弾で先に削られるので、崩れない限り仰け反らない（`HitReactor`）。
   */
  private applySuperArmor(): void {
    const state = this.state;
    const armor = isHeavyAttackState(state) ? PLAYER_ACTIONS[state].superArmor : undefined;
    const wanted = armor !== undefined && inWindow(this.stateFrame, armor);
    if (wanted && !this.armorActive) {
      this.reactor.poise.grant(armor.poiseBonus);
      this.armorActive = true;
    } else if (!wanted && this.armorActive) {
      this.reactor.poise.clearBonus();
      this.armorActive = false;
    }
  }

  /**
   * 軽攻撃（light1〜3）。前進（発生 + 持続の間）・旋回制限・キャンセル（ロール / 次段）・終了。
   * 動作の全体（発生 + 持続 + 硬直）が終わった次のステップで移動系へ戻り、そのステップから入力を受け付ける。
   */
  private updateAttack(id: PlayerAttackId, frame: PlayerFrame): PlayerStateId | null {
    const f = this.stateFrame;
    const data = PLAYER_ACTIONS[id];

    // 前進: 向いている方向へ、モーションの踏み込み量だけ（硬直中は止まる）。致命の一撃は吸着
    if (id === 'backstab') {
      this.updateAmbushSnap(1 / 60);
    } else {
      const dist = LUNGE[id][f - 1] ?? 0;
      this.velocity.x = Math.sin(this.yaw) * dist * 60;
      this.velocity.y = Math.cos(this.yaw) * dist * 60;
    }

    // キャンセル: ロール / バックステップ（持続終了の 2F 後〜）、次段の軽攻撃（持続終了 + 4F 〜 全体 + 12F）
    if (this.fsm.canCancelTo('dodge')) {
      const dodge = this.tryDodge(frame);
      if (dodge) return dodge;
    }
    const next = isLightAttackState(id) ? NEXT_LIGHT[id] : null;
    if (next && this.fsm.canCancelTo('lightAttack')) {
      const chain = this.tryLightAttack(frame, next);
      if (chain) return chain;
    }
    // 軽攻撃の窓から強攻撃へ（軽 1 → 強、軽 2 → 強、軽 3 の後も可）
    if (isLightAttackState(id) && this.fsm.canCancelTo('heavyAttack')) {
      const heavy = this.tryHeavyAttack(frame);
      if (heavy) return heavy;
    }
    // ガード: 持続終了の 6F 後から（軽攻撃のキャンセル窓）
    if (this.fsm.canCancelTo('guard')) {
      const guard = this.tryGuard(frame, frame.input.snapshot);
      if (guard) return guard;
    }

    if (f > totalFrames(data)) return this.afterAttackState();
    return null;
  }

  private afterAttackState(): PlayerStateId {
    if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';
    return this.moveMagnitude > 0 ? 'move' : 'idle';
  }

  /** 攻撃判定との接続用: いま出している軽攻撃（なければ null）。`PlayerAttackDriver` が読む。 */
  get attack(): PlayerAttackInfo | null {
    if (!isAttackState(this.state)) return null;
    return {
      id: this.state,
      serial: this.attackSerial,
      frame: this.stateFrame,
      // 落下攻撃はマーカー表を持たない: 着地の F1〜F4（持続 4F）が当たり窓
      hitActive:
        this.state === 'plunge'
          ? this.stateFrame <= PLAYER_ACTIONS.plunge.active
          : this.markers.hitActive,
      ...(this.state === 'plunge' && { plungeMultiplier: this.plungeMult }),
    };
  }

  /** 直近のステップがヒットストップで凍結されたか。 */
  get frozen(): boolean {
    return this.fsm.isFrozenStep;
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

  /** `healApply` マーカー（F26）で HP を加算する。最大 HP でクランプ。 */
  private applyHealMarkers(): void {
    for (const e of this.markerEvents) {
      if (e.type !== 'healApply' || e.actionId !== 'player.heal') continue;
      const before = this.health.current;
      this.health.heal(PLAYER_ACTIONS.heal.healAmount);
      this.events.push({ type: 'healApply', amount: this.health.current - before });
    }
  }

  /**
   * 回復（54F）/ 空振り（20F）。移動 1.0 m/s・向きは通常どおり。回復は F30 からロール、F36 から攻撃へ
   * キャンセル可（F1–F25 はロール・攻撃・ガードへ不可）。F36 からはガードへもキャンセル可。
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
    if (this.fsm.canCancelTo('lightAttack')) {
      const attack = this.tryLightAttack(frame, 'light1');
      if (attack) return attack;
    }
    if (this.fsm.canCancelTo('heavyAttack')) {
      const heavy = this.tryHeavyAttack(frame);
      if (heavy) return heavy;
    }
    // F36 からガードへキャンセル可（ボタン保持）
    if (this.fsm.canCancelTo('guard')) {
      const guard = this.tryGuard(frame, frame.input.snapshot);
      if (guard) return guard;
    }
    if (this.stateFrame > totalFrames(PLAYER_ACTIONS[id])) return this.afterAttackState();
    this.driftVelocity(dt);
    return null;
  }

  /** 回復中の移動: 入力方向へ 1.0 m/s（強さに比例）。ロックオン中も同じ（ストレイフはしない）。 */
  private driftVelocity(dt: number, maxSpeed: number = MOVEMENT.heal): void {
    const m = this.moveMagnitude;
    const speed = maxSpeed * Math.min(1, m / 0.6);
    this.tmpVelocity.x = m > 0 ? (this.worldMove.x / m) * speed : 0;
    this.tmpVelocity.y = m > 0 ? (this.worldMove.y / m) * speed : 0;
    const accel = this.tuning.player.run / (this.tuning.player.accelFrames / 60);
    const decel = this.tuning.player.run / (this.tuning.player.stopFrames / 60);
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
    mode: 'ground' | 'air' | 'land' | 'guard' = 'ground',
  ): void {
    const airborne = mode === 'air';
    const guarding = mode === 'guard';
    const p = this.tuning.player;
    const m = this.moveMagnitude;
    const wantsDash =
      (snap.sprint || this.dashLatch) &&
      m > 0.1 &&
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
    const locomoting =
      this.state === 'idle' ||
      this.state === 'move' ||
      this.state === 'dash' ||
      isGuardState(this.state);
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
    this.turnRate = this.tuning.player.rollTurnDegPerSecond * DEG;
    this.turnResponse = 40;

    const dist = ROLL_PROFILE[f - 1] ?? 0;
    this.velocity.x = Math.sin(this.dodgeDirYaw) * dist * 60;
    this.velocity.y = Math.cos(this.dodgeDirYaw) * dist * 60;

    // F26 から攻撃へキャンセル可（先行入力あり）。
    if (this.fsm.canCancelTo('lightAttack')) {
      const attack = this.tryLightAttack(frame, 'light1');
      if (attack) return attack;
    }
    if (this.fsm.canCancelTo('heavyAttack')) {
      const heavy = this.tryHeavyAttack(frame);
      if (heavy) return heavy;
    }

    // F26 からガードへキャンセル可（ボタン保持）
    if (this.fsm.canCancelTo('guard')) {
      const guard = this.tryGuard(frame, snap);
      if (guard) return guard;
    }
    // F26 から回復へキャンセル可（先行入力 6F）。
    if (this.fsm.canCancelTo('heal')) {
      const heal = this.tryHeal(frame);
      if (heal) return heal;
    }

    // F26 から移動へキャンセル可（移動入力があるとき）。入力がなければ F32 まで硬直。
    if (f > ROLL_FRAMES || (f >= ROLL_MOVE_CANCEL && this.moveMagnitude > 0.001)) {
      return this.afterDodgeState(snap);
    }
    return null;
  }

  private updateBackstep(frame: PlayerFrame): PlayerStateId | null {
    const f = this.stateFrame;
    const dist = BACKSTEP_PROFILE[f - 1] ?? 0;
    this.velocity.x = Math.sin(this.dodgeDirYaw) * dist * 60;
    this.velocity.y = Math.cos(this.dodgeDirYaw) * dist * 60;
    // 向きは変えない（ロックオン中は対象を向いたまま）
    this.turnRate = 0;
    // F18 から攻撃へキャンセル可（先行入力あり）
    if (this.fsm.canCancelTo('lightAttack')) {
      const attack = this.tryLightAttack(frame, 'light1');
      if (attack) return attack;
    }
    if (this.fsm.canCancelTo('heavyAttack')) {
      const heavy = this.tryHeavyAttack(frame);
      if (heavy) return heavy;
    }
    if (f > BACKSTEP_FRAMES) return this.moveMagnitude > 0 ? 'move' : 'idle';
    return null;
  }

  /** ロール終了・キャンセル時の遷移先。ボタンが押されていればダッシュへ（2.3 節）。 */
  private afterDodgeState(snap: InputSnapshot): PlayerStateId {
    if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';
    if (snap.buttons.dodge.held && this.moveMagnitude > 0.1) this.dashLatch = true;
    return this.moveMagnitude > 0 ? (this.dashLatch ? 'dash' : 'move') : 'idle';
  }

  private updateFall(dt: number, snap: InputSnapshot, frame: PlayerFrame): PlayerStateId | null {
    if (this.grounded) return this.landed(this.fallStartY - this.position.y);
    const plunge = this.tryPlunge(frame);
    if (plunge) return plunge;
    if (this.fallStartY - this.position.y < PLUNGE.freeSteerDrop) {
      // 階段の段差・縁の出っ張りなどの小さな落ち込みは、地上と同じように操作できる（粘らない）。
      // 速度を引き継ぎ点とし、本格的な落下になってから「踏み出しの速度 ± 1.5 m/s」に切り替わる
      this.computeLocomotion(dt, snap, frame, 1, 'air');
      this.airBase.x = this.velocity.x;
      this.airBase.y = this.velocity.y;
      return null;
    }
    this.driveAir(dt, frame);
    return null;
  }

  /**
   * 着地。高さ 2.0m 以上は硬直 10F（`Jump_Land` 圧縮）、2.0m 未満は硬直なし（落下ダメージなし）。
   * 高さ 2m 以上の着地は音（半径 6m）を出す（`land` イベント → Game が敵へ）。
   */
  private landed(height: number): PlayerStateId {
    this.events.push({ type: 'land', fallHeight: height });
    const frames = landStiffnessFrames(height);
    if (frames > 0) {
      this.landFrames = frames;
      return 'land';
    }
    return this.moveMagnitude > 0 ? 'move' : 'idle';
  }

  /**
   * 落下中の攻撃入力（軽・強どちらも）で落下攻撃に入れるか（14.3.3 節）。地面から 0.6m 以上離れて下降中・有効な落下高さ
   * 1.0〜3.0m・スタミナ 20 以上・下に敵がいること。満たさないときは入力を残す（着地後の先行入力として通常の攻撃になる）。
   */
  private tryPlunge(frame: PlayerFrame): 'plungeFall' | null {
    const light = frame.input.hasBuffered('lightAttack');
    const heavy = frame.input.hasBuffered('heavyAttack');
    if (!light && !heavy) return null;
    const clearance = this.groundClearanceProbe(this.position.x, this.position.y, this.position.z);
    const height = this.fallStartY - (this.position.y - (clearance ?? 0));
    if (
      !canStartPlunge({
        stamina: this.stamina.current,
        clearance,
        height,
        descending: this.verticalVelocity < 0,
      })
    ) {
      return null;
    }
    if (
      this.plungeTargetNear &&
      !this.plungeTargetNear(this.position.x, this.position.z, PLUNGE.targetReach)
    ) {
      return null;
    }
    frame.input.consumeBuffered('lightAttack');
    frame.input.consumeBuffered('heavyAttack');
    return 'plungeFall';
  }

  /** 落下攻撃の空中: 振りかぶりを保持して落ちる。着地の高さが有効なら `plunge`、そうでなければ通常の着地。 */
  private updatePlungeFall(dt: number, frame: PlayerFrame): PlayerStateId | null {
    if (this.grounded) {
      const height = this.fallStartY - this.position.y;
      const multiplier = plungeMultiplier(height);
      if (multiplier === null) return this.landed(height);
      this.plungeMult = multiplier;
      this.events.push({ type: 'land', fallHeight: height });
      return 'plunge';
    }
    this.driveAir(dt, frame);
    return null;
  }

  /** 落下攻撃の着地: 判定 4F（円）+ 硬直 24F。動けず、ロールもできない。 */
  private updatePlunge(): PlayerStateId | null {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.turnRate = 0;
    if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';
    if (this.stateFrame > totalFrames(PLAYER_ACTIONS.plunge)) return this.afterAttackState();
    return null;
  }

  /**
   * 空中の水平速度: 踏み出し時の速度を保ち、入力で ±1.5 m/s まで補正する。ロックオン対象へは最大
   * `airLockOnSpeed`（2.5 m/s）で寄せる（着地点で敵を捉えやすく）。
   */
  private driveAir(dt: number, frame: PlayerFrame): void {
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

  private updateLand(dt: number, snap: InputSnapshot, frame: PlayerFrame): PlayerStateId | null {
    if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';
    // 着地の途中からロールで抜けられる
    if (this.stateFrame >= 4) {
      const dodge = this.tryDodge(frame);
      if (dodge) return dodge;
    }
    if (this.stateFrame > this.landFrames) return this.moveMagnitude > 0 ? 'move' : 'idle';
    this.computeLocomotion(dt, snap, frame, this.tuning.player.landSpeedFactor, 'land');
    return null;
  }

  /** 仰け反り・転倒: 行動不能。押し戻しは `slide` が担う。終わったら移動・待機・落下へ。 */
  private updateReaction(): PlayerStateId | null {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.turnRate = 0;
    if (this.stateFrame > this.reactionFrames) {
      if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';
      return this.moveMagnitude > 0 ? 'move' : 'idle';
    }
    return null;
  }

  // ---- ガード（2.3 節）----

  /**
   * ガードの構え・保持。ロール / バックステップへは F1 から即時、ガード被弾から 30F 以内の攻撃入力はガードカウンター。
   * それ以外の攻撃入力・ボタンを離す操作は解除（8F の硬直）へ。被ガードのスタン中は歩行・解除ができない。
   */
  private updateGuard(dt: number, snap: InputSnapshot, frame: PlayerFrame): PlayerStateId | null {
    this.guardAge++;
    if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';

    const dodge = this.tryDodge(frame);
    if (dodge) return dodge;

    if (
      this.counterWindow.open &&
      this.stamina.canStart(PLAYER_ACTIONS.guardCounter.staminaCost) &&
      frame.input.consumeBuffered('lightAttack')
    ) {
      return 'guardCounter';
    }

    const stunned = this.guardStun > 0;
    if (stunned) this.guardStun--;
    if (!stunned && (!snap.buttons.guard.held || frame.input.hasBuffered('lightAttack'))) {
      this.releaseSawUp = !snap.buttons.guard.held;
      return 'guardRelease';
    }

    if (stunned) {
      // スタンの間は止まる（押し戻しは slide が担う）
      this.tmpVelocity.x = 0;
      this.tmpVelocity.y = 0;
      approachVelocity(
        this.velocity,
        this.tmpVelocity,
        MOVEMENT.run / (MOVEMENT.accelFrames / 60),
        MOVEMENT.run / (MOVEMENT.stopFrames / 60),
        dt,
      );
    } else {
      this.computeLocomotion(dt, snap, frame, 1, 'guard');
    }
    return null;
  }

  /**
   * 解除の硬直（8F）。ボタンを離してから再び押すと、構えをやり直さず即ガードへ復帰する（残りの硬直はスキップ）。
   * 硬直が終わったら、先行入力の通常攻撃（= ガード解除の 8F 後に出る攻撃）か、移動系へ。
   */
  private updateGuardRelease(
    dt: number,
    snap: InputSnapshot,
    frame: PlayerFrame,
  ): PlayerStateId | null {
    if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';
    if (!snap.buttons.guard.held) this.releaseSawUp = true;
    if (
      snap.buttons.guard.held &&
      this.releaseSawUp &&
      this.stamina.canStart() &&
      !frame.input.hasBuffered('lightAttack')
    ) {
      this.guardResume = true;
      return 'guard';
    }
    if (this.stateFrame > this.guardParams.releaseFrames) {
      const attack = this.tryLightAttack(frame, 'light1');
      if (attack) return attack;
      return this.moveMagnitude > 0 ? 'move' : 'idle';
    }
    // 解除の硬直中は新しい動作ができない。歩行は続く（ガード中と同じ速度）。
    this.computeLocomotion(dt, snap, frame, 1, 'guard');
    return null;
  }

  /** ガード崩し: 54F の行動不能。終わったら移動・待機・落下へ。 */
  private updateGuardBreak(): PlayerStateId | null {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.turnRate = 0;
    if (this.stateFrame > this.guardParams.breakFrames) {
      if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';
      return this.moveMagnitude > 0 ? 'move' : 'idle';
    }
    return null;
  }

  // ---- 状況アクション（調べる・座り込み・休憩・立ち上がり）----

  /** 入力を受け付けず、その場で止まる。長さが過ぎたら次の状態へ（`rest` は `standUp` が呼ばれるまで保持）。 */
  private updateScripted(dt: number): PlayerStateId | null {
    this.tmpVelocity.x = 0;
    this.tmpVelocity.y = 0;
    const decel = this.tuning.player.run / (this.tuning.player.stopFrames / 60);
    approachVelocity(this.velocity, this.tmpVelocity, decel, decel, dt);
    if (this.state === 'rest' || this.stateFrame <= this.scriptedFrames) return null;
    if (this.state === 'sitDown') return 'rest';
    if (!this.grounded && this.airFrames > this.tuning.player.coyoteFrames) return 'fall';
    return 'idle';
  }

  // ---- 向き・スタミナ・移動 ----

  private applyFacing(frame: PlayerFrame, dt: number): void {
    if (this.state === 'roll') {
      this.yaw = turnToward(this.yaw, this.dodgeDirYaw, this.turnRate, this.turnResponse, dt);
      return;
    }
    if (
      this.state === 'backstep' ||
      this.state === 'guardBreak' ||
      this.state === 'dead' ||
      isReactionState(this.state)
    ) {
      return;
    }
    if (isScriptedState(this.state)) {
      // 状況アクション: 指定された向きへ（ロックオン・入力は無視）
      if (this.scriptedFaceYaw !== null) {
        this.yaw = turnToward(this.yaw, this.scriptedFaceYaw, this.turnRate, this.turnResponse, dt);
      }
      return;
    }
    if (isAttackState(this.state)) {
      this.applyAttackFacing(frame, dt);
      return;
    }

    let target: number | null = null;
    let rate = this.turnRate;
    let response = this.turnResponse;
    if (frame.lockTarget) {
      target = this.toTargetYaw;
      rate = this.tuning.player.lockOnTurnDegPerSecond * DEG;
      response = this.tuning.player.lockOnTurnResponse;
    } else if (this.moveMagnitude > 0.001 && this.state !== 'land') {
      target = yawOf(this.worldMove.x, this.worldMove.y);
    }
    if (target !== null) {
      this.yaw = turnToward(this.yaw, target, rate, response, dt);
    }
  }

  /**
   * 攻撃中の旋回: 発生の間（当たり窓が開くまで）だけ、ロックオン対象 / 入力方向へ素早く向きを合わせる。
   * 持続・硬直中は向き固定（振り抜く方向がぶれない。ロールで躱される余地にもなる）。
   */
  private applyAttackFacing(frame: PlayerFrame, dt: number): void {
    const id = this.state as PlayerAttackId;
    // 致命の一撃の向きは吸着（`updateAmbushSnap`）が決める。入力・ロックオンでは回さない
    if (id === 'backstab') return;
    if (this.stateFrame > PLAYER_ACTIONS[id].startup) return;
    let target: number | null = null;
    if (frame.lockTarget) target = this.toTargetYaw;
    else if (this.moveMagnitude > 0.001) target = yawOf(this.worldMove.x, this.worldMove.y);
    if (target === null) return;
    this.yaw = turnToward(
      this.yaw,
      target,
      this.tuning.player.attackTurnDegPerSecond * DEG,
      this.tuning.player.attackTurnResponse,
      dt,
    );
  }

  /** スタミナ回復に影響する行動。走り・ダッシュ中と強攻撃の溜め中は回復しない（歩き以下は回復する）。 */
  private staminaContext(): StaminaContext {
    const sprinting =
      this.dashing ||
      (this.state === 'move' &&
        Math.hypot(this.velocity.x, this.velocity.y) > this.tuning.player.walk + 0.3);
    return { sprinting, guarding: this.state === 'guard', charging: this.state === 'heavyCharge' };
  }

  private moveBody(dt: number): void {
    const p = this.tuning.player;
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
      this.groundHistory[this.groundHistoryIndex] = this.position.y;
      this.groundHistoryIndex = (this.groundHistoryIndex + 1) % this.groundHistory.length;
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
      this.state !== 'plungeFall' &&
      this.state !== 'heavyCharge' &&
      !isAttackState(this.state) &&
      this.state !== 'guardRelease' &&
      this.state !== 'guardBreak' &&
      !isHealState(this.state) &&
      !isReactionState(this.state)
    );
  }
}

const tmpQuat = new Quaternion();
function yawQuaternion(yaw: number): Quaternion {
  return tmpQuat.setFromAxisAngle(Y_AXIS, yaw);
}
