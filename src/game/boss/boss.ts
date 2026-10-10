import { Quaternion, Vector3 } from 'three/webgpu';
import type { GameEventBus } from '../../core/gameEvents';
import { InterpolatedTransform } from '../../core/interpolated';
import {
  sectorShape,
  type ActiveAttack,
  type HitResolver,
  type HitShape,
  type Poise,
} from '../combat';
import { POISE, totalFrames, trackEndFrame } from '../data';
import { turnToward, yawOf } from '../player/movement';
import {
  BOSS_AI,
  BOSS_BATTLE,
  BOSS_CORRECTION,
  BOSS_STATS,
  BOSS_SUPER_ARMOR_BONUS,
  BOSS_WALL,
  type BossMoveId,
  type BossPhase,
  type DistanceBand,
} from './bossData';
import {
  stagesOf,
  type BossMoveActor,
  type BossMoveContext,
  type BossMoveDef,
  type BossMoveRegistry,
  type BossStageDef,
} from './bossMove';
import { pinnedAgainstWall, sectorTouchesCircle, type Circle2D } from './bossBattle';
import {
  PlayerTracker,
  chooseBossMove,
  distanceBand,
  type BossPlayerInfo,
  type BossWeights,
} from './bossPlanner';

const DEG = Math.PI / 180;
const Y_AXIS = new Vector3(0, 1, 0);

export type BossStateId =
  /** 戦闘前（`engage()` まで何もしない）。 */
  | 'dormant'
  /** ビート: 技の硬直後の睨み合い。対象へ向き直るだけ。 */
  | 'beat'
  /** 技の前の接近（技定義の `approach`）。 */
  | 'approach'
  /** 技の実行（予備動作 → 判定 → 硬直、複数段）。 */
  | 'attack'
  /** 選べる技がなかったので対象へ歩み寄る。 */
  | 'reposition'
  /** 強靭度崩し。 */
  | 'staggered'
  /** 壁に追い詰められた対象に、近距離技の前に 1 歩下がる（6.6 節）。 */
  | 'stepBack'
  /** フェーズ移行（`BOSS_BATTLE.transitionFrames` の間、無敵で行動しない。演出は E5-6）。 */
  | 'transition'
  | 'dead';

export interface BossInit {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
}

export interface BossDeps {
  /** 攻撃判定（`Game.combat`）。 */
  readonly combat: Pick<HitResolver, 'startAttack' | 'prime' | 'resolve' | 'endAttack'>;
  /** 使える技。 */
  readonly moves: BossMoveRegistry;
  /** 乱数（0 以上 1 未満）。シード固定でテストできる。 */
  readonly random: () => number;
  /** 強靭度（攻撃中の加算・スーパーアーマー）。なければ触らない。 */
  readonly poise?: Poise;
  /** アリーナの円（中心と半径）。省略時は制限なし。 */
  readonly arena?: { readonly x: number; readonly z: number; readonly radius: number };
  /** 柱（円）。攻撃は柱を貫通し、判定が触れると `bossPillarHit` を発行する。 */
  readonly pillars?: readonly Circle2D[];
  /** イベントバス（`Game.events`）。交戦開始・HP 変化・フェーズ境界・撃破・リセットを発行する。省略時は発行しない。 */
  readonly events?: GameEventBus;
}

/** デバッグ表示・E2E 用の状態。 */
export interface BossDebugInfo {
  readonly state: BossStateId;
  readonly phase: BossPhase;
  readonly hp: number;
  readonly x: number;
  readonly z: number;
  readonly yaw: number;
  readonly distance: number;
  readonly band: DistanceBand;
  /** 直近の技（古い順）。 */
  readonly history: readonly string[];
  /** 直前の技。 */
  readonly previousMove: string | null;
  /** 実行中の技と段（1 始まり）・段内のフレーム。 */
  readonly move: string | null;
  readonly stage: number;
  readonly stageFrame: number;
  /** 直近の選択の重み（内訳つき）。 */
  readonly weights: BossWeights | null;
  /** ビートの残り F。 */
  readonly beatLeft: number;
  /** このフェーズで崩しを使い切ったか（使い切ると強靭度ダメージは無効）。 */
  readonly breakUsed: boolean;
  /** フェーズ移行が待機中か（HP が閾値以下。次の硬直で始まる）。 */
  readonly transitionPending: boolean;
  readonly player: {
    readonly behindFrames: number;
    readonly rollStreak: number;
    readonly healing: boolean;
  };
}

interface MoveRun {
  readonly move: BossMoveDef;
  /** 実効の段（ロール連打補正で 1 段目の発生を延ばしたものを含む）。 */
  readonly stages: readonly BossStageDef[];
  stageIndex: number;
  /** 段に入ってからのフレーム（F1 起点）。 */
  frame: number;
  attack: ActiveAttack | null;
  primed: boolean;
  /** 現在の強靭度加算の種類（変わったときだけ `grant` する）。 */
  armor: 'none' | 'normal' | 'super';
}

/**
 * ボス本体（6.2〜6.4 節）。位置・向き・フェーズ・AI（ビート → 技の選択 → 接近 → 技の実行）。
 * 描画（three のシーン）は知らず、render 側が `transform` を読む。ロックオン対象（`LockOnTarget`）でもある。
 *
 * - 技の選択は `chooseBossMove`（重み表 + 直前の技 + プレイヤー状態）。技は `BossMoveRegistry` から引く。
 * - 攻撃は E3-1c の枠組み（`EnemyAttackDef` のフレームデータ・`HitResolver` の判定・`checkEnemyAttack` の検証）に載る。
 *   予備動作の前半（`trackEndFrame` まで）だけ対象へ向きを追い、以降は向き固定（ロールで躱せる）。
 * - 通常攻撃 1 発では技は中断されない（崩し `stagger` と撃破 `kill` だけが打ち切る）。
 * - 座標: `position` は足元。向き `yaw` は前方 = (sin yaw, cos yaw)。
 */
export class Boss implements BossMoveActor {
  readonly id: string;
  readonly height = BOSS_STATS.height;
  readonly maxHp = BOSS_STATS.hp;
  readonly transform = new InterpolatedTransform();
  readonly position: Vector3;
  readonly tracker = new PlayerTracker();
  yaw: number;
  hp: number = BOSS_STATS.hp;
  phase: BossPhase = 1;
  /**
   * AI の有効 / 無効（回避検証ツール用。既定 true）。false の間は、技が終わっても次のビート・選択へ進まず待機（`dormant`）する。
   * 技は `startMove` で明示的に出す。
   */
  aiEnabled = true;

  private stateId: BossStateId = 'dormant';
  private stateFrames = 0;
  private beatLength = 0;
  private run: MoveRun | null = null;
  private pending: { move: BossMoveDef; rollBonus: boolean } | null = null;
  private readonly history: string[] = [];
  private lastWeights: BossWeights | null = null;
  private freezeLeft = 0;
  private staggerLeft = 0;
  private readonly target = new Vector3();
  private approachMax = 0;
  private distanceNow = Number.POSITIVE_INFINITY;
  private readonly quat = new Quaternion();
  /** 待機位置（`reset()` で戻る）。 */
  private readonly homeX: number;
  private readonly homeZ: number;
  private readonly homeYaw: number;
  private engaged = false;
  /** このフェーズで崩しを使い切った（フェーズごとに 1 回まで）。 */
  private breakUsed = false;
  /** HP が閾値以下になった。次の硬直（技が終わった瞬間）でフェーズ移行を始める。 */
  private transitionPending = false;
  /** 移行の直後の最初の選択（遠距離帯の技 = 跳躍・灰の波で再開する）。 */
  private afterTransition = false;

  constructor(
    init: BossInit,
    private readonly deps: BossDeps,
  ) {
    this.id = init.id;
    this.position = new Vector3(init.x, init.y, init.z);
    this.yaw = init.yaw;
    this.homeX = init.x;
    this.homeZ = init.z;
    this.homeYaw = init.yaw;
    this.syncTransform();
    this.transform.snap();
  }

  // ---- LockOnTarget ----

  get alive(): boolean {
    return this.stateId !== 'dead';
  }

  get state(): BossStateId {
    return this.stateId;
  }

  /** 実行中の技（なければ null）。 */
  get currentMove(): BossMoveId | null {
    return this.run?.move.id ?? null;
  }

  get debugInfo(): BossDebugInfo {
    const run = this.run;
    return {
      state: this.stateId,
      phase: this.phase,
      hp: this.hp,
      x: this.position.x,
      z: this.position.z,
      yaw: this.yaw,
      distance: this.distanceNow,
      band: distanceBand(this.distanceNow),
      history: [...this.history],
      previousMove: this.history[this.history.length - 1] ?? null,
      move: run?.move.id ?? null,
      stage: run ? run.stageIndex + 1 : 0,
      stageFrame: run?.frame ?? 0,
      weights: this.lastWeights,
      beatLeft: this.stateId === 'beat' ? Math.max(0, this.beatLength - this.stateFrames) : 0,
      breakUsed: this.breakUsed,
      transitionPending: this.transitionPending,
      player: {
        behindFrames: this.tracker.behindFrames,
        rollStreak: this.tracker.rollStreak,
        healing: this.tracker.healing,
      },
    };
  }

  // ---- 外からの操作 ----

  /** 戦闘を始める（最初はビートから）。 */
  engage(): void {
    if (this.stateId !== 'dormant') return;
    if (!this.engaged) {
      this.engaged = true;
      this.deps.events?.emit('bossEngaged', {
        id: this.id,
        hp: this.hp,
        maxHp: this.maxHp,
        phase: this.phase,
        boundaries: [BOSS_BATTLE.phase2Hp],
      });
    }
    this.enterBeat();
  }

  /**
   * 指定した技を今すぐ始める（回避検証ツール・検証 API 用。AI の選択・ビートは通らない）。実行中の技は打ち切る。
   * `skipApproach` を true にすると接近を飛ばし、いまの位置から予備動作に入る（F1 = 技の 1 段目の F1）。
   * 使えない技（未登録・そのフェーズで使えない）なら false。
   */
  startMove(id: BossMoveId, options: { skipApproach?: boolean } = {}): boolean {
    if (!this.alive) return false;
    const move = this.deps.moves.get(id);
    if (!move || !move.phases.includes(this.phase)) return false;
    this.cancelRun();
    this.history.push(move.id);
    if (this.history.length > BOSS_AI.historyLength) this.history.shift();
    this.pending = { move, rollBonus: false };
    this.beginMove(options.skipApproach ?? false);
    return true;
  }

  /** 交戦中か（`engage()` 済みで、リセットされていない）。 */
  get isEngaged(): boolean {
    return this.engaged;
  }

  /** フェーズ移行の経過フレーム（開始の瞬間が 0、F1 から数える）。移行中でなければ -1。 */
  get transitionFrame(): number {
    return this.stateId === 'transition' ? this.stateFrames : -1;
  }

  /** 無敵か（フェーズ移行中）。被弾側（`UprightTarget.invulnerable`）へ写す。 */
  get invulnerable(): boolean {
    return this.stateId === 'transition';
  }

  /** このフェーズでまだ崩せるか。 */
  get canBreak(): boolean {
    return !this.breakUsed;
  }

  /**
   * フェーズを切り替える（移行の終わりと確認用の dev フックが呼ぶ）。新しいフェーズでは崩しが 1 回使えるようになる
   * （強靭度は最大へ戻る）。
   */
  setPhase(phase: BossPhase): void {
    this.phase = phase;
    this.breakUsed = false;
    this.transitionPending = false;
    this.deps.poise?.reset();
  }

  /** HP を更新する（被弾側の HP の写し）。減ったら `bossHpChanged`（減少量つき）を発行する。 */
  setHp(hp: number): void {
    const clamped = Math.max(0, Math.min(this.maxHp, hp));
    if (clamped === this.hp) return;
    const damage = Math.max(0, this.hp - clamped);
    this.hp = clamped;
    this.deps.events?.emit('bossHpChanged', {
      id: this.id,
      hp: clamped,
      maxHp: this.maxHp,
      damage,
      phase: this.phase,
    });
  }

  /**
   * リセット（プレイヤーの死亡・篝火の休憩。E5-8a が使う）: HP 満タン・フェーズ 1・待機位置へ戻り、`engage()` まで動かない。
   * 撃破済みでも復活する（撃破済みボスを戻すかどうかは呼び出し側が決める）。交戦中だったら `bossReset` を発行する。
   * 被弾側の HP・強靭度は呼び出し側（`BossSystem.reset`）が戻す。
   */
  reset(cause: 'death' | 'rest' | 'removed' = 'death'): void {
    const wasEngaged = this.engaged;
    this.cancelRun();
    this.pending = null;
    this.position.set(this.homeX, this.position.y, this.homeZ);
    this.yaw = this.homeYaw;
    this.hp = this.maxHp;
    this.phase = 1;
    this.breakUsed = false;
    this.transitionPending = false;
    this.afterTransition = false;
    this.engaged = false;
    this.history.length = 0;
    this.lastWeights = null;
    this.freezeLeft = 0;
    this.staggerLeft = 0;
    this.tracker.reset();
    this.deps.poise?.reset();
    this.enter('dormant');
    this.syncTransform();
    this.transform.snap();
    if (wasEngaged) {
      this.deps.events?.emit('bossReset', {
        id: this.id,
        cause,
        hp: this.maxHp,
        maxHp: this.maxHp,
      });
    }
  }

  /** ヒットストップ（`Game.registerFreezable`）。 */
  freeze(frames: number): void {
    this.freezeLeft = Math.max(this.freezeLeft, Math.floor(frames));
  }

  /**
   * 強靭度崩し: 技を打ち切って `frames` ステップ行動不能にする。崩しは**フェーズごとに 1 回まで**で、崩した後は
   * そのフェーズの間、強靭度ダメージが無効になる（`Poise.damageDisabled`）。2 回目以降は何もしない。
   */
  stagger(frames: number): void {
    if (!this.alive || this.stateId === 'transition' || this.breakUsed) return;
    this.breakUsed = true;
    if (this.deps.poise) this.deps.poise.damageDisabled = true;
    this.cancelRun();
    this.staggerLeft = frames;
    this.enter('staggered');
  }

  /** 撃破（HP 0）。`bossDefeated` を発行する。 */
  kill(): void {
    if (!this.alive) return;
    this.cancelRun();
    this.setHp(0);
    this.enter('dead');
    this.deps.events?.emit('bossDefeated', {
      id: this.id,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
    });
  }

  /** 撃破イベントなしで取り除く（デバッグ・シーン切替）。交戦中だったら `bossReset`（cause `removed`）だけ発行する。 */
  dispose(): void {
    if (!this.alive) return;
    this.cancelRun();
    this.enter('dead');
    if (this.engaged) {
      this.engaged = false;
      this.deps.events?.emit('bossReset', {
        id: this.id,
        cause: 'removed',
        hp: this.maxHp,
        maxHp: this.maxHp,
      });
    }
  }

  moveBy(dx: number, dz: number): void {
    this.position.x += dx;
    this.position.z += dz;
    const arena = this.deps.arena;
    if (arena) {
      const ox = this.position.x - arena.x;
      const oz = this.position.z - arena.z;
      const d = Math.hypot(ox, oz);
      const limit = Math.max(0, arena.radius - BOSS_STATS.radius);
      if (d > limit && d > 1e-6) {
        this.position.x = arena.x + (ox / d) * limit;
        this.position.z = arena.z + (oz / d) * limit;
      }
    }
  }

  turnToward(targetYaw: number, degPerSecond: number, dt: number): void {
    this.yaw = turnToward(this.yaw, targetYaw, degPerSecond * DEG, BOSS_AI.turnResponse, dt);
  }

  // ---- 1 ステップ ----

  /** 1 固定ステップ進める。プレイヤー・敵の更新後、判定の解決（`combat.step`）の前に呼ぶ。 */
  update(dt: number, player: BossPlayerInfo, playerY = this.position.y): void {
    this.transform.beginStep();
    this.target.set(player.x, playerY, player.z);
    this.distanceNow = Math.hypot(player.x - this.position.x, player.z - this.position.z);
    // プレイヤー状態の追跡は戦闘前・凍結中も続ける（背後・ロール連打を正しく数える）
    this.tracker.update(this.position.x, this.position.z, this.yaw, player);
    if (this.stateId === 'dead' || this.stateId === 'dormant') {
      this.syncTransform();
      return;
    }
    if (this.freezeLeft > 0) {
      this.freezeLeft--;
      this.syncTransform();
      return;
    }
    this.stateFrames++;

    // HP がフェーズ 2 の閾値以下になったら移行を予約する（技の最中なら、その技は最後まで出す）
    if (this.phase === 1 && this.hp <= BOSS_BATTLE.phase2Hp) {
      this.transitionPending = true;
    }
    // 技の外（ビート・接近・歩み寄り・1 歩下がり）なら、すぐ移行する
    if (
      this.transitionPending &&
      (this.stateId === 'beat' ||
        this.stateId === 'approach' ||
        this.stateId === 'reposition' ||
        this.stateId === 'stepBack')
    ) {
      this.cancelRun();
      this.beginTransition();
      this.syncTransform();
      return;
    }

    switch (this.stateId) {
      case 'beat':
        this.updateBeat(dt);
        break;
      case 'stepBack':
        this.updateStepBack();
        break;
      case 'transition':
        if (this.stateFrames >= BOSS_BATTLE.transitionFrames) {
          this.setPhase(2);
          this.afterTransition = true;
          this.enterBeat();
        }
        break;
      case 'approach':
        this.updateApproach(dt);
        break;
      case 'attack':
        this.updateAttack(dt);
        break;
      case 'reposition':
        this.updateReposition(dt);
        break;
      case 'staggered':
        if (this.stateFrames >= this.staggerLeft) this.enterBeat();
        break;
      default:
        break;
    }
    this.syncTransform();
  }

  // ---- 状態 ----

  private enter(state: BossStateId): void {
    this.stateId = state;
    this.stateFrames = 0;
  }

  /** フェーズ移行を始める（無敵・行動停止。`bossPhaseBoundary` を発行する。演出は購読側）。 */
  private beginTransition(): void {
    this.transitionPending = false;
    this.pending = null;
    this.deps.poise?.reset();
    this.enter('transition');
    this.deps.events?.emit('bossPhaseBoundary', {
      id: this.id,
      from: 1,
      to: 2,
      hp: this.hp,
      transitionFrames: BOSS_BATTLE.transitionFrames,
    });
  }

  private enterBeat(): void {
    if (!this.aiEnabled) {
      this.enter('dormant');
      return;
    }
    // 技の終わり・崩しの終わりなど、硬直が明けたところでフェーズ移行を始める
    if (this.transitionPending && this.phase === 1 && this.alive) {
      this.beginTransition();
      return;
    }
    const [min, max] = BOSS_AI.beatFrames[this.phase];
    this.beatLength = min + Math.floor(this.deps.random() * (max - min + 1));
    this.enter('beat');
  }

  /** 対象へ向き直る（旋回速度はフェーズの値）。 */
  private faceTarget(dt: number, rateMultiplier = 1): void {
    const dx = this.target.x - this.position.x;
    const dz = this.target.z - this.position.z;
    if (Math.hypot(dx, dz) < 1e-3) return;
    this.turnToward(yawOf(dx, dz), BOSS_STATS.turnDegPerSecond[this.phase] * rateMultiplier, dt);
  }

  private updateBeat(dt: number): void {
    this.faceTarget(dt);
    if (this.stateFrames >= this.beatLength) this.selectMove();
  }

  private updateReposition(dt: number): void {
    this.faceTarget(dt);
    this.walkToward(dt, 'walk');
    if (this.stateFrames >= BOSS_AI.repositionFrames) this.enterBeat();
  }

  /** 次の技を選び、始める。 */
  private selectMove(): void {
    const band = distanceBand(this.distanceNow);
    const tracker = this.tracker;
    const choose = (forBand: DistanceBand) =>
      chooseBossMove(
        {
          phase: this.phase,
          band: forBand,
          history: this.history,
          available: (id) => {
            const m = this.deps.moves.get(id);
            return m !== undefined && m.phases.includes(this.phase);
          },
          behind: tracker.behind,
          rollStreak: tracker.rollStreakReached,
        },
        this.deps.random,
      );
    // フェーズ移行の直後は距離に関わらず遠距離帯の技（跳躍・灰の波）で再開する（6.5 節）。なければ通常の選択
    let choice = this.afterTransition ? choose('far') : choose(band);
    if (this.afterTransition && !choice.id) choice = choose(band);
    this.afterTransition = false;
    this.lastWeights = choice.weights;
    // ロール連打の補正は「次の近距離技」で使い切る（選ばれた技が何であっても）
    if (band === 'close' && tracker.rollStreakReached) tracker.consumeRollStreak();
    const move = choice.id ? this.deps.moves.get(choice.id) : undefined;
    if (!move) {
      this.enter('reposition');
      return;
    }
    this.history.push(move.id);
    if (this.history.length > BOSS_AI.historyLength) this.history.shift();
    this.pending = { move, rollBonus: choice.weights.rollBonus && move.id === 'combo3' };
    // 壁際に追い詰められた対象には、近距離技の発生前に 1 歩下がって射程を調整する（6.6 節）
    const arena = this.deps.arena;
    if (
      arena &&
      band === 'close' &&
      pinnedAgainstWall(arena, this.position, { x: this.target.x, z: this.target.z })
    ) {
      this.enter('stepBack');
      return;
    }
    this.beginMove();
  }

  /** 対象から離れる向きに `BOSS_WALL.stepBackDistance` を下がる（アリーナの縁で止まる）。終わったら技を始める（接近は飛ばす）。 */
  private updateStepBack(): void {
    const dx = this.position.x - this.target.x;
    const dz = this.position.z - this.target.z;
    const len = Math.hypot(dx, dz);
    const step = BOSS_WALL.stepBackDistance / BOSS_WALL.stepBackFrames;
    if (len > 1e-3) this.moveBy((dx / len) * step, (dz / len) * step);
    this.distanceNow = Math.hypot(this.target.x - this.position.x, this.target.z - this.position.z);
    if (this.stateFrames >= BOSS_WALL.stepBackFrames) {
      this.beginMove(true);
    }
  }

  private beginMove(skipApproach = false): void {
    const pending = this.pending;
    if (!pending) return;
    this.pending = null;
    const { move, rollBonus } = pending;
    let stages = stagesOf(move, this.phase);
    // ロール連打の補正で三連撃を選んだときも、1 技目の予備動作は 30F 以上を保つ
    const first = stages[0];
    if (rollBonus && first && first.startup < BOSS_CORRECTION.comboMinStartup) {
      stages = [{ ...first, startup: BOSS_CORRECTION.comboMinStartup }, ...stages.slice(1)];
    }
    this.run = {
      move,
      stages,
      stageIndex: 0,
      frame: 0,
      attack: null,
      primed: false,
      armor: 'none',
    };
    move.hooks?.onStart?.(this.moveContext());
    const a = move.approach;
    if (a && !skipApproach && this.distanceNow > a.stopRange) {
      this.approachMax = a.maxFrames ?? BOSS_AI.approachMaxFrames;
      this.enter('approach');
    } else {
      this.beginStage(0);
    }
  }

  private updateApproach(dt: number): void {
    const run = this.run;
    const a = run?.move.approach;
    if (!run || !a) {
      this.enterBeat();
      return;
    }
    this.faceTarget(dt);
    this.walkToward(dt, a.speed);
    if (this.distanceNow <= a.stopRange || this.stateFrames >= this.approachMax) {
      this.beginStage(0);
    }
  }

  /** 対象の方へ向いている向きに歩く / 走る（アリーナ内）。 */
  private walkToward(dt: number, speed: 'walk' | 'run'): void {
    const v = speed === 'run' ? BOSS_STATS.runSpeed[this.phase] : BOSS_STATS.walkSpeed;
    const step = Math.min(v * dt, Math.max(0, this.distanceNow - BOSS_STATS.radius));
    this.moveBy(Math.sin(this.yaw) * step, Math.cos(this.yaw) * step);
    this.distanceNow = Math.hypot(this.target.x - this.position.x, this.target.z - this.position.z);
  }

  // ---- 技の実行 ----

  private moveContext(): BossMoveContext {
    const run = this.run;
    return {
      boss: this,
      target: this.target,
      phase: this.phase,
      random: this.deps.random,
      stageIndex: run?.stageIndex ?? 0,
      frame: run?.frame ?? 0,
    };
  }

  private beginStage(index: number): void {
    const run = this.run;
    if (!run) return;
    const stage = run.stages[index];
    if (!stage) return;
    run.stageIndex = index;
    run.frame = 0;
    run.primed = false;
    run.armor = 'none';
    run.attack = this.deps.combat.startAttack(this.id, 'enemy', {
      id: `boss.${run.move.id}.${index + 1}`,
      damage: stage.damage,
      poiseDamage: stage.poiseDamage,
      guardStaminaCost: stage.guardStaminaCost,
    });
    this.enter('attack');
    this.stateFrames = 0;
    run.move.hooks?.onStageStart?.(this.moveContext());
  }

  /** 実行中の段の判定形状。 */
  private shapeOf(run: MoveRun, stage: BossStageDef): HitShape {
    const hooks = run.move.hooks;
    if (hooks?.shape) return hooks.shape(this.moveContext(), stage);
    return sectorShape(this.position, this.yaw, stage.arcDeg, stage.range);
  }

  private updateAttack(dt: number): void {
    const run = this.run;
    if (!run?.attack) {
      this.enterBeat();
      return;
    }
    const stage = run.stages[run.stageIndex];
    if (!stage) {
      this.endMove(false);
      return;
    }
    run.frame++;
    const f = run.frame;
    const ctx = this.moveContext();

    // 予備動作の前半だけ対象へ向きを追う（以降は向き固定）。回復中に近距離なら追尾率 120%
    if (f <= trackEndFrame(stage)) {
      let rate =
        (stage.trackDegPerSecond ?? BOSS_STATS.turnDegPerSecond[this.phase]) *
        (stage.trackRate ?? 1);
      if (this.tracker.healing && distanceBand(this.distanceNow) === 'close') {
        rate *= BOSS_CORRECTION.healTrackRate;
      }
      const dx = this.target.x - this.position.x;
      const dz = this.target.z - this.position.z;
      if (Math.hypot(dx, dz) > 1e-3) this.turnToward(yawOf(dx, dz), rate, dt);
    }

    run.move.hooks?.onStep?.(ctx, dt);
    this.applyArmor(run, stage, f);

    const hitStart = stage.startup + 1;
    const hitEnd = stage.startup + stage.active;
    if (!run.primed && f >= stage.startup) {
      // 発生の最終フレームを判定開始直前の姿勢にして、持続の初日から前フレームとの間をスイープする
      this.deps.combat.prime(run.attack, this.shapeOf(run, stage));
      run.primed = true;
    }
    if (f === hitStart) this.emitPillarHits(run, stage);
    if (f >= hitStart && f <= hitEnd) {
      this.deps.combat.resolve(run.attack, this.shapeOf(run, stage));
      // 突進: 持続の間に `moveDistance` を均等に進む
      if (stage.moveDistance > 0 && stage.active > 0) {
        const step = stage.moveDistance / stage.active;
        this.moveBy(Math.sin(this.yaw) * step, Math.cos(this.yaw) * step);
      }
    }
    if (f < totalFrames(stage)) return;

    // 段の終わり: 次の段があれば続ける（フェーズ移行待ちの 2 発目以降の中止は E5-7）
    this.deps.combat.endAttack(run.attack);
    run.attack = null;
    // フェーズ移行待ちなら 2 発目以降の追撃は出さず、ここで技を終える（移行が始まる）
    if (run.stageIndex + 1 < run.stages.length && !this.transitionPending) {
      this.beginStage(run.stageIndex + 1);
      return;
    }
    this.endMove(false);
  }

  /** 判定の開始時に、扇形が柱に触れていれば `bossPillarHit` を発行する（攻撃は柱で遮られない。破片の演出のフック）。 */
  private emitPillarHits(run: MoveRun, stage: BossStageDef): void {
    const { pillars, events } = this.deps;
    if (!pillars || !events || run.move.hooks?.shape) return;
    pillars.forEach((pillar, index) => {
      if (!sectorTouchesCircle(this.position, this.yaw, stage.arcDeg, stage.range, pillar)) return;
      const dx = pillar.x - this.position.x;
      const dz = pillar.z - this.position.z;
      const len = Math.hypot(dx, dz) || 1;
      events.emit('bossPillarHit', {
        id: this.id,
        pillar: index,
        // 柱の表面（ボス側）、ボスの腰の高さ
        position: {
          x: pillar.x - (dx / len) * pillar.radius,
          y: this.position.y + 1.5,
          z: pillar.z - (dz / len) * pillar.radius,
        },
        moveId: run.move.id,
      });
    });
  }

  /** 強靭度の加算: スーパーアーマー区間は大きく、予備動作〜持続は +30、硬直は 0。変わったときだけ与える。 */
  private applyArmor(run: MoveRun, stage: BossStageDef, f: number): void {
    const poise = this.deps.poise;
    if (!poise) return;
    const sa = stage.superArmor;
    const armor: MoveRun['armor'] =
      sa && f >= sa.start && f <= sa.end
        ? 'super'
        : f <= stage.startup + stage.active
          ? 'normal'
          : 'none';
    if (armor === run.armor) return;
    run.armor = armor;
    if (armor === 'super') poise.grant(BOSS_SUPER_ARMOR_BONUS);
    else if (armor === 'normal') poise.grant(stage.poiseBonus ?? POISE.enemyAttackingBonus);
    else poise.clearBonus();
  }

  /** 技を終える（正常終了ならビートへ。打ち切りは呼び出し側が状態を決める）。 */
  private endMove(cancelled: boolean): void {
    const run = this.run;
    if (run) {
      if (run.attack) this.deps.combat.endAttack(run.attack);
      this.deps.poise?.clearBonus();
      run.move.hooks?.onEnd?.(this.moveContext(), cancelled);
    }
    this.run = null;
    if (!cancelled) this.enterBeat();
  }

  private cancelRun(): void {
    if (this.run) this.endMove(true);
    this.pending = null;
  }

  private syncTransform(): void {
    this.transform.position.copy(this.position);
    this.quat.setFromAxisAngle(Y_AXIS, this.yaw);
    this.transform.quaternion.copy(this.quat);
  }
}
