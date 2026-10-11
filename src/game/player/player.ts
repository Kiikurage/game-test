import type { Vector3 } from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { PLAYER_ACTIONS, PLAYER_STATS } from '../data';
import {
  Health,
  knockdownInvulnerable,
  type GuardOutcome,
  type GuardQuery,
  type HitEvent,
  type HitReaction,
} from '../combat';
import type { PlayerAttackInfo } from '../combat/playerAttack';
import type { Physics } from '../physics';
import { createTuning, type Tuning } from '../tuning';
import type { AmbushSource } from './ambush';
import { guardOutcomeAt, isWithinGuardArc, type GuardParams } from './guard';
import { PlayerCore, type PlayerFrame } from './playerCore';
import {
  advanceGait,
  animationState,
  applyFacing,
  moveBody,
  staminaContext,
  syncTransform,
} from './playerMotion';
import {
  isAttackState,
  isHealState,
  isReactionState,
  isSeatedState,
  type PlayerStateId,
} from './playerStates';
import type { PlayerAnimationState, ScriptedActionState, ScriptedOptions } from './playerTypes';
import {
  PLAYER_STATE_HANDLERS,
  applyHealMarkers,
  applySuperArmor,
  endAmbush,
  enterState,
  stampFootstepGait,
  updateAmbushReady,
} from './states';

export type { PlayerEvent, PlayerFrame } from './playerCore';
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
} from './playerStates';
export type {
  GuardPresentation,
  PlayerAnimationState,
  ScriptedActionState,
  ScriptedOptions,
} from './playerTypes';

/**
 * プレイヤー: Rapier のキャラクターコントローラ（カプセル・kinematic）で動く本体。
 * 位置・向き・状態は game 層が持ち、render 層は `transform`（補間用）と `animation` を読んで描くだけ。
 *
 * 座標: `position` は足元。向き `yaw` は前方 = (sin yaw, cos yaw)。
 * 内部状態は `PlayerCore`、状態ごとの更新は `states/*.ts` のハンドラ。このクラスは状態の振り分けと外部への口を持つ。
 */
export class Player {
  private readonly c: PlayerCore;

  constructor(
    physics: Physics,
    spawn: Vector3,
    yaw: number,
    /** HP（回復の加算先）。Game は被弾側（`playerTarget`）の Health を渡す。 */
    readonly health: Health = new Health(PLAYER_STATS.hp),
    /** 調整値。Game は自分の `tuning` を渡す。 */
    tuning: Tuning = createTuning(),
  ) {
    this.c = new PlayerCore(physics, spawn, yaw, health, tuning);
    syncTransform(this.c);
    this.c.transform.snap();
  }

  /** 足元の位置と向き（補間描画用）。 */
  get transform() {
    return this.c.transform;
  }
  get stamina() {
    return this.c.stamina;
  }
  /** 回復瓶の残数（#48）。 */
  get flask() {
    return this.c.flask;
  }
  /** 強靭度・被弾後無敵・押し戻し（#50）。敵と共通の `HitReactor`。 */
  get reactor() {
    return this.c.reactor;
  }
  /** 状態機械（遷移の検証・状態フレーム・キャンセル窓・ヒットストップ）。 */
  get fsm() {
    return this.c.fsm;
  }
  /** このステップに発火したイベントマーカー（足音・当たり窓・無敵窓など）。1 ステップごとにクリアされる。 */
  get markerEvents() {
    return this.c.markerEvents;
  }
  /** 状態遷移などの通知。1 ステップごとにクリアされる。 */
  get events() {
    return this.c.events;
  }
  /** 水平速度（x, z）。 */
  get velocity() {
    return this.c.velocity;
  }
  get yaw(): number {
    return this.c.yaw;
  }
  set yaw(v: number) {
    this.c.yaw = v;
  }
  get grounded(): boolean {
    return this.c.grounded;
  }
  set grounded(v: boolean) {
    this.c.grounded = v;
  }
  get verticalVelocity(): number {
    return this.c.verticalVelocity;
  }
  set verticalVelocity(v: number) {
    this.c.verticalVelocity = v;
  }
  /**
   * 落下攻撃を出してよいか（下に敵がいるか）を水平位置と半径で問い合わせる口。`plunge.system.ts` が差し込む。
   * null なら常に可（Player 単体のテスト用）。水路の床板などで「下に敵がいない落下」では落下攻撃を出さない（仕様書 14.1.3 節）。
   */
  get plungeTargetNear() {
    return this.c.plungeTargetNear;
  }
  set plungeTargetNear(v: ((x: number, z: number, radius: number) => boolean) | null) {
    this.c.plungeTargetNear = v;
  }
  /** ロックオン対象への空中補正の上限（m/s）。標準 2.5、入力補助の強は 3.5（11.2 節。適用は E10-4）。 */
  get airLockOnSpeed(): number {
    return this.c.airLockOnSpeed;
  }
  set airLockOnSpeed(v: number) {
    this.c.airLockOnSpeed = v;
  }
  /** 致命の一撃（#115）: 対象の探索と拘束の口（`ambush.system.ts` が Game 起動時に差す）。 */
  get ambushSource(): AmbushSource | null {
    return this.c.ambushSource;
  }
  set ambushSource(v: AmbushSource | null) {
    this.c.ambushSource = v;
  }
  /** いまの入力で致命の一撃が出せる（条件成立中）。剣の縁の光（HUD 表示は出さない）。 */
  get ambushReady(): boolean {
    return this.c.ambushReady;
  }
  /** ガードのフレーム・窓（入力補助 11.2 節で差し替えられる。実際の差し替えは E10-1）。 */
  get guardParams(): GuardParams {
    return this.c.guardParams;
  }
  set guardParams(v: GuardParams) {
    this.c.guardParams = v;
  }
  /** ガードカウンターが出せる間 true（デバッグ・テスト用）。 */
  get guardCounterOpen(): boolean {
    return this.c.counterWindow.open;
  }
  /** ガードを崩された回数の累計（Game がガード崩しの SE を出す判定に使う）。 */
  get guardBreakCount(): number {
    return this.c.guardBreakCount;
  }

  get state(): PlayerStateId {
    return this.c.fsm.state;
  }

  /** 現在の状態に入ってからのフレーム数（F1 起点）。 */
  get stateFrame(): number {
    return this.c.fsm.stateFrame;
  }

  /**
   * ヒットストップ: `frames` ステップのあいだ、状態フレーム・移動・アニメーションを凍結する（4.1 節）。
   * 呼ぶのは命中判定側（#40 以降）。次の `update` から効く。
   */
  hitStop(frames: number): void {
    this.c.fsm.freeze(frames);
  }

  /**
   * 自分宛ての命中（`HitEvent`）を受け取り、強靭度・押し戻し・仰け反り / 転倒・被弾後無敵を処理する（4.3 / 4.4 節）。
   * `(awayX, awayZ)` は攻撃側から自分へ向かう水平方向。命中判定の直後（同じステップ内）に呼ぶ。
   * 反応は即座に状態へ反映する（ヒットストップ中は反応の姿勢で凍結する）。
   */
  receiveHit(event: HitEvent, awayX: number, awayZ: number): HitReaction {
    const c = this.c;
    const reaction = c.reactor.react(event, awayX, awayZ);
    if (event.guard !== 'none') {
      // ガードされた命中（2.3 節）: スタミナを消費し、被ガードのスタンとカウンター窓を始める。
      // 消費でスタミナが 0 になればガード崩し。ジャストガードはスタンなし（すぐに反撃できる）。
      c.stamina.consume(event.guardStaminaCost);
      c.counterWindow.hit();
      if (event.guard === 'guard') c.guardStun = c.guardParams.stunFrames;
      if (c.stamina.empty && this.state === 'guard') {
        c.fsm.transition('guardBreak');
        c.interrupt();
        c.counterWindow.close();
        c.guardBreakCount++;
      }
      return reaction;
    }
    if (reaction.kind === 'flinch' || reaction.kind === 'knockdown') {
      // 転倒中の軽い追撃は転倒を中断しない（被弾後無敵の切れた F37 以降）。
      // ガード崩し中は姿勢が崩れたまま（行動不能は崩しの 54F が決める。被ダメージ 1.5 倍は崩し中の対象が受ける）。
      if (this.state === 'guardBreak') return reaction;
      if (!(this.state === 'knockdown' && reaction.kind === 'flinch')) {
        if (this.state === reaction.kind) c.fsm.restart();
        else c.fsm.transition(reaction.kind);
        c.interrupt();
        c.reactionFrames = reaction.frames;
      }
    }
    return reaction;
  }

  /**
   * ガード判定（`HitTarget.guard`）。構え完了（F6）以降、正面 120° からの攻撃だけ防ぐ。構えに入ってから
   * 10F 以内（F6–F15）ならジャストガード。背面・側面・構え完了前・ガード以外の状態は `none`。
   */
  guardOutcome(query: GuardQuery): GuardOutcome {
    if (this.state !== 'guard') return 'none';
    const params = this.c.guardParams;
    const outcome = guardOutcomeAt(this.c.guardAge, params);
    if (outcome === 'none') return 'none';
    const a = query.attackerPosition;
    const p = this.c.position;
    if (!isWithinGuardArc(p.x, p.z, this.c.yaw, a.x, a.z, params.frontArcDeg)) return 'none';
    return outcome;
  }

  /** 構えに入ってからのフレーム（ガード系の状態のとき。デバッグ・テスト用）。 */
  get guardFrame(): number {
    return this.c.guardAge;
  }

  /** ガード被弾のスタンの残りフレーム（デバッグ・テスト用）。 */
  get guardStunRemaining(): number {
    return this.c.guardStun;
  }

  /** HP が 0 になった。以降は入力を受け付けず、リスポーン（`teleport`）まで動かない。 */
  die(): void {
    if (this.state === 'dead') return;
    const c = this.c;
    c.fsm.transition('dead');
    c.interrupt();
    c.reactor.poise.clearBonus();
    c.armorActive = false;
    c.counterWindow.close();
  }

  get dead(): boolean {
    return this.state === 'dead';
  }

  /** 物理ボディ（カメラ衝突の問い合わせから除外するのに使う）。 */
  get rigidBody(): RAPIER.RigidBody {
    return this.c.body;
  }

  /** 指令された水平速度の大きさ（m/s）。壁で止められていても入力どおりの値。 */
  get speed(): number {
    return Math.hypot(this.c.velocity.x, this.c.velocity.y);
  }

  /** 足元の位置（読み取り専用として扱う）。 */
  get feet(): Vector3 {
    return this.c.position;
  }

  /** 無敵フレーム中か（被ダメージ判定を持たない。2.3 節）。窓はイベントマーカー（`invulnStart` / `invulnEnd`）が決める。 */
  get invulnerable(): boolean {
    return (
      this.state === 'dead' ||
      isSeatedState(this.state) ||
      this.c.markers.invulnerable ||
      this.c.reactor.invulnerable ||
      (this.state === 'knockdown' && knockdownInvulnerable(this.stateFrame))
    );
  }

  /** ガード崩し中か（被ダメージ 1.5 倍。`HitTarget.staggered`）。 */
  get guardBroken(): boolean {
    return this.state === 'guardBreak';
  }

  /** アニメーション・デバッグ用の描画情報。 */
  get animation(): PlayerAnimationState {
    return animationState(this.c);
  }

  /**
   * 状況アクションを始める（「調べる」の動作・座り込み・立ち上がり。インタラクション #55）。
   * 地上の移動系・休憩中から入れる（`rest` からは `standUp` だけ）。ロール・攻撃・被弾などの最中は入れず false。
   * 始めたら入力による移動・攻撃はできない（`frames` 後に自動で次の状態へ）。座っている間は被弾しない。
   * 立ち上がり（`standUp`）は `teleport` の直後（リスポーン）にも始められる。
   */
  beginScripted(state: ScriptedActionState, options: ScriptedOptions): boolean {
    const c = this.c;
    if (this.state === state || !c.fsm.canTransition(state)) return false;
    if (!c.grounded && state !== 'standUp') return false;
    c.fsm.transition(state);
    c.interrupt();
    c.scriptedFrames = Math.max(1, Math.floor(options.frames));
    c.scriptedFaceYaw = options.faceYaw ?? null;
    c.lastAttack = null;
    return true;
  }

  /**
   * 入力を奪って `frames` ステップだけ歩かせる（演出。霧の門の入場）。`yaw` は毎ステップ呼ばれ、歩く向き（ワールドのヨー）を返す。
   * 歩いている間は実入力（ボタン・先行入力）を読まない。死亡・`teleport`・`cancelForcedWalk` で終わる。
   */
  beginForcedWalk(frames: number, yaw: () => number): void {
    this.c.forcedWalk = { frames: Math.max(1, Math.floor(frames)), yaw };
  }

  cancelForcedWalk(): void {
    this.c.forcedWalk = null;
  }

  /** 強制歩行中か。 */
  get forcedWalking(): boolean {
    return this.c.forcedWalk !== null;
  }

  private applyForcedWalk(frame: PlayerFrame): PlayerFrame {
    const forced = this.c.forcedWalk;
    if (!forced) return frame;
    if (this.dead || forced.frames <= 0) {
      this.c.forcedWalk = null;
      return frame;
    }
    forced.frames--;
    frame.input.clearBuffer();
    return {
      input: this.c.forcedInput.aim(forced.yaw(), frame.cameraYaw),
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
        return this.c.grounded;
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

  /**
   * 水平方向に `(dx, dz)` m を `frames` ステップかけて押し出す（状態は変えない。壁・床の衝突は通常の移動と同じ）。
   * ボスの跳躍の着地でプレイヤーが体に重なったときなどに使う。残りがあれば足し合わせる。
   */
  shove(dx: number, dz: number, frames = 6): void {
    const s = this.c.shoveLeft;
    s.x += dx;
    s.z += dz;
    s.frames = Math.max(s.frames, Math.max(1, Math.round(frames)));
  }

  /** スポーン・リスポーン・テレポート。補間もスナップする。 */
  teleport(position: Vector3, yaw: number): void {
    this.c.reset(position, yaw);
    syncTransform(this.c);
    this.c.transform.snap();
  }

  /** 1 固定ステップ進める。物理ステップ（`physics.step`）の前に呼ぶ。 */
  update(dt: number, inputFrame: PlayerFrame): void {
    const c = this.c;
    const frame = this.applyForcedWalk(inputFrame);
    c.transform.beginStep();
    c.events.length = 0;
    c.markerEvents.length = 0;
    // ヒットストップ中は状態フレーム・移動・スタミナ回復を含めて丸ごと止める
    if (c.fsm.consumeFreeze()) {
      frame.input.holdBuffer?.(dt); // 先行入力の期限も凍結分だけ延ばす（4.1 節）
      syncTransform(c);
      return;
    }
    const snap = frame.input.snapshot;
    c.beginStep(snap, frame);

    // 状態更新。遷移した場合は新しい状態の F1 を同じステップ内で実行する（入力から動き出しまで 0 フレーム）。
    for (let i = 0; i < 3; i++) {
      c.fsm.advance();
      const next = PLAYER_STATE_HANDLERS[c.state](c, dt, snap, frame);
      if (next === null) break;
      enterState(c, next);
    }
    // イベントマーカーは、最終的に落ち着いた状態のフレームで発火する（途中で捨てた状態の分は出さない）
    if (c.ambushTarget && this.state !== 'backstab') endAmbush(c);
    c.markers.advance(c.fsm.stateFrame, c.markerEvents);
    applyHealMarkers(c);
    applySuperArmor(c);
    stampFootstepGait(c);
    updateAmbushReady(c);

    applyFacing(c, frame, dt);
    c.stamina.update(dt, staminaContext(c));
    moveBody(c, dt);
    advanceGait(c, dt);
    syncTransform(c, dt);
  }

  /** 溜めに入ってからのステップ数（デバッグ・テスト用。溜め中でなければ 0）。 */
  get chargeFrames(): number {
    return this.state === 'heavyCharge' ? this.stateFrame : 0;
  }

  /** 攻撃判定との接続用: いま出している軽攻撃（なければ null）。`PlayerAttackDriver` が読む。 */
  get attack(): PlayerAttackInfo | null {
    if (!isAttackState(this.state)) return null;
    return {
      id: this.state,
      serial: this.c.attackSerial,
      frame: this.stateFrame,
      // 落下攻撃はマーカー表を持たない: 着地の F1〜F4（持続 4F）が当たり窓
      hitActive:
        this.state === 'plunge'
          ? this.stateFrame <= PLAYER_ACTIONS.plunge.active
          : this.c.markers.hitActive,
      ...(this.state === 'plunge' && { plungeMultiplier: this.c.plungeMult }),
    };
  }

  /** 直近のステップがヒットストップで凍結されたか。 */
  get frozen(): boolean {
    return this.c.fsm.isFrozenStep;
  }

  /** 回避確定と同様、後続の戦闘用に外部から行動不能にできる口。 */
  get isActionable(): boolean {
    const s = this.state;
    return (
      s !== 'roll' &&
      s !== 'backstep' &&
      s !== 'land' &&
      s !== 'plungeFall' &&
      s !== 'heavyCharge' &&
      !isAttackState(s) &&
      s !== 'guardRelease' &&
      s !== 'guardBreak' &&
      !isHealState(s) &&
      !isReactionState(s)
    );
  }
}
