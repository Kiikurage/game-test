import type { RenderTarget } from 'three/webgpu';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { registerFramePass } from '../framePasses';

/** BloomNode が内部で描くレンダーターゲット（three r186 の内部フィールド。GPU 時間をブルームとして数えるためだけに読む）。 */
interface BloomInternals {
  _renderTargetBright?: RenderTarget;
  _renderTargetsHorizontal?: RenderTarget[];
  _renderTargetsVertical?: RenderTarget[];
}

// しきい値を 1 付近に置き、太陽・黄金の光などの HDR だけを滲ませる。低品質では省略する
registerFramePass({
  id: 'bloom',
  stage: 'post',
  order: 0,
  enabled: (preset) => preset.bloom,
  build: (ctx, color) => {
    const node = bloom(color, ctx.preset.bloomStrength, 0.6, 0.9);
    const internals = node as unknown as BloomInternals;
    const targets = [
      ...(internals._renderTargetBright ? [internals._renderTargetBright] : []),
      ...(internals._renderTargetsHorizontal ?? []),
      ...(internals._renderTargetsVertical ?? []),
    ];
    return {
      color: color.add(node),
      targets,
      dispose: () => {
        node.dispose();
      },
    };
  },
});
