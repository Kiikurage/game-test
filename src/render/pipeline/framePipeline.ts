// フレームパイプライン（#317）: scene パス（MRT で G バッファも書く）→ 登録されたパスを段の順に通す → トーンマップ / sRGB 出力。
// パスの追加は `framePasses.ts` の `registerFramePass`（`*.pass.ts` は自動で読み込む）。パス別 GPU 時間は `gpuTimer.ts`。
import {
  RenderPipeline,
  type Camera,
  type Node,
  type Scene,
  type TextureNode,
  type WebGPURenderer,
} from 'three/webgpu';
import {
  unpackRGBToNormal,
  packNormalToRGB,
  mrt,
  normalView,
  output,
  pass,
  velocity,
  vec4,
} from 'three/tsl';
import type { QualityPreset } from '../quality';
import { finiteColor } from '../finiteColor';
import {
  orderedFramePasses,
  type FramePassContext,
  type FramePassDef,
  type GBufferChannel,
} from './framePasses';
import type { GpuTimer, PassLabeler } from './gpuTimer';
import type { GradeApi, ScreenEffect } from './passes/grade.pass';

import.meta.glob('../**/*.pass.ts', { eager: true });

export type { ScreenEffect } from './passes/grade.pass';

/** three r186 の内部 `RenderContexts`（compileScene でキャッシュキーを本描画に揃えるためだけに触る）。 */
interface RenderContextsLike {
  get: (
    this: RenderContextsLike,
    renderTarget: unknown,
    mrt: unknown,
    callDepth?: number,
  ) => unknown;
}

/** three r186 の内部 `Pipelines`（compileScene でパイプライン作成の待ちを後ろへ回すためだけに触る）。 */
interface PipelinesLike {
  getForRender: (
    this: PipelinesLike,
    renderObject: unknown,
    promises?: Promise<unknown>[],
  ) => unknown;
}

/** scene パスが本描画で呼ばれる深さ（RenderPipeline.render → 全画面描画 → PassNode.updateBefore → renderer.render）。 */
const SCENE_PASS_CALL_DEPTH = 1;

export interface SceneStats {
  /** 画素数 x チャンネル数のうち NaN / Inf の個数。 */
  readonly nonFinite: number;
  /** 有限値の最大成分（RGB）。 */
  readonly maxRgb: number;
}

/** 半精度浮動小数の RGBA 配列から、非有限値の個数と有限値の最大 RGB 成分を数える。 */
export function analyzeHalfFloatRgba(data: ArrayLike<number>): SceneStats {
  let nonFinite = 0;
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const h = data[i] ?? 0;
    const exp = (h >> 10) & 0x1f;
    if (exp === 0x1f) {
      nonFinite++;
      continue;
    }
    if (i % 4 === 3 || (h & 0x8000) !== 0) continue;
    const mant = h & 0x3ff;
    const v = exp === 0 ? (mant / 1024) * 2 ** -14 : (1 + mant / 1024) * 2 ** (exp - 15);
    if (v > max) max = v;
  }
  return { nonFinite, maxRgb: max };
}

export interface FramePipeline {
  /** 組み込まれたパス（描画順。scene と output を含む）。`?debug` の表示用。 */
  readonly passIds: readonly string[];
  /** scene パスが書いている G バッファの出力。 */
  readonly gbuffer: readonly GBufferChannel[];
  /** 登録パスの API（`FramePassResult.api`）を取り出す。そのパスが無効なら undefined。 */
  pass(id: string): unknown;
  /** 画面演出のパラメータを設定する（grade パスへの近道）。 */
  setScreenEffect(effect: Partial<ScreenEffect>): void;
  /**
   * ブルームへ渡る HDR シーン色（scene パスのレンダーターゲット）を読み出し、非有限値（NaN / Inf）の個数と
   * 有限値の最大成分を返す（#258 の回帰テスト用。GPU 同期を伴うので通常は呼ばない）。
   */
  readSceneStats(): Promise<SceneStats>;
  /** 1 フレームを描画する。 */
  render(): void;
  /**
   * scene パスの描画パイプラインを非同期に作る（`createRenderPipelineAsync`。メインスレッドも GPU キューも止めない）。
   * `onProgress(loaded, total)` はパイプラインが 1 つできるたびに呼ばれる（#369）。
   * 影のパスと後段の全画面パスは対象外（`compileRest` で作る）。
   */
  compileScene(onProgress?: (loaded: number, total: number) => void): Promise<void>;
  /**
   * `draw`（`render()` を呼ぶ関数）を、パイプラインを非同期に作る状態で 1 回実行し、作成の完了まで待つ（#396）。
   * `compileScene` の対象外（影・ポスト処理の全画面パス・背景）は、three に先行コンパイルの口が無く本描画の経路でしか作れない。
   * 本描画の経路は作成中のパイプラインの描画を飛ばすだけなので、`getForRender` に promise 配列を渡して非同期に作らせ、全部まとめて待つ。
   * 描画結果は捨てる前提（ローディング中に 1 回だけ呼ぶ）。
   */
  compileRest(draw: () => void): Promise<void>;
  dispose(): void;
}

/**
 * 有効なパスを段の順に組み立てる。`defs` は単体テスト用（省略時は登録済みのパス）。
 * `timer` を渡すと、各パスのレンダーターゲットをそのパス名で GPU 時間に数える。
 */
export function createFramePipeline(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  preset: QualityPreset,
  timer?: GpuTimer,
  defs?: readonly FramePassDef[],
): FramePipeline {
  const passes = orderedFramePasses(preset, defs);
  const gbuffer = [...new Set(passes.flatMap((p) => p.gbuffer ?? []))].sort();

  const scenePass = pass(scene, camera);
  if (gbuffer.length > 0) {
    const outputs: Record<string, Node> = { output };
    if (gbuffer.includes('normal')) outputs.normal = packNormalToRGB(normalView);
    if (gbuffer.includes('velocity')) outputs.velocity = velocity;
    scenePass.setMRT(mrt(outputs));
  }
  const depth = scenePass.getTextureNode('depth');

  const ctxFor = (def: FramePassDef): FramePassContext => {
    const requireChannel = (c: GBufferChannel): void => {
      if (!def.gbuffer?.includes(c)) {
        throw new Error(`frame pass "${def.id}" reads G-buffer "${c}" without declaring it`);
      }
    };
    return {
      renderer,
      scene,
      camera,
      preset,
      scenePass,
      depth,
      normal: () => {
        requireChannel('normal');
        return unpackRGBToNormal(scenePass.getTextureNode('normal').rgb);
      },
      velocity: (): TextureNode => {
        requireChannel('velocity');
        return scenePass.getTextureNode('velocity');
      },
    };
  };

  const rawSceneColor = scenePass.getTextureNode('output');
  // NaN / Inf・極端な HDR 値はブルームのぼかしで画面全体へ広がる（#258）ので、後段に渡す前に有限値へ丸める
  let color: Node<'vec4'> = vec4(finiteColor(rawSceneColor.rgb), rawSceneColor.a);

  const targetLabels = new Map<unknown, string>([[scenePass.renderTarget, 'scene']]);
  const apis = new Map<string, unknown>();
  const beforeRender: { id: string; fn: () => void }[] = [];
  const disposers: (() => void)[] = [];
  for (const def of passes) {
    const result = def.build(ctxFor(def), color);
    color = result.color;
    for (const t of result.targets ?? []) targetLabels.set(t, def.id);
    if (result.api !== undefined) apis.set(def.id, result.api);
    if (result.beforeRender) beforeRender.push({ id: def.id, fn: result.beforeRender });
    if (result.dispose) disposers.push(result.dispose);
  }

  const pipeline = new RenderPipeline(renderer);
  pipeline.outputNode = color;

  const passIds = ['scene', ...passes.map((p) => p.id), 'output'];
  if (timer) {
    const labeler: PassLabeler = {
      labelFor: (target) => targetLabels.get(target),
    };
    timer.labeler = labeler;
    // 登録パス以外のラベル（gpuTimer が付ける）: compute（ラベル無しのコンピュート）、shadow（ShadowNode。scene の前に描かれる）、
    // reflection（ReflectorNode）、output（キャンバスへの最終パス = 最後の合成 + トーンマップ + sRGB）、other（不明）
    timer.order = ['compute', 'shadow', 'reflection', ...passIds, 'other'];
  }

  return {
    passIds,
    gbuffer,
    pass: (id) => apis.get(id),
    setScreenEffect: (effect) => {
      (apis.get('grade') as GradeApi | undefined)?.setScreenEffect(effect);
    },
    readSceneStats: async () => {
      const rt = scenePass.renderTarget;
      const data = await renderer.readRenderTargetPixelsAsync(rt, 0, 0, rt.width, rt.height);
      return analyzeHalfFloatRgba(data);
    },
    render: () => {
      for (const b of beforeRender) {
        if (timer) timer.withLabel(b.id, b.fn);
        else b.fn();
      }
      pipeline.render();
    },
    compileScene: async (onProgress) => {
      // PassNode.compileAsync と同じく、パスのレンダーターゲット・MRT へ向けてコンパイルする（キャッシュキーを本描画と揃える）。
      // ターゲットの samples / 型は PassNode.setup が初回描画で決めるので、同じ値を先に入れておく。
      const rt = scenePass.renderTarget;
      rt.samples = scenePass.options.samples ?? renderer.samples;
      rt.texture.type = renderer.getOutputBufferType();
      const prevTarget = renderer.getRenderTarget();
      const prevMrt = renderer.getMRT();
      renderer.setRenderTarget(rt);
      renderer.setMRT(scenePass.getMRT());
      // three r186 はレンダーコンテキストを呼び出しの深さ（callDepth）込みで引く。本描画の scene パスは RenderPipeline の
      // 全画面描画の中から入れ子で呼ばれる（深さ 1）が、compileAsync は常に深さ 0 で引くため、作ったパイプラインが本描画で
      // 使われず、初回フレームで全部同期的に作り直されていた（#369）。compileAsync の同期部分（コンテキストを引く所）の間だけ
      // 深さを本描画に合わせる。
      const contexts = (renderer as unknown as { _renderContexts: RenderContextsLike })
        ._renderContexts;
      const originalGet = contexts.get;
      contexts.get = (target, mrtNode) =>
        originalGet.call(contexts, target, mrtNode, SCENE_PASS_CALL_DEPTH);
      // 並列化（#390）。three r186 の compileAsync（Renderer.js 1055〜1090 行）はオブジェクトごとに
      // `await Promise.all(pipelinePromises)` してから次へ進むため、パイプラインを 1 本ずつ直列に作る。
      // WebGPU の createRenderPipelineAsync は並列に投げればドライバ（Metal のコンパイラサービス）が並列に処理できるので、
      // `_pipelines.getForRender(renderObject, pipelinePromises)` に渡される promise 配列を自前の配列にすり替え、
      // compileAsync には空配列に見せて待たせない。全オブジェクトの投入が終わってから自前の配列をまとめて待つ。
      // （compileAsync の前半をコピーせずに済ませるための方法。three を更新したら、getForRender の呼び出しと
      // `_isPreCompiling` の扱いが変わっていないか見直す。）
      const pipelines = (renderer as unknown as { _pipelines: PipelinesLike })._pipelines;
      const originalGetForRender = pipelines.getForRender;
      const pending: Promise<unknown>[] = [];
      let settled = 0;
      let total = 0;
      pipelines.getForRender = function (this: PipelinesLike, renderObject, promises) {
        if (promises === undefined) return originalGetForRender.call(this, renderObject);
        const own: Promise<unknown>[] = [];
        const result = originalGetForRender.call(this, renderObject, own);
        if (own.length > 0) {
          pending.push(
            Promise.all(own).then(() => {
              settled++;
              onProgress?.(settled, Math.max(total, settled));
            }),
          );
        }
        return result;
      };
      let compiling: Promise<void>;
      try {
        compiling = renderer.compileAsync(scene, camera, null, (e: ProgressEvent) => {
          total = e.total;
        });
      } finally {
        contexts.get = originalGet;
      }
      try {
        try {
          await compiling;
        } finally {
          pipelines.getForRender = originalGetForRender;
        }
        await Promise.all(pending);
        onProgress?.(total, total);
      } finally {
        renderer.setRenderTarget(prevTarget);
        renderer.setMRT(prevMrt);
      }
    },
    compileRest: async (draw) => {
      // 本描画の `_renderObjectDirect` は `getForRender(renderObject)`（promises なし = 同期作成）を呼ぶ。
      // promises が無いときだけ自前の配列を渡して非同期作成にし、描画はパイプラインが無い物を飛ばす（`isReady`）。
      const pipelines = (renderer as unknown as { _pipelines: PipelinesLike })._pipelines;
      const originalGetForRender = pipelines.getForRender;
      const pending: Promise<unknown>[] = [];
      pipelines.getForRender = function (this: PipelinesLike, renderObject, promises) {
        if (promises !== undefined) return originalGetForRender.call(this, renderObject, promises);
        const own: Promise<unknown>[] = [];
        const result = originalGetForRender.call(this, renderObject, own);
        pending.push(...own);
        return result;
      };
      try {
        draw();
      } finally {
        pipelines.getForRender = originalGetForRender;
      }
      await Promise.all(pending);
    },
    dispose: () => {
      for (const d of disposers) d();
      pipeline.dispose();
    },
  };
}
