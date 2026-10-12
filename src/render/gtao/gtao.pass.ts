import { FloatType, RedFormat, type Node, type RenderTarget } from 'three/webgpu';
import {
  float,
  mix,
  reference,
  rtt,
  sample,
  select,
  unpackRGBToNormal,
  vec4,
  viewZToPerspectiveDepth,
} from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { registerFramePass } from '../pipeline/framePasses';

/** GTAONode が内部で描くレンダーターゲット（three r186 の内部フィールド。GPU 時間の帰属だけに使う）。 */
interface GtaoInternals {
  _aoRenderTarget?: RenderTarget;
}

/** 遮蔽の効き（0 = 無効、1 = GTAO の値そのまま）。直接光まで暗くしすぎないよう少し弱める。 */
const AO_STRENGTH = 1;

// GTAO（#319、tech-direction §3.2）: scene パスの深度と法線（MRT で同時に書いたもの）から環境遮蔽を求め、色に掛ける。
// 半解像度で求め、深度・法線を見た空間デノイズ（合成時に画素ごと）で均してノイズを消す。
registerFramePass({
  id: 'gtao',
  stage: 'screenSpace',
  order: 0,
  gbuffer: ['normal', 'depth'],
  enabled: (preset) => preset.ao,
  build: (ctx, color) => {
    ctx.normal(); // G バッファの宣言を確かめる（GTAO は任意の uv で引くので、テクスチャを直接 sample で包む）
    const normalTex = ctx.scenePass.getTextureNode('normal');
    const normalAt = sample((uv) => unpackRGBToNormal(normalTex.sample(uv).rgb));

    // MSAA の深度はマルチサンプルのままで GTAO が引けない（textureGather 不可）ので、MRT で書いた解決済みの距離を
    // GTAO が期待する透視深度（0..1、背景 = 1）へ 32bit で描き直す
    const near = reference('near', 'float', ctx.camera);
    const far = reference('far', 'float', ctx.camera);
    const dist = ctx.resolvedDepth().r;
    const perspective = select(
      dist.greaterThan(0),
      viewZToPerspectiveDepth(dist.negate(), near, far),
      float(1),
    );
    const depthTex = rtt(vec4(perspective, 0, 0, 1), null, null, {
      type: FloatType,
      format: RedFormat,
      depthBuffer: false,
    });
    const aoNode = ao(depthTex, normalAt, ctx.camera);
    aoNode.resolutionScale = 0.5;
    aoNode.radius.value = 2.5;
    aoNode.samples.value = 8;

    const denoised = denoise(aoNode.getTextureNode(), depthTex, normalAt, ctx.camera);
    const occlusion = mix(float(1), (denoised as unknown as Node<'vec4'>).r, AO_STRENGTH);

    const aoRt = (aoNode as unknown as GtaoInternals)._aoRenderTarget;
    return {
      color: vec4(color.rgb.mul(occlusion), color.a),
      targets: [depthTex.renderTarget, aoRt].filter((t): t is RenderTarget => t != null),
      api: aoNode,
      dispose: () => {
        depthTex.dispose();
        aoNode.dispose();
        denoised.dispose();
      },
    };
  },
});
