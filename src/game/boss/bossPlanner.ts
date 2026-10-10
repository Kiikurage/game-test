import { pickWeighted } from '../enemy/attackRunner';
import { angleDelta, yawOf } from '../player/movement';
import {
  BOSS_AI,
  BOSS_BANDS,
  BOSS_CORRECTION,
  BOSS_MOVE_IDS,
  BOSS_WEIGHTS,
  type BossMoveId,
  type BossPhase,
  type DistanceBand,
} from './bossData';

const DEG = Math.PI / 180;

/** 距離帯。3.5m 未満が近、8m 超が遠（ちょうど 3.5m / 8m は中）。 */
export function distanceBand(distance: number): DistanceBand {
  if (distance < BOSS_BANDS.closeBelow) return 'close';
  if (distance > BOSS_BANDS.farAbove) return 'far';
  return 'mid';
}

// ---- プレイヤー状態の追跡 ----

/** ボスがプレイヤーについて毎ステップ受け取る情報。 */
export interface BossPlayerInfo {
  readonly x: number;
  readonly z: number;
  /** 回復動作中（回復瓶・空振り）。 */
  readonly healing: boolean;
  /** ロール中。 */
  readonly rolling: boolean;
}

/**
 * プレイヤー状態による補正の入力（6.4 節）: 背後に居続けたフレーム数・ロール連打・回復中。
 * ボスの位置・向きは `update` で毎ステップ渡す（技の途中も数える）。
 */
export class PlayerTracker {
  /** ボスの背後（真後ろから ±60°）に居続けているフレーム数。 */
  behindFrames = 0;
  /** ロールを連続で使った回数（間隔が `rollStreakGapFrames` を超えると 0 に戻る）。 */
  rollStreak = 0;
  healing = false;
  private rolling = false;
  /** 直近の「ボスとプレイヤーの距離」（`retreatWindowFrames` F ぶん）。後退の検出に使う。 */
  private readonly recentDistances: number[] = [];
  private sinceRollEnd = Number.POSITIVE_INFINITY;

  update(bossX: number, bossZ: number, bossYaw: number, player: BossPlayerInfo): void {
    this.healing = player.healing;
    // 背後: ボスの向きと「ボス → プレイヤー」の向きの差が 180° ± 60° 以内
    const dx = player.x - bossX;
    const dz = player.z - bossZ;
    this.recentDistances.push(Math.hypot(dx, dz));
    if (this.recentDistances.length > BOSS_CORRECTION.retreatWindowFrames) {
      this.recentDistances.shift();
    }
    if (Math.hypot(dx, dz) > 1e-3) {
      const diff = Math.abs(angleDelta(bossYaw, yawOf(dx, dz)));
      const behind = diff >= Math.PI - BOSS_CORRECTION.behindHalfDeg * DEG;
      this.behindFrames = behind ? this.behindFrames + 1 : 0;
    }
    // ロール連打: 開始の立ち上がりで数え、前のロールの終わりから間が空きすぎたら数え直す
    if (player.rolling && !this.rolling) {
      this.rollStreak =
        this.sinceRollEnd <= BOSS_CORRECTION.rollStreakGapFrames ? this.rollStreak + 1 : 1;
    }
    if (!player.rolling) {
      if (this.rolling) this.sinceRollEnd = 0;
      else if (this.sinceRollEnd !== Number.POSITIVE_INFINITY) this.sinceRollEnd++;
      if (this.sinceRollEnd > BOSS_CORRECTION.rollStreakGapFrames) this.rollStreak = 0;
    }
    this.rolling = player.rolling;
  }

  /** 戦闘のリセット（追跡を最初から）。 */
  reset(): void {
    this.behindFrames = 0;
    this.rollStreak = 0;
    this.healing = false;
    this.rolling = false;
    this.sinceRollEnd = Number.POSITIVE_INFINITY;
    this.recentDistances.length = 0;
  }

  /** 近距離にいたプレイヤーに直近で離れられた（跳躍の重みを上げる。6.3 節 技 5）。 */
  get retreated(): boolean {
    const d = this.recentDistances;
    if (d.length < 2) return false;
    const min = Math.min(...d);
    const now = d[d.length - 1] ?? min;
    return min < BOSS_BANDS.closeBelow && now - min >= BOSS_CORRECTION.retreatDistance;
  }

  /** ロール連打の補正を使った（次の近距離技で消費する）。 */
  consumeRollStreak(): void {
    this.rollStreak = 0;
  }

  get behind(): boolean {
    return this.behindFrames >= BOSS_CORRECTION.behindFrames;
  }

  get rollStreakReached(): boolean {
    return this.rollStreak >= BOSS_CORRECTION.rollStreak;
  }
}

// ---- 重みの計算と選択 ----

export interface BossSelectionContext {
  readonly phase: BossPhase;
  readonly band: DistanceBand;
  /** 直近に選んだ技（古い順）。 */
  readonly history: readonly string[];
  /** その技が使えるか（登録済み・フェーズが合う）。 */
  readonly available: (id: BossMoveId) => boolean;
  /** 背後に 90F 以上居る。 */
  readonly behind: boolean;
  /** ロールを 3 回連続で使った。 */
  readonly rollStreak: boolean;
  /** 近距離にいたプレイヤーに後退された（跳躍の重みを上げる）。省略は false。 */
  readonly retreated?: boolean;
}

/** 技 1 つの重みの内訳（デバッグ表示・テスト用）。 */
export interface WeightEntry {
  readonly id: BossMoveId;
  /** 重み表の値。 */
  readonly base: number;
  /** 直前と同じ技なら 0.5、そうでなければ 1。 */
  readonly repeatFactor: number;
  /** 背後張り付きの補正（×2 または 1）。 */
  readonly behindFactor: number;
  /** 補正後の重み（連続 3 回・使えない技は 0）。 */
  readonly weight: number;
  /** 選ばれる確率（重みの合計に対する割合）。 */
  readonly probability: number;
  /** 0 になった理由。 */
  readonly excluded?: 'table' | 'unavailable' | 'consecutive';
}

export interface BossWeights {
  readonly entries: readonly WeightEntry[];
  /** ロール連打の補正（三連撃 +20%）がかかった。 */
  readonly rollBonus: boolean;
}

/** 同じ技が `maxConsecutive` 回続いているか（次に選ぶと上限を超える）。 */
function atRepeatLimit(id: string, history: readonly string[]): boolean {
  const n = BOSS_AI.maxConsecutive;
  if (history.length < n) return false;
  for (let i = 1; i <= n; i++) if (history[history.length - i] !== id) return false;
  return true;
}

/**
 * 重み表 + 直前の技 + プレイヤー状態から、各技の重みを求める（6.4 節）。
 *
 * 1. 重み表（フェーズ × 距離帯）。未登録・フェーズ外の技、表が 0 の技は除く。
 * 2. 同じ技を 3 回連続で選ばない（重み 0）。直前と同じ技（2 連続目）は重み半分。
 * 3. 背後に 90F 以上: 回転斬り（P2）・薙ぎ払いを ×2。
 * 3b. 近距離にいたプレイヤーに後退された: 跳躍の重みを `retreatLeapWeight` 以上にする。
 * 4. ロール 3 連続 + 近距離: 三連撃の確率を +20%（ほかの重みの合計に対して、確率がちょうど +0.2 になるよう決める）。
 */
export function computeWeights(ctx: BossSelectionContext): BossWeights {
  const table = BOSS_WEIGHTS[ctx.phase][ctx.band];
  const last = ctx.history[ctx.history.length - 1];
  const raw: (Omit<WeightEntry, 'probability' | 'weight'> & { weight: number })[] =
    BOSS_MOVE_IDS.map((id) => {
      // 近距離で後退された時は跳躍を選べる（距離を詰める）。重み表が大きければそちら
      const base =
        id === 'leap' && ctx.retreated && ctx.band !== 'far'
          ? Math.max(table[id] ?? 0, BOSS_CORRECTION.retreatLeapWeight)
          : (table[id] ?? 0);
      const repeatFactor = last === id ? BOSS_AI.repeatWeightFactor : 1;
      const behindFactor =
        ctx.behind && (id === 'sweep' || (id === 'spin' && ctx.phase === 2))
          ? BOSS_CORRECTION.behindWeightFactor
          : 1;
      let excluded: WeightEntry['excluded'];
      if (base <= 0) excluded = 'table';
      else if (!ctx.available(id)) excluded = 'unavailable';
      else if (atRepeatLimit(id, ctx.history)) excluded = 'consecutive';
      const weight = excluded ? 0 : base * repeatFactor * behindFactor;
      return { id, base, repeatFactor, behindFactor, weight, ...(excluded && { excluded }) };
    });

  // ロール連打: 近距離の次の技で三連撃の確率を +20%（絶対値）にする
  let rollBonus = false;
  if (ctx.rollStreak && ctx.band === 'close') {
    const combo = raw.find((e) => e.id === 'combo3');
    if (combo && combo.weight > 0) {
      const rest = raw.reduce((s, e) => (e.id === 'combo3' ? s : s + e.weight), 0);
      const p = combo.weight / (combo.weight + rest);
      const q = Math.min(0.95, p + BOSS_CORRECTION.comboBonus);
      if (rest > 0 && q > p) {
        combo.weight = (q * rest) / (1 - q);
        rollBonus = true;
      }
    }
  }

  const total = raw.reduce((s, e) => s + e.weight, 0);
  const entries = raw.map((e) => ({ ...e, probability: total > 0 ? e.weight / total : 0 }));
  return { entries, rollBonus };
}

export interface BossChoice {
  /** 選んだ技（選べる技がなければ null）。 */
  readonly id: BossMoveId | null;
  readonly weights: BossWeights;
}

/** 重み付き乱択で次の技を選ぶ。乱数は注入する（シード固定のテスト用）。 */
export function chooseBossMove(ctx: BossSelectionContext, random: () => number): BossChoice {
  const weights = computeWeights(ctx);
  const id = pickWeighted(
    weights.entries.map((e) => ({ id: e.id, weight: e.weight })),
    random,
    { history: ctx.history as readonly BossMoveId[], maxConsecutive: BOSS_AI.maxConsecutive },
  );
  return { id, weights };
}
