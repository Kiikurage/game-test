import { Quaternion, Vector3 } from 'three/webgpu';

/**
 * シミュレーション側が持つ「直前ステップ / 最新ステップ」の位置・回転。
 * 描画側は alpha で補間した値を使う。
 */
export class InterpolatedTransform {
  readonly prevPosition = new Vector3();
  readonly position = new Vector3();
  readonly prevQuaternion = new Quaternion();
  readonly quaternion = new Quaternion();

  /** 各シミュレーションステップの先頭で呼び、最新状態を「直前」に退避する。 */
  beginStep(): void {
    this.prevPosition.copy(this.position);
    this.prevQuaternion.copy(this.quaternion);
  }

  /** テレポート等、補間したくない場合に直前状態を最新状態へ揃える。 */
  snap(): void {
    this.prevPosition.copy(this.position);
    this.prevQuaternion.copy(this.quaternion);
  }

  sample(alpha: number, outPosition: Vector3, outQuaternion: Quaternion): void {
    outPosition.lerpVectors(this.prevPosition, this.position, alpha);
    outQuaternion.slerpQuaternions(this.prevQuaternion, this.quaternion, alpha);
  }
}
