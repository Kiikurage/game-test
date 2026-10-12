// TAAU（#318。tech-direction §3.2 の「時間方向」。既定無効、`?taau=0.5..1` で有効）: scene パスを内部解像度（`preset.taauScale`）で、毎フレーム
// サブピクセルずらして（ジッタ）描き、速度バッファで前フレームの履歴を再投影して出力解像度へ再構成する。
// アンチエイリアス（MSAA の代わり）とアップスケールを 1 パスで行う。本体は three r186 の TAAUNode。
//
// - 入力色は前段（screenSpace〜transparent のパス）を通した後の色。TAAUNode はテクスチャを要求するので、
//   内部解像度の RTT に 1 度書き出す（scene パスと同じ画素格子。前段が無ければ finiteColor の 1 パスだけ）。
// - カメラのジッタ（setViewOffset）と速度の投影行列の差し替えは TAAUNode が RenderPipeline の前後で行う。
import type { Node, RenderTarget } from 'three/webgpu';
import { Fn, int, max, min, rtt, uniform, uv, vec2, vec4 } from 'three/tsl';
import { sharpTaau } from './taauNode';
import { registerFramePass } from '../pipeline/framePasses';

/** TAAUNode が内部で描くレンダーターゲット（three r186 の内部フィールド。GPU 時間を taau として数えるためだけに読む）。 */
interface TaauInternals {
  _resolveRenderTarget?: RenderTarget;
  _historyRenderTarget?: RenderTarget;
}

export interface TaauApi {
  /** 内部解像度スケール。 */
  readonly scale: number;
  /** 再構成後の鮮鋭化の強さ（0 で無効。既定 SHARPEN）。 */
  setSharpen(amount: number): void;
}

/**
 * TAAU の再構成（3x3 のガウス近似フィルタ + 履歴の双線形サンプル）は静止画でもやや甘くなるので、出力を軽く鮮鋭化する。
 * 上下左右 4 点との差を足し、近傍の最小・最大で抑える（HDR のままでもハローを出さない）。別パスにせず、後段（ブルーム・
 * グレーディング）の中で読むので追加のレンダーパスは無い。
 */
const SHARPEN = 0.6;

/** 現フレームの最低の重み（TAAUNode.currentFrameWeight）。 */
const CURRENT_FRAME_WEIGHT = 0.1;

registerFramePass({
  id: 'taau',
  stage: 'temporal',
  gbuffer: ['velocity'],
  enabled: (preset) => preset.taauScale > 0,
  build: (ctx, color) => {
    const scale = ctx.preset.taauScale;
    ctx.scenePass.setResolutionScale(scale);
    const input = rtt(color, null, null, { resolutionScale: scale });
    input.name = 'taau.input';
    const node = sharpTaau(input, ctx.depth, ctx.velocity(), ctx.camera);
    // 既定 0.025 は約 40 フレーム分を溜め、動いている間は毎フレームの双線形の再サンプルで像が大きくぼける（#318 の撮影で確認）。
    // 溜める量を減らして動きの中の鮮明さを優先する
    node.currentFrameWeight = CURRENT_FRAME_WEIGHT;
    const internals = node as unknown as TaauInternals;
    const targets = [
      ...(input.renderTarget ? [input.renderTarget] : []),
      ...(internals._resolveRenderTarget ? [internals._resolveRenderTarget] : []),
      ...(internals._historyRenderTarget ? [internals._historyRenderTarget] : []),
    ];
    const resolved = node.getTextureNode();
    const uSharpen = uniform(SHARPEN);
    const sharpened = Fn(() => {
      const p = uv();
      const texel = vec2(1).div(vec2(resolved.size(int(0)) as Node<'ivec2'>));
      const c = resolved.sample(p);
      const n = resolved.sample(p.add(vec2(0, texel.y))).rgb;
      const s = resolved.sample(p.sub(vec2(0, texel.y))).rgb;
      const e = resolved.sample(p.add(vec2(texel.x, 0))).rgb;
      const w = resolved.sample(p.sub(vec2(texel.x, 0))).rgb;
      const lo = min(min(min(n, s), min(e, w)), c.rgb);
      const hi = max(max(max(n, s), max(e, w)), c.rgb);
      const avg = n.add(s).add(e).add(w).mul(0.25);
      const out = c.rgb.add(c.rgb.sub(avg).mul(uSharpen)).clamp(lo, hi);
      return vec4(out, c.a);
    })();
    const api: TaauApi = {
      scale,
      setSharpen: (amount) => {
        uSharpen.value = amount;
      },
    };
    return {
      color: sharpened,
      targets,
      api,
      dispose: () => {
        node.dispose();
        input.dispose();
      },
    };
  },
});
