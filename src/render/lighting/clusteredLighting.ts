import { Lighting, type Light, type Node, type WebGPURenderer } from 'three/webgpu';
import { Fn, clamp, float, floor, int, log, positionView, vec4 } from 'three/tsl';
import ClusteredLightsNode from 'three/addons/tsl/lighting/ClusteredLightsNode.js';

/**
 * クラスタードライティング（Forward+、#322）。three r186 の `ClusteredLightsNode` を土台にする。
 *
 * 影を落とさない点光源（篝火・たいまつ・燭台。`localLights.ts` で登録する）は、視錐台を X×Y×Z のクラスターに
 * 分けたコンピュートで振り分け、各ピクセルは自分のクラスターに入った光だけを評価する。
 * 太陽・環境光など他の光源は従来どおりマテリアルのシェーダに直接入る。
 *
 * 標準の `ClusteredLightsNode` との違い: クラスターの XY を「描画バッファの 32px タイル」ではなく、
 * 画面（NDC）を固定数に割った格子にする。標準のままだと
 *  - 動的解像度（pixelRatio）が変わるたびに格子を作り直し、ノードのキャッシュキーが変わって全マテリアルを再コンパイルする
 *  - 描画バッファと大きさの違う描画先（水面の反射、今後の TAAU の内部解像度）でタイルの位置がずれる
 * ため。フラグメント側のクラスター番号は `positionView` を射影して求める（画面の画素座標を使わない）。
 */

/** クラスターの格子（画面の横・縦の分割数と、奥行きの指数分割数）。 */
export const CLUSTER_GRID = { x: 20, y: 12, z: 24 } as const;
/** 1 クラスターに入れる光の上限。 */
export const MAX_LIGHTS_PER_CLUSTER = 32;
/** クラスタリングする点光源の上限（光のデータテクスチャの幅）。 */
export const MAX_CLUSTERED_LIGHTS = 256;

/** `create` の幅・高さはタイルの大きさ × 格子数として渡す（格子数だけが意味を持つ）。 */
const VIRTUAL_TILE = 32;

/** 標準ノードの非公開メンバー（three r186 の実装に依存する。型定義に無い）。 */
interface ClusteredInternals {
  _bufferSize: unknown;
  _screenClusterIndex: Node<'int'>;
  _cameraNear: Node<'float'>;
  _cameraFar: Node<'float'>;
  _cameraProjectionMatrix: Node<'mat4'>;
  create(width: number, height: number): void;
}

class FixedGridClusteredLightsNode extends ClusteredLightsNode {
  static get type(): string {
    return 'FixedGridClusteredLightsNode';
  }

  constructor() {
    super(MAX_CLUSTERED_LIGHTS, VIRTUAL_TILE, CLUSTER_GRID.z, MAX_LIGHTS_PER_CLUSTER);
    // 標準は最初の setup でコンピュートを作るため、`customCacheKey`（コンピュートのキーを含む）が初回のビルドの
    // 前後で変わり、それまでに作ったマテリアルのパイプラインが全部作り直される。ローディング中に非同期で作った
    // パイプライン（#369）が初回フレームで同期的に作り直されないよう、固定格子なので最初から作っておく。
    this.updateProgram();
  }

  /** 標準は描画バッファの大きさで格子を作り直す。固定格子なので最初の 1 回だけ作る。 */
  updateProgram(): void {
    const self = this as unknown as ClusteredInternals;
    if (self._bufferSize !== null) return;
    self.create(CLUSTER_GRID.x * VIRTUAL_TILE, CLUSTER_GRID.y * VIRTUAL_TILE);
    const NX = CLUSTER_GRID.x;
    const NY = CLUSTER_GRID.y;
    const NZ = CLUSTER_GRID.z;
    const clusterIndex = Fn(() => {
      const clip = self._cameraProjectionMatrix.mul(vec4(positionView, 1));
      const ndc = clip.xy.div(clip.w);
      // コンピュート側と同じく cy = 0 が画面の上端（NDC y = +1）
      const tx = clamp(floor(ndc.x.mul(0.5).add(0.5).mul(NX)), 0, NX - 1);
      const ty = clamp(floor(float(0.5).sub(ndc.y.mul(0.5)).mul(NY)), 0, NY - 1);
      const viewDepth = positionView.z.negate();
      const invLog = float(1).div(log(self._cameraFar.div(self._cameraNear)));
      const slice = log(viewDepth.div(self._cameraNear)).mul(invLog).mul(NZ);
      const tz = clamp(floor(slice), 0, NZ - 1);
      return int(tx)
        .add(int(ty).mul(NX))
        .add(int(tz).mul(NX * NY));
    });
    self._screenClusterIndex = clusterIndex().toVar();
  }
}

/** `renderer.lighting` に入れるライティング。シーン（光の組）ごとに固定格子のクラスターノードを作る。 */
export class FixedGridClusteredLighting extends Lighting {
  override createNode(lights: Light[] = []): FixedGridClusteredLightsNode {
    const node = new FixedGridClusteredLightsNode();
    node.setLights(lights);
    return node;
  }
}

/** レンダラーのライティングをクラスタードに差し替える（マテリアルを作る前に呼ぶ）。 */
export function installClusteredLighting(renderer: WebGPURenderer): void {
  renderer.lighting = new FixedGridClusteredLighting();
}
