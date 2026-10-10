import type { Vector3 } from 'three/webgpu';
import type { HitShape } from '../combat';
import { checkEnemyAttack, trackEndFrame, type EnemyAttackDef, type FrameWindow } from '../data';
import type { BossMoveId, BossPhase } from './bossData';

/**
 * ボスの技の定義（6.3 節）。E3-1c の敵攻撃定義（`EnemyAttackDef`）を 1 段として、複数段・追尾率・
 * スーパーアーマー区間・接近・特殊動作（ジャンプ・灰の波など）を足したもの。
 *
 * 技は 1 つの技 = 1 つのモジュール（`moves/<名前>.move.ts`）で、`registerBossMove` で登録する
 * （`moves/*.move.ts` は自動で読み込まれる。ほかのファイルを編集しない）。
 */

/**
 * 向きを固定してから判定が出るまでの最低フレーム数（ロールで躱す猶予。6.3 節の大上段は発生 48 / 追尾 F30 まで = 18F、
 * フェーズ 2 は 42 / 30 = 12F）。雑魚の「発生の 60% まで」はボスの技表と合わないので、ボスはこの基準で検証する（本実装の判断）。
 */
export const BOSS_MIN_LOCKED_FRAMES = 12;

/**
 * 連続攻撃の 2 段目以降（`followUp`）の発生の下限（F）。雑魚の 20F（`ENEMY_ATTACK_RULES.minFollowUpStartup`）は、
 * 仕様の三連撃 P2 の 2 段目（発生 16F）と合わないので、ボスはこの値で見る（6.3 節の数値を優先する本実装の判断）。
 * 1 段目で身構えているうえ、向き固定の猶予（`BOSS_MIN_LOCKED_FRAMES`）は別に守らせる。
 */
export const BOSS_MIN_FOLLOW_UP_STARTUP = 16;

/** 技 1 段。`EnemyAttackDef` のフレームデータ・判定に、ボス用の指定を足す。 */
export interface BossStageDef extends EnemyAttackDef {
  /**
   * 追尾率: 予備動作中の旋回速度の倍率（既定 1 = ボスの旋回速度。`trackDegPerSecond` を指定すればその値が基準）。
   * 追尾を終えるフレームは `trackEndFrame`（省略時は発生の 60%）。
   */
  readonly trackRate?: number;
  /**
   * スーパーアーマー区間（この段の F から数える。両端含む）。区間の間は強靭度に大きな加算を与え、
   * 通常攻撃では崩れず仰け反りもしない。区間外は `poiseBonus`（既定 +30）。
   */
  readonly superArmor?: FrameWindow;
  /** 未ガードで命中したときの後退距離（m。盾打ちの 3m など。重い被弾のプレイヤーの転倒に効く）。 */
  readonly knockback?: number;
  /**
   * 直前の段から途切れず続く段（回転斬りの 2 回転目など）。連続攻撃の発生の下限（`BOSS_MIN_FOLLOW_UP_STARTUP`）を免除する。
   * 向き固定の猶予は別（`trackEndFrame`）で見る。`followUp` と併用する。
   */
  readonly chained?: boolean;
}

/** 技の前に行う移動（接近）。省略すると、いまの位置のまま予備動作に入る。 */
export interface BossApproach {
  readonly speed: 'walk' | 'run';
  /** この距離（m）以内まで近付いたら足を止めて予備動作に入る。 */
  readonly stopRange: number;
  /** 近付けなくてもこの F で打ち切って予備動作に入る（既定 `BOSS_AI.approachMaxFrames`）。 */
  readonly maxFrames?: number;
}

/** フックから使えるボスの操作（`Boss` の一部）。 */
export interface BossMoveActor {
  readonly position: Vector3;
  yaw: number;
  /** 水平に `dx, dz`（m）だけ動く（ジャンプ・突進など）。アリーナの外へは出ない。 */
  moveBy(dx: number, dz: number): void;
  /** 向きを `targetYaw` へ `degPerSecond` で回す。 */
  turnToward(targetYaw: number, degPerSecond: number, dt: number): void;
}

/** 技の実行中にフックが読む・動かすもの。 */
export interface BossMoveContext {
  readonly boss: BossMoveActor;
  /** 対象（プレイヤー）の足元。 */
  readonly target: Readonly<Vector3>;
  readonly phase: BossPhase;
  readonly random: () => number;
  /** 現在の段（0 始まり）と、その段に入ってからのフレーム（F1 起点）。 */
  readonly stageIndex: number;
  readonly frame: number;
}

export interface BossMoveHooks {
  /** 技が始まったとき（接近の前）。 */
  onStart?(ctx: BossMoveContext): void;
  /** 各段の頭（F1）。 */
  onStageStart?(ctx: BossMoveContext): void;
  /** 毎ステップ（ヒットストップ中を除く）。ジャンプ・突進・灰の波の発生などはここで行う。 */
  onStep?(ctx: BossMoveContext, dt: number): void;
  /** 判定形状。省略時は前方の扇形（`arcDeg` / `range`）。円・線などはここで返す。 */
  shape?(ctx: BossMoveContext, stage: BossStageDef): HitShape;
  /**
   * 柱への接触（`bossPillarHit`）を見る円（着地の叩きつけなど。判定の開始 F の時点）。`shape` を持つ技は
   * 既定では柱の判定の対象外だが、これを返す技は円で見る。
   */
  impactCircle?(ctx: BossMoveContext): {
    readonly x: number;
    readonly z: number;
    readonly radius: number;
  };
  /**
   * この F の判定形状が前フレームから不連続か（true ならスイープせず、現在の形状だけで判定する）。
   * 灰の波の 2 本目の発生のように、判定が別の場所へ「飛ぶ」F で返す。
   */
  discontinuous?(ctx: BossMoveContext): boolean;
  /** 技が終わった・打ち切られた（崩し・撃破）。 */
  onEnd?(ctx: BossMoveContext, cancelled: boolean): void;
}

export interface BossMoveDef {
  readonly id: BossMoveId;
  /** 表示名（デバッグ表示）。 */
  readonly name: string;
  /** 使えるフェーズ。重み表で 0 でも、ここに無いフェーズでは選ばれない。 */
  readonly phases: readonly BossPhase[];
  /** 段の一覧（フェーズ 1 の値。`phase2Stages` がなければフェーズ 2 も同じ）。`recovery` が次の段との間・最終硬直。 */
  readonly stages: readonly BossStageDef[];
  /** フェーズ 2 の段（数値が変わる技）。 */
  readonly phase2Stages?: readonly BossStageDef[];
  readonly approach?: BossApproach;
  readonly hooks?: BossMoveHooks;
}

export function stagesOf(move: BossMoveDef, phase: BossPhase): readonly BossStageDef[] {
  return phase === 2 && move.phase2Stages ? move.phase2Stages : move.stages;
}

/** 技定義の検証（違反の説明を返す。空なら OK）。E3-1c の `checkEnemyAttack` を各段に当てる。 */
export function checkBossMove(move: BossMoveDef): string[] {
  const problems: string[] = [];
  const sets: [string, readonly BossStageDef[]][] = [['P1', move.stages]];
  if (move.phase2Stages) sets.push(['P2', move.phase2Stages]);
  if (move.phase2Stages && move.phases.length === 1 && move.phases[0] === 1) {
    problems.push(`${move.id}: フェーズ 1 のみの技に phase2Stages がある`);
  }
  if (move.phases.length === 0) problems.push(`${move.id}: 使えるフェーズがない`);
  for (const [label, stages] of sets) {
    if (stages.length === 0) problems.push(`${move.id}(${label}): 段がない`);
    stages.forEach((stage, i) => {
      // 追尾終了は雑魚の「発生の 60% まで」ではなく、ボス用の基準（向き固定の猶予 12F 以上）で見る
      for (const p of checkEnemyAttack(stage)) {
        if (p.includes('追尾終了')) continue;
        // 連続攻撃の発生の下限はボス用（`BOSS_MIN_FOLLOW_UP_STARTUP`）で見る
        if (stage.followUp && /発生 \d+ が下限/.test(p)) continue;
        problems.push(`${move.id}(${label}) 段${i + 1}: ${p}`);
      }
      const trackEnd = trackEndFrame(stage);
      if (trackEnd > stage.startup - BOSS_MIN_LOCKED_FRAMES) {
        problems.push(
          `${move.id}(${label}) 段${i + 1}: 追尾終了 F${trackEnd} が発生 ${stage.startup} の ${BOSS_MIN_LOCKED_FRAMES}F 前を超える`,
        );
      }
      if (stage.followUp && !stage.chained && stage.startup < BOSS_MIN_FOLLOW_UP_STARTUP) {
        problems.push(
          `${move.id}(${label}) 段${i + 1}: 発生 ${stage.startup} が下限 ${BOSS_MIN_FOLLOW_UP_STARTUP} 未満（連続攻撃）`,
        );
      }
      if (i > 0 && !stage.followUp) {
        problems.push(`${move.id}(${label}) 段${i + 1}: 2 段目以降は followUp を付ける`);
      }
      if (i === 0 && stage.followUp) {
        problems.push(`${move.id}(${label}) 段1: 1 段目に followUp は付けられない`);
      }
      const sa = stage.superArmor;
      if (sa && (sa.start < 1 || sa.end < sa.start || sa.end > stage.startup + stage.active)) {
        problems.push(`${move.id}(${label}) 段${i + 1}: スーパーアーマー区間が不正`);
      }
      if (stage.trackRate !== undefined && stage.trackRate < 0) {
        problems.push(`${move.id}(${label}) 段${i + 1}: 追尾率が負`);
      }
    });
  }
  const a = move.approach;
  if (a && (a.stopRange <= 0 || (a.maxFrames !== undefined && a.maxFrames <= 0))) {
    problems.push(`${move.id}: 接近の指定が不正`);
  }
  return problems;
}

/** 技のレジストリ。技のモジュールは `registerBossMove` で既定のレジストリ（`BOSS_MOVES`）へ登録する。 */
export class BossMoveRegistry {
  private readonly moves = new Map<BossMoveId, BossMoveDef>();

  /** 登録する。同じ ID の重複はエラー。 */
  register(move: BossMoveDef): void {
    if (this.moves.has(move.id)) throw new Error(`boss move "${move.id}" already registered`);
    this.moves.set(move.id, move);
  }

  get(id: string): BossMoveDef | undefined {
    return this.moves.get(id as BossMoveId);
  }

  has(id: string): boolean {
    return this.moves.has(id as BossMoveId);
  }

  all(): BossMoveDef[] {
    return [...this.moves.values()];
  }

  /** `base` に無い技だけ `fill` から足した新しいレジストリ（未実装の技をスタブで埋める）。 */
  static merged(base: BossMoveRegistry, fill: BossMoveRegistry): BossMoveRegistry {
    const out = new BossMoveRegistry();
    for (const m of base.all()) out.register(m);
    for (const m of fill.all()) if (!out.has(m.id)) out.register(m);
    return out;
  }
}

/** 既定のレジストリ（`moves/*.move.ts` が登録する）。 */
export const BOSS_MOVES = new BossMoveRegistry();

export function registerBossMove(move: BossMoveDef): void {
  BOSS_MOVES.register(move);
}
