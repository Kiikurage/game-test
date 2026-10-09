import { Vector3 } from 'three/webgpu';
import { LOCK_ON } from '../data';

/**
 * ロックオン対象のインターフェース。敵（#40 以降）はこれを実装して `Game.lockOnTargets` に登録する。
 * 位置は足元のワールド座標。
 */
export interface LockOnTarget {
  readonly id: string;
  /** 足元の位置（ワールド）。毎ステップ更新される参照を返してよい。 */
  readonly position: Vector3;
  /** 身長（m）。胸元・カメラ距離の計算に使う。 */
  readonly height: number;
  /** false になると（死亡）ロックオンは一定時間後に次の対象へ移るか解除される。 */
  readonly alive: boolean;
}

/** 胸元（ロックオンマーカー・カメラの注視点）。身長 × 0.65。 */
export function chestPosition(target: LockOnTarget, out = new Vector3()): Vector3 {
  return out.set(
    target.position.x,
    target.position.y + target.height * LOCK_ON.chestHeightRatio,
    target.position.z,
  );
}

/** テスト用の動かないダミー（柱・人形）。 */
export class DummyTarget implements LockOnTarget {
  readonly position: Vector3;
  alive = true;

  constructor(
    readonly id: string,
    x: number,
    y: number,
    z: number,
    readonly height: number,
    /** 衝突用の円柱の半径（m）。 */
    readonly radius: number,
  ) {
    this.position = new Vector3(x, y, z);
  }
}
