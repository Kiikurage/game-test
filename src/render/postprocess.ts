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
  mix,
  pass,
  saturation,
  screenUV,
  smoothstep,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import type { QualityPreset } from './quality';

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
}

export interface PostProcess {
  /** 画面演出のパラメータを設定する（指定した項目だけ更新）。既存のグレーディング内の uniform を書き換えるだけで、追加のパスはない。 */
  setScreenEffect(effect: Partial<ScreenEffect>): void;
  /** シーンをポストエフェクト込みで描画する（renderer.render の代わりに呼ぶ）。 */
  render(): void;
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
  const sceneColor = scenePass.getTextureNode('output');

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
    },
    render: () => {
      pipeline.render();
    },
    dispose: () => {
      pipeline.dispose();
    },
  };
}
