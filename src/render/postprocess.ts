import {
  RenderPipeline,
  type Camera,
  type Node,
  type Scene,
  type WebGPURenderer,
} from 'three/webgpu';
import {
  Fn,
  float,
  luminance,
  min,
  mix,
  pass,
  saturation,
  screenSize,
  screenUV,
  smoothstep,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import type { QualityPreset } from './quality';
import { finiteColor } from './finiteColor';

/** three r186 の内部 `RenderContexts`（compileScene でキャッシュキーを本描画に揃えるためだけに触る）。 */
interface RenderContextsLike {
  get: (
    this: RenderContextsLike,
    renderTarget: unknown,
    mrt: unknown,
    callDepth?: number,
  ) => unknown;
}

/** シーンパスが本描画で呼ばれる深さ（RenderPipeline.render → 全画面描画 → PassNode.updateBefore → renderer.render）。 */
const SCENE_PASS_CALL_DEPTH = 1;

/** 画面全体の演出パラメータ（すべて 0..1。既定は 0 = 効果なし）。死亡演出（8.1 節）などが設定する。 */
export interface ScreenEffect {
  /** 脱色（1 で彩度 0%）。 */
  desaturate: number;
  /** 減光（0.4 で明度 -40%）。 */
  dim: number;
  /** 周辺減光の強さ（1 で周辺がほぼ黒）。 */
  vignette: number;
  /** 黒へのフェード（1 で真っ黒）。 */
  fade: number;
  /** 画面端の赤い縁取り（ボスのフェーズ移行の咆哮。1 で縁がはっきり赤い）。 */
  rim: number;
}

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

export interface PostProcess {
  /** 画面演出のパラメータを設定する（指定した項目だけ更新）。既存のグレーディング内の uniform を書き換えるだけで、追加のパスはない。 */
  setScreenEffect(effect: Partial<ScreenEffect>): void;
  /**
   * ブルームへ渡る HDR シーン色（ポスト前のレンダーターゲット）を読み出し、非有限値（NaN / Inf）の個数と
   * 有限値の最大成分を返す（#258 の回帰テスト用。GPU 同期を伴うので通常は呼ばない）。
   */
  readSceneStats(): Promise<SceneStats>;
  /** シーンをポストエフェクト込みで描画する（renderer.render の代わりに呼ぶ）。 */
  render(): void;
  /**
   * シーンパスの描画パイプラインを非同期に作る（`createRenderPipelineAsync`。メインスレッドも GPU キューも止めない）。
   * `onProgress(loaded, total)` はパイプラインが 1 つできるたびに呼ばれる（#369）。
   * 影のパスとポスト処理自体の全画面パスは対象外（初回の `render()` で作られる）。
   */
  compileScene(onProgress?: (loaded: number, total: number) => void): Promise<void>;
  dispose(): void;
}

/**
 * シーン描画 → ブルーム → カラーグレーディング → ビネット → トーンマッピング/sRGB 出力。
 * ブルームとグレーディングはリニア HDR 空間で行い、トーンマッピングは最後（RenderPipeline 標準）。
 * 低品質ではブルームを省略するが、グレーディングとビネットは常に適用して見た目を揃える。
 */
export function createPostProcess(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  preset: QualityPreset,
): PostProcess {
  const scenePass = pass(scene, camera);
  const rawSceneColor = scenePass.getTextureNode('output');
  // NaN / Inf・極端な HDR 値はブルームのぼかしで画面全体へ広がる（#258）ので、ブルームに渡す前に有限値へ丸める
  const sceneColor = vec4(finiteColor(rawSceneColor.rgb), rawSceneColor.a);

  let color: Node<'vec4'> = sceneColor;
  if (preset.bloom) {
    // しきい値を 1 付近に置き、太陽・黄金の光などの HDR だけを滲ませる
    const bloomPass = bloom(sceneColor, preset.bloomStrength, 0.6, 0.9);
    color = sceneColor.add(bloomPass);
  }

  const uDesaturate = uniform(0);
  const uDim = uniform(0);
  const uVignette = uniform(0);
  const uFade = uniform(0);
  const uRim = uniform(0);
  const uRimBand = uniform(0.075);
  const uRimAlpha = uniform(0.33);

  const graded = Fn(() => {
    let c = color.rgb;
    const lum = luminance(c);

    // 落ち着いた色調: 全体を少し脱色し、影は冷たく、光は暖かく振る（スプリットトーン）
    c = saturation(c, 0.86);
    const shadowMask = float(1).sub(smoothstep(0.0, 0.35, lum));
    const highlightMask = smoothstep(0.35, 1.6, lum);
    c = mix(c, c.mul(vec3(0.9, 0.99, 1.1)), shadowMask.mul(0.7));
    c = mix(c, c.mul(vec3(1.1, 1.0, 0.86)), highlightMask.mul(0.55));

    // ビネット（周辺減光）
    const d = screenUV.sub(vec2(0.5, 0.5)).mul(vec2(1.0, 0.9)).length();
    const vignette = smoothstep(0.82, 0.28, d);
    c = c.mul(mix(0.55, 1.0, vignette));

    // 画面演出（死亡: 脱色・減光・強い周辺減光・黒へのフェード）。既存のパスの中で計算するので追加コストは ALU のみ
    c = mix(c, vec3(luminance(c)), uDesaturate);
    c = c.mul(float(1).sub(uDim));
    c = c.mul(mix(1.0, mix(0.08, 1.0, smoothstep(0.78, 0.2, d)), uVignette));
    // 画面端の赤い縁取り（咆哮）。短辺の `uRimBand` 倍の細い帯を、外へ向かってやわらかく赤く・少し暗くする。中心は変えない
    const edge = min(
      min(screenUV.x, float(1).sub(screenUV.x)).mul(screenSize.x.div(screenSize.y)),
      min(screenUV.y, float(1).sub(screenUV.y)),
    );
    const band = float(1)
      .sub(smoothstep(0, uRimBand, edge))
      .mul(uRim);
    c = mix(c, c.mul(0.6), band.mul(0.35));
    c = mix(c, vec3(0.8, 0.05, 0.03), band.mul(uRimAlpha));
    c = c.mul(float(1).sub(uFade));
    return vec4(c, 1.0);
  })();

  const pipeline = new RenderPipeline(renderer);
  pipeline.outputNode = graded;

  return {
    setScreenEffect: (effect) => {
      if (effect.desaturate !== undefined) uDesaturate.value = effect.desaturate;
      if (effect.dim !== undefined) uDim.value = effect.dim;
      if (effect.vignette !== undefined) uVignette.value = effect.vignette;
      if (effect.fade !== undefined) uFade.value = effect.fade;
      if (effect.rim !== undefined) uRim.value = effect.rim;
    },
    readSceneStats: async () => {
      const rt = scenePass.renderTarget;
      const data = await renderer.readRenderTargetPixelsAsync(rt, 0, 0, rt.width, rt.height);
      return analyzeHalfFloatRgba(data);
    },
    render: () => {
      pipeline.render();
    },
    compileScene: async (onProgress) => {
      // PassNode.compileAsync と同じく、パスのレンダーターゲットへ向けてコンパイルする（キャッシュキーを本描画と揃える）。
      // ターゲットの samples / 型は PassNode.setup が初回描画で決めるので、同じ値を先に入れておく。
      const rt = scenePass.renderTarget;
      rt.samples = scenePass.options.samples ?? renderer.samples;
      rt.texture.type = renderer.getOutputBufferType();
      const prevTarget = renderer.getRenderTarget();
      const prevMrt = renderer.getMRT();
      renderer.setRenderTarget(rt);
      renderer.setMRT(scenePass.getMRT());
      // three r186 はレンダーコンテキストを呼び出しの深さ（callDepth）込みで引く。本描画のシーンパスは RenderPipeline の
      // 全画面描画の中から入れ子で呼ばれる（深さ 1）が、compileAsync は常に深さ 0 で引くため、作ったパイプラインが本描画で
      // 使われず、初回フレームで全部同期的に作り直されていた（#369）。compileAsync の同期部分（コンテキストを引く所）の間だけ
      // 深さを本描画に合わせる。
      const contexts = (renderer as unknown as { _renderContexts: RenderContextsLike })
        ._renderContexts;
      const originalGet = contexts.get;
      contexts.get = (target, mrt) =>
        originalGet.call(contexts, target, mrt, SCENE_PASS_CALL_DEPTH);
      let compiling: Promise<void>;
      try {
        compiling = renderer.compileAsync(scene, camera, null, (e: ProgressEvent) => {
          onProgress?.(e.loaded, e.total);
        });
      } finally {
        contexts.get = originalGet;
      }
      try {
        await compiling;
      } finally {
        renderer.setRenderTarget(prevTarget);
        renderer.setMRT(prevMrt);
      }
    },
    dispose: () => {
      pipeline.dispose();
    },
  };
}
