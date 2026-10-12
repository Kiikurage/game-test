// フレームパイプラインのパスの登録口（#317。tech-direction §3.2 の目標形）。
//
// フレームは次の段（stage）の順に組み立てる。各段に複数のパスを登録でき、段の中は `order` の昇順。
//   scene        影 + 不透明 + 半透明の前方描画（three の PassNode 1 回）。G バッファの出力（深度・法線・速度など）も同時に書く
//                （プリパスを別に描かず、MRT で「深度プリパス」の出力を共有する。頂点処理を 2 回払わないため）
//   screenSpace  画面空間（GTAO・接触影・SSR）。G バッファを読み、色を加工する
//   volume       体積（フロクセルの体積霧）
//   transparent  後から合成する半透明（ソフトパーティクル・歪み）
//   temporal     時間方向（TAAU）
//   post         ポスト（ブルーム・グレーディング・ビネット）。トーンマップと sRGB 変換は最後に RenderPipeline が行う
//
// 新しいパスは `src/render/<feature>/<feature>.pass.ts` を作って `registerFramePass` を呼ぶ（自動で読み込まれる）。
//
//   registerFramePass({
//     id: 'gtao', stage: 'screenSpace', gbuffer: ['normal'],
//     build: (ctx, color) => {
//       const ao = ao(ctx.depth, ctx.normal(), ctx.camera);   // three の TSL ノード
//       return { color: vec4(color.rgb.mul(ao.r), color.a), targets: [...] };
//     },
//   });
import type {
  Camera,
  Node,
  PassNode,
  RenderTarget,
  Scene,
  TextureNode,
  WebGPURenderer,
} from 'three/webgpu';
import type { QualityPreset } from '../quality';

export const FRAME_STAGES = [
  'scene',
  'screenSpace',
  'volume',
  'transparent',
  'temporal',
  'post',
] as const;
export type FrameStage = (typeof FRAME_STAGES)[number];

/**
 * scene パスが MRT で同時に書く G バッファの出力。要求したパスがあるときだけ書く（書かなければ帯域を払わない）。
 * - normal: ビュー空間の法線（`directionToColor` で 0..1 に詰めたもの。読むときは `ctx.normal()`）
 * - velocity: 画面空間の速度（TAA・モーションブラー用。three の `velocity`）
 * 深度は常に読める（`ctx.depth`）。
 */
export type GBufferChannel = 'normal' | 'velocity';

export interface FramePassContext {
  readonly renderer: WebGPURenderer;
  readonly scene: Scene;
  readonly camera: Camera;
  readonly preset: QualityPreset;
  /** 前方描画のパス（`setResolutionScale` で内部解像度を変えられる。TAAU 用）。 */
  readonly scenePass: PassNode;
  /** scene パスの深度テクスチャ。 */
  readonly depth: TextureNode;
  /** ビュー空間の法線（vec3）。`gbuffer: ['normal']` を宣言したパスだけが使える。 */
  normal(): Node<'vec3'>;
  /** 画面空間の速度テクスチャ。`gbuffer: ['velocity']` を宣言したパスだけが使える。 */
  velocity(): TextureNode;
}

export interface FramePassResult {
  /** このパスを通した後の色（リニア HDR の vec4）。 */
  readonly color: Node<'vec4'>;
  /**
   * このパスが内部で描くレンダーターゲット。GPU 時間をこのパス名で数えるのに使う（`?debug` のパス別 GPU 時間）。
   * 指定しないと、そのレンダーパスは "other" に入る。
   */
  readonly targets?: readonly RenderTarget[];
  /** 他のコード（演出など）から操作するための API。`FramePipeline.pass(id)` で取り出す。 */
  readonly api?: unknown;
  /** 毎フレーム、描画の前に呼ばれる（コンピュートの起動など）。ここでの描画・コンピュートはこのパスの GPU 時間に入る。 */
  readonly beforeRender?: () => void;
  readonly dispose?: () => void;
}

export interface FramePassDef {
  readonly id: string;
  readonly stage: FrameStage;
  /** 段の中の順序（昇順。既定 0）。 */
  readonly order?: number;
  /** scene パスに書かせる G バッファの出力。 */
  readonly gbuffer?: readonly GBufferChannel[];
  /** false ならこのパスを組み込まない（品質段階・トグル）。 */
  readonly enabled?: (preset: QualityPreset) => boolean;
  /** 入力色 `color` を受けて、出力を組み立てる（起動時に 1 度）。 */
  build(ctx: FramePassContext, color: Node<'vec4'>): FramePassResult;
}

const passes: FramePassDef[] = [];

/** フレームのパスを登録する。`id` の重複はエラー。 */
export function registerFramePass(def: FramePassDef): void {
  if (passes.some((p) => p.id === def.id))
    throw new Error(`frame pass "${def.id}" already registered`);
  passes.push(def);
}

/** 有効なパスを段・order の順に並べて返す。 */
export function orderedFramePasses(
  preset: QualityPreset,
  defs: readonly FramePassDef[] = passes,
): FramePassDef[] {
  const stageIndex = (s: FrameStage): number => FRAME_STAGES.indexOf(s);
  return defs
    .filter((p) => p.enabled?.(preset) ?? true)
    .map((p, i) => ({ p, i }))
    .sort(
      (a, b) =>
        stageIndex(a.p.stage) - stageIndex(b.p.stage) ||
        (a.p.order ?? 0) - (b.p.order ?? 0) ||
        a.i - b.i,
    )
    .map(({ p }) => p);
}
