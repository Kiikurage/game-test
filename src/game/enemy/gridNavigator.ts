import type { NavGrid } from './navGrid';
import type { NavAgent, NavPoint, Navigator } from './navigation';

/**
 * 格子（`NavGrid`）上の A* による `Navigator`（#43）。
 *
 *  - 直線で歩けるなら経路を引かず直線（多くの追跡はこれで済む）。
 *  - 経路は A*（8 近傍、壁際はコスト増、重み付きヒューリスティック）→ 直線で結べる所まで間引く平滑化。
 *  - モバイル向けに、探索は 1 ステップあたり `budget` ノード展開までに区切って複数ステップに分散する
 *    （探索中の敵は古い経路で進むか、その場で待つ）。同じ（始点セル, 終点セル, 門の状態）の結果はキャッシュする。
 *  - 敵同士は簡易的な分離（近い味方から離れる向きへ寄せる）で重なりを避ける。
 *  - スタック検出: 前進しようとしているのに動けない状態が続いたら経路を引き直し、横へよけ、
 *    それでもだめなら一定時間「経路なし」にする。
 */
export interface GridNavigatorOptions {
  /** 1 ステップあたりの A* のノード展開数の上限。 */
  readonly budget?: number;
}

/** 経路探索の 1 件。 */
interface Job {
  readonly key: string;
  readonly start: number;
  readonly goal: number;
  readonly version: number;
  readonly requesters: Set<AgentState>;
  started: boolean;
  expansions: number;
}

interface AgentState {
  readonly agent: NavAgent | null;
  /** 現在の経路（ウェイポイント。最後は目的のセル）。null は経路なし / 未計算。 */
  path: readonly NavPoint[] | null;
  index: number;
  goalX: number;
  goalZ: number;
  version: number;
  planTick: number;
  forceReplan: boolean;
  pending: Job | null;
  /** この tick まで「到達不能」として null を返す。 */
  noPathUntil: number;
  // スタック検出
  lastCallTick: number;
  activeTicks: number;
  sampleTick: number;
  sampleX: number;
  sampleZ: number;
  stuckCount: number;
  sidestepUntil: number;
  sidestepSign: number;
}

const DEFAULT_BUDGET = 3000;
/** 探索は始点セルから終点セルまでのノード展開がこの数を超えたら諦める（到達不能とみなす）。 */
const MAX_EXPANSIONS = 400_000;
const SQRT2 = Math.SQRT2;
/** ヒューリスティックの重み（> 1 で探索が速くなり、経路は最短より少しだけ長くなりうる）。 */
const H_WEIGHT = 1.25;
/** 壁・崖縁のすぐ隣のコスト倍率の追加分（離れるほど小さくなる。`NavGrid.edgePenalty`）。 */
const EDGE_COST = 1.2;
/** 直線判定する最大距離（m）。 */
const MAX_DIRECT = 30;
/** ウェイポイントに着いたとみなす距離。 */
const REACH = 0.45;
/** 先のウェイポイントが直線で見えるなら飛ばす、その候補の距離。 */
const LOOKAHEAD = 6;
/** 目的地がこの距離を超えて動いたら経路を引き直す。 */
const GOAL_MOVED = 2;
/** 引き直しの最小間隔（tick = 1/60s）。 */
const MIN_REPLAN_TICKS = 20;
/** 到達不能と判定したあと、再試行までの間隔。 */
const NO_PATH_TICKS = 60;
const CACHE_SIZE = 48;
// スタック検出
const STUCK_WINDOW = 90;
const STUCK_MOVED = 0.3;
const STUCK_ACTIVE = 0.7;
const SIDESTEP_TICKS = 30;
const SIDESTEP_DISTANCE = 1.5;
const STUCK_GIVE_UP = 4;
// 敵同士の分離
const SEPARATION_RADIUS = 1.1;
const SEPARATION_WEIGHT = 1.4;
/** 正面の味方をかわす横方向の強さ（離れる向きに対する比）。 */
const SEPARATION_SIDE = 0.8;

/** 二分ヒープ（f 値の小さい順。同じノードの重複は遅延削除で扱う）。 */
class MinHeap {
  private ids = new Int32Array(1024);
  private keys = new Float32Array(1024);
  size = 0;

  clear(): void {
    this.size = 0;
  }

  push(id: number, key: number): void {
    if (this.size === this.ids.length) {
      const ids = new Int32Array(this.size * 2);
      ids.set(this.ids);
      this.ids = ids;
      const keys = new Float32Array(this.size * 2);
      keys.set(this.keys);
      this.keys = keys;
    }
    let i = this.size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if ((this.keys[p] ?? 0) <= key) break;
      this.ids[i] = this.ids[p] ?? 0;
      this.keys[i] = this.keys[p] ?? 0;
      i = p;
    }
    this.ids[i] = id;
    this.keys[i] = key;
  }

  pop(): number {
    const top = this.ids[0] ?? -1;
    const n = --this.size;
    if (n > 0) {
      const id = this.ids[n] ?? 0;
      const key = this.keys[n] ?? 0;
      let i = 0;
      for (;;) {
        let c = i * 2 + 1;
        if (c >= n) break;
        if (c + 1 < n && (this.keys[c + 1] ?? 0) < (this.keys[c] ?? 0)) c++;
        if ((this.keys[c] ?? 0) >= key) break;
        this.ids[i] = this.ids[c] ?? 0;
        this.keys[i] = this.keys[c] ?? 0;
        i = c;
      }
      this.ids[i] = id;
      this.keys[i] = key;
    }
    return top;
  }
}

export class GridNavigator implements Navigator {
  private readonly budget: number;
  private tick = 0;
  /** `update()` が一度でも呼ばれたか。呼ばれていなければ探索はその場で最後まで進める。 */
  private stepped = false;
  private readonly states = new Map<NavAgent | null, AgentState>();
  private readonly cache = new Map<string, readonly NavPoint[] | null>();
  private readonly queue: Job[] = [];
  private active: Job | null = null;

  // A* の作業領域（探索ごとに `stamp` を進めて初期化を省く）
  private readonly g: Float32Array;
  private readonly parent: Int32Array;
  private readonly seen: Uint32Array;
  private readonly closed: Uint32Array;
  private readonly heap = new MinHeap();
  private stamp = 0;

  /** 統計（テスト・デバッグ用）。 */
  readonly stats = { searches: 0, expansions: 0, cacheHits: 0, maxJobExpansions: 0 };

  constructor(
    readonly grid: NavGrid,
    options: GridNavigatorOptions = {},
  ) {
    this.budget = options.budget ?? DEFAULT_BUDGET;
    const n = grid.cellCount;
    this.g = new Float32Array(n);
    this.parent = new Int32Array(n);
    this.seen = new Uint32Array(n);
    this.closed = new Uint32Array(n);
  }

  // ---- Navigator ----

  update(): void {
    this.stepped = true;
    this.tick++;
    this.pump(this.budget);
  }

  setGateClosed(id: string, closed: boolean): void {
    this.grid.setGateClosed(id, closed);
  }

  nextPoint(
    from: Readonly<NavPoint>,
    to: Readonly<NavPoint>,
    out: NavPoint,
    agent?: NavAgent,
  ): NavPoint | null {
    const grid = this.grid;
    const st = this.stateOf(agent ?? null);
    this.trackStuck(st, from, to);
    if (st.noPathUntil > this.tick) return null;

    let tx: number;
    let tz: number;
    if (this.tick < st.sidestepUntil) {
      const side = this.sidestepPoint(st, from, to);
      tx = side.x;
      tz = side.z;
    } else if (
      Math.hypot(to.x - from.x, to.z - from.z) <= MAX_DIRECT &&
      grid.walkLine(from.x, from.z, to.x, to.z)
    ) {
      // 直線で歩ける: 経路は要らない
      st.path = null;
      st.pending = null;
      tx = to.x;
      tz = to.z;
    } else {
      this.ensurePath(st, from, to);
      if (st.noPathUntil > this.tick) return null;
      const path = st.path;
      if (!path) {
        // 探索待ち（古い経路もない）: その場で待つ。動かないのはスタックではない
        st.sampleX = from.x;
        st.sampleZ = from.z;
        st.sampleTick = this.tick;
        st.activeTicks = 0;
        out.x = from.x;
        out.z = from.z;
        return out;
      }
      let i = st.index;
      while (i < path.length && closeTo(from, path[i], REACH)) i++;
      // 先の点が直線で見えるなら飛ばして、角を切る
      while (i + 1 < path.length) {
        const next = path[i + 1] as NavPoint;
        if (Math.hypot(next.x - from.x, next.z - from.z) > LOOKAHEAD) break;
        if (!grid.walkLine(from.x, from.z, next.x, next.z)) break;
        i++;
      }
      st.index = i;
      if (i >= path.length) {
        tx = to.x;
        tz = to.z;
        // 経路の終わりに着いたのに目的地へ歩けない（目的地が動いた）: 引き直す
        if (Math.hypot(to.x - from.x, to.z - from.z) > GOAL_MOVED) st.forceReplan = true;
      } else {
        const p = path[i] as NavPoint;
        tx = p.x;
        tz = p.z;
      }
    }
    this.separate(st, from, tx, tz, out);
    return out;
  }

  /** 主体の状態を捨てる（敵を取り除くとき）。 */
  release(agent: NavAgent): void {
    this.states.delete(agent);
  }

  // ---- 同期 API（テスト・デバッグ用） ----

  /**
   * `from` から `to` への平滑化済みの経路（始点・終点を含む）を同期的に引く。到達不能なら null。
   * 実行中の問い合わせとは独立（キャッシュは共有する）。
   */
  findPath(from: Readonly<NavPoint>, to: Readonly<NavPoint>): NavPoint[] | null {
    const grid = this.grid;
    const start = grid.nearestWalkable(from.x, from.z, 12);
    const goal = grid.nearestWalkable(to.x, to.z, 12);
    if (start < 0 || goal < 0) return null;
    // 作業領域は共有なので、進行中の探索は最初からやり直しにして先頭へ戻す
    const interrupted = this.active;
    if (interrupted) {
      interrupted.started = false;
      interrupted.expansions = 0;
      this.queue.unshift(interrupted);
      this.active = null;
    }
    const job = this.makeJob(start, goal, new Set());
    this.run(job, Infinity);
    const path = this.cache.get(job.key);
    if (!path) return null;
    return [{ x: from.x, z: from.z }, ...path, { x: to.x, z: to.z }];
  }

  /** デバッグ表示用: 各主体の残りの経路（現在位置から終点まで）。 */
  debugPaths(): { id: string; points: NavPoint[] }[] {
    const result: { id: string; points: NavPoint[] }[] = [];
    for (const st of this.states.values()) {
      if (!st.agent || !st.path || st.index >= st.path.length) continue;
      const points: NavPoint[] = [{ x: st.agent.position.x, z: st.agent.position.z }];
      for (let i = st.index; i < st.path.length; i++) points.push(st.path[i] as NavPoint);
      result.push({ id: st.agent.id ?? '', points });
    }
    return result;
  }

  // ---- 経路の管理 ----

  private stateOf(agent: NavAgent | null): AgentState {
    let st = this.states.get(agent);
    if (!st) {
      st = {
        agent,
        path: null,
        index: 0,
        goalX: Infinity,
        goalZ: Infinity,
        version: -1,
        planTick: -Infinity,
        forceReplan: false,
        pending: null,
        noPathUntil: 0,
        lastCallTick: -1,
        activeTicks: 0,
        sampleTick: this.tick,
        sampleX: Infinity,
        sampleZ: Infinity,
        stuckCount: 0,
        sidestepUntil: 0,
        sidestepSign: 1,
      };
      this.states.set(agent, st);
    }
    return st;
  }

  private ensurePath(st: AgentState, from: Readonly<NavPoint>, to: Readonly<NavPoint>): void {
    const grid = this.grid;
    const goalMoved = Math.hypot(to.x - st.goalX, to.z - st.goalZ);
    const stale =
      !st.path ||
      st.version !== grid.version ||
      st.forceReplan ||
      (goalMoved > GOAL_MOVED && this.tick - st.planTick >= MIN_REPLAN_TICKS);
    if (!stale) return;
    // 探索中の結果が古くなければ待つ（目的地が大きく動いたときだけ別の探索を始める）
    if (st.pending && st.pending.version === grid.version && goalMoved <= GOAL_MOVED) return;
    if (this.tick - st.planTick < MIN_REPLAN_TICKS && st.path && !st.forceReplan) return;

    const start = grid.nearestWalkable(from.x, from.z, 12);
    if (start < 0) {
      // 格子の外・埋まっている: 経路は引けない。物理に任せて直進する
      st.path = [{ x: to.x, z: to.z }];
      st.index = 0;
      st.goalX = to.x;
      st.goalZ = to.z;
      st.version = grid.version;
      st.planTick = this.tick;
      return;
    }
    const goal = grid.nearestWalkable(to.x, to.z, 12);
    st.planTick = this.tick;
    st.forceReplan = false;
    st.goalX = to.x;
    st.goalZ = to.z;
    if (goal < 0) {
      st.path = null;
      st.pending = null;
      st.noPathUntil = this.tick + NO_PATH_TICKS;
      return;
    }
    const key = `${start}:${goal}:${grid.version}`;
    if (this.cache.has(key)) {
      this.stats.cacheHits++;
      this.assign(st, this.touch(key), grid.version);
      return;
    }
    // 同じ探索が進行中 / 待機中なら相乗りする
    const existing = this.active?.key === key ? this.active : this.queue.find((j) => j.key === key);
    const job = existing ?? this.makeJob(start, goal, new Set());
    job.requesters.add(st);
    st.pending = job;
    if (!existing) this.queue.push(job);
    if (!this.stepped) this.pump(Infinity);
  }

  private makeJob(start: number, goal: number, requesters: Set<AgentState>): Job {
    return {
      key: `${start}:${goal}:${this.grid.version}`,
      start,
      goal,
      version: this.grid.version,
      requesters,
      started: false,
      expansions: 0,
    };
  }

  /** キャッシュの値を最近使った扱いにして返す。 */
  private touch(key: string): readonly NavPoint[] | null {
    const v = this.cache.get(key) ?? null;
    this.cache.delete(key);
    this.cache.set(key, v);
    return v;
  }

  private assign(st: AgentState, path: readonly NavPoint[] | null, version: number): void {
    st.pending = null;
    st.version = version;
    st.index = 0;
    if (path) {
      st.path = path;
    } else {
      st.path = null;
      st.noPathUntil = this.tick + NO_PATH_TICKS;
    }
  }

  private finish(job: Job, path: readonly NavPoint[] | null): void {
    this.cache.set(job.key, path);
    if (this.cache.size > CACHE_SIZE) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    for (const st of job.requesters) {
      if (st.pending === job) this.assign(st, path, job.version);
    }
    this.stats.maxJobExpansions = Math.max(this.stats.maxJobExpansions, job.expansions);
  }

  /** 待機中の探索を `budget` ノード展開ぶんだけ進める。 */
  private pump(budget: number): void {
    let left = budget;
    while (left > 0) {
      if (!this.active) {
        const next = this.queue.shift();
        if (!next) return;
        // 誰も待っていない・門の状態が変わった探索は捨てる
        const waiting = [...next.requesters].some((s) => s.pending === next);
        if (!waiting || next.version !== this.grid.version) {
          for (const st of next.requesters) if (st.pending === next) st.pending = null;
          continue;
        }
        this.active = next;
      }
      const job = this.active;
      const used = this.run(job, left);
      left -= Math.max(1, used);
    }
  }

  /** `job` を最大 `limit` ノード展開まで進める。終われば `active` を空にして結果を `finish` する。 */
  private run(job: Job, limit: number): number {
    const grid = this.grid;
    const { cols } = grid;
    const g = this.g;
    const parent = this.parent;
    const seen = this.seen;
    const closed = this.closed;
    const heap = this.heap;
    const goalX = job.goal % cols;
    const goalZ = Math.floor(job.goal / cols);
    if (!job.started) {
      job.started = true;
      this.active = job;
      this.stamp++;
      this.stats.searches++;
      heap.clear();
      g[job.start] = 0;
      parent[job.start] = -1;
      seen[job.start] = this.stamp;
      heap.push(job.start, 0);
    }
    const stamp = this.stamp;
    let used = 0;
    while (heap.size > 0 && used < limit) {
      const cur = heap.pop();
      if (closed[cur] === stamp) continue;
      closed[cur] = stamp;
      used++;
      job.expansions++;
      this.stats.expansions++;
      if (cur === job.goal) {
        this.active = null;
        this.finish(job, this.buildPath(job));
        return used;
      }
      if (job.expansions > MAX_EXPANSIONS) break;
      const cx = cur % cols;
      const cz = (cur - cx) / cols;
      const gc = g[cur] ?? 0;
      const hc = grid.height[cur] ?? 0;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dz === 0) continue;
          const nx = cx + dx;
          const nz = cz + dz;
          if (!grid.isWalkable(nx, nz)) continue;
          // 角を切らない（斜めは両隣の直交セルも歩けるときだけ）
          if (
            dx !== 0 &&
            dz !== 0 &&
            (!grid.isWalkable(cx + dx, cz) || !grid.isWalkable(cx, cz + dz))
          ) {
            continue;
          }
          const ni = nz * cols + nx;
          if (closed[ni] === stamp) continue;
          const step = dx !== 0 && dz !== 0 ? SQRT2 : 1;
          const rise = Math.abs((grid.height[ni] ?? 0) - hc) / (step * grid.cellSize);
          const cost = step * (1 + grid.edgePenalty(ni) * EDGE_COST + rise * 0.5);
          const ng = gc + cost;
          if (seen[ni] === stamp && ng >= (g[ni] ?? Infinity)) continue;
          seen[ni] = stamp;
          g[ni] = ng;
          parent[ni] = cur;
          const ex = Math.abs(nx - goalX);
          const ez = Math.abs(nz - goalZ);
          const h = (Math.max(ex, ez) + (SQRT2 - 1) * Math.min(ex, ez)) * H_WEIGHT;
          heap.push(ni, ng + h);
        }
      }
    }
    // 予算を使い切っただけなら、続きは次のステップ
    if (heap.size > 0 && job.expansions <= MAX_EXPANSIONS) return used;
    // 開集合が尽きた / 展開の上限: 到達不能
    this.active = null;
    this.finish(job, null);
    return used;
  }

  /** 親をたどって経路を作り、直線で結べる所まで間引く（始点を除く。終点は目的のセルの中心）。 */
  private buildPath(job: Job): NavPoint[] {
    const grid = this.grid;
    const cells: NavPoint[] = [];
    for (let c = job.goal; c >= 0; c = this.parent[c] ?? -1) {
      cells.push({ x: grid.centerX(c % grid.cols), z: grid.centerZ(Math.floor(c / grid.cols)) });
    }
    cells.reverse();
    // 平滑化（string pulling）: 今の点から直線で歩ける最も遠い点へ。少し先まで見て、失敗が続いたら打ち切る
    const result: NavPoint[] = [];
    let anchor = 0;
    while (anchor < cells.length - 1) {
      const a = cells[anchor] as NavPoint;
      let best = anchor + 1;
      let misses = 0;
      for (let j = anchor + 2; j < cells.length && misses < 24; j++) {
        const b = cells[j] as NavPoint;
        if (grid.walkLine(a.x, a.z, b.x, b.z, 0)) {
          best = j;
          misses = 0;
        } else {
          misses++;
        }
      }
      result.push(cells[best] as NavPoint);
      anchor = best;
    }
    return result;
  }

  // ---- スタック検出・分離 ----

  private trackStuck(st: AgentState, from: Readonly<NavPoint>, to: Readonly<NavPoint>): void {
    if (st.lastCallTick !== this.tick) {
      st.lastCallTick = this.tick;
      st.activeTicks++;
    }
    if (!Number.isFinite(st.sampleX)) {
      st.sampleX = from.x;
      st.sampleZ = from.z;
      st.sampleTick = this.tick;
      st.activeTicks = 0;
      return;
    }
    if (this.tick - st.sampleTick < STUCK_WINDOW) return;
    const moved = Math.hypot(from.x - st.sampleX, from.z - st.sampleZ);
    const wanted = st.activeTicks >= STUCK_WINDOW * STUCK_ACTIVE;
    const stillFar = Math.hypot(to.x - from.x, to.z - from.z) > 1;
    if (wanted && stillFar && moved < STUCK_MOVED) {
      st.stuckCount++;
      st.forceReplan = true;
      st.sidestepUntil = this.tick + SIDESTEP_TICKS;
      st.sidestepSign = st.stuckCount % 2 === 1 ? 1 : -1;
      if (st.stuckCount >= STUCK_GIVE_UP) {
        st.stuckCount = 0;
        st.noPathUntil = this.tick + NO_PATH_TICKS * 2;
      }
    } else if (moved > 1) {
      st.stuckCount = 0;
    }
    st.sampleX = from.x;
    st.sampleZ = from.z;
    st.sampleTick = this.tick;
    st.activeTicks = 0;
  }

  /** 進行方向に直角へ少しよける点（歩けない側なら反対側）。 */
  private sidestepPoint(
    st: AgentState,
    from: Readonly<NavPoint>,
    to: Readonly<NavPoint>,
  ): NavPoint {
    let dx = to.x - from.x;
    let dz = to.z - from.z;
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) {
      dx = 1;
      dz = 0;
    } else {
      dx /= len;
      dz /= len;
    }
    for (let k = 0; k < 2; k++) {
      const px = -dz * st.sidestepSign;
      const pz = dx * st.sidestepSign;
      if (this.grid.isWalkableAt(from.x + px * 0.8, from.z + pz * 0.8)) {
        return { x: from.x + px * SIDESTEP_DISTANCE, z: from.z + pz * SIDESTEP_DISTANCE };
      }
      st.sidestepSign = -st.sidestepSign;
    }
    return { x: to.x, z: to.z };
  }

  /** 近い味方から離れる向きへ目標の向きを寄せる（壁へ押し込まないときだけ）。 */
  private separate(
    st: AgentState,
    from: Readonly<NavPoint>,
    tx: number,
    tz: number,
    out: NavPoint,
  ): void {
    out.x = tx;
    out.z = tz;
    const me = st.agent;
    if (!me) return;
    let hx = tx - from.x;
    let hz = tz - from.z;
    const len = Math.hypot(hx, hz);
    if (len < 1e-4) return;
    const ux = hx / len;
    const uz = hz / len;
    let px = 0;
    let pz = 0;
    for (const other of this.states.values()) {
      const a = other.agent;
      if (!a || a === me || a.alive === false) continue;
      const dx = from.x - a.position.x;
      const dz = from.z - a.position.z;
      const d = Math.hypot(dx, dz);
      if (d >= SEPARATION_RADIUS || d < 1e-4) continue;
      const w = 1 - d / SEPARATION_RADIUS;
      px += (dx / d) * w;
      pz += (dz / d) * w;
      // 正面にいる味方は、離れるだけだと正対したまま動けないので、右側へかわす（互いに右へ避けてすれ違う）
      if (dx * ux + dz * uz < 0) {
        px += uz * w * SEPARATION_SIDE;
        pz -= ux * w * SEPARATION_SIDE;
      }
    }
    if (px === 0 && pz === 0) return;
    hx = ux + px * SEPARATION_WEIGHT;
    hz = uz + pz * SEPARATION_WEIGHT;
    const hl = Math.hypot(hx, hz);
    if (hl < 1e-4) return;
    hx /= hl;
    hz /= hl;
    // 寄せた先が歩けない（壁・崖）なら寄せない
    if (!this.grid.isWalkableAt(from.x + hx * 0.7, from.z + hz * 0.7)) return;
    const reach = Math.max(len, 1);
    out.x = from.x + hx * reach;
    out.z = from.z + hz * reach;
  }
}

function closeTo(a: Readonly<NavPoint>, b: NavPoint | undefined, r: number): boolean {
  return !!b && Math.hypot(a.x - b.x, a.z - b.z) < r;
}
