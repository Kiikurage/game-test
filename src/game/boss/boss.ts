import { Quaternion, Vector3 } from 'three/webgpu';
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
  BOSS_CORRECTION,
  BOSS_STATS,
  BOSS_SUPER_ARMOR_BONUS,
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

  constructor(
    init: BossInit,
    private readonly deps: BossDeps,
  ) {
    this.id = init.id;
    this.position = new Vector3(init.x, init.y, init.z);
    this.yaw = init.yaw;
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
    if (this.stateId === 'dormant' && this.aiEnabled) this.enterBeat();
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

  /** フェーズを切り替える（E5-7 が呼ぶ。移行演出はそちら）。 */
  setPhase(phase: BossPhase): void {
    this.phase = phase;
  }

  /** ヒットストップ（`Game.registerFreezable`）。 */
  freeze(frames: number): void {
    this.freezeLeft = Math.max(this.freezeLeft, Math.floor(frames));
  }

  /** 強靭度崩し: 技を打ち切って `frames` ステップ行動不能にする。 */
  stagger(frames: number): void {
    if (!this.alive) return;
    this.cancelRun();
    this.staggerLeft = frames;
    this.enter('staggered');
  }

  kill(): void {
    if (!this.alive) return;
    this.cancelRun();
    this.hp = 0;
    this.enter('dead');
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

    switch (this.stateId) {
      case 'beat':
        this.updateBeat(dt);
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

  private enterBeat(): void {
    if (!this.aiEnabled) {
      this.enter('dormant');
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
    const choice = chooseBossMove(
      {
        phase: this.phase,
        band,
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
    this.beginMove();
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
      ...(stage.knockback !== undefined && { knockback: stage.knockback }),
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
    if (run.stageIndex + 1 < run.stages.length) {
      this.beginStage(run.stageIndex + 1);
      return;
    }
    this.endMove(false);
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
