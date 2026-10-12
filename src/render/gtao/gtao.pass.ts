import type { Node, RenderTarget } from 'three/webgpu';
import { float, mix, sample, unpackRGBToNormal, vec4 } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { registerFramePass } from '../pipeline/framePasses';

/** GTAONode が内部で描くレンダーターゲット（three r186 の内部フィールド。GPU 時間の帰属だけに使う）。 */
interface GtaoInternals {
  _aoRenderTarget?: RenderTarget;
}

/** 遮蔽の効き（0 = 無効、1 = GTAO の値そのまま）。直接光まで暗くしすぎないよう少し弱める。 */
const AO_STRENGTH = 0.8;

// GTAO（#319、tech-direction §3.2）: scene パスの深度と法線（MRT で同時に書いたもの）から環境遮蔽を求め、色に掛ける。
// 半解像度で求め、深度・法線を見た空間デノイズ（合成時に画素ごと）で均してノイズを消す。
registerFramePass({
  id: 'gtao',
  stage: 'screenSpace',
  order: 0,
  gbuffer: ['normal'],
  enabled: (preset) => preset.ao,
  build: (ctx, color) => {
    ctx.normal(); // G バッファの宣言を確かめる（GTAO は任意の uv で引くので、テクスチャを直接 sample で包む）
    const normalTex = ctx.scenePass.getTextureNode('normal');
    const normalAt = sample((uv) => unpackRGBToNormal(normalTex.sample(uv).rgb));

    const aoNode = ao(ctx.depth, normalAt, ctx.camera);
    aoNode.resolutionScale = 0.5;
    aoNode.radius.value = 0.6;
    aoNode.samples.value = 16;

    const denoised = denoise(aoNode.getTextureNode(), ctx.depth, normalAt, ctx.camera);
    const occlusion = mix(float(1), (denoised as unknown as Node<'vec4'>).r, AO_STRENGTH);

    const rt = (aoNode as unknown as GtaoInternals)._aoRenderTarget;
    return {
      color: vec4(color.rgb.mul(occlusion), color.a),
      targets: rt ? [rt] : [],
      api: aoNode,
      dispose: () => {
        aoNode.dispose();
        denoised.dispose();
      },
    };
  },
});
