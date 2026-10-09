import { Euler, Quaternion, type Object3D } from 'three/webgpu';

/**
 * 骨の回転指定。キャラクター空間（+X がキャラクターの左、+Y が上、+Z が前）の軸まわりに、
 * 現在の姿勢へ角度（度）を加える。親の回転は子に伝わる（親から順に適用する）。
 * 例: 左腕を前へ上げる = `upperarm_l` を Y 軸まわりに -90°。
 */
export interface BoneTurn {
  readonly bone: string;
  /** [x, y, z] の度。Euler 順は XYZ（ワールド軸）。 */
  readonly euler: readonly [number, number, number];
}

const _q = new Quaternion();
const _parentQ = new Quaternion();
const _worldQ = new Quaternion();
const _euler = new Euler();
const DEG = Math.PI / 180;

/** ワールド軸まわりの回転 q を、骨の現在のワールド姿勢に左から掛ける（ローカルのクォータニオンを更新）。 */
export function rotateBoneWorld(bone: Object3D, q: Quaternion): void {
  const parent = bone.parent;
  if (parent) {
    parent.updateWorldMatrix(true, false);
    parent.getWorldQuaternion(_parentQ);
  } else {
    _parentQ.identity();
  }
  _worldQ.copy(_parentQ).multiply(bone.quaternion); // 現在のワールド姿勢
  _worldQ.premultiply(q);
  bone.quaternion.copy(_parentQ).invert().multiply(_worldQ);
  bone.updateMatrixWorld(true);
}

/** `turns` を順に適用する。`root` 以下に同名の骨が無ければ例外（ポーズ定義の綴り間違いを検出する）。 */
export function applyBoneTurns(root: Object3D, turns: readonly BoneTurn[]): void {
  root.updateMatrixWorld(true);
  for (const turn of turns) {
    const bone = root.getObjectByName(turn.bone);
    if (!bone) throw new Error(`bone not found: ${turn.bone}`);
    const [x, y, z] = turn.euler;
    _q.setFromEuler(_euler.set(x * DEG, y * DEG, z * DEG, 'XYZ'));
    rotateBoneWorld(bone, _q);
  }
}
