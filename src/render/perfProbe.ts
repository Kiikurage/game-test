/**
 * 描画の「毎フレーム再生成」を検出するための計測（#231）。
 * パイプライン生成は Android Chrome（Dawn/Vulkan）で非常に遅いので、ウォームアップ後に増え続けていたらバグ。
 * `perf.view.ts` が backend をラップして更新し、`perf.dev.ts` が E2E へ公開する。
 */
export interface PerfProbe {
  /** 起動からのレンダーパイプライン生成回数（ウォームアップ後に増えないのが正常）。 */
  pipelineCreations: number;
  /** 直近フレームの JS 側 CPU 時間（beginFrame〜endFrame。描画コマンドの組み立て込み、GPU 待ちは含まない）。 */
  frameCpuMs: number;
  /** 直近 120 フレームの CPU 時間の中央値（初回コンパイルなどの外れ値に引きずられない）。 */
  frameCpuAvgMs: number;
  /**
   * 生成したパイプラインの内訳（マテリアルの種類・ウーバーのバリアント・パス）。`npm run perf` が集計して、
   * 何がパイプラインを分けているかを出す（#326）。
   */
  pipelineLabels: string[];
  /** 同じ順で、シェーダコードとレンダーステートのハッシュ付き（同じラベルで分かれる理由の切り分け用）。 */
  pipelineDetails: string[];
  /**
   * 起動時の事前コンパイル（`GameView.warmUp`）で、パイプラインを作った区間ごとの所要時間（#388）。
   * `npm run perf` が長い順に上位を出す。`pipelineLabels` と同じラベル。
   */
  pipelineTimings: PipelineTiming[];
}

export interface PipelineTiming {
  /** その区間で最初に作ったパイプラインのラベル（複数作った区間は末尾に `(+n)`）。 */
  label: string;
  /** 区間の長さ（ms）。シェーダ（WGSL）の生成・バインディング更新・パイプライン作成の完了待ちを含む。 */
  ms: number;
  /** その区間で作ったパイプラインの数。 */
  count: number;
}

export const perfProbe: PerfProbe = {
  pipelineCreations: 0,
  frameCpuMs: 0,
  frameCpuAvgMs: 0,
  pipelineLabels: [],
  pipelineDetails: [],
  pipelineTimings: [],
};

/**
 * `lap()` を呼ぶたびに、前回の `lap()`（または生成）からの時間と、その間に作られたパイプラインを `pipelineTimings` に記録する。
 * three の `compileAsync` は描画オブジェクトを 1 つずつ順に処理し、1 つ終わるごとに進捗を返すので、進捗の合間が 1 区間になる。
 * パイプラインを作らなかった区間（キャッシュ済み）は記録しない。
 */
export function createPipelineTimer(): { lap(): void } {
  let lastTime = performance.now();
  let lastIndex = perfProbe.pipelineLabels.length;
  return {
    lap() {
      const now = performance.now();
      const created = perfProbe.pipelineLabels.slice(lastIndex);
      if (created.length > 0) {
        perfProbe.pipelineTimings.push({
          label: created.length > 1 ? `${created[0]} (+${created.length - 1})` : (created[0] ?? ''),
          ms: now - lastTime,
          count: created.length,
        });
      }
      lastTime = now;
      lastIndex = perfProbe.pipelineLabels.length;
    },
  };
}

interface RenderObjectLike {
  material?: { type?: string; name?: string; userData?: { uberVariant?: string } };
  object?: {
    isInstancedMesh?: boolean;
    isSkinnedMesh?: boolean;
    isBatchedMesh?: boolean;
    skeleton?: { bones: unknown[] };
    instanceMatrix?: { count: number };
    morphTargetInfluences?: unknown[];
  };
  context?: { depth?: boolean; textures?: unknown[] | null };
  pipeline?: { vertexProgram?: { code?: string }; fragmentProgram?: { code?: string } };
}

function shortHash(text: string | undefined): string {
  if (text === undefined) return '-';
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36).slice(0, 4);
}

/** パイプライン 1 本のラベル（集計用）。 */
export function pipelineLabel(renderObject: unknown, stateKey?: string): string {
  const r = renderObject as RenderObjectLike | null;
  const m = r?.material;
  if (!m) return 'unknown';
  const variant = m.userData?.uberVariant;
  const kind = variant !== undefined ? `uber:${variant}` : (m.type ?? 'material');
  const obj = r.object;
  const mesh = obj?.isSkinnedMesh
    ? ' skinned'
    : obj?.isInstancedMesh
      ? ' instanced'
      : obj?.isBatchedMesh
        ? ' batched'
        : '';
  const base = `${kind}${mesh}${m.name ? ` (${m.name})` : ''}`;
  if (stateKey === undefined) return base;
  const v = shortHash(r.pipeline?.vertexProgram?.code);
  const f = shortHash(r.pipeline?.fragmentProgram?.code);
  const extra = `${obj?.skeleton ? ` bones${obj.skeleton.bones.length}` : ''}${obj?.instanceMatrix ? ` n${obj.instanceMatrix.count}` : ''}${obj?.morphTargetInfluences ? ` morph${obj.morphTargetInfluences.length}` : ''}`;
  return `${base} [v${v} f${f} s${shortHash(stateKey)}${extra}]`;
}
