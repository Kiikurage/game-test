import { dbToGain } from './volume';

/** ダッキング 1 件の指定。 */
export interface DuckOptions {
  /** 目標レベル（dB、負の値。例: -12）。 */
  readonly db: number;
  /** 目標へ下げきるまでの時間（秒）。 */
  readonly fadeSeconds: number;
  /**
   * 目標レベルを保持する時間（秒）。省略すると `release()` が呼ばれるまで保持する。
   * 保持が終わると `releaseSeconds` かけて元に戻る。
   */
  readonly holdSeconds?: number;
  /** 戻すまでの時間（秒）。既定 0.5 秒。 */
  readonly releaseSeconds?: number;
}

export const DEFAULT_RELEASE_SECONDS = 0.5;

/** 区間の長さ 0 を避けるための下限（秒）。 */
const MIN_SECONDS = 0.001;

interface Duck {
  readonly start: number;
  readonly fade: number;
  readonly target: number; // ゲイン（振幅）
  readonly release: number;
  /** 戻し開始時刻。保持中（解放待ち）は undefined。 */
  readonly releaseAt: number | undefined;
  /** releaseAt 時点のレベル（ゲイン）。 */
  readonly releaseFrom: number;
}

function baseLevel(d: Duck, t: number): number {
  if (t <= d.start) return 1;
  if (t >= d.start + d.fade) return d.target;
  return 1 + (d.target - 1) * ((t - d.start) / d.fade);
}

function level(d: Duck, t: number): number {
  if (d.releaseAt === undefined || t <= d.releaseAt) return baseLevel(d, t);
  if (t >= d.releaseAt + d.release) return 1;
  return d.releaseFrom + (1 - d.releaseFrom) * ((t - d.releaseAt) / d.release);
}

function endTime(d: Duck): number {
  return d.releaseAt === undefined ? Infinity : d.releaseAt + d.release;
}

/** 傾きが変わる時刻。 */
function breakpoints(d: Duck): number[] {
  const pts = [d.start, d.start + d.fade];
  if (d.releaseAt !== undefined) pts.push(d.releaseAt, d.releaseAt + d.release);
  return pts;
}

export interface GainKnot {
  readonly time: number;
  readonly gain: number;
}

/**
 * ダッキング包絡の計算（純粋ロジック）。複数のダッキングが重なったときは最も小さいゲインを採用する。
 * 各ダッキングは「フェード → 保持 → 戻し」の折れ線（ゲイン領域で線形）。
 */
export class DuckingEnvelope {
  private readonly ducks = new Map<number, Duck>();
  private nextId = 1;

  /** ダッキングを開始し、解放用の ID を返す。 */
  start(now: number, opts: DuckOptions): number {
    const id = this.nextId++;
    const fade = Math.max(MIN_SECONDS, opts.fadeSeconds);
    const release = Math.max(MIN_SECONDS, opts.releaseSeconds ?? DEFAULT_RELEASE_SECONDS);
    const target = Math.min(1, dbToGain(opts.db));
    const releaseAt =
      opts.holdSeconds === undefined ? undefined : now + fade + Math.max(0, opts.holdSeconds);
    this.ducks.set(id, { start: now, fade, target, release, releaseAt, releaseFrom: target });
    return id;
  }

  /** 保持中のダッキングを解除し、`releaseSeconds`（省略時は開始時の指定）かけて戻す。 */
  release(now: number, id: number, releaseSeconds?: number): void {
    const d = this.ducks.get(id);
    if (!d || d.releaseAt !== undefined) return;
    const rel = releaseSeconds === undefined ? d.release : Math.max(MIN_SECONDS, releaseSeconds);
    this.ducks.set(id, { ...d, release: rel, releaseAt: now, releaseFrom: baseLevel(d, now) });
  }

  /** 時刻 t でのゲイン（1 = ダッキングなし）。 */
  gainAt(t: number): number {
    let g = 1;
    for (const d of this.ducks.values()) g = Math.min(g, level(d, t));
    return g;
  }

  /** `now` より後の折れ線の節（時刻昇順）。 */
  knotsAfter(now: number): GainKnot[] {
    const times = new Set<number>();
    for (const d of this.ducks.values()) {
      for (const p of breakpoints(d)) if (p > now) times.add(p);
    }
    return [...times].sort((a, b) => a - b).map((time) => ({ time, gain: this.gainAt(time) }));
  }

  /** 終了済みのダッキングを捨てる。 */
  prune(now: number): void {
    for (const [id, d] of this.ducks) if (endTime(d) <= now) this.ducks.delete(id);
  }

  get activeCount(): number {
    return this.ducks.size;
  }
}
