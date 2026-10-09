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
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import type { QualityPreset } from './quality';

export interface PostProcess {
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
    return vec4(c, 1.0);
  })();

  const pipeline = new RenderPipeline(renderer);
  pipeline.outputNode = graded;

  return {
    render: () => {
      pipeline.render();
    },
    dispose: () => {
      pipeline.dispose();
    },
  };
}
