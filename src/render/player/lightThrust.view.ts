import { Vector3, type Object3D } from 'three/webgpu';
import { registerViewPlugin } from '../viewPlugins';
import { BonePoseGuard } from './bonePoseGuard';
import { aimAxis, rotateBoneAbout, solveTwoBone } from './poseUtils';
import { StepClock } from './stepClock';
import { thrustPose } from './thrustPose';

/**
 * 軽攻撃 3 段目を「突き」に見せる手続き的な補正（#173）。
 *
 * ベースは派生クリップ `Sword_Thrust`（跳ねを除いた下半身・踏み込み。`anim/thrustClip.ts`）。ここでは
 * ミキサーの後に、(1) 体幹を溜めでひねり・突きで回し込み、前かがみの踏み込みを起こす、(2) モデルを前へ踏み込ませる、
 * (3) 右腕を IK で「脇に引く → 正面へ突き出す」に動かし、(4) 刃を前へ向ける（手首）。
 * 判定（`combat/playerAttack.ts` の `lightAttackCapsule`）の軌道と同じ向き・高さ・射程に合わせてある。
 * ミキサーが毎フレーム姿勢を上書きするので、状態を戻す処理は要らない。
 */

/** 手の位置（キャラクター空間。+Z が前、−X が右）。構え・引き・突き出し。 */
const HAND_READY = new Vector3(-0.3, 1.0, 0.1);
const HAND_CHAMBER = new Vector3(-0.27, 1.1, -0.16);
const HAND_EXTEND = new Vector3(-0.13, 1.3, 0.62);
/** 肘が逃げる向き（キャラクター空間。右・下・やや後ろ）。 */
const ELBOW_POLE = new Vector3(-0.55, -0.8, -0.3);
/** モデルを前へ踏み込ませる最大量（m）。判定の剣先（体の前 2.2m）に見た目を近づける。 */
const LUNGE_SHIFT = 0.38;
/** 踏み込み中の体幹の前傾の上限（rad）。クリップのままだと頭を突っ込む飛び込みになるので、超えた分を背骨で起こす。 */
const MAX_TORSO_PITCH = 0.22;

const AXIS_X = new Vector3(1, 0, 0);
const AXIS_Y = new Vector3(0, 1, 0);
const BLADE_LOCAL = new Vector3(0, 1, 0);

registerViewPlugin('light-thrust', ({ game, view }) => {
  const handLocal = new Vector3();
  const handWorld = new Vector3();
  const pole = new Vector3();
  const aim = new Vector3();
  const axisX = new Vector3();
  const axisY = new Vector3();
  const forward = new Vector3();
  const tmp = new Vector3();
  let bones: { root: Object3D; list: Record<string, Object3D>; guard: BonePoseGuard } | null = null;
  const clock = new StepClock();

  const a = new Vector3();
  const c = new Vector3();
  /** 背骨（spine_01 → neck_01）の前傾のうち、上限を超えている分（rad、0 以上）。 */
  function excessTorsoPitch(root: Object3D, from: Object3D, to: Object3D): number {
    root.updateWorldMatrix(true, true);
    from.getWorldPosition(a);
    to.getWorldPosition(c);
    root.worldToLocal(a);
    root.worldToLocal(c);
    c.sub(a);
    return Math.max(0, Math.atan2(c.z, c.y) - MAX_TORSO_PITCH);
  }

  function lookup(root: Object3D): typeof bones {
    if (bones?.root === root) return bones;
    const names = [
      'spine_01',
      'spine_02',
      'spine_03',
      'neck_01',
      'upperarm_r',
      'lowerarm_r',
      'hand_r',
      'attach:sword',
    ];
    const list: Record<string, Object3D> = {};
    for (const name of names) {
      const o = root.getObjectByName(name);
      if (!o) return null;
      list[name] = o;
    }
    const guard = new BonePoseGuard(
      ['spine_01', 'spine_02', 'spine_03', 'upperarm_r', 'lowerarm_r', 'hand_r'].map(
        (n) => list[n] as Object3D,
      ),
    );
    bones = { root, list, guard };
    return bones;
  }

  return {
    update(dt) {
      const anim = game.player.animation;
      const root = view.shadowFocusTarget;
      if (!root) return;
      const rig = lookup(root);
      if (!rig) return;
      if (anim.state !== 'light3') {
        clock.reset();
        rig.guard.restore();
        return;
      }
      if (!root.visible) return;
      const b = rig.list;
      const spine1 = b['spine_01'];
      const spine2 = b['spine_02'];
      const spine3 = b['spine_03'];
      const neck = b['neck_01'];
      const upper = b['upperarm_r'];
      const lower = b['lowerarm_r'];
      const hand = b['hand_r'];
      const sword = b['attach:sword'];
      if (!spine1 || !spine2 || !spine3 || !neck || !upper || !lower || !hand || !sword) return;

      const frame = clock.update(dt, anim.stateFrame, anim.frozen);
      const p = thrustPose(frame);
      if (p.weight <= 0) {
        rig.guard.restore();
        return;
      }
      rig.guard.begin();

      // (2) 前へ踏み込む（モデルだけ。判定・位置は game 側）
      root.updateWorldMatrix(true, false);
      forward.set(0, 0, 1).transformDirection(root.matrixWorld);
      root.position.addScaledVector(forward, LUNGE_SHIFT * p.lunge * p.weight);
      root.updateMatrixWorld(true);

      // (1) 体幹: 起こす（キャラクターの右軸まわり。後ろへ反らす向きが負）とひねる
      axisX.copy(AXIS_X).transformDirection(root.matrixWorld);
      axisY.copy(AXIS_Y).transformDirection(root.matrixWorld);
      const back = -excessTorsoPitch(root, spine1, neck) * p.weight;
      rotateBoneAbout(spine1, axisX, back * 0.2);
      rotateBoneAbout(spine2, axisX, back * 0.45);
      rotateBoneAbout(spine3, axisX, back * 0.35);
      rotateBoneAbout(spine2, axisY, p.twist * p.weight * 0.45);
      rotateBoneAbout(spine3, axisY, p.twist * p.weight * 0.55);

      // (3) 右腕 IK
      handLocal.copy(HAND_READY).lerp(HAND_CHAMBER, p.chamber).lerp(HAND_EXTEND, p.extend);
      handWorld.copy(handLocal);
      root.localToWorld(handWorld);
      pole.copy(ELBOW_POLE).transformDirection(root.matrixWorld);
      solveTwoBone(upper, lower, hand, handWorld, pole, p.weight);

      // (4) 刃を前へ（溜めでは少し上向き、突きで水平よりわずかに下向き）
      const pitch = (10 * p.chamber * (1 - p.extend) - 3 * p.extend) * (Math.PI / 180);
      tmp.set(0, Math.sin(pitch), Math.cos(pitch)).transformDirection(root.matrixWorld);
      aim.copy(tmp);
      aimAxis(hand, BLADE_LOCAL, aim, p.weight, sword);
      rig.guard.end();
    },
  };
});
