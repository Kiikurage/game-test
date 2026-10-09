import type { Vec3Like } from '../core/gameEvents';

/** three の `Object3D.matrixWorld`（列優先 4x4）だけを要求する構造的な型（audio は three に依存しない）。 */
export interface WorldMatrixSource {
  readonly matrixWorld: { readonly elements: ArrayLike<number> };
}

export interface ListenerPose {
  readonly position: Vec3Like;
  readonly forward: Vec3Like;
  readonly up: Vec3Like;
}

/** カメラのワールド行列からリスナーの姿勢を得る。three のカメラは -Z 前方・+Y 上方。 */
export function listenerPoseFromMatrix(e: ArrayLike<number>): ListenerPose {
  const n = (i: number): number => e[i] ?? 0;
  return {
    position: { x: n(12), y: n(13), z: n(14) },
    forward: { x: -n(8), y: -n(9), z: -n(10) },
    up: { x: n(4), y: n(5), z: n(6) },
  };
}
