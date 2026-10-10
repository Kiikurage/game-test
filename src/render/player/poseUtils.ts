import { Quaternion, Vector3, type Object3D } from 'three/webgpu';

/**
 * ボーンへの手続き的な姿勢補正（アニメーションミキサーの後に適用する。ミキサーが毎フレーム姿勢を上書きするので累積しない）。
 * 軸・方向はすべてワールド座標で渡す。ボーンのローカル軸の向きには依存しない。
 */

const IDENTITY = new Quaternion();
const tmpParentQ = new Quaternion();
const tmpLocal = new Quaternion();
const tmpDelta = new Quaternion();
const tmpA = new Vector3();
const tmpB = new Vector3();
const tmpC = new Vector3();
const tmpDir = new Vector3();
const tmpElbow = new Vector3();
const tmpUp = new Vector3();

/** ボーンをワールド空間の回転 `worldDelta` だけ回す（ボーン自身の位置が回転の中心）。子孫のワールド行列も更新する。 */
export function rotateBoneWorld(bone: Object3D, worldDelta: Quaternion): void {
  const parent = bone.parent;
  if (!parent) return;
  parent.updateWorldMatrix(true, false);
  parent.getWorldQuaternion(tmpParentQ);
  // local' = parent⁻¹ · delta · parent · local
  tmpLocal.copy(tmpParentQ).invert().multiply(worldDelta).multiply(tmpParentQ);
  bone.quaternion.premultiply(tmpLocal);
  bone.updateMatrixWorld(true);
}

/** `axis`（ワールド、単位ベクトル）まわりに `angle`（rad）回す。 */
export function rotateBoneAbout(bone: Object3D, axis: Vector3, angle: number): void {
  if (Math.abs(angle) < 1e-5) return;
  tmpDelta.setFromAxisAngle(axis, angle);
  rotateBoneWorld(bone, tmpDelta);
}

/**
 * `bone` のローカル軸 `localAxis` が指すワールド方向を `worldDir` へ向ける（`weight` 0..1 で途中まで）。
 * 手に持った物（剣・瓶）の向きを手首で合わせるのに使う。`holder` を渡すと、その物体のローカル軸で測る。
 */
export function aimAxis(
  bone: Object3D,
  localAxis: Vector3,
  worldDir: Vector3,
  weight: number,
  holder: Object3D = bone,
): void {
  if (weight <= 0) return;
  holder.updateWorldMatrix(true, false);
  tmpDir.copy(localAxis).transformDirection(holder.matrixWorld);
  tmpDelta.setFromUnitVectors(tmpDir, tmpC.copy(worldDir).normalize());
  if (weight < 1) tmpDelta.slerp(IDENTITY, 1 - weight);
  rotateBoneWorld(bone, tmpDelta);
}

/**
 * 2 ボーン IK（腕）。`end`（手）のワールド位置を `target` へ寄せる。肘は `pole`（ワールドの方向。肘が逃げる向き）側へ曲がる。
 * `weight` 0..1 で、元の姿勢から目標姿勢へブレンドする。届かない目標は腕を伸ばしきった位置で止まる。
 */
export function solveTwoBone(
  upper: Object3D,
  lower: Object3D,
  end: Object3D,
  target: Vector3,
  pole: Vector3,
  weight = 1,
): void {
  if (weight <= 0) return;
  upper.updateWorldMatrix(true, true);
  const a = upper.getWorldPosition(tmpA);
  const b = lower.getWorldPosition(tmpB);
  const c = end.getWorldPosition(tmpC);
  const l1 = a.distanceTo(b);
  const l2 = b.distanceTo(c);
  if (l1 < 1e-4 || l2 < 1e-4) return;

  const toTarget = tmpDir.copy(target).sub(a);
  const dist = Math.min(Math.max(toTarget.length(), Math.abs(l1 - l2) + 1e-3), l1 + l2 - 1e-3);
  toTarget.normalize();
  // 余弦定理: 肘は a から toTarget 方向へ x、そこから pole 側へ h
  const x = (dist * dist + l1 * l1 - l2 * l2) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  tmpUp.copy(pole).addScaledVector(toTarget, -pole.dot(toTarget));
  if (tmpUp.lengthSq() < 1e-8) tmpUp.set(0, -1, 0).addScaledVector(toTarget, toTarget.y);
  tmpUp.normalize();
  tmpElbow.copy(a).addScaledVector(toTarget, x).addScaledVector(tmpUp, h);
  const goal = tmpC.copy(a).addScaledVector(toTarget, dist);

  // 上腕: (b - a) → (elbow - a)
  const current = b.clone().sub(a).normalize();
  const wanted = tmpElbow.clone().sub(a).normalize();
  tmpDelta.setFromUnitVectors(current, wanted);
  if (weight < 1) tmpDelta.slerp(IDENTITY, 1 - weight);
  rotateBoneWorld(upper, tmpDelta);

  // 前腕: (c - b') → (goal - b')
  lower.getWorldPosition(tmpB);
  end.getWorldPosition(tmpA);
  const forearm = tmpA.sub(tmpB).normalize();
  const aim = goal.clone().sub(tmpB).normalize();
  tmpDelta.setFromUnitVectors(forearm, aim);
  if (weight < 1) tmpDelta.slerp(IDENTITY, 1 - weight);
  rotateBoneWorld(lower, tmpDelta);
}

/** 0..1 の滑らかな補間（3t² − 2t³）。範囲外は端に丸める。 */
export function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** t を [a, b] の 0..1 へ写す（範囲外は端に丸める）。 */
export function ramp(t: number, a: number, b: number): number {
  return b === a ? (t >= b ? 1 : 0) : Math.min(1, Math.max(0, (t - a) / (b - a)));
}
