import { registerDevHooks } from '../devHooks';
import type { SceneStats } from './postprocess';

declare module '../devHooks' {
  interface DevHooks {
    /** ブルームへ渡る HDR シーン色の NaN / Inf 個数と最大輝度（#258）。直近に描画したフレームを読む。 */
    sceneStats(): Promise<SceneStats>;
  }
}

registerDevHooks('postprocess', ({ view }) => ({
  sceneStats: () => view.postProcess.readSceneStats(),
}));
