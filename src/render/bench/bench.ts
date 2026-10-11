// ベンチマークモード（`?bench`。#261）の純粋なロジック: 区間の進行（ウォームアップ → 計測）と集計・結果テキスト。
// three / DOM に依存しない（bench.view.ts がシーンを操作し、ここへ 1 フレームずつ値を渡す）。

/** 区間の長さ。時間と最小フレーム数の両方を満たしたら次へ進む。 */
export interface BenchTiming {
  /** ウォームアップ（秒）。シェーダの初回コンパイル・解像度変更直後のカクつきを計測から外す。 */
  readonly warmSec: number;
  /** 計測（秒）。 */
  readonly measureSec: number;
  readonly minWarmFrames: number;
  readonly minMeasureFrames: number;
  /** ウォームアップの終わりに、パイプライン生成が止まってから最低これだけフレームを待つ（実行時切替の再コンパイル対策）。 */
  readonly settleFrames: number;
  /** パイプライン生成が続いても、ウォームアップはこの秒数で打ち切る（ハングしない）。 */
  readonly maxWarmSec: number;
}

/** 実機用の既定（1 区間 1 秒 + 4 秒）。 */
export const BENCH_TIMING: BenchTiming = {
  warmSec: 1,
  measureSec: 4,
  minWarmFrames: 10,
  minMeasureFrames: 30,
  settleFrames: 10,
  maxWarmSec: 15,
};

/** `?bench=quick`（E2E 用）。時間の条件を外し、フレーム数だけで進める（SwiftShader でも短時間で完走する）。 */
export const BENCH_TIMING_QUICK: BenchTiming = {
  warmSec: 0,
  measureSec: 0,
  minWarmFrames: 3,
  minMeasureFrames: 4,
  settleFrames: 2,
  maxWarmSec: 120,
};

export function benchTimingFor(search: string): BenchTiming {
  return new URLSearchParams(search).get('bench') === 'quick' ? BENCH_TIMING_QUICK : BENCH_TIMING;
}

/** 1 フレーム分の計測値。null は取得できなかった値（GPU 時間非対応など）。 */
export interface BenchSample {
  /** 直前フレームからの経過（ms）。 */
  readonly frameMs: number;
  readonly gpuMs: number | null;
  readonly cpuMs: number;
  readonly draws: number;
  readonly tris: number;
}

export type BenchPhase = 'warm' | 'measure' | 'done';

/** 1 区間の進行（ウォームアップ → 計測 → 終了）と、計測中のサンプルの蓄積。 */
export class BenchSectionRun {
  phase: BenchPhase = 'warm';
  private elapsed = 0;
  private frames = 0;
  private sincePipeline = 0;
  private lastPipelines: number | null = null;
  private pipelinesAtMeasure = 0;
  private pipelines = 0;
  readonly samples: BenchSample[] = [];

  constructor(private readonly timing: BenchTiming) {}

  /** 計測区間の進み具合（0..1。戦闘区間の演出のきっかけ用）。ウォームアップ中は 0。 */
  get progress(): number {
    if (this.phase === 'warm') return 0;
    if (this.phase === 'done') return 1;
    const t = this.timing;
    const byTime = t.measureSec > 0 ? this.elapsed / t.measureSec : 1;
    return Math.min(1, byTime, this.frames / t.minMeasureFrames);
  }

  /** 計測中に生成されたパイプライン数（0 でなければ計測にコンパイルのカクつきが混ざっている）。 */
  get pipelinesDuringMeasure(): number {
    return this.pipelines - this.pipelinesAtMeasure;
  }

  /**
   * 1 フレーム進める。`pipelines` は起動からのパイプライン生成回数（perfProbe）。
   * 計測フェーズのフレームだけ `sample` を蓄積する。
   */
  step(dtSec: number, pipelines: number, sample: BenchSample): BenchPhase {
    if (this.phase === 'done') return 'done';
    if (this.lastPipelines !== null && pipelines !== this.lastPipelines) this.sincePipeline = 0;
    else this.sincePipeline++;
    this.lastPipelines = pipelines;
    this.pipelines = pipelines;
    const t = this.timing;
    if (this.phase === 'warm') {
      this.elapsed += dtSec;
      this.frames++;
      const ready =
        this.elapsed >= t.warmSec &&
        this.frames >= t.minWarmFrames &&
        this.sincePipeline >= t.settleFrames;
      if (ready || this.elapsed >= t.maxWarmSec) {
        this.phase = 'measure';
        this.elapsed = 0;
        this.frames = 0;
        this.pipelinesAtMeasure = pipelines;
      }
      return this.phase;
    }
    this.samples.push(sample);
    this.elapsed += dtSec;
    this.frames++;
    if (this.elapsed >= t.measureSec && this.frames >= t.minMeasureFrames) this.phase = 'done';
    return this.phase;
  }
}

/** 昇順に並べた配列の p 分位（0..1。最近傍）。空なら NaN。 */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[i] ?? Number.NaN;
}

export const median = (values: readonly number[]): number => percentile(values, 0.5);

/** 1 区間の結果（結果表の 1 行）。 */
export interface BenchRow {
  readonly name: string;
  /** 省略した区間の理由（計測値なし）。 */
  readonly skipped?: string;
  readonly frames?: number;
  readonly frameMedMs?: number;
  readonly frameP99Ms?: number;
  /** null は GPU 時間非対応（timestamp-query なし）。 */
  readonly gpuMedMs?: number | null;
  readonly cpuMedMs?: number;
  readonly draws?: number;
  readonly tris?: number;
  /** 描画バッファの解像度（px）と内部解像度スケール。 */
  readonly width?: number;
  readonly height?: number;
  readonly scale?: number;
  /** 計測中に生成されたパイプライン数（0 以外はコンパイルのカクつきが混ざっている）。 */
  readonly pipelines?: number;
}

/** 計測サンプルから結果の行を作る。 */
export function summarize(
  name: string,
  samples: readonly BenchSample[],
  view: { width: number; height: number; scale: number },
  pipelines: number,
): BenchRow {
  const frameMs = samples.map((s) => s.frameMs);
  const gpu = samples.map((s) => s.gpuMs).filter((v): v is number => v !== null);
  return {
    name,
    frames: samples.length,
    frameMedMs: median(frameMs),
    frameP99Ms: percentile(frameMs, 0.99),
    gpuMedMs: gpu.length > 0 ? median(gpu) : null,
    cpuMedMs: median(samples.map((s) => s.cpuMs)),
    draws: Math.round(median(samples.map((s) => s.draws))),
    tris: Math.round(median(samples.map((s) => s.tris))),
    width: view.width,
    height: view.height,
    scale: view.scale,
    pipelines,
  };
}

const ms = (v: number | null | undefined): string =>
  v === null || v === undefined || Number.isNaN(v) ? 'n/a' : v.toFixed(1);

const count = (v: number | undefined): string => {
  if (v === undefined) return 'n/a';
  return v >= 10_000 ? `${(v / 1000).toFixed(0)}k` : String(v);
};

/** 結果表の列（パネルの表とテキストで共有）。 */
export const BENCH_COLUMNS = [
  'section',
  'frame med',
  'frame p99',
  'gpu med',
  'cpu med',
  'draws',
  'tris',
  'res',
] as const;

/** 1 行を列ごとの文字列にする（`BENCH_COLUMNS` の順）。 */
export function rowCells(row: BenchRow): string[] {
  if (row.skipped !== undefined) return [row.name, `skipped: ${row.skipped}`];
  const res =
    row.width !== undefined && row.height !== undefined && row.scale !== undefined
      ? `${row.width}x${row.height} @${row.scale.toFixed(2)}`
      : 'n/a';
  return [
    row.name,
    ms(row.frameMedMs),
    ms(row.frameP99Ms),
    ms(row.gpuMedMs),
    ms(row.cpuMedMs),
    count(row.draws),
    count(row.tris),
    res + (row.pipelines ? ` pipe+${row.pipelines}` : ''),
  ];
}

/** 結果テキスト（チャットに貼る用）。先頭に端末情報、続いて 1 区間 1 行。 */
export function formatBenchReport(header: readonly string[], rows: readonly BenchRow[]): string {
  return [
    '# bench (#261) times in ms: frame median / p99, gpu median, cpu median',
    ...header,
    BENCH_COLUMNS.join(' | '),
    ...rows.map((r) => rowCells(r).join(' | ')),
  ].join('\n');
}

/** 実行状況（bench.view.ts が更新し、bench.dev.ts が E2E へ公開する）。 */
export interface BenchStatus {
  state: 'off' | 'running' | 'done';
  /** 現在の区間（0 始まり）と総数。 */
  index: number;
  total: number;
  current: string;
  /** 完了後の結果テキスト（`formatBenchReport`）。 */
  text: string;
  rows: BenchRow[];
}

export const benchStatus: BenchStatus = {
  state: 'off',
  index: 0,
  total: 0,
  current: '',
  text: '',
  rows: [],
};
