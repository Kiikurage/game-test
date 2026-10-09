import { Object3D, Vector3 } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { applyBoneTurns } from './poseMath';

/** 腰 → 太もも（-Y へ垂れる）→ すね の骨の鎖。 */
function leg(): { root: Object3D; thigh: Object3D; calf: Object3D } {
  const root = new Object3D();
  const pelvis = new Object3D();
  pelvis.name = 'pelvis';
  pelvis.position.set(0, 1, 0);
  const thigh = new Object3D();
  thigh.name = 'thigh_l';
  const calf = new Object3D();
  calf.name = 'calf_l';
  calf.position.set(0, -0.45, 0);
  const foot = new Object3D();
  foot.name = 'foot_l';
  foot.position.set(0, -0.45, 0);
  calf.add(foot);
  thigh.add(calf);
  pelvis.add(thigh);
  root.add(pelvis);
  root.updateMatrixWorld(true);
  return { root, thigh, calf };
}

const foot = (root: Object3D): Vector3 =>
  root.getObjectByName('foot_l')?.getWorldPosition(new Vector3()) ?? new Vector3();

describe('applyBoneTurns', () => {
  it('rotates about the character-space axes and carries children along', () => {
    const { root } = leg();
    // 股関節を前へ 90°（X 軸まわりに -90°）: 足は前（+Z）へ伸びる
    applyBoneTurns(root, [{ bone: 'thigh_l', euler: [-90, 0, 0] }]);
    const f = foot(root);
    expect(f.y).toBeCloseTo(1, 5);
    expect(f.z).toBeCloseTo(0.9, 5);
  });

  it('applies turns in order so a child turn is relative to its rotated parent', () => {
    const { root } = leg();
    applyBoneTurns(root, [
      { bone: 'thigh_l', euler: [-90, 0, 0] },
      { bone: 'calf_l', euler: [90, 0, 0] }, // 膝を曲げてすねを下へ垂らす（座った姿勢）
    ]);
    const f = foot(root);
    expect(f.z).toBeCloseTo(0.45, 5); // 太ももぶん前
    expect(f.y).toBeCloseTo(1 - 0.45, 5); // すねぶん下
  });

  it('throws for an unknown bone (typo in a pose definition)', () => {
    const { root } = leg();
    expect(() => {
      applyBoneTurns(root, [{ bone: 'thigh_x', euler: [1, 0, 0] }]);
    }).toThrow(/bone not found/);
  });
});
