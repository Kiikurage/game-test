// 実行場所ごとの executor と、Worker との受け渡し（#383 spike）。DOM / three 非依存。
// executor は job を包み、同期点（`SyncPoint.frame`）で 1 フレームに 1 回だけ `sync` される。
// 描画側は executor の `current` / `previous`（step の job は補間用に 1 ステップ前）だけを読む。
import type { JobDef, JobParams } from './job';
import type { Place } from './placement';
import { allocState, copyState, viewState, type StateSchema, type StateStore } from './state';

export interface SyncFrame {
  /** このフレームで進める固定ステップ数（step の job 用）。 */
  readonly steps: number;
  readonly stepDt: number;
  /** フレーム間隔（秒。frame の job 用）。 */
  readonly frameDt: number;
}

export interface Executor<S extends StateSchema> {
  readonly place: Place;
  readonly current: StateStore<S>;
  /** 1 ステップ前の状態（step の job の補間用。frame の job では current と同じ中身）。 */
  readonly previous: StateStore<S>;
  /** 実行場所での job の計算時間（直前の sync から今回の sync までに届いた分の合計、ms。GPU は null）。 */
  readonly workMs: number | null;
  init(): Promise<void>;
  sync(frame: SyncFrame): void;
  dispose(): void;
}

/** メインスレッドで job.run を直接呼ぶ。 */
export class MainExecutor<S extends StateSchema, Ctx> implements Executor<S> {
  readonly place = 'main';
  readonly current: StateStore<S>;
  readonly previous: StateStore<S>;
  workMs: number | null = 0;
  private ctx!: Ctx;
  private time = 0;

  constructor(private readonly job: JobDef<S, Ctx>) {
    this.current = allocState(job.state);
    this.previous = allocState(job.state);
  }

  async init(): Promise<void> {
    this.ctx = (await this.job.init?.(this.current.arrays)) as Ctx;
    copyState(this.current, this.previous);
  }

  sync(frame: SyncFrame): void {
    const t0 = performance.now();
    if (this.job.rate === 'frame') {
      this.time += frame.frameDt;
      this.job.run(this.current.arrays, { dt: frame.frameDt, time: this.time }, this.ctx);
    } else {
      for (let i = 0; i < frame.steps; i++) {
        if (i === frame.steps - 1) copyState(this.current, this.previous);
        this.time += frame.stepDt;
        this.job.run(this.current.arrays, { dt: frame.stepDt, time: this.time }, this.ctx);
      }
    }
    this.workMs = performance.now() - t0;
  }

  dispose(): void {
    // 何も持たない
  }
}

// ---- Worker との受け渡し ----

/** Worker / Worker のグローバルの共通部分（DOM の型に依存しないための最小形）。 */
export interface MessagePortLike {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((ev: { data: unknown }) => void) | null;
}

export type Transport = 'sab' | 'msg';

export type ToWorker =
  | { type: 'init'; jobId: string; transport: Transport; sab?: SharedArrayBuffer }
  | { type: 'advance'; steps: number; dt: number; pool: ArrayBuffer[] };

export type FromWorker =
  | { type: 'ready' }
  | { type: 'step'; seq: number; cur: ArrayBuffer; workMs: number }
  | { type: 'published'; workMs: number };

/** SAB の配置: ヘッダ（Int32 [seq] @0, Float64 [累計の job ms] @8）+ 3 スロット × (current, previous)。 */
const SAB_HEADER = 16;
const SAB_SLOTS = 3;

export function sabByteLength(stateBytes: number): number {
  return SAB_HEADER + SAB_SLOTS * 2 * stateBytes;
}

function slotOffset(stateBytes: number, slot: number, which: 0 | 1): number {
  return SAB_HEADER + (slot * 2 + which) * stateBytes;
}

/**
 * Worker で job を回す。main は同期点で「進めるステップ数」を送り、Worker が公開した最新の結果を写して使う
 * （結果は 1 フレーム遅れる）。`sab`: Worker は SAB の 3 スロットに書き、seq を Atomics で更新する。
 * `msg`: Worker は 1 ステップごとに結果のバッファを Transferable で送り、main は使い終わったバッファを返す。
 */
export class WorkerExecutor<S extends StateSchema> implements Executor<S> {
  readonly place: Place;
  readonly current: StateStore<S>;
  readonly previous: StateStore<S>;
  workMs: number | null = 0;
  private sab: SharedArrayBuffer | null = null;
  private header: Int32Array | null = null;
  private headerF: Float64Array | null = null;
  private lastWorkTotal = 0;
  private lastSeq = 0;
  private latest: ArrayBuffer | null = null;
  private beforeLatest: ArrayBuffer | null = null;
  private pool: ArrayBuffer[] = [];
  private pendingWork = 0;
  private ready: Promise<void> | null = null;

  constructor(
    private readonly job: Pick<JobDef<S, unknown>, 'id' | 'state'>,
    private readonly worker: MessagePortLike & { terminate(): void },
    private readonly transport: Transport,
  ) {
    this.place = transport === 'sab' ? 'worker-sab' : 'worker-msg';
    this.current = allocState(job.state);
    this.previous = allocState(job.state);
  }

  init(): Promise<void> {
    this.ready ??= new Promise<void>((resolve) => {
      this.worker.onmessage = (ev) => {
        const m = ev.data as FromWorker;
        if (m.type === 'ready') resolve();
        else if (m.type === 'step') {
          if (this.beforeLatest) this.pool.push(this.beforeLatest);
          this.beforeLatest = this.latest;
          this.latest = m.cur;
          this.pendingWork += m.workMs;
        } else this.pendingWork += m.workMs;
      };
      let msg: ToWorker;
      if (this.transport === 'sab') {
        this.sab = new SharedArrayBuffer(sabByteLength(this.job.state.byteLength));
        this.header = new Int32Array(this.sab, 0, 1);
        this.headerF = new Float64Array(this.sab, 8, 1);
        msg = { type: 'init', jobId: this.job.id, transport: 'sab', sab: this.sab };
      } else {
        msg = { type: 'init', jobId: this.job.id, transport: 'msg' };
      }
      this.worker.postMessage(msg);
    }).then(() => {
      this.pull();
    });
    return this.ready;
  }

  /** Worker が公開した最新の結果を current / previous に写す。 */
  private pull(): void {
    const bytes = this.job.state.byteLength;
    if (this.sab && this.header && this.headerF) {
      const seq = Atomics.load(this.header, 0);
      const total = this.headerF[0] ?? 0;
      this.workMs = total - this.lastWorkTotal;
      this.lastWorkTotal = total;
      if (seq === this.lastSeq && seq !== 0) return;
      this.lastSeq = seq;
      const slot = seq % SAB_SLOTS;
      copyState(viewState(this.job.state, this.sab, slotOffset(bytes, slot, 0)), this.current);
      copyState(viewState(this.job.state, this.sab, slotOffset(bytes, slot, 1)), this.previous);
      return;
    }
    this.workMs = this.pendingWork;
    this.pendingWork = 0;
    if (!this.latest) return;
    // 1 ステップだけ届いたなら、直前の current がそのまま 1 ステップ前
    if (this.beforeLatest) copyState(viewState(this.job.state, this.beforeLatest), this.previous);
    else copyState(this.current, this.previous);
    copyState(viewState(this.job.state, this.latest), this.current);
    // 写し終えたバッファは次の advance で Worker に返す（latest は次の step の比較用に残さない）
    this.pool.push(this.latest);
    if (this.beforeLatest) this.pool.push(this.beforeLatest);
    this.latest = null;
    this.beforeLatest = null;
  }

  sync(frame: SyncFrame): void {
    this.pull();
    if (frame.steps === 0 && this.pool.length === 0) return;
    const pool = this.pool;
    this.pool = [];
    const msg: ToWorker = { type: 'advance', steps: frame.steps, dt: frame.stepDt, pool };
    this.worker.postMessage(msg, pool);
  }

  dispose(): void {
    this.worker.terminate();
  }
}

/**
 * Worker 側: job を登録表から引き、main の advance に応じて回して結果を公開する。
 * Worker のエントリから `serveJobs(self, { [job.id]: job })` のように呼ぶ。
 */
export function serveJobs(
  port: MessagePortLike,
  // job ごとに状態の型が違うので、登録表では型を消す
  registry: Readonly<Record<string, JobDef<StateSchema, unknown>>>,
): void {
  let job: JobDef<StateSchema, unknown> | null = null;
  let cur: StateStore<StateSchema> | null = null;
  let prev: StateStore<StateSchema> | null = null;
  let ctx: unknown;
  let transport: Transport = 'msg';
  let sab: SharedArrayBuffer | null = null;
  let seq = 0;
  let time = 0;
  const pool: ArrayBuffer[] = [];

  let workTotal = 0;
  const publishSab = (workMs: number): void => {
    if (!sab || !cur || !prev) return;
    const bytes = cur.def.byteLength;
    const next = seq + 1;
    const slot = next % SAB_SLOTS;
    copyState(cur, viewState(cur.def, sab, slotOffset(bytes, slot, 0)));
    copyState(prev, viewState(cur.def, sab, slotOffset(bytes, slot, 1)));
    workTotal += workMs;
    new Float64Array(sab, 8, 1)[0] = workTotal;
    seq = next;
    Atomics.store(new Int32Array(sab, 0, 1), 0, seq);
  };

  const publishMsg = (workMs: number): void => {
    if (!cur) return;
    const buf = pool.pop() ?? new ArrayBuffer(cur.def.byteLength);
    copyState(cur, viewState(cur.def, buf));
    seq++;
    const m: FromWorker = { type: 'step', seq, cur: buf, workMs };
    port.postMessage(m, [buf]);
  };

  port.onmessage = (ev) => {
    const m = ev.data as ToWorker;
    if (m.type === 'init') {
      const found = registry[m.jobId];
      if (!found) throw new Error(`unknown job ${m.jobId}`);
      job = found;
      transport = m.transport;
      sab = m.sab ?? null;
      cur = allocState(found.state);
      prev = allocState(found.state);
      void Promise.resolve(found.init?.(cur.arrays)).then((c) => {
        ctx = c;
        if (cur && prev) copyState(cur, prev);
        if (transport === 'sab') publishSab(0);
        else publishMsg(0);
        port.postMessage({ type: 'ready' } satisfies FromWorker);
      });
      return;
    }
    if (!job || !cur || !prev) return;
    pool.push(...m.pool);
    for (let i = 0; i < m.steps; i++) {
      const t0 = performance.now();
      copyState(cur, prev);
      time += m.dt;
      const params: JobParams = { dt: m.dt, time };
      job.run(cur.arrays, params, ctx);
      const workMs = performance.now() - t0;
      if (transport === 'sab') publishSab(workMs);
      else publishMsg(workMs);
    }
  };
}
