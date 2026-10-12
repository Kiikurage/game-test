// パス別の GPU 時間（timestamp-query）を測る（#317）。
//
// three r186 は各レンダーパス / コンピュートパスの開始・終了に timestamp を書き、`WebGPUTimestampQueryPool` に
// uid（`r:<呼び出し番号>:<コンテキスト id>:f<フレーム番号>`）ごとに溜める。three 標準の解決（`resolveTimestampsAsync`）は
// 最後のフレームの合計しか返さず、どのパスが何 ms かは分からない。そこで:
//   1. `renderer.inspector` を差し替え、`beginRender` / `beginCompute` で uid にラベル（パス名）を付ける。
//   2. プールの解決処理を差し替え、uid ごとの開始・終了の生の値を受け取り、フレームごとに集計する。
//   3. 直近 N フレームの中央値を出す（1 フレームの値は揺れるので、表示・計測は中央値を使う）。
// 解決は非同期で、間に合わない間のクエリは次の解決にまとめて入る（フレーム番号で分けるので混ざらない）。
import { InspectorBase, type Camera, type Object3D, type WebGPURenderer } from 'three/webgpu';

/** 1 フレーム分のパス別 GPU 時間（ms）。 */
export interface GpuFrame {
  readonly frame: number;
  /** パス名 → そのフレームでの持ち分（ms。`groupFrames` の説明を参照。同じパス名の複数のレンダーパスは足す）。 */
  readonly passes: ReadonlyMap<string, number>;
  /** 持ち分の合計（ms）。GPU が仕事をしていた時間（パス間の隙間を除く）。 */
  readonly sumMs: number;
  /** 各パスの開始〜終了をそのまま足したもの（ms。重なりを二重に数える。three 標準の値に相当。比較・診断用）。 */
  readonly rawSumMs: number;
  /** 最初のパスの開始から最後のパスの終了まで（ms。パスの間の隙間を含む）。 */
  readonly spanMs: number;
}

export interface GpuTimingSummary {
  /** 集計に使ったフレーム数。 */
  readonly frames: number;
  /** パス別の中央値（ms）。並びは `order` に従い、未知のパスは後ろ。 */
  readonly passes: readonly { readonly label: string; readonly ms: number }[];
  readonly sumMs: number;
  readonly rawSumMs: number;
  readonly spanMs: number;
}

/** 1 つのタイムスタンプ組（ナノ秒）。 */
export interface TimestampSpan {
  readonly uid: string;
  readonly label: string;
  readonly start: bigint;
  readonly end: bigint;
}

const FRAME_RE = /:f(\d+)$/;
/** `GPUMapMode.READ`（グローバル定数は型定義に無い環境があるので値で書く）。 */
const MAP_READ = 1;

/**
 * uid 付きの開始・終了をフレームごとに集計する（純粋関数。単体テスト用に公開）。不正な組（0・逆転）は捨てる。
 *
 * パスの時間は「開始〜終了」をそのまま使わず、開始順に並べて「直前のパスの終了（または自分の開始の遅い方）〜自分の終了」を
 * そのパスの持ち分にする。Apple GPU（タイル型）では連続するパスが重なって実行され、開始〜終了をそのまま足すと
 * 実時間の数倍になる（実測: ブルームの小さなパス群が 1 フレーム 3〜5ms のうち 20〜30ms と出た）。持ち分の合計は
 * GPU が仕事をしていた時間（パス間の隙間を除く）になり、`spanMs` を超えない。
 */
export function groupFrames(spans: readonly TimestampSpan[]): GpuFrame[] {
  const byFrame = new Map<number, TimestampSpan[]>();
  for (const s of spans) {
    if (s.start === 0n || s.end < s.start) continue;
    const m = FRAME_RE.exec(s.uid);
    if (!m) continue;
    const frame = Number(m[1]);
    const list = byFrame.get(frame);
    if (list) list.push(s);
    else byFrame.set(frame, [s]);
  }
  return [...byFrame.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([frame, list]) => {
      list.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
      const passes = new Map<string, number>();
      let sum = 0;
      let rawSum = 0;
      let first = list[0]?.start ?? 0n;
      let last = 0n;
      for (const s of list) {
        if (s.start < first) first = s.start;
        const from = s.start > last ? s.start : last;
        const ms = s.end > from ? Number(s.end - from) / 1e6 : 0;
        passes.set(s.label, (passes.get(s.label) ?? 0) + ms);
        sum += ms;
        rawSum += Number(s.end - s.start) / 1e6;
        if (s.end > last) last = s.end;
      }
      return { frame, passes, sumMs: sum, rawSumMs: rawSum, spanMs: Number(last - first) / 1e6 };
    });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const mid = values.length >> 1;
  return values.length % 2 === 1
    ? (values[mid] ?? 0)
    : ((values[mid - 1] ?? 0) + (values[mid] ?? 0)) / 2;
}

/** 直近のフレームを保持して中央値を出す（純粋。単体テスト用に公開）。 */
export class GpuFrameWindow {
  private readonly frames: GpuFrame[] = [];
  constructor(private readonly capacity = 120) {}

  push(frame: GpuFrame): void {
    this.frames.push(frame);
    if (this.frames.length > this.capacity) this.frames.shift();
  }

  clear(): void {
    this.frames.length = 0;
  }

  /** `order` はパス名の表示順（描画順）。フレームに出てこなかったパスは 0 ms として中央値に入れる。 */
  summary(order: readonly string[] = []): GpuTimingSummary | null {
    if (this.frames.length === 0) return null;
    const labels = new Set<string>();
    for (const f of this.frames) for (const l of f.passes.keys()) labels.add(l);
    const rank = (l: string): number => {
      const i = order.indexOf(l);
      return i < 0 ? order.length : i;
    };
    const sorted = [...labels].sort((a, b) => rank(a) - rank(b));
    return {
      frames: this.frames.length,
      passes: sorted.map((label) => ({
        label,
        ms: median(this.frames.map((f) => f.passes.get(label) ?? 0)),
      })),
      sumMs: median(this.frames.map((f) => f.sumMs)),
      rawSumMs: median(this.frames.map((f) => f.rawSumMs)),
      spanMs: median(this.frames.map((f) => f.spanMs)),
    };
  }
}

/** three の WebGPUTimestampQueryPool のうち、解決に使う内部フィールド（r186）。 */
interface QueryPoolInternals {
  device: GPUDevice;
  querySet: GPUQuerySet;
  resolveBuffer: GPUBuffer;
  resultBuffer: GPUBuffer;
  queryOffsets: Map<string, number>;
  currentQueryIndex: number;
  isDisposed: boolean;
  lastValue: number;
  _resolveQueries: () => Promise<number>;
  __gpuTimerPatched?: boolean;
}

interface BackendInternals {
  trackTimestamp?: boolean;
  timestampQueryPool?: Record<string, QueryPoolInternals | null | undefined>;
}

/** レンダーパスのラベル付け。描画先・シーン名から決める。 */
export interface PassLabeler {
  /** 描画先のレンダーターゲット（null はキャンバス）に対応するパス名を返す。不明なら undefined。 */
  labelFor(target: unknown, scene: Object3D, camera: Camera): string | undefined;
}

class LabelingInspector extends InspectorBase {
  /** uid → パス名（解決時に取り出して消す）。 */
  readonly labels = new Map<string, string>();
  /** `withLabel` の実行中は、その中で起きた描画・コンピュートをこの名前にする。 */
  current: string | null = null;
  labeler: PassLabeler | null = null;

  override beginRender(uid: string, scene: Object3D, camera: Camera, target: unknown): void {
    const label =
      this.current ??
      this.labeler?.labelFor(target, scene, camera) ??
      (scene.name.startsWith('Shadow Map')
        ? 'shadow'
        : scene.name.includes('[ Reflector ]')
          ? 'reflection'
          : target === null
            ? 'output'
            : 'other');
    this.labels.set(uid, label);
  }

  override beginCompute(uid: string): void {
    this.labels.set(uid, this.current ?? 'compute');
  }
}

/**
 * パス別 GPU 時間の計測。`renderer` は `trackTimestamp: true` で作ってあること（非対応端末では `enabled` が false）。
 * 毎フレーム描画の後に `endFrame()` を呼ぶ。
 */
export class GpuTimer {
  private readonly window = new GpuFrameWindow();
  /** 表示順（描画順）。パイプラインが組み立て時に設定する。 */
  order: readonly string[] = [];
  private readonly inspector = new LabelingInspector();
  private readonly backend: BackendInternals;
  private resolving = false;

  constructor(renderer: WebGPURenderer) {
    this.backend = renderer.backend as unknown as BackendInternals;
    if (this.enabled) renderer.inspector = this.inspector;
  }

  /** timestamp-query が使えて計測しているか。 */
  get enabled(): boolean {
    return this.backend.trackTimestamp === true;
  }

  set labeler(labeler: PassLabeler | null) {
    this.inspector.labeler = labeler;
  }

  /** `fn` の中で起きた描画・コンピュートを `label` として数える（パス自前の compute / render 用）。 */
  withLabel<T>(label: string, fn: () => T): T {
    const prev = this.inspector.current;
    this.inspector.current = label;
    try {
      return fn();
    } finally {
      this.inspector.current = prev;
    }
  }

  private cached: GpuTimingSummary | null = null;

  /** 直近フレームの中央値（新しいフレームが解決されるまでは前の結果を返す）。 */
  summary(): GpuTimingSummary | null {
    this.cached ??= this.window.summary(this.order);
    return this.cached;
  }

  /** 集計をやり直す（視点を変えた直後など）。 */
  reset(): void {
    this.window.clear();
    this.cached = null;
  }

  /** 1 フレームの描画を終えたら呼ぶ。溜まったクエリの解決を要求する（非同期。前の解決中は何もしない）。 */
  endFrame(): void {
    if (!this.enabled || this.resolving) return;
    const pools = this.backend.timestampQueryPool;
    if (!pools) return;
    const render = pools.render;
    const compute = pools.compute;
    if (render) this.patch(render);
    if (compute) this.patch(compute);
    this.resolving = true;
    // compute を先に解決し、その後 render の解決でフレームを確定させる
    const pending: Promise<unknown>[] = [];
    if (compute && compute.currentQueryIndex > 0) pending.push(compute._resolveQueries());
    if (render && render.currentQueryIndex > 0) pending.push(render._resolveQueries());
    void Promise.allSettled(pending).then(() => {
      this.flush();
      this.resolving = false;
    });
  }

  private spans: TimestampSpan[] = [];

  private flush(): void {
    if (this.spans.length === 0) return;
    for (const f of groupFrames(this.spans)) this.window.push(f);
    this.spans = [];
    this.cached = null;
    // クエリが割り当てられなかった描画のラベルは解決されずに残るので、溜まりすぎたら捨てる
    if (this.inspector.labels.size > 4096) this.inspector.labels.clear();
  }

  /** プールの解決処理を、生の開始・終了を受け取る版に差し替える（three の自動解決＝クエリ溢れ時も含めてこちらを通る）。 */
  private patch(pool: QueryPoolInternals): void {
    if (pool.__gpuTimerPatched) return;
    pool.__gpuTimerPatched = true;
    const labels = this.inspector.labels;
    pool._resolveQueries = async () => {
      if (pool.isDisposed || pool.resultBuffer.mapState !== 'unmapped') return pool.lastValue;
      const offsets = new Map(pool.queryOffsets);
      const count = pool.currentQueryIndex;
      if (count === 0) return pool.lastValue;
      const bytes = count * 8;
      pool.currentQueryIndex = 0;
      pool.queryOffsets.clear();
      const encoder = pool.device.createCommandEncoder({ label: 'gpuTimer-resolve' });
      encoder.resolveQuerySet(pool.querySet, 0, count, pool.resolveBuffer, 0);
      encoder.copyBufferToBuffer(pool.resolveBuffer, 0, pool.resultBuffer, 0, bytes);
      pool.device.queue.submit([encoder.finish()]);
      await pool.resultBuffer.mapAsync(MAP_READ, 0, bytes);
      // await の間に dispose されうる（型の絞り込みを避けて読み直す）
      if (Reflect.get(pool, 'isDisposed')) {
        if ((pool.resultBuffer.mapState as string) === 'mapped') pool.resultBuffer.unmap();
        return pool.lastValue;
      }
      const times = new BigUint64Array(pool.resultBuffer.getMappedRange(0, bytes)).slice();
      pool.resultBuffer.unmap();
      let total = 0;
      for (const [uid, offset] of offsets) {
        const start = times[offset] ?? 0n;
        const end = times[offset + 1] ?? 0n;
        const label = labels.get(uid) ?? 'other';
        labels.delete(uid);
        this.spans.push({ uid, label, start, end });
        if (end > start) total += Number(end - start) / 1e6;
      }
      pool.lastValue = total;
      return total;
    };
  }
}
