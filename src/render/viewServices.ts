import type { Camera, Object3D, Scene } from 'three/webgpu';
import { REFLECT_LAYER } from './layers';
import { localLightsOf, type LocalLights } from './lighting/localLights';
import type { ParticleSystem } from './particles';

/**
 * 描画プラグイン（`*.view.ts`）の共通サービス（#324）。`registerViewPlugin` の `ctx.services` で受け取る。
 *
 * view は光源・FX・レイヤーを個別に扱わず、ここを通す:
 * - `lights`: 局所光源の登録口（`LocalLights`）。`new PointLight` / マテリアルへの偽の発光を書かない。
 * - `fx`: 共有のパーティクル（火花・灰・篝火など）。view ごとにパーティクルを作らない。
 * - `layers`: レイヤーの割り当て。`layers.enable(REFLECT_LAYER)` などを view に直接書かない。
 */
export interface ViewServices {
  readonly lights: LocalLights;
  readonly fx: ParticleSystem;
  readonly layers: ViewLayers;
}

export interface ViewLayers {
  /** このオブジェクト（だけ）を水面の反射にも描く（メインカメラのレイヤー 0 はそのまま）。 */
  reflect(object: Object3D): void;
  /** 部分木のうち、メインカメラが描くメッシュをすべて反射にも描く（影専用のメッシュは含めない）。 */
  reflectMeshesIn(root: Object3D): void;
  /** 反射用のカメラが反射レイヤーだけを見るようにし、シーンのライトを反射にも効かせる。 */
  setupReflectionCamera(camera: Camera): void;
}

interface ServiceSource {
  readonly scene: Scene;
  readonly particles: ParticleSystem;
}

export function createViewServices(view: ServiceSource): ViewServices {
  const { scene } = view;
  return {
    lights: localLightsOf(scene),
    fx: view.particles,
    layers: {
      reflect: (object) => {
        object.layers.enable(REFLECT_LAYER);
      },
      reflectMeshesIn: (root) => {
        root.traverse((o) => {
          if ((o as { isMesh?: boolean }).isMesh === true && o.layers.isEnabled(0)) {
            o.layers.enable(REFLECT_LAYER);
          }
        });
      },
      setupReflectionCamera: (camera) => {
        camera.layers.set(REFLECT_LAYER);
        // ライトもカメラのレイヤーで選ばれる（光の組が同じなのでパイプラインも共有される）
        scene.traverse((o) => {
          if ((o as { isLight?: boolean }).isLight === true) o.layers.enable(REFLECT_LAYER);
        });
      },
    },
  };
}
