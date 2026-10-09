import type { Capsule, Vec3 } from './geometry';
import { capsuleShape, type CapsuleShape } from './shapes';

/** 武器の判定カプセル（2.3 節: 半径 0.25m、長さ 1.1m、剣先から根元まで）。 */
export const WEAPON_CAPSULE = { radius: 0.25, length: 1.1 } as const;

/**
 * 武器の現在のワールド姿勢の取得元（ボーン姿勢の抽象）。
 * render 層が剣のボーン（手のアタッチ）から、または game 層の手続き的な振りが実装する。
 * `sample` は剣の根元 `a`・剣先 `b`・半径を `out` に書く。
 */
export interface WeaponPoseSource {
  sample(out: Capsule): void;
}

/** 武器姿勢の取得元から、このステップの判定形状を作る（`scratch` を再利用して割り当てを避ける）。 */
export function weaponShape(
  source: WeaponPoseSource,
  attackerPosition: Vec3,
  scratch: Capsule,
): CapsuleShape {
  source.sample(scratch);
  return capsuleShape(scratch, attackerPosition);
}
